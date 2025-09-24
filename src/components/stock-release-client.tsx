
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, FileUp, Loader2, Wand2, ChevronLeft, ChevronRight, PlusCircle, Calendar as CalendarIcon, X, Camera } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';


import { autofillFromDescription } from "@/app/actions";
import { MOCK_STOCK_ITEMS as INITIAL_STOCK_ITEMS } from "@/lib/mock-data";
import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { StockReleaseLogo } from "./icons";
import { Separator } from "./ui/separator";
import { AddItemDialog } from "./add-item-dialog";
import { Calendar } from "./ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


const formSchema = z.object({
  item: z.object(
    {
      id: z.string(),
      name: z.string(),
      specifications: z.string(),
      barcode: z.string().optional(),
    },
    { required_error: "Selecione um item da lista." }
  ),
  quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
  unit: z.string().min(1, "A unidade é obrigatória."),
  requestedBy: z.string().min(1, 'O campo "Quem" é obrigatório.'),
  requestedFor: z.string().min(1, 'O campo "Para Quem" é obrigatório.'),
  aiDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ITEMS_PER_PAGE = 5;

export default function StockReleaseClient() {
  const { toast } = useToast();
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [isSearchScannerOpen, setSearchScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const searchVideoRef = useRef<HTMLVideoElement>(null);


  const [currentPage, setCurrentPage] = useState(1);
  const [currentDate, setCurrentDate] = useState("");

  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [requesterFilter, setRequesterFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      unit: "un",
      requestedBy: "",
      requestedFor: "",
      aiDescription: "",
    },
  });

  useEffect(() => {
    setCurrentDate(format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("withdrawalHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedStockItems = localStorage.getItem("stockItems");
      if (storedStockItems) {
        setStockItems(JSON.parse(storedStockItems));
      } else {
        setStockItems(INITIAL_STOCK_ITEMS);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      try {
        localStorage.setItem("withdrawalHistory", JSON.stringify(history));
        localStorage.setItem("stockItems", JSON.stringify(stockItems));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [history, stockItems, isInitialLoad]);

  const filteredHistory = useMemo(() => {
    setCurrentPage(1);
    return history.filter(record => {
      const recordDate = new Date(record.date);
      const isDateMatch = !dateFilter || (
        recordDate.getFullYear() === dateFilter.getFullYear() &&
        recordDate.getMonth() === dateFilter.getMonth() &&
        recordDate.getDate() === dateFilter.getDate()
      );
      const isRequesterMatch = !requesterFilter || record.requestedBy.toLowerCase().includes(requesterFilter.toLowerCase());
      const isDestinationMatch = !destinationFilter || record.requestedFor.toLowerCase().includes(destinationFilter.toLowerCase());

      return isDateMatch && isRequesterMatch && isDestinationMatch;
    });
  }, [history, dateFilter, requesterFilter, destinationFilter]);
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAutofill = async () => {
    const description = form.getValues("aiDescription") || "";
    if (!description && !photoFile) {
      toast({
        variant: "destructive",
        title: "Entrada Faltando",
        description: "Forneça uma descrição ou uma foto para a análise de IA.",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      let photoDataUri: string | undefined;
      if (photoFile) {
        photoDataUri = await fileToDataUri(photoFile);
      }

      const result = await autofillFromDescription(description, photoDataUri);

      if (result.itemName) {
        const matchedItem = stockItems.find(
          (item) => item.name.toLowerCase().includes(result.itemName!.toLowerCase())
        );
        if (matchedItem) {
          form.setValue("item", matchedItem);
        }
      }
      if (result.quem) form.setValue("requestedBy", result.quem, { shouldValidate: true });
      if (result.paraQuem) form.setValue("requestedFor", result.paraQuem, { shouldValidate: true });

      toast({
        title: "Análise Concluída",
        description: "Os campos foram preenchidos com base nos dados fornecidos.",
      });

    } catch (error) {
      console.error("AI autofill failed", error);
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: "Não foi possível analisar os dados. Tente novamente.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    const newRecord: WithdrawalRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      item: values.item,
      quantity: values.quantity,
      unit: values.unit,
      requestedBy: values.requestedBy,
      requestedFor: values.requestedFor,
    };

    setHistory((prevHistory) => [newRecord, ...prevHistory]);
    toast({
      title: "Sucesso!",
      description: "Retirada de item registrada.",
    });
    form.reset({
      quantity: 1,
      unit: "un",
      requestedBy: "",
      requestedFor: "",
      aiDescription: "",
    });
    setPhotoFile(null);
  };
  
  const handleClear = () => {
      form.reset({
        quantity: 1,
        unit: "un",
        requestedBy: "",
        requestedFor: "",
        aiDescription: "",
      });
      setPhotoFile(null);
      toast({
          title: "Campos Limpos",
          description: "Todos os campos de entrada foram redefinidos.",
      });
  };

  const handleAddItem = useCallback((newItem: Omit<StockItem, 'id' | 'barcode'> & { barcode?: string }) => {
    const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]))) + 1 : 1).toString().padStart(3, '0');
    const newId = `ITM-${newIdNumber}`;
    const itemWithId: StockItem = { ...newItem, id: newId, barcode: newItem.barcode || '' };
    
    setStockItems(prev => [...prev, itemWithId]);
    form.setValue('item', itemWithId);
    setAddItemDialogOpen(false);
    toast({
      title: "Item Adicionado",
      description: `${newItem.name} foi adicionado ao estoque.`,
    })
  }, [stockItems, toast, form]);

  const clearFilters = () => {
    setDateFilter(undefined);
    setRequesterFilter('');
    setDestinationFilter('');
  }
  
    useEffect(() => {
    if (!isSearchScannerOpen || !searchVideoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    
    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setHasCameraPermission(true);

            if (searchVideoRef.current) {
                searchVideoRef.current.srcObject = stream;
                
                codeReader.decodeFromVideoDevice(undefined, searchVideoRef.current, (result, err) => {
                    if (result) {
                        const scannedBarcode = result.getText();
                        const foundItem = stockItems.find(item => item.barcode === scannedBarcode);

                        if (foundItem) {
                            form.setValue('item', foundItem);
                             toast({
                                title: "Item Encontrado",
                                description: `Item "${foundItem.name}" selecionado.`,
                            });
                        } else {
                             toast({
                                variant: 'destructive',
                                title: 'Item Não Encontrado',
                                description: `Nenhum item com o código de barras "${scannedBarcode}" foi encontrado.`,
                            });
                        }
                        setSearchScannerOpen(false);
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        console.error('Barcode scan error:', err);
                        toast({
                            variant: 'destructive',
                            title: 'Erro ao Escanear',
                            description: 'Não foi possível ler o código de barras.',
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            setSearchScannerOpen(false);
            toast({
                variant: 'destructive',
                title: 'Acesso à Câmera Negado',
                description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
            });
        }
    };

    startScanning();

    return () => {
        codeReader.reset();
        if (searchVideoRef.current && searchVideoRef.current.srcObject) {
            const stream = searchVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
}, [isSearchScannerOpen, stockItems, form, toast]);


  return (
    <>
    <div className="flex flex-col gap-8">
        <header className="flex items-center gap-3">
            <StockReleaseLogo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">StockRelease</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <Card className="lg:col-span-3 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Registrar Retirada</CardTitle>
                        <CardDescription>{currentDate}</CardDescription>
                      </div>
                       <Button variant="outline" onClick={() => setAddItemDialogOpen(true)}>
                          <PlusCircle className="mr-2" />
                          Cadastrar Item
                      </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="space-y-4 rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Assistente de IA</h3>
                            <Button onClick={handleAutofill} disabled={isAiLoading} size="sm">
                                {isAiLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Wand2 />
                                )}
                                Analisar
                            </Button>
                        </div>
                        <Textarea
                            {...form.register("aiDescription")}
                            placeholder="Cole a descrição do item ou requisição aqui..."
                            className="bg-background"
                        />
                         <div className="flex items-center gap-4">
                            <label htmlFor="photo-upload" className={cn(buttonVariants({ variant: 'outline' }), "cursor-pointer")}>
                                <FileUp className="mr-2" />
                                {photoFile ? 'Mudar Foto' : 'Carregar Foto'}
                            </label>
                            <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            {photoFile && <span className="text-sm text-muted-foreground truncate">{photoFile.name}</span>}
                        </div>
                    </div>
                    
                    <Separator />

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                               <FormField
                                    control={form.control}
                                    name="item"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-col sm:col-span-2">
                                        <FormLabel>Item</FormLabel>
                                        <div className="flex gap-2">
                                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                ? stockItems.find(
                                                    (item) => item.id === field.value.id
                                                    )?.name
                                                : "Selecione um item"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Procurar item..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                    {stockItems.map((item) => (
                                                        <CommandItem
                                                        value={item.name}
                                                        key={item.id}
                                                        onSelect={() => {
                                                            form.setValue("item", item);
                                                            setComboboxOpen(false);
                                                        }}
                                                        >
                                                        <Check
                                                            className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value?.id === item.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {item.name}
                                                        </CommandItem>
                                                    ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                        </Popover>
                                        <Button type="button" variant="outline" size="icon" onClick={() => setSearchScannerOpen(true)}>
                                          <Camera className="h-4 w-4" />
                                          <span className="sr-only">Escanear para buscar</span>
                                        </Button>
                                        </div>
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
                                 <div className="space-y-1 sm:col-span-2">
                                    <Label>Especificações</Label>
                                    <Input value={form.watch("item")?.specifications || '—'} readOnly className="bg-muted" />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="requestedBy"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quem (Retirou)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome do responsável" {...field} />
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
                                                <Input placeholder="Nome ou departamento" {...field} />
                                            </FormControl>
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

            <Card className="lg:col-span-2 shadow-lg">
                <CardHeader>
                    <CardTitle>Histórico de Retiradas</CardTitle>
                    <CardDescription>Visualize e filtre as retiradas de itens.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateFilter && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter ? format(dateFilter, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={dateFilter}
                                onSelect={setDateFilter}
                                initialFocus
                                locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="relative">
                         <Input 
                            placeholder="Quem retirou..."
                            value={requesterFilter}
                            onChange={(e) => setRequesterFilter(e.target.value)}
                         />
                        </div>
                        <div className="relative">
                         <Input 
                            placeholder="Para quem (destino)..."
                            value={destinationFilter}
                            onChange={(e) => setDestinationFilter(e.target.value)}
                         />
                        </div>
                         <Button variant="ghost" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4"/>
                            Limpar Filtros
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Data</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">Qtd.</TableHead>
                                <TableHead>Quem</TableHead>
                                <TableHead>Para Quem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedHistory.length > 0 ? (
                                paginatedHistory.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="text-muted-foreground">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell className="font-medium">{record.item.name}</TableCell>
                                        <TableCell className="text-center">{`${record.quantity} ${record.unit}`}</TableCell>
                                        <TableCell>{record.requestedBy}</TableCell>
                                        <TableCell>{record.requestedFor}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Nenhum registro encontrado para os filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Próxima
                                <ChevronRight />
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
    <AddItemDialog
        isOpen={isAddItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        onAddItem={handleAddItem}
    />
     <Dialog open={isSearchScannerOpen} onOpenChange={setSearchScannerOpen}>
        <DialogContent>
            <div className="flex flex-col items-center gap-4">
                <DialogHeader>
                    <DialogTitle className="text-center">Buscar Item por Código de Barras</DialogTitle>
                    <DialogDescription className="text-center">
                        Aponte a câmera para o código de barras do item.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={searchVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                       <div className="w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75"/>
                    </div>
                </div>
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                        <AlertDescription>
                            Por favor, permita o acesso à câmera para usar esta funcionalidade.
                        </AlertDescription>
                    </Alert>
                )}
                <Button variant="destructive" onClick={() => setSearchScannerOpen(false)}>
                    <X className="mr-2" />
                    Cancelar
                </Button>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}

    