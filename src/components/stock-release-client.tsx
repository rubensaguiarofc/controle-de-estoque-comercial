
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
    const [formPrefill, setFormPrefill] = useState<{ itemId?: string; quantity?: number; unit?: string } | null>(null);

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
          if (Array.isArray(parsed)) {
            const normalized = parsed.map(it => ({
              ...it,
              unit: (it.unit || 'UN').toUpperCase(),
              cartKey: it.cartKey || `${it.item.id}__${(it.unit || 'UN').toUpperCase()}`,
            }));
            setWithdrawalItems(normalized);
          }
        }
        // Also load one-shot form prefill (from Itens quick-add)
        const prefillRaw = localStorage.getItem('prefillReleaseForm');
        if (prefillRaw) {
          const p = JSON.parse(prefillRaw) as { itemId?: string; quantity?: number; unit?: string };
          setFormPrefill({
            itemId: p.itemId,
            quantity: typeof p.quantity === 'number' ? p.quantity : undefined,
            unit: (p.unit || 'UN').toUpperCase(),
          });
          localStorage.removeItem('prefillReleaseForm');
        }
      } catch {}
    }, []);

    

    // Persist cart on changes and broadcast so any other mounted client stays in sync
    useEffect(() => {
      try {
        localStorage.setItem('withdrawalCart', JSON.stringify(withdrawalItems));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('almox:withdrawalCart:updated'));
        }
      } catch {}
    }, [withdrawalItems]);

    // Listen for external cart updates (in case another hidden instance processed the add)
    useEffect(() => {
      function syncFromStorage() {
        try {
          const raw = localStorage.getItem('withdrawalCart');
          if (!raw) return;
          const parsed = JSON.parse(raw) as WithdrawalItem[];
          if (Array.isArray(parsed)) {
            // If lengths differ or content changed, update
            const current = JSON.stringify(withdrawalItems);
            const next = JSON.stringify(parsed);
            if (current !== next) {
              const normalized = parsed.map(it => ({
                ...it,
                unit: (it.unit || 'UN').toUpperCase(),
                cartKey: it.cartKey || `${it.item.id}__${(it.unit || 'UN').toUpperCase()}`,
              }));
              setWithdrawalItems(normalized);
            }
          }
        } catch {}
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('almox:withdrawalCart:updated', syncFromStorage);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('almox:withdrawalCart:updated', syncFromStorage);
        }
      };
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
        // atribui uma chave única (item + unidade) para operações no carrinho
        const cartKey = `${item.item.id}__${item.unit.toUpperCase()}`;
        setWithdrawalItems(prev => [...prev, { ...item, unit: item.unit.toUpperCase(), cartKey }]);
        toast({
          title: "Item Adicionado",
          description: `"${item.item.name}" foi adicionado à cesta.`,
        });
      }
    }, [toast, stockItems, withdrawalItems]);

    // Drain any pending quick-adds that were queued before this view mounted
    // Robustness: don't drop entries if stockItems haven't loaded yet. Keep the remaining and retry on next stockItems change.
    useEffect(() => {
      try {
        const raw = localStorage.getItem('pendingQuickAdds');
        if (!raw) return;
        const list = JSON.parse(raw) as Array<{ item: StockItem; quantity: number; unit: string }>;
        if (!Array.isArray(list) || list.length === 0) return;

        const remaining: Array<{ item: StockItem; quantity: number; unit: string }> = [];
        for (const it of list) {
          const found = stockItems.find(s => s.id === it.item.id);
          if (found) {
            handleAppendItem({ item: found, quantity: Math.max(1, Number(it.quantity || 1)), unit: (it.unit || 'UN').toUpperCase() });
          } else {
            remaining.push(it);
          }
        }

        if (remaining.length > 0) {
          localStorage.setItem('pendingQuickAdds', JSON.stringify(remaining));
        } else {
          localStorage.removeItem('pendingQuickAdds');
        }
      } catch {}
    }, [handleAppendItem, stockItems]);

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
    
    const handleRemoveItem = useCallback((cartKey: string) => {
      setWithdrawalItems(prev => prev.filter(item => (item.cartKey || `${item.item.id}__${item.unit.toUpperCase()}`) !== cartKey));
    }, []);

    const handleUpdateItemQuantity = useCallback((cartKey: string, quantity: number) => {
      if (quantity > MAX_QUANTITY) {
        quantity = MAX_QUANTITY;
      }
      const found = withdrawalItems.find(item => (item.cartKey || `${item.item.id}__${item.unit.toUpperCase()}`) === cartKey);
      const stockItem = found ? stockItems.find(i => i.id === found.item.id) : undefined;
      if (stockItem && quantity > stockItem.quantity) {
          toast({
              variant: "destructive",
              title: "Estoque Insuficiente",
              description: `Apenas ${stockItem.quantity} unidades disponíveis.`,
          });
          setWithdrawalItems(prev => prev.map(item => ((item.cartKey || `${item.item.id}__${item.unit.toUpperCase()}`) === cartKey) ? { ...item, quantity: stockItem.quantity } : item));
          return;
      }

      if (quantity <= 0) {
        handleRemoveItem(cartKey);
        return;
      }
      setWithdrawalItems(prev => prev.map(item => ((item.cartKey || `${item.item.id}__${item.unit.toUpperCase()}`) === cartKey) ? { ...item, quantity } : item));
    }, [handleRemoveItem, stockItems, toast, withdrawalItems]);

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
          prefill={formPrefill}
        />
    );
  }
);

StockReleaseClient.displayName = 'StockReleaseClient';
export default StockReleaseClient;
