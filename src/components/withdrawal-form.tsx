
"use client";

import React, { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ScanLine, Plus, PackageX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
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
  onRemoveItem: (itemId: string) => void;
  onUpdateItemQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
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
}, ref) => {
  const { toast } = useToast();
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [unit, setUnit] = useState('UN');
  const unitOptions = ['UN','PC','CX','KG','M','L','OUTRA'];
  const [customUnit, setCustomUnit] = useState('');

  const hasStockAvailable = useMemo(() => stockItems.some(item => item.quantity > 0), [stockItems]);

  const handleScanSuccess = (foundItem: StockItem) => {
    onAppendItem({ item: foundItem, quantity: 1, unit: 'UN' });
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
    if (!currentItemId) {
      toast({ variant: 'destructive', title: 'Nenhum item selecionado' });
      return;
    }
    const item = stockItems.find(i => i.id === currentItemId);
    if (item) {
  let finalQuantity = Number(quantity) || 1;
  if (finalQuantity > MAX_QUANTITY) finalQuantity = MAX_QUANTITY;
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
  Haptics.impact({ style: ImpactStyle.Light }).catch(()=>{});
      
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
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registrar Saída de Estoque</CardTitle>
                  <CardDescription>{currentDate}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" onClick={() => setSearchScannerOpen(true)}>
                    <ScanLine className="h-4 w-4" />
                    <span className="sr-only">Buscar por código de barras</span>
                  </Button>
                  {process.env.NODE_ENV !== 'production' && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSearchScannerOpen(true)}>
                      <ScanLine className="h-4 w-4 mr-2" />
                      Abrir Scanner (debug)
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="text-lg font-medium">Adicionar Item à Retirada</h3>
                {hasStockAvailable ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] md:grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
                      <FormItem className="sm:col-span-2 md:col-span-1">
                        <FormLabel>Item</FormLabel>
                        <Select onValueChange={setCurrentItemId} value={currentItemId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um item" />
                            </SelectTrigger>
                          <SelectContent>
                            {stockItems.map((item) => (
                              <SelectItem key={item.id} value={item.id} disabled={item.quantity <= 0}>
                                {item.name} - ({item.quantity} em estoque)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Qtd.</FormLabel>
                        <Input type="number" placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" max={MAX_QUANTITY} />
                      </FormItem>
                      <FormItem className="hidden md:block">
                        <FormLabel>Unidade</FormLabel>
                        <Select value={unit} onValueChange={setUnit}>
                          <SelectTrigger><SelectValue placeholder="UN" /></SelectTrigger>
                          <SelectContent>
                            {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {unit === 'OUTRA' && (
                          <Input className="mt-2" placeholder="Digite a unidade" value={customUnit} onChange={(e)=>setCustomUnit(e.target.value.toUpperCase())} maxLength={8} />
                        )}
                      </FormItem>
            <Button type="button" size="icon" onClick={handleAddItemToCart} className="bg-primary hover:bg-primary/90 sm:col-start-2 md:col-start-4 dark:bg-teal-500 dark:hover:bg-teal-600">
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Adicionar</span>
                      </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 gap-2">
                    <PackageX className="h-8 w-8 text-foreground dark:text-white" />
                    <p className="font-medium">Não há itens em estoque para retirada.</p>
                    <p className="text-sm">Vá para a aba de "Entrada" para adicionar novos itens ao estoque.</p>
                  </div>
                )}
              </div>

              <WithdrawalCart 
                items={withdrawalItems} 
                onRemove={onRemoveItem} 
                onUpdateQuantity={onUpdateItemQuantity} 
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quem (Retirou)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requestedFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Para Quem (Destino)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome ou departamento" {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>{ onClearCart(); Haptics.impact({style: ImpactStyle.Medium}).catch(()=>{}); }}>Limpar Tudo</Button>
              <Button type="submit" disabled={isSubmitDisabled} onClick={()=> Haptics.notification({ type: NotificationType.Success }).catch(()=>{})}>Salvar Retirada</Button>
            </CardFooter>
          </Card>
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
