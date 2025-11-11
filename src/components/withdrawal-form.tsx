
"use client";

import React, { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FullscreenSearchList from "@/components/ui/fullscreen-search-list"
import type { SearchableOption } from "@/hooks/useSearchableSelect";
import { hapticImpact, hapticNotification } from "@/lib/native/haptics";
import type { StockItem, WithdrawalItem } from "@/lib/types";
import type { WithdrawalFormValues } from "./stock-release-client";
import dynamic from "next/dynamic";
import { WithdrawalCart } from "./withdrawal-cart";
import { MAX_QUANTITY } from "@/lib/constants";

const SearchScannerDialog = dynamic(() => import('./search-scanner-dialog').then(mod => mod.SearchScannerDialog), { ssr: false });

interface WithdrawalFormProps {
  form: UseFormReturn<WithdrawalFormValues>;
  currentDate: string;
  stockItems: StockItem[];
  withdrawalItems: WithdrawalItem[];
  uniqueRequesters: string[];
  uniqueDestinations: string[];
  onSubmit: (values: WithdrawalFormValues) => void;
  onAppendItem: (item: WithdrawalItem) => void;
  onRemoveItem: (cartKey: string) => void;
  onUpdateItemQuantity: (cartKey: string, quantity: number) => void;
  onClearCart: () => void;
  // Opcional: preencher os campos do formulário quando vier de um atalho na aba Itens
  prefill?: { itemId?: string; quantity?: number; unit?: string } | null;
}

export const WithdrawalForm = React.forwardRef<HTMLFormElement, WithdrawalFormProps>(({
  form,
  currentDate,
  stockItems,
  withdrawalItems,
  uniqueRequesters,
  uniqueDestinations,
  onSubmit,
  onAppendItem,
  onRemoveItem,
  onUpdateItemQuantity,
  onClearCart,
  prefill,
}, ref) => {
  const { toast } = useToast();
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [unit, setUnit] = useState('UN');
  // Medidas disponíveis para a saída: inclui sugestões do cliente (KG, RL, BL, PCT)
  const unitOptions = ['UN','PC','CX','KG','RL','BL','PCT','M','L','OUTRA'];
  const [customUnit, setCustomUnit] = useState('');

  const hasStockAvailable = useMemo(() => stockItems.some(item => item.quantity > 0), [stockItems]);

  // Precompute the options for the FullscreenSearchList unconditionally to avoid
  // calling hooks conditionally inside JSX (fixes React hook order errors).
  const searchOptions = useMemo(() => stockItems.map(item => ({
    value: item.id,
    label: `${item.name}${item.specifications ? ` - ${item.specifications}` : ''}`,
    data: item,
    disabled: item.quantity === 0,
    keywords: [item.location ?? '', item.barcode ?? '', (item as any).sku ?? ''].filter(Boolean),
  })), [stockItems]);

  // Preenche os campos quando solicitado (fluxo: Cadastro -> Saída com prefill)
  React.useEffect(() => {
    if (!prefill) return;
    // Aguarda o item existir na lista para evitar que o SelectValue não reconheça o label
    if (!currentItemId && prefill.itemId) {
      const exists = stockItems.some(i => i.id === prefill.itemId);
      if (exists) setCurrentItemId(prefill.itemId);
    }
    if (typeof prefill.quantity === 'number') setQuantity(prefill.quantity);
    if (prefill.unit) setUnit(prefill.unit.toUpperCase());
  }, [prefill, stockItems, currentItemId]);

  const handleScanSuccess = (foundItem: StockItem) => {
    // Usa a unidade selecionada atualmente (ou UN por padrão)
    onAppendItem({ item: foundItem, quantity: 1, unit: unit === 'OUTRA' ? (customUnit || 'UN') : unit });
    setSearchScannerOpen(false);
    toast({ title: "Item Adicionado", description: `Item "${foundItem.name}" adicionado à cesta.` });
  };

  const handleScanNotFound = () => {
    toast({
      variant: 'destructive',
      title: "Item Não Encontrado",
      description: "Nenhum item com este código de barras na biblioteca.",
    });
    setSearchScannerOpen(false);
  };
  
  const handleAddItemToCart = () => {
    const effectiveItemId = currentItemId || prefill?.itemId || '';
    if (!effectiveItemId) {
      toast({ variant: 'destructive', title: 'Nenhum item selecionado' });
      return;
    }
    const item = stockItems.find(i => i.id === effectiveItemId);
    if (item) {
  let finalQuantity = Number(quantity) || 1;
  if (finalQuantity > 30000) finalQuantity = 30000;
      if (finalQuantity <= 0) {
        toast({ variant: 'destructive', title: 'Quantidade Inválida', description: 'A quantidade deve ser maior que zero.' });
        return;
      }
      // validate against available stock before appending
      if (item.quantity < finalQuantity) {
        toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: `Apenas ${item.quantity} unidades de "${item.name}" disponíveis.` });
        return;
      }

  onAppendItem({ item, quantity: finalQuantity, unit: unit === 'OUTRA' ? (customUnit || 'UN') : unit });
  hapticImpact('light').catch(()=>{});
      
      setCurrentItemId('');
      setQuantity('');
      setUnit('UN');
    }
  };

  // disable submit if any cart item is invalid or exceeds stock
  const isSubmitDisabled = useMemo(() => {
    if (!withdrawalItems || withdrawalItems.length === 0) return true;
    for (const cartItem of withdrawalItems) {
      const stockItem = stockItems.find(i => i.id === cartItem.item.id);
      if (!stockItem) return true;
      if (cartItem.quantity <= 0) return true;
      if (cartItem.quantity > stockItem.quantity) return true;
    }
    return false;
  }, [withdrawalItems, stockItems]);

  return (
    <>
      <Form {...form}>
        <form ref={ref} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Cabeçalho interno da tela, seguindo o protótipo */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Registrar Saída</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentDate}</p>
            </div>
            <button type="button" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400" onClick={() => setSearchScannerOpen(true)} aria-label="Ler código de barras">
              <span className="material-symbols-outlined">qr_code_scanner</span>
            </button>
          </div>

          {/* Bloco: Adicionar item à retirada */}
          <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-700/50">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Adicionar Item à Retirada</h3>
            {hasStockAvailable ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="item">Item</label>
                  {/* Select de item com busca fullscreen */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">search</span>
                    <div className="pl-8">
                      <FullscreenSearchList
                        options={searchOptions}
                        value={currentItemId}
                        onSelect={(opt) => setCurrentItemId(opt.value)}
                        placeholder="Selecione um item..."
                        searchPlaceholder="Digite nome, código ou local..."
                        maxResults={500}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="quantity">Quantidade</label>
                    <Input id="quantity" name="quantity" type="number" min={1} max={30000} value={quantity} onChange={(e)=>setQuantity(e.target.value)} className="py-2.5" placeholder="1" />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="unit">Unidade</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger id="unit" className="py-2.5"><SelectValue placeholder="UN" /></SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {unit === 'OUTRA' && (
                    <div className="w-28">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="customUnit">Unid. personalizada</label>
                      <Input id="customUnit" className="py-2.5" placeholder="UN" value={customUnit} onChange={(e)=>setCustomUnit(e.target.value.toUpperCase())} maxLength={8} />
                    </div>
                  )}
                  <button type="button" onClick={handleAddItemToCart} className="h-11 w-11 flex-shrink-0 bg-primary text-white rounded-md flex items-center justify-center hover:bg-blue-600 transition-colors" aria-label="Adicionar">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-lg">
                <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-zinc-600 mb-2">shopping_basket</span>
                <p className="text-zinc-500 dark:text-zinc-400">Não há itens em estoque para retirada.</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Vá para a aba de Entrada para adicionar.</p>
              </div>
            )}
          </div>

          {/* Cesta / estado vazio */}
          {withdrawalItems.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-lg">
              <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-zinc-600 mb-2">shopping_basket</span>
              <p className="text-zinc-500 dark:text-zinc-400">Sua cesta de retirada está vazia.</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Adicione itens para continuar.</p>
            </div>
          ) : (
            <WithdrawalCart
              items={withdrawalItems}
              onRemove={onRemoveItem}
              onUpdateQuantity={onUpdateItemQuantity}
            />
          )}

          {/* Quem / Destino */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="retirado">Quem (Retirou)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">person</span>
                <FormField
                  control={form.control}
                  name="requestedBy"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormControl>
                        <Input id="retirado" placeholder="Nome do responsável" {...field} autoComplete="off" className="pl-10 py-2.5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="destino">Para Quem (Destino)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">apartment</span>
                <FormField
                  control={form.control}
                  name="requestedFor"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormControl>
                        <Input id="destino" placeholder="Nome ou departamento" {...field} autoComplete="off" className="pl-10 py-2.5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="outline" className="w-full py-3" onClick={()=>{ onClearCart(); hapticImpact('medium').catch(()=>{}); }}>Limpar Tudo</Button>
            <Button type="submit" className="w-full py-3" disabled={isSubmitDisabled} onClick={()=> hapticNotification('success').catch(()=>{})}>Salvar Retirada</Button>
          </div>
        </form>
      </Form>
      {isSearchScannerOpen && (
        <SearchScannerDialog
          isOpen={isSearchScannerOpen}
          onOpenChange={setSearchScannerOpen}
          stockItems={stockItems}
          onSuccess={handleScanSuccess}
          onNotFound={handleScanNotFound}
        />
      )}
    </>
  );
});

WithdrawalForm.displayName = 'WithdrawalForm';
