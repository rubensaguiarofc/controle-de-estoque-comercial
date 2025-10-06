
"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";
import type { StockItem } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: StockItem;
}

export function BarcodeDisplayDialog({ isOpen, onOpenChange, item }: BarcodeDisplayDialogProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && item.barcode && canvasRef.current) {
      try {
        const barcodeValue = item.barcode;
        const textToDisplay = barcodeValue.split('-').pop() || barcodeValue;

        JsBarcode(canvasRef.current, barcodeValue, {
          format: "CODE128",
          displayValue: true,
          text: textToDisplay, // Exibe apenas a parte numérica
          fontSize: 18,
          margin: 10,
        });
      } catch (e) {
        console.error("Erro ao gerar código de barras:", e);
        toast({
          variant: "destructive",
          title: "Erro no Código de Barras",
          description: "Não foi possível gerar a imagem do código de barras.",
        });
      }
    }
  }, [isOpen, item, item.barcode, toast]);

  const handlePrint = () => {
    if (!item.barcode) {
        toast({ variant: 'destructive', title: 'Código de barras inválido' });
        return;
    }

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [80, 50] // Tamanho da etiqueta
    });

    const tempCanvas = document.createElement('canvas');
    try {
        const barcodeValue = item.barcode;
        const textToDisplay = barcodeValue.split('-').pop() || barcodeValue;

        JsBarcode(tempCanvas, barcodeValue, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            text: textToDisplay,
        });
        const barcodeDataUrl = tempCanvas.toDataURL('image/png');

        doc.setFontSize(10);
        doc.text(item.name.toUpperCase(), 40, 10, { align: 'center' });
        doc.setFontSize(8);
        doc.text(item.specifications.toUpperCase(), 40, 15, { align: 'center' });

        const canvasWidth = tempCanvas.width;
        const canvasHeight = tempCanvas.height;
        const aspectRatio = canvasWidth / canvasHeight;

        let imgWidth = 60; // Largura da imagem no PDF
        let imgHeight = imgWidth / aspectRatio;

        const maxHeight = 25; // Altura máxima permitida para o código de barras
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
        }

        const x = (80 - imgWidth) / 2; // Centralizar imagem
        const y = 20;

        doc.addImage(barcodeDataUrl, 'PNG', x, y, imgWidth, imgHeight);

        const filename = `etiqueta_${item.name.replace(/\s+/g, '_')}.pdf`;

        // If running inside Capacitor native, write file to device and offer share/open
        (async () => {
          try {
            const isCapacitor = typeof (window as any) !== 'undefined' && (window as any).Capacitor;
            if (isCapacitor) {
              // get data URI and extract base64
              const dataUri = doc.output('datauristring') as string;
              const base64 = dataUri.split(',')[1];

              // try to access Capacitor plugins through window.Capacitor.Plugins first
              const win = typeof window !== 'undefined' ? (window as any) : undefined;
              let writeResult: any = null;
              try {
                const Plugins = win?.Capacitor?.Plugins;
                const Filesystem = Plugins?.Filesystem;
                const Directory = Plugins?.Filesystem?.Directory || Plugins?.Directory;
                const Share = Plugins?.Share;
                if (Filesystem && Filesystem.writeFile) {
                  writeResult = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory?.Documents });
                } else {
                  // fallback to dynamic import if running in environment where packages are available
                  try {
                    const fsModule = await (new Function('return import("@capacitor/filesystem")')());
                    const shareModule = await (new Function('return import("@capacitor/share")')());
                    const FilesystemDyn = (fsModule as any).Filesystem;
                    const DirectoryDyn = (fsModule as any).Directory;
                    const ShareDyn = (shareModule as any).Share;
                    writeResult = await FilesystemDyn.writeFile({ path: filename, data: base64, directory: DirectoryDyn.Documents });
                    if (ShareDyn && ShareDyn.share) {
                      await ShareDyn.share({ title: filename, text: 'Etiqueta gerada', url: writeResult.uri || writeResult.path });
                      return;
                    }
                  } catch (dynErr) {
                    console.warn('Capacitor dynamic plugin import failed', dynErr);
                  }
                }

                const fileUri = writeResult?.uri || writeResult?.path || null;
                if (fileUri && Share && Share.share) {
                  try {
                    await Share.share({ title: filename, text: 'Etiqueta gerada', url: fileUri });
                    return;
                  } catch (shareErr) {
                    toast({ title: 'PDF salvo', description: `Arquivo salvo em: ${fileUri}` });
                    return;
                  }
                } else if (fileUri) {
                  toast({ title: 'PDF salvo', description: `Arquivo salvo em: ${fileUri}` });
                  return;
                }
              } catch (e) {
                console.warn('Capacitor save failed, falling back to web download', e);
              }

              return;
            }
          } catch (e) {
            console.warn('Capacitor save failed, falling back to web download', e);
          }

          // fallback for web: trigger normal download
          doc.save(filename);
          toast({ title: "PDF Gerado", description: "O download da etiqueta deve começar em breve." });
        })();

    } catch (e) {
        console.error("Erro ao gerar PDF:", e);
        toast({
          variant: "destructive",
          title: "Erro ao Gerar PDF",
          description: "Não foi possível criar o arquivo da etiqueta.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código de Barras do Item</DialogTitle>
          <DialogDescription>
            Visualizando o código de barras para: <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {item.barcode ? (
            <canvas ref={canvasRef} />
          ) : (
            <div className="text-center text-muted-foreground p-8">
              Este item ainda não possui um código de barras gerado.
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button type="button" onClick={handlePrint} disabled={!item.barcode}>Imprimir Etiqueta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
