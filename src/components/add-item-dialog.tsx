
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, X, ScanText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { readBarcodeFromImage } from "@/ai/flows/read-barcode-from-image";

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
  const [isOcrMode, setIsOcrMode] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const streamRef = useRef<MediaStream | null>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specifications: "",
      barcode: "",
    },
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if(codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (editingItem) {
            form.reset(editingItem);
        } else {
            form.reset({ name: "", specifications: "", barcode: "" });
        }
    } else {
      setIsScanning(false);
      setIsOcrMode(false);
      stopCamera();
    }
  }, [isOpen, editingItem, form, stopCamera]);

   // Effect to get camera permission
   useEffect(() => {
    if (isScanning && hasCameraPermission === null) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop()); // Stop immediately, we just wanted permission
          setHasCameraPermission(true);
        })
        .catch(error => {
          console.error('Error getting camera permission:', error);
          setHasCameraPermission(false);
          setIsScanning(false);
           toast({
              variant: 'destructive',
              title: 'Acesso à Câmera Negado',
              description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
          });
        });
    }
   }, [isScanning, hasCameraPermission, toast]);

   // Unified Camera & Scanner Effect
   useEffect(() => {
    const codeReader = codeReaderRef.current;
    let isMounted = true;

    const startCameraAndScanner = async () => {
        if (!isScanning || !videoRef.current || !hasCameraPermission) {
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (!isMounted) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play();
            }

            if (!isOcrMode && isMounted) {
                const hints = new Map();
                const formats = [
                    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
                ];
                hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
                hints.set(DecodeHintType.TRY_HARDER, true);

                await codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
                    if (result && isMounted) {
                        form.setValue('barcode', result.getText());
                        setIsScanning(false);
                        setIsOcrMode(false);
                        toast({
                            title: "Código de Barras Escaneado",
                            description: `Código: ${result.getText()}`,
                        });
                    }
                    if (err && !(err instanceof NotFoundException) && isMounted) {
                        console.error('Barcode scan error:', err);
                    }
                });
            }
        } catch (error) {
            console.error('Error starting camera stream:', error);
            if (isMounted) {
                setHasCameraPermission(false);
                setIsScanning(false);
            }
        }
    };

    if (isScanning && hasCameraPermission) {
        startCameraAndScanner();
    } else {
        stopCamera();
    }

    return () => {
        isMounted = false;
        stopCamera();
    };
 }, [isScanning, isOcrMode, hasCameraPermission, form, toast, stopCamera]);


 const handleOcrCapture = async () => {
    if (!videoRef.current || !streamRef.current) return;
    setIsOcrLoading(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({ variant: 'destructive', title: 'Erro ao Capturar', description: 'Não foi possível inicializar o canvas.' });
        setIsOcrLoading(false);
        return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
        const result = await readBarcodeFromImage({ photoDataUri });
        if (result.barcode && /^\d+$/.test(result.barcode)) {
            form.setValue('barcode', result.barcode);
            toast({
                title: "OCR bem-sucedido!",
                description: `Código lido: ${result.barcode}`,
            });
            setIsOcrMode(false);
            setIsScanning(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'OCR Falhou',
                description: 'Não foi possível ler o código. Tente uma foto melhor ou digite manualmente.',
            });
        }
    } catch (aiError) {
        console.error("AI OCR error:", aiError);
        toast({
            variant: 'destructive',
            title: 'Erro na IA',
            description: 'Ocorreu um erro ao processar a imagem. Tente novamente.',
        });
    } finally {
        setIsOcrLoading(false);
    }
};


  const onSubmit = (values: FormValues) => {
    onAddItem(values);
  };
  
  const dialogTitle = editingItem ? "Editar Item" : "Cadastrar Novo Item";
  const dialogDescription = editingItem ? "Atualize as informações do item de estoque." : "Preencha as informações do novo item de estoque.";


  const renderMainForm = () => (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>
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
                <Button type="button" variant="outline" size="icon" onClick={() => { setIsScanning(true); setIsOcrMode(false); }}>
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
    </>
  );

  const renderScanner = () => (
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
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
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
        <div className="flex w-full justify-center gap-2">
            <Button variant="ghost" onClick={() => { setIsScanning(false); }}>
                <X className="mr-2" />
                Cancelar
            </Button>
            <Button onClick={() => { setIsOcrMode(true); }} disabled={hasCameraPermission !== true}>
                <ScanText className="mr-2" />
                Usar Foto (OCR)
            </Button>
        </div>
    </div>
  );

  const renderOcrMode = () => (
    <div className="flex flex-col items-center gap-4">
        <DialogHeader>
            <DialogTitle className="text-center">Leitura por Foto (OCR)</DialogTitle>
            <DialogDescription className="text-center">
                Enquadre o código de barras e tire uma foto para a IA ler os números.
            </DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full max-w-xs h-32 border-4 border-dashed border-primary rounded-lg opacity-75"/>
            </div>
        </div>
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                <AlertDescription>Por favor, permita o acesso à câmera.</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Número do Código (pode ser digitado)</FormLabel>
              <FormControl>
                <Input placeholder="A IA preencherá ou você pode digitar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-full flex-col sm:flex-row justify-center gap-2">
             <Button variant="ghost" onClick={() => setIsOcrMode(false)}>
                <X className="mr-2" />
                Voltar
            </Button>
            <Button onClick={handleOcrCapture} disabled={isOcrLoading || hasCameraPermission !== true}>
                {isOcrLoading ? <Loader2 className="mr-2 animate-spin" /> : <Camera className="mr-2" />}
                {isOcrLoading ? "Lendo..." : "Ler com IA"}
            </Button>
             <Button onClick={() => {
                const barcodeValue = form.getValues('barcode');
                if (!barcodeValue) {
                  toast({ variant: 'destructive', title: "Campo Vazio", description: "Digite um código de barras para salvar."});
                  return;
                }
                setIsOcrMode(false);
                setIsScanning(false);
                toast({ title: "Código de Barras Salvo", description: `Código ${barcodeValue} foi salvo.`});
             }}>
                Salvar Manualmente
            </Button>
        </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <Form {...form}>
          {!isScanning ? renderMainForm() : (isOcrMode ? renderOcrMode() : renderScanner())}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
