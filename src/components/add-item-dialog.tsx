
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, X, WandSparkles, Loader2 } from "lucide-react";
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
import { suggestItemDetails } from "@/ai/flows/suggest-item-details";

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

type CameraMode = 'barcode' | 'ai' | 'none';

export function AddItemDialog({ isOpen, onOpenChange, onAddItem, editingItem }: AddItemDialogProps) {
  const { toast } = useToast();
  const [cameraMode, setCameraMode] = useState<CameraMode>('none');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
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
      setCameraMode('none');
      setIsSuggesting(false);
    }
  }, [isOpen, editingItem, form]);

  useEffect(() => {
    if (cameraMode === 'none') {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        codeReaderRef.current.reset();
        return;
    };

    const constraints: MediaStreamConstraints = {
      video: { facingMode: 'environment' }
    };

    let stream: MediaStream;

    const startCamera = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            setHasCameraPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                if (cameraMode === 'barcode') {
                    codeReaderRef.current.decodeFromStream(stream, videoRef.current, (result, err) => {
                        if (result) {
                            form.setValue('barcode', result.getText());
                            setCameraMode('none');
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
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            setCameraMode('none');
            toast({
                variant: 'destructive',
                title: 'Acesso à Câmera Negado',
                description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
            });
        }
    };

    startCamera();

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        codeReaderRef.current.reset();
    };
}, [cameraMode, form, toast]);


  const onSubmit = (values: FormValues) => {
    onAddItem(values);
  };
  
  const handleAiSuggest = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
        toast({ variant: 'destructive', title: 'Câmera não iniciada.' });
        return;
    }

    setIsSuggesting(true);
    setCameraMode('none');
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await suggestItemDetails({ photoDataUri: dataUri });
            if (result.name) form.setValue('name', result.name);
            if (result.specifications) form.setValue('specifications', result.specifications);
            toast({ title: 'Sugestão da IA', description: 'Campos preenchidos com base na imagem.' });
        } catch (error) {
            console.error('AI suggestion error:', error);
            toast({ variant: 'destructive', title: 'Erro da IA', description: 'Não foi possível gerar sugestões.' });
        } finally {
            setIsSuggesting(false);
        }
    }
  };


  const dialogTitle = editingItem ? "Editar Item" : "Cadastrar Novo Item";
  const dialogDescription = editingItem ? "Atualize as informações do item de estoque." : "Preencha as informações do novo item de estoque.";

  const isScanning = cameraMode !== 'none';

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
                        <Button type="button" variant="outline" size="icon" onClick={() => setCameraMode('barcode')}>
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Escanear código de barras</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="sm:justify-between gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setCameraMode('ai')} disabled={isSuggesting}>
                       {isSuggesting ? <Loader2 className="mr-2 animate-spin" /> : <WandSparkles className="mr-2" />}
                        Sugerir com IA
                    </Button>
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
                        {cameraMode === 'barcode' ? 'Escanear Código de Barras' : 'Fotografar Item'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                       {cameraMode === 'barcode' ? 'Aponte a câmera para o código de barras.' : 'Enquadre o item e capture a imagem.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {cameraMode === 'barcode' && (
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75"/>
                        </div>
                    )}
                </div>
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                        <AlertDescription>
                            Por favor, permita o acesso à câmera para usar esta funcionalidade.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex w-full justify-between items-center">
                    <Button variant="destructive" onClick={() => setCameraMode('none')}>
                        <X className="mr-2" />
                        Cancelar
                    </Button>
                    {cameraMode === 'ai' && (
                        <Button onClick={handleAiSuggest}>
                           <Camera className="mr-2" />
                           Capturar Imagem
                        </Button>
                    )}
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
