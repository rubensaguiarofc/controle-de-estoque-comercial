
"use client";

import type { WithdrawalRecord } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface WithdrawalRecordDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  record: WithdrawalRecord | null;
}

export function WithdrawalRecordDetailsDialog({ isOpen, onOpenChange, record }: WithdrawalRecordDetailsDialogProps) {
  if (!record) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Retirada</DialogTitle>
          <DialogDescription>
            Visualizando informações do registro selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Item</Label>
                <Input value={`${record.item.name} (${record.item.specifications})`} readOnly />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Data</Label>
                    <Input value={new Date(record.date).toLocaleString('pt-BR')} readOnly />
                </div>
                <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input value={`${record.quantity} ${record.unit}`} readOnly />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Retirado por</Label>
                <Input value={record.requestedBy} readOnly />
            </div>
            <div className="space-y-2">
                <Label>Destino</Label>
                <Input value={record.requestedFor} readOnly />
            </div>
        </div>
        <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
