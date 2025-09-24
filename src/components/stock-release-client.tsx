
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, ChevronLeft, ChevronRight, PlusCircle, Calendar as CalendarIcon, X, Camera, Trash } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
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
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";


const formSchema = z.object({
  item: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome do item é obrigatório."),
    specifications: z.string().min(1, "As especificações são obrigatórias."),
    barcode: z.string().optional(),
  }),
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

export interface StockReleaseClientRef {
  setFormItem: (item: StockItem) => void;
}

const StockReleaseClient = forwardRef<StockReleaseClientRef, StockReleaseClientProps>(
  ({ stockItems, history, onUpdateHistory, onSetIsAddItemDialogOpen }, ref) => {
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
      item: {
        name: "",
        specifications: "",
      },
      quantity: 1,
      unit: "un",
      requestedBy: "",
      requestedFor: "",
    },
  });

  useImperativeHandle(ref, () => ({
    setFormItem(item: StockItem) {
      form.setValue('item', item);
    }
  }));

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
    const withdrawalItem: StockItem = {
      id: values.item.id || `NEW-${Date.now()}`, // Create a temporary ID if it's a new item
      name: values.item.name,
      specifications: values.item.specifications,
      barcode: values.item.barcode,
    };
    
    const newRecord: WithdrawalRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      item: withdrawalItem,
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
      item: {
        name: "",
        specifications: "",
      },
      quantity: 1,
      unit: "un",
      requestedBy: "",
      requestedFor: "",
    });
  };
  
  const handleClear = () => {
      form.reset({
        item: { name: "", specifications: "" },
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

  const handleDeleteRecord = (recordId: string) => {
    const updatedHistory = history.filter(record => record.id !== recordId);
    onUpdateHistory(updatedHistory);
    toast({
        title: "Registro Excluído",
        description: "O registro de retirada foi removido do histórico.",
    });
  };
  
  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue('item.name', newName);
    const existingItem = stockItems.find(item => item.name === newName);
    if (existingItem) {
      form.setValue('item', existingItem);
    } else {
      form.setValue('item.id', undefined);
      form.setValue('item.specifications', '');
      form.setValue('item.barcode', undefined);
    }
  }


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
                                name="item.name"
                                render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Nome do Item</FormLabel>
                                    <FormControl>
                                    <>
                                        <Input 
                                            placeholder="Digite ou selecione o nome do item" 
                                            {...field} 
                                            onChange={handleItemNameChange}
                                            list="stock-items-datalist"
                                        />
                                        <datalist id="stock-items-datalist">
                                            {stockItems.map((item) => (
                                                <option key={item.id} value={item.name} />
                                            ))}
                                        </datalist>
                                    </>
                                    </FormControl>
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
                                            <Input placeholder="Ex: 8000 DPI, USB-C" {...field} />
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
                            <TableHead className="text-center">Un.</TableHead>
                            <TableHead>Quem</TableHead>
                            <TableHead>Para Quem</TableHead>
                             <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedHistory.length > 0 ? (
                            paginatedHistory.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="text-muted-foreground">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="font-medium">{record.item.name}</TableCell>
                                    <TableCell className="text-center">{record.quantity}</TableCell>
                                    <TableCell className="text-center">{record.unit}</TableCell>
                                    <TableCell>{record.requestedBy}</TableCell>
                                    <TableCell>{record.requestedFor}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Excluir</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro de retirada.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }}>Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
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
);

StockReleaseClient.displayName = 'StockReleaseClient';
export default StockReleaseClient;

    