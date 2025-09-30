
"use client";

import { useRef, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import type { StockItem } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BarcodeDisplayDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BarcodeDisplayDialog({ item, isOpen, onOpenChange }: BarcodeDisplayDialogProps) {
  // This ref is now only for displaying the barcode in the dialog
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && item && canvasRef.current) {
        const barcodeValue = item.barcode || item.id;
        if (barcodeValue) {
            try {
                 JsBarcode(canvasRef.current, barcodeValue, {
                    format: "CODE128",
                    displayValue: false,
                    width: 2,
                    height: 50,
                    margin: 10,
                });
            } catch (e) {
                console.error("Error generating barcode for display", e);
            }
        }
    }
  }, [isOpen, item]);

  const handlePrint = () => {
    if (!item) return;

    const barcodeValue = item.barcode || item.id;
    if (!barcodeValue) {
        alert("Este item não possui um valor de código de barras para gerar a etiqueta.");
        return;
    }

    const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [80, 50] // [width, height]
    });

    const docWidth = doc.internal.pageSize.getWidth();
    const docHeight = doc.internal.pageSize.getHeight();
    const centerX = docWidth / 2;
    const margin = 5;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(item.name, docWidth - (margin * 2));
    const nameHeight = doc.getTextDimensions(nameLines).h;
    doc.text(nameLines, centerX, margin + 5, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const specLines = doc.splitTextToSize(item.specifications, docWidth - (margin * 2));
    const specHeight = doc.getTextDimensions(specLines).h;
    const specY = margin + 5 + nameHeight;
    doc.text(specLines, centerX, specY, { align: 'center' });

    try {
        // Create an in-memory canvas
        const tempCanvas = document.createElement('canvas');
        JsBarcode(tempCanvas, barcodeValue, {
            format: "CODE128",
            displayValue: false,
            width: 2, // Controls the thickness of the bars
            height: 40, // Controls the height of the bars
            margin: 0,
        });

        const barcodeImage = tempCanvas.toDataURL('image/png');
        const barcodeY = specY + specHeight + 2;

        const canvasWidth = tempCanvas.width;
        const canvasHeight = tempCanvas.height;
        const aspectRatio = canvasWidth / canvasHeight;

        let imgWidth = docWidth - 20; 
        let imgHeight = imgWidth / aspectRatio;
        
        // Define a max height for the barcode image area
        const maxHeight = docHeight - barcodeY - 10;
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
        }

        const x = (docWidth - imgWidth) / 2;
        doc.addImage(barcodeImage, 'PNG', x, barcodeY, imgWidth, imgHeight);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(barcodeValue, centerX, barcodeY + imgHeight + 4, { align: 'center'});

    } catch (error) {
        console.error("Failed to add barcode image to PDF", error);
        alert("Ocorreu um erro ao gerar a imagem do código de barras.");
        return;
    }
    
    doc.save(`etiqueta-${item.name.replace(/\s+/g, '-')}.pdf`);
  };

  if (!item) {
    return null;
  }

  const barcodeValue = item.barcode || item.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Etiqueta</DialogTitle>
          <DialogDescription>
            Visualize a etiqueta e gere um PDF para impressão.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 px-4 bg-white text-black rounded-md flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-bold">{item.name}</h3>
          <p className="text-sm">{item.specifications}</p>
          <canvas ref={canvasRef} className="max-w-full h-auto mt-2 bg-white" />
           <p className="font-mono text-xs bg-slate-100 px-2 py-1 rounded mt-2">
              {barcodeValue ? `CÓDIGO: ${barcodeValue}`: "Sem código de barras."}
            </p>
        </div>

        <DialogFooter className="sm:justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2" />
            Fechar
          </Button>
          <Button type="button" onClick={handlePrint} disabled={!barcodeValue}>
            <Printer className="mr-2" />
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
