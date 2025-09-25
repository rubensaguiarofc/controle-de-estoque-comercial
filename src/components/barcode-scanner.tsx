
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ScanText } from "lucide-react";
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    codeReaderRef.current.reset();
  }, []);

  // Get camera permission on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      })
      .catch(error => {
        console.error('Error getting camera permission:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmera Negado',
          description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
        });
        onCancel(); // Go back if no permission
      });
  }, [toast, onCancel]);

  // Start scanner when permission is granted
  useEffect(() => {
    const codeReader = codeReaderRef.current;
    let isMounted = true;

    const startScanner = async () => {
      if (!videoRef.current || !hasCameraPermission) {
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

        const hints = new Map();
        const formats = [
            BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        await codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result && isMounted) {
            toast({
              title: "Código de Barras Escaneado",
              description: `Código: ${result.getText()}`,
            });
            onScan(result.getText());
          }
          if (err && !(err instanceof NotFoundException) && isMounted) {
            console.error('Barcode scan error:', err);
          }
        });
      } catch (error) {
        console.error('Error starting camera stream:', error);
        if (isMounted) {
          setHasCameraPermission(false);
          onCancel();
        }
      }
    };

    if (hasCameraPermission) {
      startScanner();
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [hasCameraPermission, onCancel, onScan, stopCamera, toast]);

  return (
    <div className="flex flex-col items-center gap-4">
      <DialogHeader>
        <DialogTitle className="text-center">Escanear Código de Barras</DialogTitle>
        <DialogDescription className="text-center">Aponte a câmera para o código de barras.</DialogDescription>
      </DialogHeader>
      <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_2px_#ef4444] animate-scan" />
      </div>
      {hasCameraPermission === false && (
        <Alert variant="destructive">
          <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
          <AlertDescription>Por favor, permita o acesso à câmera para usar esta funcionalidade.</AlertDescription>
        </Alert>
      )}
      <div className="flex w-full justify-center gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
