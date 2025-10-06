
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
    }, []);
    
    const handleAppendItem = useCallback((item: WithdrawalItem) => {
      const stockItem = stockItems.find(i => i.id === item.item.id);
      if (!stockItem) return;

      const existingItemIndex = withdrawalItems.findIndex(cartItem => cartItem.item.id === item.item.id);
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

      setWithdrawalItems(prev => {
        if (existingItemIndex > -1) {
          const updatedItems = [...prev];
          updatedItems[existingItemIndex].quantity += item.quantity;
          toast({
            title: "Quantidade Atualizada",
            description: `A quantidade de "${item.item.name}" foi atualizada na cesta.`,
          });
          return updatedItems;
        } else {
          toast({
            title: "Item Adicionado",
            description: `"${item.item.name}" foi adicionado à cesta.`,
          });
          return [...prev, item];
        }
      });
    }, [toast, stockItems, withdrawalItems]);
    
    const handleRemoveItem = useCallback((itemId: string) => {
      setWithdrawalItems(prev => prev.filter(item => item.item.id !== itemId));
    }, []);

    const handleUpdateItemQuantity = useCallback((itemId: string, quantity: number) => {
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
