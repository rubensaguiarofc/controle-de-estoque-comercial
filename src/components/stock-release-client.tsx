
"use client";

import { useEffect, useState, forwardRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

import type { StockItem, WithdrawalRecord, WithdrawalItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalForm } from "./withdrawal-form";
import { MAX_QUANTITY } from "@/lib/constants";

const formSchema = z.object({
  requestedBy: z.string().min(1, 'O campo "Quem" é obrigatório.').toUpperCase(),
  requestedFor: z.string().min(1, 'O campo "Para Quem" é obrigatório.').toUpperCase(),
});

export type WithdrawalFormValues = z.infer<typeof formSchema>;

interface StockReleaseClientProps {
  stockItems: StockItem[];
  onUpdateHistory: (records: WithdrawalRecord[]) => void;
  uniqueRequesters: string[];
  uniqueDestinations: string[];
}

const StockReleaseClient = forwardRef<HTMLFormElement, StockReleaseClientProps>(
  ({ stockItems, onUpdateHistory, uniqueRequesters, uniqueDestinations }, ref) => {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState("");
  const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([]);

    const form = useForm<WithdrawalFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        requestedBy: "",
        requestedFor: "",
      },
    });
    
    useEffect(() => {
      setCurrentDate(format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
      // Restore persisted cart
      try {
        const raw = localStorage.getItem('withdrawalCart');
        if (raw) {
          const parsed = JSON.parse(raw) as WithdrawalItem[];
          if (Array.isArray(parsed)) setWithdrawalItems(parsed);
        }
      } catch {}
    }, []);

    // Persist cart on changes
    useEffect(() => {
      try {
        localStorage.setItem('withdrawalCart', JSON.stringify(withdrawalItems));
      } catch {}
    }, [withdrawalItems]);
    
    const handleAppendItem = useCallback((item: WithdrawalItem) => {
      const stockItem = stockItems.find(i => i.id === item.item.id);
      if (!stockItem) return;

      // Combine apenas quando o item e a unidade coincidirem
      const existingItemIndex = withdrawalItems.findIndex(
        cartItem => cartItem.item.id === item.item.id && cartItem.unit.toUpperCase() === item.unit.toUpperCase()
      );
      let newQuantity = item.quantity;

      if (existingItemIndex > -1) {
          newQuantity += withdrawalItems[existingItemIndex].quantity;
      }

      if (stockItem.quantity < newQuantity) {
          toast({
              variant: "destructive",
              title: "Estoque Insuficiente",
              description: `Apenas ${stockItem.quantity} unidades de "${item.item.name}" disponíveis.`,
          });
          return;
      }

      if (existingItemIndex > -1) {
        setWithdrawalItems(prev => {
          const updatedItems = [...prev];
          updatedItems[existingItemIndex].quantity += item.quantity;
          return updatedItems;
        });
        toast({
          title: "Quantidade Atualizada",
          description: `A quantidade de "${item.item.name}" foi atualizada na cesta.`,
        });
      } else {
        setWithdrawalItems(prev => [...prev, item]);
        toast({
          title: "Item Adicionado",
          description: `"${item.item.name}" foi adicionado à cesta.`,
        });
      }
    }, [toast, stockItems, withdrawalItems]);

    // Listen to global quick-add event fired from other screens (e.g., ItemManagement)
    useEffect(() => {
      function onQuickAdd(ev: Event) {
        const ce = ev as CustomEvent;
        const detail = ce.detail as Partial<WithdrawalItem> & { item: StockItem };
        if (!detail || !detail.item) return;
        const unit = (detail.unit || 'UN').toUpperCase();
        const quantity = Math.max(1, Number(detail.quantity || 1));
        handleAppendItem({ item: detail.item, quantity, unit });
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('almox:add-to-release', onQuickAdd as EventListener);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('almox:add-to-release', onQuickAdd as EventListener);
        }
      };
    }, [handleAppendItem]);
    
    const handleRemoveItem = useCallback((itemId: string) => {
      setWithdrawalItems(prev => prev.filter(item => item.item.id !== itemId));
    }, []);

    const handleUpdateItemQuantity = useCallback((itemId: string, quantity: number) => {
      if (quantity > MAX_QUANTITY) {
        quantity = MAX_QUANTITY;
      }
      const stockItem = stockItems.find(i => i.id === itemId);
      if (stockItem && quantity > stockItem.quantity) {
          toast({
              variant: "destructive",
              title: "Estoque Insuficiente",
              description: `Apenas ${stockItem.quantity} unidades disponíveis.`,
          });
          setWithdrawalItems(prev => prev.map(item => item.item.id === itemId ? { ...item, quantity: stockItem.quantity } : item));
          return;
      }

      if (quantity <= 0) {
        handleRemoveItem(itemId);
        return;
      }
      setWithdrawalItems(prev => prev.map(item => item.item.id === itemId ? { ...item, quantity } : item));
    }, [handleRemoveItem, stockItems, toast]);

    const handleClearCart = useCallback(() => {
      form.reset({ requestedBy: "", requestedFor: "" });
      setWithdrawalItems([]);
      try { localStorage.removeItem('withdrawalCart'); } catch {}
      toast({ title: "Campos Limpos", description: "Todos os campos de entrada foram redefinidos." });
    }, [form, toast]);


    const onSubmit = useCallback((values: WithdrawalFormValues) => {
      if (withdrawalItems.length === 0) {
        toast({
          variant: "destructive",
          title: "Cesta Vazia",
          description: "Adicione pelo menos um item para registrar uma retirada.",
        });
        return;
      }

      // Final validation before submitting
      for (const cartItem of withdrawalItems) {
        const stockItem = stockItems.find(i => i.id === cartItem.item.id);
        if (!stockItem || cartItem.quantity > stockItem.quantity) {
          toast({
            variant: "destructive",
            title: "Estoque Insuficiente",
            description: `Não há estoque suficiente para "${cartItem.item.name}".`,
          });
          return;
        }
      }
      
      const newRecords: WithdrawalRecord[] = withdrawalItems.map(cartItem => ({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        item: cartItem.item,
        quantity: cartItem.quantity,
        unit: cartItem.unit.toUpperCase(),
        requestedBy: values.requestedBy.toUpperCase(),
        requestedFor: values.requestedFor.toUpperCase(),
      }));
      
  onUpdateHistory(newRecords);

      toast({ title: "Sucesso!", description: `${newRecords.length} retirada(s) foram registradas.` });
      form.reset({
        requestedBy: "",
        requestedFor: "",
      });
      setWithdrawalItems([]);
      try { localStorage.removeItem('withdrawalCart'); } catch {}
    }, [withdrawalItems, onUpdateHistory, toast, form, stockItems]);

    return (
        <WithdrawalForm
          ref={ref}
          form={form}
          currentDate={currentDate}
          stockItems={stockItems}
          withdrawalItems={withdrawalItems}
          uniqueRequesters={uniqueRequesters}
          uniqueDestinations={uniqueDestinations}
          onSubmit={onSubmit}
          onAppendItem={handleAppendItem}
          onRemoveItem={handleRemoveItem}
          onUpdateItemQuantity={handleUpdateItemQuantity}
          onClearCart={handleClearCart}
        />
    );
  }
);

StockReleaseClient.displayName = 'StockReleaseClient';
export default StockReleaseClient;
