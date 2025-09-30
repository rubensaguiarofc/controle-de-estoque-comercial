
"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ScanLine, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StockItem, WithdrawalItem } from "@/lib/types";
import type { WithdrawalFormValues } from "./stock-release-client";
import dynamic from "next/dynamic";
import { WithdrawalCart } from "./withdrawal-cart";

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
}

export function WithdrawalForm({
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
}: WithdrawalFormProps) {
  const { toast } = useToast();
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('UN');

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
      onAppendItem({ item, quantity, unit });
      setCurrentItemId('');
      setQuantity(1);
      setUnit('UN');
    }
  };

  const handleClear = () => {
    form.reset({ requestedBy: "", requestedFor: "" });
    onRemoveItem('all'); // Custom logic in parent to clear all
    toast({ title: "Campos Limpos", description: "Todos os campos de entrada foram redefinidos." });
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registrar Retirada</CardTitle>
                  <CardDescription>{currentDate}</CardDescription>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setSearchScannerOpen(true)}>
                  <ScanLine className="h-4 w-4" />
                  <span className="sr-only">Buscar por código de barras</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="text-lg font-medium">Adicionar Item à Retirada</h3>
                <div className="grid sm:grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
                    <FormItem>
                      <FormLabel>Item</FormLabel>
                      <Select onValueChange={setCurrentItemId} value={currentItemId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um item" />
                          </SelectTrigger>
                        <SelectContent>
                          {stockItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.specifications}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Qtd.</FormLabel>
                      <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                    </FormItem>
                     <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <Input placeholder="UN, KG, PC..." value={unit} onChange={(e) => setUnit(e.target.value.toUpperCase())} />
                    </FormItem>
                    <Button type="button" size="icon" onClick={handleAddItemToCart} className="bg-teal-500 hover:bg-teal-600">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Adicionar</span>
                    </Button>
                </div>
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
                        <Input placeholder="Nome do responsável" {...field} list="requesters-datalist" />
                      </FormControl>
                      <datalist id="requesters-datalist">
                        {uniqueRequesters.map((requester) => (
                          <option key={requester} value={requester} />
                        ))}
                      </datalist>
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
                        <Input placeholder="Nome ou departamento" {...field} list="destinations-datalist" />
                      </FormControl>
                      <datalist id="destinations-datalist">
                        {uniqueDestinations.map((destination) => (
                          <option key={destination} value={destination} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClear}>Limpar Tudo</Button>
              <Button type="submit">Salvar Retirada</Button>
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
}
