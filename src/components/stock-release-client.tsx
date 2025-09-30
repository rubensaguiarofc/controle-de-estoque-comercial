
"use client";

import { useEffect, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

import type { StockItem, WithdrawalRecord, WithdrawalItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalForm } from "./withdrawal-form";

const formSchema = z.object({
  withdrawalItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    specifications: z.string(),
    barcode: z.string().optional(),
    quantity: z.coerce.number().min(1),
    unit: z.string().min(1),
  })).min(1, "Adicione pelo menos um item à retirada."),
  requestedBy: z.string().min(1, 'O campo "Quem" é obrigatório.').toUpperCase(),
  requestedFor: z.string().min(1, 'O campo "Para Quem" é obrigatório.').toUpperCase(),
});

export type WithdrawalFormValues = z.infer<typeof formSchema>;

interface StockReleaseClientProps {
  stockItems: StockItem[];
  onUpdateHistory: (callback: (history: WithdrawalRecord[]) => WithdrawalRecord[]) => void;
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
        withdrawalItems: [],
        requestedBy: "",
        requestedFor: "",
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "withdrawalItems"
    });

    useImperativeHandle(ref, () => ({
      setFormItem(item: StockItem) {
        const existingItemIndex = fields.findIndex(field => field.id === item.id);
        if (existingItemIndex === -1) {
            append({ ...item, quantity: 1, unit: 'UN' });
        } else {
            toast({ variant: 'destructive', title: "Item já adicionado", description: "Este item já está na lista de retirada."});
        }
      }
    }));

    useEffect(() => {
        const storedHistory = localStorage.getItem("withdrawalHistory");
        if (storedHistory) {
          try {
            setHistory(JSON.parse(storedHistory));
          } catch (e) {
            console.error("Failed to parse history from localStorage", e);
          }
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
      const newRecords: WithdrawalRecord[] = values.withdrawalItems.map(item => ({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        item: {
          id: item.id,
          name: item.name,
          specifications: item.specifications,
          barcode: item.barcode,
        },
        quantity: item.quantity,
        unit: item.unit.toUpperCase(),
        requestedBy: values.requestedBy.toUpperCase(),
        requestedFor: values.requestedFor.toUpperCase(),
      }));
      
      onUpdateHistory(prevHistory => {
        const updatedHistory = [...newRecords, ...prevHistory];
        setHistory(updatedHistory);
        return updatedHistory;
      });

      toast({ title: "Sucesso!", description: "Retirada de múltiplos itens registrada." });
      form.reset({
        withdrawalItems: [],
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
          withdrawalItems={fields as (WithdrawalItem & {id: string})[]}
          onAppendItem={append}
          onRemoveItem={remove}
        />
    );
  }
);

StockReleaseClient.displayName = 'StockReleaseClient';
export default StockReleaseClient;
