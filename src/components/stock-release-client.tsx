
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, ChevronLeft, ChevronRight, PlusCircle, Calendar as CalendarIcon, X, Camera } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';


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
});

type FormValues = z.infer<typeof formSchema>;

const ITEMS_PER_PAGE = 5;

interface StockReleaseClientProps {
  stockItems: StockItem[];
  history: WithdrawalRecord[];
  onUpdateHistory: (history: WithdrawalRecord[]) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
}

export default function StockReleaseClient({ 
    stockItems, 
    history, 
    onUpdateHistory, 
    onSetIsAddItemDialogOpen 
}: StockReleaseClientProps) {
  const { toast } = useToast();
  const [comboboxOpen, setComboboxOpen] = useState(false);
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
    },
  });

  useEffect(() => {
    setCurrentDate(format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
  }, []);

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

    onUpdateHistory([newRecord, ...history]);
    toast({
      title: "Sucesso!",
      description: "Retirada de item registrada.",
    });
    form.reset({
      quantity: 1,
      unit: "un",
      requestedBy: "",
      requestedFor: "",
    });
  };
  
  const handleClear = () => {
      form.reset({
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <Card className="lg:col-span-3 shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                    <CardTitle>Registrar Retirada</CardTitle>
                    <CardDescription>{currentDate}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => onSetIsAddItemDialogOpen(true)}>
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
