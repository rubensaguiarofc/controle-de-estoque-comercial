"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, FileUp, Loader2, Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { autofillFromDescription } from "@/app/actions";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
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

const formSchema = z.object({
  item: z.object(
    {
      id: z.string(),
      name: z.string(),
      specifications: z.string(),
    },
    { required_error: "Selecione um item da lista." }
  ),
  quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
  requestedBy: z.string().min(1, 'O campo "Quem" é obrigatório.'),
  requestedFor: z.string().min(1, 'O campo "Para Quem" é obrigatório.'),
  aiDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ITEMS_PER_PAGE = 5;

export default function StockReleaseClient() {
  const { toast } = useToast();
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      requestedBy: "",
      requestedFor: "",
      aiDescription: "",
    },
  });

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("withdrawalHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to parse withdrawal history from localStorage", error);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      try {
        localStorage.setItem("withdrawalHistory", JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save withdrawal history to localStorage", error);
      }
    }
  }, [history, isInitialLoad]);
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return history.slice(startIndex, endIndex);
  }, [history, currentPage]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);

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
        const matchedItem = MOCK_STOCK_ITEMS.find(
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
      requestedBy: "",
      requestedFor: "",
      aiDescription: "",
    });
    setPhotoFile(null);
  };
  
  const handleClear = () => {
      form.reset({
        quantity: 1,
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

  return (
    <div className="flex flex-col gap-8">
        <header className="flex items-center gap-3">
            <StockReleaseLogo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">StockRelease</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <Card className="lg:col-span-3 shadow-lg">
                <CardHeader>
                    <CardTitle>Registrar Retirada</CardTitle>
                    <CardDescription>Preencha os detalhes abaixo ou use a IA para preenchimento automático.</CardDescription>
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
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Item</FormLabel>
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
                                                ? MOCK_STOCK_ITEMS.find(
                                                    (item) => item.id === field.value.id
                                                    )?.name
                                                : "Selecione um item"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Procurar item..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                    {MOCK_STOCK_ITEMS.map((item) => (
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
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantidade</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-1">
                                    <Label>ID do Item</Label>
                                    <Input value={form.watch("item")?.id || '—'} readOnly className="bg-muted" />
                                </div>
                                 <div className="space-y-1">
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
                    <CardDescription>Visualize as retiradas de itens mais recentes.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                        <TableCell className="text-muted-foreground">{new Date(record.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{record.item.name}</TableCell>
                                        <TableCell className="text-center">{record.quantity}</TableCell>
                                        <TableCell>{record.requestedBy}</TableCell>
                                        <TableCell>{record.requestedFor}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Nenhum registro encontrado.
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
  );
}
