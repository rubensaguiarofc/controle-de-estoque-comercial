
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
  const [featureSupported, setFeatureSupported] = useState<boolean | null>(null);
  const [manualCode, setManualCode] = useState<string>("");
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

  // debug logs collector to help capture runtime info for devices
  const debugLogsRef = useRef<Array<{ t: string; event: string; detail?: any }>>([]);
  const pushDebug = (event: string, detail?: any) => {
    try {
      debugLogsRef.current.push({ t: new Date().toISOString(), event, detail });
      // keep last 200 entries max
      if (debugLogsRef.current.length > 200) debugLogsRef.current.shift();
    } catch (e) {
      // no-op
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // feature detection (guard against WebView/older browsers)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFeatureSupported(false);
      setHasCameraPermission(false);
      pushDebug('feature-detection', { supported: false, navigatorDefined: typeof navigator !== 'undefined' });
      return;
    }
    setFeatureSupported(true);
    pushDebug('feature-detection', { supported: true });

    let isMounted = true;
    const codeReader = codeReaderRef.current;

    const startScanner = async () => {
      if (!isMounted) return;

      try {
        pushDebug('start-scanner-attempt');
        // If running inside Capacitor native container, request native camera permission first
        try {
          const win = typeof window !== 'undefined' ? (window as any) : undefined;
          if (win && win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform()) {
            try {
              // dynamic import to avoid bundling on web
              // dynamic import Capacitor core and try to request permission via Plugins
              try {
                const capModule = await import('@capacitor/core');
                const Capacitor = (capModule as any).Capacitor || (window as any).Capacitor;
                const Plugins = (capModule as any).Plugins || (window as any).Capacitor?.Plugins;
                const Permissions = Plugins?.Permissions;
                if (Permissions && Permissions.request) {
                  // @ts-ignore
                  const permRes = await Permissions.request({ name: 'camera' });
                  if (permRes && permRes.state !== 'granted') {
                    throw new Error('Native camera permission not granted');
                  }
                }
              } catch (e) {
                // ignore capacitor permission errors
                pushDebug('capacitor-permission-error', { error: String(e) });
              }
            } catch (capErr) {
              console.warn('Capacitor permission request failed:', capErr);
              // fallthrough to try getUserMedia which may still work if webview grants it
            }
          }
        } catch (e) {
          // ignore
        }

        pushDebug('requesting-getUserMedia');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setHasCameraPermission(true);
        streamRef.current = stream;
        pushDebug('stream-started', { tracks: stream.getTracks().map(t => ({ kind: t.kind, id: t.id })) });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        const hints = new Map();
        const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        await codeReader.decodeFromStream(stream, videoRef.current!, (result, err) => {
          if (result && isMounted) {
            pushDebug('decode-result', { text: result.getText() });
            const foundItem = stockItems.find(item => item.barcode === result.getText());
            if (foundItem) {
              onSuccess(foundItem);
            } else {
              onNotFound();
            }
          }
          if (err && !(err instanceof NotFoundException) && isMounted) {
            pushDebug('decode-error', { error: String(err) });
            console.error('Search barcode scan error:', err);
          }
        });
      } catch (error) {
    console.error('Error starting search camera stream:', error);
    pushDebug('start-scanner-error', { error: String(error) });
        if (isMounted) {
            setHasCameraPermission(false);
            // show actionable toast but keep dialog open so user can use fallback input
            toast({
                variant: 'destructive',
                title: 'Acesso à Câmera Negado ou Não Disponível',
                description: 'Permita acesso à câmera ou use a entrada manual abaixo.',
            });
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
            {!featureSupported && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-white text-center">Seu navegador/WebView não suporta acesso à câmera (getUserMedia).</p>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75" />
            </div>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_2px_#ef4444] animate-scan" />
          </div>
          {hasCameraPermission === false && (
            <>
              <Alert variant="destructive">
                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                <AlertDescription>Permita acesso à câmera nas configurações ou use a entrada manual abaixo.</AlertDescription>
              </Alert>

              <div className="w-full max-w-md mt-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Código (entrada manual)</label>
                <div className="flex gap-2">
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 input input-bordered"
                    placeholder="Cole ou digite o código de barras"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const found = stockItems.find(item => item.barcode === manualCode.trim());
                      stopCamera();
                      if (found) onSuccess(found);
                      else onNotFound();
                    }}
                  >
                    Buscar
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="ghost" onClick={() => {
                    // try to restart scanner
                    setHasCameraPermission(null);
                    // re-open to trigger useEffect start
                    onOpenChange(false);
                    setTimeout(() => onOpenChange(true), 100);
                  }}>Tentar novamente</Button>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
                </div>
              </div>
            </>
          )}
          <div className="w-full flex justify-center mt-2">
            <Button type="button" variant="outline" size="sm" onClick={async () => {
              try {
                const state = {
                  navigator: {
                    mediaDevices: typeof navigator !== 'undefined' ? !!navigator.mediaDevices : false,
                    permissions: typeof (navigator as any).permissions !== 'undefined',
                  },
                  capacitor: typeof window !== 'undefined' ? (window as any).Capacitor || null : null,
                  lastLogs: debugLogsRef.current.slice(-100),
                };
                await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
                toast({ title: 'Debug copiado', description: 'Informações de debug copiadas para a área de transferência.' });
              } catch (e) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível copiar o debug.' });
              }
            }}>Copiar debug</Button>
          </div>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
