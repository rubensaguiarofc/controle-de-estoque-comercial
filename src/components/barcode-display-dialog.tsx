
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
        JsBarcode(canvasRef.current, item.barcode, {
          format: "CODE128",
          displayValue: true,
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
  }, [isOpen, item, toast]);

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
        JsBarcode(tempCanvas, item.barcode, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true
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
        doc.save(`etiqueta_${item.name.replace(/\s+/g, '_')}.pdf`);
        toast({ title: "PDF Gerado", description: "O download da etiqueta deve começar em breve." });

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
          <canvas ref={canvasRef} />
        </div>
        <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button type="button" onClick={handlePrint}>Imprimir Etiqueta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
