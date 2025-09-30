
"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StockItem } from "@/lib/types";
import type { WithdrawalFormValues } from "./stock-release-client";
import dynamic from "next/dynamic";

const SearchScannerDialog = dynamic(() => import('./search-scanner-dialog').then(mod => mod.SearchScannerDialog), { ssr: false });

interface WithdrawalFormProps {
  form: UseFormReturn<WithdrawalFormValues>;
  currentDate: string;
  stockItems: StockItem[];
  uniqueRequesters: string[];
  uniqueDestinations: string[];
  onSubmit: (values: WithdrawalFormValues) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
}

export function WithdrawalForm({
  form,
  currentDate,
  stockItems,
  uniqueRequesters,
  uniqueDestinations,
  onSubmit,
}: WithdrawalFormProps) {
  const { toast } = useToast();
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);
  
  const handleScanSuccess = (foundItem: StockItem) => {
    form.setValue('selectedItem', foundItem.id);
    setSearchScannerOpen(false);
    toast({ title: "Item Encontrado", description: `Item "${foundItem.name}" selecionado.` });
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
    form.reset({ selectedItem: "", quantity: 1, unit: "UN", requestedBy: "", requestedFor: "" });
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
              <div className="grid sm:grid-cols-[1fr_80px_100px] gap-4 items-end">
                <FormField
                  control={form.control}
                  name="selectedItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.specifications}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qtd.</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="UN, KG, PC..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
