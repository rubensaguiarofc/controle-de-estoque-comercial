
"use client";

import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';

import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalForm } from "./withdrawal-form";
import { Skeleton } from "./ui/skeleton";

const HistoryPanel = dynamic(() => import('./history-panel').then(mod => mod.HistoryPanel), {
  ssr: false,
  loading: () => <HistoryPanelSkeleton />,
});

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
        form.setValue('item', item, { shouldValidate: true });
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

function HistoryPanelSkeleton() {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="border rounded-lg p-4">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
