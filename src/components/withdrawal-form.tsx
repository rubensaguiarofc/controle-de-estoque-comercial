
"use client";

import React, { useState } from "react";
import { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Plus, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { StockItem, WithdrawalItem } from "@/lib/types";
import type { WithdrawalFormValues } from "./stock-release-client";
import dynamic from "next/dynamic";
import { WithdrawalCart } from "./withdrawal-cart";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "./ui/label";

const SearchScannerDialog = dynamic(() => import('./search-scanner-dialog').then(mod => mod.SearchScannerDialog), { ssr: false });

interface WithdrawalFormProps {
  form: UseFormReturn<WithdrawalFormValues>;
  currentDate: string;
  stockItems: StockItem[];
  uniqueRequesters: string[];
  uniqueDestinations: string[];
  onSubmit: (values: WithdrawalFormValues) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
  withdrawalItems: FieldArrayWithId<WithdrawalFormValues, "withdrawalItems", "id">[];
  onAppendItem: (item: WithdrawalItem) => void;
  onRemoveItem: (index: number) => void;
}

export function WithdrawalForm({
  form,
  currentDate,
  stockItems,
  uniqueRequesters,
  uniqueDestinations,
  onSubmit,
  withdrawalItems,
  onAppendItem,
  onRemoveItem,
}: WithdrawalFormProps) {
  const { toast } = useToast();
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<StockItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('UN');

  const handleAddItemToCart = () => {
    if (!currentItem) {
      toast({ variant: 'destructive', title: 'Nenhum item selecionado' });
      return;
    }
    const existingItemIndex = withdrawalItems.findIndex(field => field.id === currentItem.id);
    if (existingItemIndex !== -1) {
      toast({ variant: 'destructive', title: 'Item já adicionado' });
      return;
    }

    onAppendItem({ ...currentItem, quantity, unit });
    setCurrentItem(null);
    setQuantity(1);
    setUnit('UN');
  };

  const handleScanSuccess = (foundItem: StockItem) => {
    const existingItemIndex = withdrawalItems.findIndex(field => field.id === foundItem.id);
    if (existingItemIndex === -1) {
        onAppendItem({ ...foundItem, quantity: 1, unit: 'UN' });
        toast({ title: "Item Adicionado", description: `Item "${foundItem.name}" adicionado à lista.` });
    } else {
        toast({ variant: 'destructive', title: "Item já adicionado", description: "Este item já está na lista de retirada."});
    }
    setSearchScannerOpen(false);
  };

  const handleScanNotFound = () => {
    toast({
      variant: 'destructive',
      title: "Item Não Encontrado",
      description: "Nenhum item com este código de barras na biblioteca.",
    });
    setSearchScannerOpen(false);
  };

  const handleClear = () => {
    form.reset({ withdrawalItems: [], requestedBy: "", requestedFor: "" });
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
                <div className="space-y-4">
                    <Label>Itens para Retirada</Label>
                    <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                      <WithdrawalCart items={withdrawalItems} onRemove={onRemoveItem} />
                      <div className="flex items-end gap-2 pt-2">
                        
                      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-start">
                                {currentItem ? currentItem.name : 'Selecione um item...'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar item..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {stockItems.map((item) => (
                                            <CommandItem
                                                key={item.id}
                                                value={item.id}
                                                onSelect={(currentValue) => {
                                                  const selected = stockItems.find(
                                                    (stockItem) => stockItem.id.toLowerCase() === currentValue.toLowerCase()
                                                  );
                                                  setCurrentItem(selected || null);
                                                  setPopoverOpen(false);
                                                }}
                                            >
                                                {item.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                      </Popover>

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-20"
                                placeholder="Qtd"
                            />
                            <Input
                                value={unit}
                                onChange={(e) => setUnit(e.target.value.toUpperCase())}
                                className="w-20"
                                placeholder="Un"
                            />
                            <Button type="button" size="icon" onClick={handleAddItemToCart} disabled={!currentItem}>
                                <Plus />
                            </Button>
                        </div>
                      </div>
                      <FormMessage>{form.formState.errors.withdrawalItems?.message}</FormMessage>
                    </div>
                </div>

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
