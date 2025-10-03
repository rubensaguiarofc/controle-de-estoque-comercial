
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { X } from "lucide-react";
import type { StockItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";

interface SearchScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stockItems: StockItem[];
  onSuccess: (item: StockItem) => void;
  onNotFound: () => void;
}

export function SearchScannerDialog({ isOpen, onOpenChange, stockItems, onSuccess, onNotFound }: SearchScannerDialogProps) {
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

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;
    const codeReader = codeReaderRef.current;

    const startScanner = async () => {
      if (!isMounted) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setHasCameraPermission(true);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        const hints = new Map();
        const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        await codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result && isMounted) {
            const foundItem = stockItems.find(item => item.barcode === result.getText());
            if (foundItem) {
              onSuccess(foundItem);
            } else {
              onNotFound();
            }
          }
          if (err && !(err instanceof NotFoundException) && isMounted) {
            console.error('Search barcode scan error:', err);
          }
        });
      } catch (error) {
        console.error('Error starting search camera stream:', error);
        if (isMounted) {
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Acesso à Câmera Negado',
                description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
            });
            onOpenChange(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, stockItems, onSuccess, onNotFound, stopCamera, onOpenChange, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col items-center gap-4">
          <DialogHeader>
            <DialogTitle className="text-center">Buscar Item por Código de Barras</DialogTitle>
            <DialogDescription className="text-center">Aponte a câmera para o código de barras do item.</DialogDescription>
          </DialogHeader>
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            {hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white">Solicitando acesso à câmera...</p>
                </div>
            )}
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
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
