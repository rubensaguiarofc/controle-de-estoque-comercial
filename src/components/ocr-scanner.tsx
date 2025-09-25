
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { readBarcodeFromImage } from "@/ai/flows/read-barcode-from-image";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import type { AddItemFormValues } from "./add-item-dialog";

interface OcrScannerProps {
  form: UseFormReturn<AddItemFormValues>;
  onBack: () => void;
  onSuccess: (barcode: string) => void;
  onManualSave: () => void;
}

export function OcrScanner({ form, onBack, onSuccess, onManualSave }: OcrScannerProps) {
  const { toast } = useToast();
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                // @ts-ignore
                focusMode: 'continuous' 
            } 
        });
        if (isMounted) {
          setHasCameraPermission(true);
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.play();
          }
        } else {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('Error starting OCR camera:', error);
        if (isMounted) setHasCameraPermission(false);
      }
    };
    startCamera();
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  const handleOcrCapture = async () => {
    if (!videoRef.current?.srcObject) return;
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
        toast({ title: "OCR bem-sucedido!", description: `Código lido: ${result.barcode}` });
        onSuccess(result.barcode);
      } else {
        toast({
          variant: 'destructive',
          title: 'OCR Falhou',
          description: 'Não foi possível ler o código. Tente uma foto melhor ou digite manualmente.',
        });
      }
    } catch (aiError) {
      console.error("AI OCR error:", aiError);
      toast({ variant: 'destructive', title: 'Erro na IA', description: 'Ocorreu um erro ao processar a imagem.' });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleManualSaveClick = () => {
    const barcodeValue = form.getValues('barcode');
    if (!barcodeValue) {
      toast({ variant: 'destructive', title: "Campo Vazio", description: "Digite um código de barras para salvar." });
      return;
    }
    toast({ title: "Código de Barras Salvo", description: `Código ${barcodeValue} foi salvo.` });
    onManualSave();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <DialogHeader>
        <DialogTitle className="text-center">Leitura por Foto (OCR)</DialogTitle>
        <DialogDescription className="text-center">Enquadre o código de barras e tire uma foto para a IA ler.</DialogDescription>
      </DialogHeader>
      <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full max-w-xs h-32 border-4 border-dashed border-primary rounded-lg opacity-75" />
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
        <Button type="button" variant="ghost" onClick={onBack}>
          <X className="mr-2" />
          Voltar
        </Button>
        <Button type="button" onClick={handleOcrCapture} disabled={isOcrLoading || hasCameraPermission !== true}>
          {isOcrLoading ? <Loader2 className="mr-2 animate-spin" /> : <Camera className="mr-2" />}
          {isOcrLoading ? "Lendo..." : "Ler com IA"}
        </Button>
        <Button type="button" onClick={handleManualSaveClick}>
          Salvar Manualmente
        </Button>
      </div>
    </div>
  );
}
