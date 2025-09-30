
"use client";

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import type { StockItem } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

interface BarcodeDisplayDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BarcodeDisplayDialog({ item, isOpen, onOpenChange }: BarcodeDisplayDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `barcode-${item?.id}`,
  });

  if (!item) {
    return null;
  }

  // Use the item's main ID for the barcode value if a specific barcode string is not available.
  const barcodeValue = item.barcode || item.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código de Barras do Item</DialogTitle>
          <DialogDescription>
            Imprima este código de barras para etiquetar o item.
          </DialogDescription>
        </DialogHeader>
        
        <div ref={printRef} className="py-6 px-4 bg-white text-black printable-area">
          <div className="flex flex-col items-center justify-center gap-4">
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
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Dialog>
  );
}
