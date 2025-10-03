
"use client";

import type { StockItem } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface ItemDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: StockItem;
}

export function ItemDetailsDialog({ isOpen, onOpenChange, item }: ItemDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Item</DialogTitle>
          <DialogDescription>
            Visualizando informações do item selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="item-name">Nome do Item</Label>
                <Input id="item-name" value={item.name} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="item-specs">Especificações</Label>
                <Input id="item-specs" value={item.specifications} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="item-barcode">Código de Barras</Label>
                <Input id="item-barcode" value={item.barcode || 'N/A'} readOnly />
            </div>
        </div>
        <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
