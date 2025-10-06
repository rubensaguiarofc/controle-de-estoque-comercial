
"use client";

import { useState, useCallback } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

import type { StockItem, EntryRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const formSchema = z.object({
  addedBy: z.string().min(1, 'O campo "Adicionado por" é obrigatório.').toUpperCase(),
});

type EntryFormValues = z.infer<typeof formSchema>;

interface StockEntryClientProps {
  stockItems: StockItem[];
  onUpdateHistory: (records: EntryRecord[]) => void;
  uniqueAdders: string[];
}

export default function StockEntryClient({ stockItems, onUpdateHistory, uniqueAdders }: StockEntryClientProps) {
  const { toast } = useToast();
  const [currentDate] = useState(format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
  const [entryItems, setEntryItems] = useState<{ item: StockItem, quantity: number, unit: string }[]>([]);

  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [unit, setUnit] = useState('UN');

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { addedBy: "" },
  });

  const handleAddItemToEntry = useCallback(() => {
    if (!currentItemId || !quantity) {
      toast({ variant: 'destructive', title: 'Campos incompletos', description: 'Selecione um item e informe a quantidade.' });
      return;
    }
    const item = stockItems.find(i => i.id === currentItemId);
    const numQuantity = Number(quantity);
    if (item && numQuantity > 0) {
      setEntryItems(prev => {
        const existingIndex = prev.findIndex(e => e.item.id === item.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += numQuantity;
          return updated;
        }
        return [...prev, { item, quantity: numQuantity, unit }];
      });
      toast({ title: 'Item adicionado à entrada', description: `${numQuantity}x "${item.name}" pronto para ser adicionado.` });
      setCurrentItemId('');
      setQuantity('');
      setUnit('UN');
    }
  }, [currentItemId, quantity, unit, stockItems, toast]);

  const onSubmit = useCallback((values: EntryFormValues) => {
    if (entryItems.length === 0) {
      toast({ variant: "destructive", title: "Nenhum item para adicionar", description: "Adicione pelo menos um item para registrar uma entrada." });
      return;
    }
    
    const newRecords: EntryRecord[] = entryItems.map(({ item, quantity, unit }) => ({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      item,
      quantity,
      unit,
      addedBy: values.addedBy,
    }));
    
    onUpdateHistory(newRecords);

    toast({ title: "Sucesso!", description: `Entrada de ${newRecords.length} item(ns) registrada.` });
    form.reset({ addedBy: "" });
    setEntryItems([]);
  }, [entryItems, onUpdateHistory, toast, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Registrar Entrada de Estoque</CardTitle>
            <CardDescription>{currentDate}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="text-lg font-medium">Adicionar Item ao Estoque</h3>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] md:grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
                  <FormItem className="sm:col-span-2 md:col-span-1">
                    <FormLabel>Item</FormLabel>
                    <Select onValueChange={setCurrentItemId} value={currentItemId}>
                      <SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger>
                      <SelectContent>
                        {stockItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Qtd.</FormLabel>
                    <Input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </FormItem>
                   <FormItem className="hidden md:block">
                    <FormLabel>Unidade</FormLabel>
                    <Input placeholder="UN, KG, PC..." value={unit} onChange={(e) => setUnit(e.target.value.toUpperCase())} />
                  </FormItem>
                  <Button type="button" size="icon" onClick={handleAddItemToEntry} className="bg-blue-500 hover:bg-blue-600 sm:col-start-2 md:col-start-4">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Adicionar</span>
                  </Button>
              </div>
            </div>

            {entryItems.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium mb-2">Itens para Entrada</h3>
                    <ul>
                        {entryItems.map(({ item, quantity, unit }) => (
                            <li key={item.id} className="flex justify-between items-center p-2 border-b">
                                <span>{item.name}</span>
                                <span className="font-mono">{quantity} {unit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <FormField
              control={form.control}
              name="addedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adicionado por</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável" {...field} list="adders-datalist" />
                  </FormControl>
                  <datalist id="adders-datalist">
                    {uniqueAdders.map((adder) => <option key={adder} value={adder} />)}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="px-6 pt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { form.reset(); setEntryItems([]); }}>Limpar</Button>
            <Button type="submit">Salvar Entrada</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
