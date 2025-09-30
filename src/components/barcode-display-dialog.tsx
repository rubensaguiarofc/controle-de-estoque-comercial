
"use client";

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && item && canvasRef.current) {
        const barcodeValue = item.barcode || item.id;
        if (barcodeValue) {
            try {
                 JsBarcode(canvasRef.current, barcodeValue, {
                    format: "CODE128",
                    displayValue: true,
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

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código de Barras do Item</DialogTitle>
          <DialogDescription>
            Este é o código de barras para: <strong>{item.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>

        <DialogFooter className="sm:justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
