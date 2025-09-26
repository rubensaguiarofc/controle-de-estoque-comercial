
"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { PlusCircle, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StockItem } from "@/lib/types";
import type { WithdrawalFormValues } from "./stock-release-client";
import { useState } from "react";
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
  onSetIsAddItemDialogOpen
}: WithdrawalFormProps) {
  const { toast } = useToast();
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);

  const handleClear = () => {
    form.reset({
      item: { name: "", specifications: "", barcode: "" },
      quantity: 1,
      unit: "un",
      requestedBy: "",
      requestedFor: "",
    });
    toast({
      title: "Campos Limpos",
      description: "Todos os campos de entrada foram redefinidos.",
    });
  };

  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value.toUpperCase();
    form.setValue('item.name', newName);
    const existingItem = stockItems.find(item => item.name.toUpperCase() === newName);
    if (existingItem) {
      form.setValue('item', existingItem, { shouldValidate: true });
    } else {
      form.setValue('item.id', undefined, { shouldValidate: true });
      form.setValue('item.specifications', '');
      form.setValue('item.barcode', '');
    }
  };

  const handleScanSuccess = (foundItem: StockItem) => {
    form.setValue('item', foundItem, { shouldValidate: true });
    toast({
      title: "Item Encontrado",
      description: `Item "${foundItem.name}" selecionado.`,
    });
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

  return (
    <>
      <Card className="lg:col-span-3 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Registrar Retirada</CardTitle>
              <CardDescription>{currentDate}</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => onSetIsAddItemDialogOpen(true)}>
              <PlusCircle className="mr-2" />
              Cadastrar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="item.name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nome do Item</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Digite ou selecione o nome do item"
                            {...field}
                            onChange={handleItemNameChange}
                            list="stock-items-datalist"
                          />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={() => setSearchScannerOpen(true)}>
                          <ScanLine className="h-4 w-4" />
                          <span className="sr-only">Buscar por código de barras</span>
                        </Button>
                      </div>
                      <datalist id="stock-items-datalist">
                        {stockItems.map((item) => (
                          <option key={item.id} value={item.name} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="item.specifications"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Especificações</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 8000 DPI, USB-C" {...field} readOnly={!!form.watch('item.id')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Unidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: un, pç, cx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label>ID do Item</Label>
                  <Input value={form.watch("item")?.id || '—'} readOnly className="bg-muted" />
                </div>
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
              <CardFooter className="px-0 pt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClear}>Limpar</Button>
                <Button type="submit">Salvar Retirada</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
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
