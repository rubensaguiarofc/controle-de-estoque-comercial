
"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Plus, Trash, Scan, Package } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/constants";
import { hapticImpact } from "@/lib/native/haptics";
import { SearchScannerDialog } from "@/components/search-scanner-dialog";
import { Badge } from "@/components/ui/badge";

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
  const [itemQuery, setItemQuery] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [unit, setUnit] = useState('UN');
  const unitOptions = ['UN','PC','CX','KG','M','L','OUTRA'];
  const [customUnit, setCustomUnit] = useState('');
  const [isScannerOpen, setScannerOpen] = useState(false);
  
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return stockItems;
    return stockItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.specifications.toLowerCase().includes(q) ||
      (i.barcode ? i.barcode.toLowerCase().includes(q) : false)
    );
  }, [itemQuery, stockItems]);

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
  let numQuantity = Number(quantity);
  if (Number.isNaN(numQuantity)) numQuantity = 0;
  if (numQuantity > MAX_QUANTITY) numQuantity = MAX_QUANTITY;
    if (item && numQuantity > 0) {
      setEntryItems(prev => {
        const existingIndex = prev.findIndex(e => e.item.id === item.id && e.unit === (unit === 'OUTRA' ? (customUnit || 'UN') : unit));
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += numQuantity;
          return updated;
        }
  const finalUnit = unit === 'OUTRA' ? (customUnit || 'UN') : unit;
  return [...prev, { item, quantity: numQuantity, unit: finalUnit }];
      });
      toast({ title: '✅ Item adicionado', description: `${numQuantity} ${unit === 'OUTRA' ? (customUnit || 'UN') : unit} de "${item.name}"` });
  hapticImpact('light').catch(()=>{});
      // Manter o item selecionado, limpar apenas quantidade para entrada rápida
      setQuantity('');
      // Auto-focus no campo de quantidade para próxima entrada
      setTimeout(() => quantityInputRef.current?.focus(), 100);
    }
  }, [currentItemId, quantity, unit, customUnit, stockItems, toast]);

  const handleScanSuccess = useCallback((item: StockItem) => {
    setCurrentItemId(item.id);
    setItemQuery('');
    setScannerOpen(false);
    toast({ title: '📦 Item escaneado', description: item.name });
    setTimeout(() => quantityInputRef.current?.focus(), 100);
  }, [toast]);

  const handleScanNotFound = useCallback(() => {
    toast({ variant: 'destructive', title: 'Item não encontrado', description: 'Código de barras não cadastrado.' });
    setScannerOpen(false);
  }, [toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentItemId && quantity) {
      e.preventDefault();
      handleAddItemToEntry();
    }
  }, [currentItemId, quantity, handleAddItemToEntry]);
  
  const handleRemoveEntryItem = (itemId: string) => {
    setEntryItems(prev => prev.filter(entry => entry.item.id !== itemId));
  hapticImpact('light').catch(()=>{});
  };

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

    toast({ title: "✅ Sucesso!", description: `Entrada de ${newRecords.length} item(ns) registrada.` });
    form.reset({ addedBy: "" });
    setEntryItems([]);
    setCurrentItemId('');
    setQuantity('');
    setUnit('UN');
    setItemQuery('');
    // Auto-focus no filtro para próxima entrada
    setTimeout(() => filterInputRef.current?.focus(), 100);
  }, [entryItems, onUpdateHistory, toast, form]);

  const selectedItem = useMemo(() => 
    stockItems.find(i => i.id === currentItemId), 
    [currentItemId, stockItems]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Registrar Entrada de Estoque</CardTitle>
            <CardDescription>{currentDate}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Adicionar Item ao Estoque</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
                  <Scan className="h-4 w-4 mr-2" />
                  Scanner
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] md:grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
                  <FormItem className="sm:col-span-2 md:col-span-1">
                    <FormLabel>Filtrar Item</FormLabel>
                    <Input 
                      ref={filterInputRef}
                      placeholder="Nome, especificação ou código" 
                      value={itemQuery} 
                      onChange={(e)=>setItemQuery(e.target.value)} 
                    />
                  </FormItem>
                  <FormItem className="sm:col-span-2 md:col-span-1">
                    <FormLabel>
                      Item
                      {selectedItem && (
                        <Badge variant="outline" className="ml-2">
                          <Package className="h-3 w-3 mr-1" />
                          Estoque: {selectedItem.quantity}
                        </Badge>
                      )}
                    </FormLabel>
                    <Select onValueChange={setCurrentItemId} value={currentItemId}>
                      <SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger>
                      <SelectContent>
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} <span className="text-muted-foreground text-xs">(Qtd: {item.quantity})</span>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-items" disabled>Nenhum item encontrado</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Qtd.</FormLabel>
                    <Input 
                      ref={quantityInputRef}
                      type="number" 
                      placeholder="0" 
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      onKeyPress={handleKeyPress}
                      min="0" 
                      max={MAX_QUANTITY} 
                    />
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
                  <Button 
                    type="button" 
                    size="icon" 
                    onClick={handleAddItemToEntry} 
                    className="bg-green-600 hover:bg-green-700 sm:col-start-2 md:col-start-4"
                    disabled={!currentItemId || !quantity}
                    title="Adicionar (Enter)"
                  >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Adicionar</span>
                  </Button>
              </div>
              {currentItemId && quantity && (
                <p className="text-xs text-muted-foreground">
                  💡 Dica: Pressione <kbd className="px-1.5 py-0.5 bg-muted border rounded">Enter</kbd> para adicionar rapidamente
                </p>
              )}
            </div>

            {entryItems.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Itens para Entrada</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {entryItems.map(({ item, quantity, unit }) => (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-card-foreground">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{quantity} {unit}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveEntryItem(item.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                </div>
            )}

            <FormField
              control={form.control}
              name="addedBy"
              render={({ field }: any) => (
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
            <Button type="button" variant="outline" onClick={() => { form.reset(); setEntryItems([]); setCurrentItemId(''); setQuantity(''); setUnit('UN'); setItemQuery(''); }}>Limpar</Button>
            <Button type="submit" disabled={entryItems.length === 0}>
              Salvar Entrada
              {entryItems.length > 0 && ` (${entryItems.length})`}
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      <SearchScannerDialog
        isOpen={isScannerOpen}
        onOpenChange={setScannerOpen}
        stockItems={stockItems}
        onSuccess={handleScanSuccess}
        onNotFound={handleScanNotFound}
      />
    </Form>
  );
}
