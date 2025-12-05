
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
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    try { codeReaderRef.current.reset(); } catch {}
    try {
      if (videoTrackRef.current) {
        // turn off torch if enabled
        // @ts-expect-error - non-standard constraint in some browsers
        videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(()=>{});
      }
    } catch {}
    videoTrackRef.current = null;
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
              const capModule = await import('@capacitor/core').catch(() => null);
              const Capacitor = (capModule as any)?.Capacitor || (window as any).Capacitor;
              const Plugins = (capModule as any)?.Plugins || (window as any).Capacitor?.Plugins || (window as any).Plugins;
              const Permissions = Plugins?.Permissions;
              if (Permissions) {
                // Query current permission first
                try {
                  const query = await Permissions.query ? await Permissions.query({ name: 'camera' }) : null;
                  if (query && query.state === 'granted') {
                    pushDebug('camera-permission', { state: 'granted' });
                  } else if (Permissions.request) {
                    const permRes = await Permissions.request({ name: 'camera' });
                    // Some Capacitor versions return { state: 'granted' } or { granted: true }
                    const granted = (permRes && (permRes.state === 'granted' || permRes.granted === true));
                    if (!granted) {
                      pushDebug('camera-permission-denied', { permRes });
                      throw new Error('Native camera permission not granted');
                    }
                  }
                } catch (permErr) {
                  pushDebug('capacitor-permission-error', { error: String(permErr) });
                  // allow fallback to getUserMedia which might still work
                }
              }
            } catch (capErr) {
              console.warn('Capacitor permission request failed:', capErr);
            }
          }
        } catch (e) {
          // ignore
        }

        pushDebug('requesting-getUserMedia');
        let stream: MediaStream | null = null;
        try {
          const constraints: any = {
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
        } catch (gmErr) {
          // map common errors for better UX
          pushDebug('getUserMedia-error', { error: String(gmErr) });
          // rethrow to be handled by outer catch
          throw gmErr;
        }
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setHasCameraPermission(true);
        streamRef.current = stream;
  const tracks = stream.getTracks();
  pushDebug('stream-started', { tracks: tracks.map(t => ({ kind: t.kind, id: t.id })) });
        const vtrack = stream.getVideoTracks()[0] || null;
  videoTrackRef.current = vtrack;
        // Try to bump resolution and enable continuous focus if supported
        try {
          if (vtrack && vtrack.applyConstraints) {
            await vtrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' } as any],
            } as any);
          }
        } catch (e) {
          pushDebug('applyConstraints-error', { error: String(e) });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        const hints = new Map();
        const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const handleResult = (txt: string) => {
          const raw = (txt || '').trim();
          // Normalize common UPC/EAN variants
          const candidates = [raw];
          if (raw.length === 13 && raw.startsWith('0')) candidates.push(raw.slice(1));
          if (raw.length === 12) candidates.push('0' + raw);
          const foundItem = stockItems.find(item => item.barcode && candidates.includes(String(item.barcode).trim()));
          if (foundItem) onSuccess(foundItem); else onNotFound();
        };

        try {
          await codeReader.decodeFromStream(stream, videoRef.current!, (result, err) => {
            if (!isMounted) return;
            if (result) {
              pushDebug('decode-result', { text: result.getText() });
              handleResult(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              pushDebug('decode-error', { error: String(err) });
              console.error('Search barcode scan error:', err);
            }
          });
        } catch (dfErr) {
          // Fallback for older browsers/zxing versions
          pushDebug('decode-fallback', { error: String(dfErr) });
          await codeReader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
            if (!isMounted) return;
            if (result) {
              pushDebug('decode-result-legacy', { text: result.getText() });
              handleResult(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              pushDebug('decode-error-legacy', { error: String(err) });
            }
          });
        }
      } catch (error) {
        console.error('Error starting search camera stream:', error);
        pushDebug('start-scanner-error', { error: String(error) });
        if (isMounted) {
            setHasCameraPermission(false);
            // classify error and show clearer messages
            const msg = (error && (error as any).name) ? (error as any).name : String(error);
            if (msg === 'NotAllowedError' || msg === 'SecurityError' || msg === 'PermissionDeniedError') {
              toast({
                variant: 'destructive',
                title: 'Permissão da Câmera Negada',
                description: 'Permita o uso da câmera nas configurações do dispositivo ou aplicativo. Use a entrada manual enquanto isso.'
              });
            } else if (msg === 'NotFoundError') {
              toast({
                variant: 'destructive',
                title: 'Câmera Não Encontrada',
                description: 'Nenhuma câmera foi encontrada neste dispositivo.'
              });
            } else {
              toast({
                variant: 'destructive',
                title: 'Erro ao acessar câmera',
                description: 'Não foi possível acessar a câmera. Use a entrada manual ou verifique permissões.'
              });
            }
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
          <div className="relative w-full aspect-video bg-card rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
      {hasCameraPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-foreground">Solicitando acesso à câmera...</p>
        </div>
      )}
            {!featureSupported && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-foreground text-center">Seu navegador/WebView não suporta acesso à câmera (getUserMedia).</p>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75 dark:border-primary" />
            </div>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-destructive shadow-[0_0_10px_2px_#ef4444] animate-scan dark:bg-destructive" />
          </div>
          {/* Torch toggle (when supported) */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const track = videoTrackRef.current;
                  if (!track) return;
                  // @ts-expect-error non-standard torch constraint
                  await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
                  setTorchOn(v => !v);
                } catch (e) {
                  toast({ variant: 'destructive', title: 'Lanterna não suportada' });
                }
              }}
            >{torchOn ? 'Desligar lanterna' : 'Ligar lanterna'}</Button>
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
