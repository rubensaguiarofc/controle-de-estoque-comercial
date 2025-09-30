
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
  selectedItem: z.string().min(1, "Selecione um item da lista."),
  quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
  unit: z.string().min(1, "A unidade é obrigatória."),
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
        selectedItem: "",
        quantity: 1,
        unit: 'UN',
        requestedBy: "",
        requestedFor: "",
      },
    });

    useImperativeHandle(ref, () => ({
      setFormItem(item: StockItem) {
        form.setValue('selectedItem', item.id);
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
      const selectedItem = stockItems.find(item => item.id === values.selectedItem);
      if (!selectedItem) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "O item selecionado não foi encontrado.",
        });
        return;
      }

      const newRecord: WithdrawalRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        item: selectedItem,
        quantity: values.quantity,
        unit: values.unit.toUpperCase(),
        requestedBy: values.requestedBy.toUpperCase(),
        requestedFor: values.requestedFor.toUpperCase(),
      };
      
      onUpdateHistory(prevHistory => {
        const updatedHistory = [newRecord, ...prevHistory];
        setHistory(updatedHistory); 
        return updatedHistory;
      });

      toast({ title: "Sucesso!", description: "Sua retirada foi registrada." });
      form.reset({
        selectedItem: "",
        quantity: 1,
        unit: 'UN',
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
