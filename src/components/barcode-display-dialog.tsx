
"use client";

import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import type { StockItem } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Barcode from 'react-barcode';

interface BarcodeDisplayDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BarcodeDisplayDialog({ item, isOpen, onOpenChange }: BarcodeDisplayDialogProps) {
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!item || !barcodeRef.current) return;

    const canvas = barcodeRef.current.querySelector('canvas');
    if (!canvas) return;

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, 50] // Largura x Altura da etiqueta
    });

    const docWidth = doc.internal.pageSize.getWidth();
    const docHeight = doc.internal.pageSize.getHeight();

    // Centralizar conteúdo
    const centerX = docWidth / 2;

    // Nome do item (centralizado, fonte maior)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, centerX, 10, { align: 'center', maxWidth: docWidth - 10 });
    const nameLines = doc.splitTextToSize(item.name, docWidth - 10);
    const nameHeight = nameLines.length * 5; // Estimativa de altura do texto

    // Especificações (centralizado, fonte menor)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(item.specifications, centerX, 12 + nameHeight, { align: 'center', maxWidth: docWidth - 10 });
    const specLines = doc.splitTextToSize(item.specifications, docWidth - 10);
    const specHeight = specLines.length * 3;

    // Imagem do código de barras
    const imgData = canvas.toDataURL('image/png');
    const barcodeWidth = 50; // Largura do código de barras no PDF
    const barcodeHeight = 20; // Altura do código de barras no PDF
    const barcodeX = (docWidth - barcodeWidth) / 2;
    const barcodeY = docHeight - barcodeHeight - 5; // Posiciona na parte inferior
    
    doc.addImage(imgData, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    
    doc.save(`barcode-${item.name}.pdf`);
  };

  if (!item) {
    return null;
  }

  const barcodeValue = item.barcode || item.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Etiqueta com Código de Barras</DialogTitle>
          <DialogDescription>
            Gere um PDF da etiqueta para impressão.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 px-4 bg-white text-black">
          <div ref={barcodeRef} className="flex flex-col items-center justify-center gap-4">
            <h3 className="text-lg font-bold text-center">{item.name}</h3>
            <p className="text-sm text-center">{item.specifications}</p>
            {barcodeValue ? (
              <Barcode value={barcodeValue} />
            ) : (
              <p className="text-red-500">Valor do código de barras indisponível.</p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2" />
            Fechar
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2" />
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
