
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';

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
  editingItem?: StockItem | null;
}

export function AddItemDialog({ isOpen, onOpenChange, onAddItem, editingItem }: AddItemDialogProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specifications: "",
      barcode: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingItem) {
            form.reset(editingItem);
        } else {
            form.reset({ name: "", specifications: "", barcode: "" });
        }
    } else {
      setIsScanning(false);
    }
  }, [isOpen, editingItem, form]);

  useEffect(() => {
    const codeReader = codeReaderRef.current;
    let stream: MediaStream;

    const startScanning = async () => {
      if (!isScanning || !videoRef.current) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          }
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video play failed", e));
            
            const hints = new Map();
            const formats = [
              BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
              BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
            ];
            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            codeReader.setHints(hints);

            codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
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
              }
            });
          };
        }
      } catch (error) {
        console.error('Error accessing camera or starting scanner:', error);
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
}, [isScanning, form, toast]);


  const onSubmit = (values: FormValues) => {
    onAddItem(values);
  };
  
  const dialogTitle = editingItem ? "Editar Item" : "Cadastrar Novo Item";
  const dialogDescription = editingItem ? "Atualize as informações do item de estoque." : "Preencha as informações do novo item de estoque.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {!isScanning ? (
          <>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>
                {dialogDescription}
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
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsScanning(true)}>
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Escanear código de barras</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="sm:justify-end gap-2 pt-4">
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Item</Button>
                    </div>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
            <div className="flex flex-col items-center gap-4">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        Escanear Código de Barras
                    </DialogTitle>
                    <DialogDescription className="text-center">
                       Aponte a câmera para o código de barras.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75"/>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_2px_#ef4444] animate-scan" />
                </div>
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                        <AlertDescription>
                            Por favor, permita o acesso à câmera para usar esta funcionalidade.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex w-full justify-center">
                    <Button variant="destructive" onClick={() => setIsScanning(false)}>
                        <X className="mr-2" />
                        Cancelar
                    </Button>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
