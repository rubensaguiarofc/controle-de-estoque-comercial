
"use client";

import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { StockItem } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Extend jsPDF interface for autotable barcode functionality
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
  }

interface BarcodeDisplayDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BarcodeDisplayDialog({ item, isOpen, onOpenChange }: BarcodeDisplayDialogProps) {

  const handlePrint = () => {
    if (!item) return;

    const barcodeValue = item.barcode || item.id;
    if (!barcodeValue) {
        alert("Este item não possui um valor de código de barras para gerar a etiqueta.");
        return;
    }

    const doc = new jsPDF({
        orientation: 'l', // landscape
        unit: 'mm',
        format: [50, 80] // height, width
    });

    const docWidth = doc.internal.pageSize.getWidth();
    const docHeight = doc.internal.pageSize.getHeight();
    const centerX = docWidth / 2;

    // Item Name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(item.name, docWidth - 10);
    doc.text(nameLines, centerX, 10, { align: 'center' });
    const nameHeight = doc.getTextDimensions(nameLines).h;
    
    // Specifications
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const specLines = doc.splitTextToSize(item.specifications, docWidth - 10);
    doc.text(specLines, centerX, 10 + nameHeight, { align: 'center' });
    
    // Barcode using jsPDF-AutoTable's undocumented feature
    (doc as any).autoTable({
        body: [[{ content: barcodeValue, styles: { cellWidth: 'auto', halign: 'center', font: 'JsBarcode' } }]],
        startY: docHeight - 20,
        theme: 'plain',
        styles: {
            cellPadding: 0,
            lineWidth: 0,
        },
        didDrawCell: (data: any) => {
            // This is a bit of a hack to get the barcode centered.
            // The library doesn't expose centering for the barcode font directly.
            const barcodeWidth = data.cell.width;
            const xPosition = (docWidth - barcodeWidth) / 2;
            data.cell.x = xPosition;
        }
    });

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
            Gere um PDF da etiqueta para impressão. O código de barras será gerado no arquivo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 px-4 bg-white text-black rounded-md">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h3 className="text-lg font-bold">{item.name}</h3>
            <p className="text-sm">{item.specifications}</p>
            <p className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
              {barcodeValue ? `CÓDIGO: ${barcodeValue}`: "Sem código de barras."}
            </p>
          </div>
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
