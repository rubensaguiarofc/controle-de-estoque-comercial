
"use client";

import { useEffect, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalForm } from "./withdrawal-form";

const formSchema = z.object({
  item: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome do item é obrigatório.").toUpperCase(),
    specifications: z.string().min(1, "As especificações são obrigatórias.").toUpperCase(),
    barcode: z.string().optional(),
  }).refine(data => !!data.id, {
    message: "O item deve ser selecionado da biblioteca de itens cadastrados.",
    path: ["name"],
  }),
  quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
  unit: z.string().min(1, "A unidade é obrigatória.").toUpperCase(),
  requestedBy: z.string().min(1, 'O campo "Quem" é obrigatório.').toUpperCase(),
  requestedFor: z.string().min(1, 'O campo "Para Quem" é obrigatório.').toUpperCase(),
});

export type WithdrawalFormValues = z.infer<typeof formSchema>;

interface StockReleaseClientProps {
  stockItems: StockItem[];
  onUpdateHistory: (history: WithdrawalRecord[]) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
}

export interface StockReleaseClientRef {
  setFormItem: (item: StockItem) => void;
}

const StockReleaseClient = forwardRef<StockReleaseClientRef, StockReleaseClientProps>(
  ({ stockItems, onUpdateHistory, onSetIsAddItemDialogOpen }, ref) => {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState("");
    const [history, setHistory] = useState<WithdrawalRecord[]>([]);

    const form = useForm<WithdrawalFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        item: { name: "", specifications: "" },
        quantity: 1,
        unit: "un",
        requestedBy: "",
        requestedFor: "",
      },
    });

    useImperativeHandle(ref, () => ({
      setFormItem(item: StockItem) {
        form.setValue('item', item, { shouldValidate: true });
      }
    }));

    useEffect(() => {
        const storedHistory = localStorage.getItem("withdrawalHistory");
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
        setCurrentDate(format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
      }, []);

    const { uniqueRequesters, uniqueDestinations } = useMemo(() => {
      const requesters = new Set<string>();
      const destinations = new Set<string>();
      history.forEach(record => {
        if (record.requestedBy) requesters.add(record.requestedBy);
        if (record.requestedFor) destinations.add(record.requestedFor);
      });
      return {
        uniqueRequesters: Array.from(requesters),
        uniqueDestinations: Array.from(destinations),
      };
    }, [history]);

    const onSubmit = (values: WithdrawalFormValues) => {
      const withdrawalItem: StockItem = {
        id: values.item.id!,
        name: values.item.name.toUpperCase(),
        specifications: values.item.specifications.toUpperCase(),
        barcode: values.item.barcode,
      };

      const newRecord: WithdrawalRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        item: withdrawalItem,
        quantity: values.quantity,
        unit: values.unit.toUpperCase(),
        requestedBy: values.requestedBy.toUpperCase(),
        requestedFor: values.requestedFor.toUpperCase(),
      };
      
      const updatedHistory = [newRecord, ...history];
      onUpdateHistory(updatedHistory);
      setHistory(updatedHistory);

      toast({ title: "Sucesso!", description: "Retirada de item registrada." });
      form.reset({
        item: { name: "", specifications: "", barcode: "" },
        quantity: 1,
        unit: "un",
        requestedBy: "",
        requestedFor: "",
      });
    };

    return (
        <WithdrawalForm
          form={form}
          currentDate={currentDate}
          stockItems={stockItems}
          uniqueRequesters={uniqueRequesters}
          uniqueDestinations={uniqueDestinations}
          onSubmit={onSubmit}
          onSetIsAddItemDialogOpen={onSetIsAddItemDialogOpen}
        />
    );
  }
);

StockReleaseClient.displayName = 'StockReleaseClient';
export default StockReleaseClient;
