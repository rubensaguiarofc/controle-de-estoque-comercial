
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WithdrawalRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ReturnItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  record: WithdrawalRecord | null;
  onReturn: (recordId: string, quantity: number) => void;
}

export function ReturnItemDialog({ isOpen, onOpenChange, record, onReturn }: ReturnItemDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (!record) return null;

  const maxReturnable = record.quantity - (record.returnedQuantity || 0);

  const handleReturn = () => {
    if (quantity <= 0) {
      toast({ variant: "destructive", title: "Quantidade Inválida", description: "A quantidade deve ser maior que zero." });
      return;
    }
    if (quantity > maxReturnable) {
      toast({
        variant: "destructive",
        title: "Quantidade Inválida",
        description: `Você pode devolver no máximo ${maxReturnable} unidades deste item.`,
      });
      return;
    }
    onReturn(record.id, quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Devolver Item</DialogTitle>
          <DialogDescription>
            Item: <strong>{record.item.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantidade
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-3"
              min="1"
              max={maxReturnable}
            />
          </div>
          <div className="text-sm text-muted-foreground col-span-4 text-center">
            Você pode devolver até {maxReturnable} unidades.
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleReturn}>
            Confirmar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
