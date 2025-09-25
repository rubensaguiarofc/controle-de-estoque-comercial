
"use client";

import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalForm } from "./withdrawal-form";
import { HistoryPanel } from "./history-panel";

const formSchema = z.object({
  item: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome do item é obrigatório."),
    specifications: z.string().min(1, "As especificações são obrigatórias."),
    barcode: z.string().optional(),
  }),
  quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
  unit: z.string().min(1, "A unidade é obrigatória."),
  requestedBy: z.string().min(1, 'O campo "Quem" é obrigatório.'),
  requestedFor: z.string().min(1, 'O campo "Para Quem" é obrigatório.'),
});

export type WithdrawalFormValues = z.infer<typeof formSchema>;

interface StockReleaseClientProps {
  stockItems: StockItem[];
  history: WithdrawalRecord[];
  onUpdateHistory: (history: WithdrawalRecord[]) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
}

export interface StockReleaseClientRef {
  setFormItem: (item: StockItem) => void;
}

const StockReleaseClient = forwardRef<StockReleaseClientRef, StockReleaseClientProps>(
  ({ stockItems, history, onUpdateHistory, onSetIsAddItemDialogOpen }, ref) => {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState("");

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
        form.setValue('item', item);
      }
    }));

    useEffect(() => {
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
        id: values.item.id || `NEW-${Date.now()}`,
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

      onUpdateHistory([newRecord, ...history]);
      toast({ title: "Sucesso!", description: "Retirada de item registrada." });
      form.reset({
        item: { name: "", specifications: "", barcode: "" },
        quantity: 1,
        unit: "un",
        requestedBy: "",
        requestedFor: "",
      });
    };

    const handleDeleteRecord = (recordId: string) => {
      const updatedHistory = history.filter(record => record.id !== recordId);
      onUpdateHistory(updatedHistory);
      toast({
        title: "Registro Excluído",
        description: "O registro de retirada foi removido do histórico.",
      });
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <WithdrawalForm
          form={form}
          currentDate={currentDate}
          stockItems={stockItems}
          uniqueRequesters={uniqueRequesters}
          uniqueDestinations={uniqueDestinations}
          onSubmit={onSubmit}
          onSetIsAddItemDialogOpen={onSetIsAddItemDialogOpen}
        />
        <HistoryPanel
          history={history}
          onDeleteRecord={handleDeleteRecord}
        />
      </div>
    );
  }
);

StockReleaseClient.displayName = 'StockReleaseClient';
export default StockReleaseClient;
