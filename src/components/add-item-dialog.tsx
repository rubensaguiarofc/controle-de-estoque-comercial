
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, Camera, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

import type { StockItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const formSchema = z.object({
  name: z.string().min(1, "O nome do item é obrigatório."),
  specifications: z.string().min(1, "As especificações são obrigatórias."),
  barcode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (newItem: Omit<StockItem, "id">) => void;
}

export function AddItemDialog({ isOpen, onOpenChange, onAddItem }: AddItemDialogProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specifications: "",
      barcode: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      form.reset();
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    
    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setHasCameraPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                    if (result) {
                        form.setValue('barcode', result.getText());
                        setIsScanning(false);
                        toast({
                            title: "Código de Barras Escaneado",
                            description: `Código: ${result.getText()}`,
                        });
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
            setIsScanning(false);
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
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
}, [isScanning, form, toast]);


  const onSubmit = (values: FormValues) => {
    onAddItem({
      name: values.name,
      specifications: values.specifications,
      // You might want to use the barcode value somewhere,
      // for now it's just in the form.
    });
  };

  const handleScanButtonClick = () => {
      setIsScanning(true);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {!isScanning ? (
          <>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Item</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo item de estoque.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Item</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mouse sem fio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificações</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 8000 DPI, USB-C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Barras (Opcional)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Escaneie ou digite o código" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={handleScanButtonClick}>
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Escanear código de barras</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Salvar Item</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
            <div className="flex flex-col items-center gap-4">
                <DialogHeader>
                    <DialogTitle className="text-center">Escanear Código de Barras</DialogTitle>
                    <DialogDescription className="text-center">
                        Aponte a câmera para o código de barras.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
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
                <Button variant="destructive" onClick={() => setIsScanning(false)}>
                    <X className="mr-2" />
                    Cancelar
                </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
