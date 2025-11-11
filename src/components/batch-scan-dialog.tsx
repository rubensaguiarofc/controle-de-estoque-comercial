"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import { MAX_QUANTITY } from "@/lib/constants";

const BarcodeScanner = dynamic(() => import('./barcode-scanner').then(m => m.BarcodeScanner), { ssr: false });

interface BatchScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rows: { name: string; specifications: string; quantity: number; barcode?: string }[]) => Promise<void> | void;
}

type DraftItem = {
  barcode: string;
  name: string;
  specifications: string;
  quantity: number;
};

export function BatchScanDialog({ open, onOpenChange, onSave }: BatchScanDialogProps) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  useEffect(() => {
    if (!open) {
      setDrafts([]);
      setScannerActive(true);
    }
  }, [open]);

  const handleScan = useCallback((code: string) => {
    setDrafts(prev => {
      // Avoid repeated consecutive identical scans (user may keep camera on barcode)
      if (prev.length && prev[prev.length - 1].barcode === code) return prev;
      // If barcode already exists in list, just increment quantity (fast restock use-case)
      const existingIdx = prev.findIndex(d => d.barcode === code);
      if (existingIdx >= 0) {
        const clone = [...prev];
        clone[existingIdx].quantity = Math.min(MAX_QUANTITY, clone[existingIdx].quantity + 1);
        return clone;
      }
      return [...prev, { barcode: code, name: "", specifications: "", quantity: 1 }];
    });
  }, []);

  const updateDraft = (idx: number, key: keyof DraftItem, value: string) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? {
      ...d,
      [key]: key === 'quantity' ? Math.max(0, Math.min(Number(value) || 0, MAX_QUANTITY)) : (key === 'name' || key === 'specifications' ? value.toUpperCase() : value)
    } as DraftItem : d));
  };

  const removeDraft = (idx: number) => setDrafts(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const cleaned = drafts
      .map(d => ({
        name: d.name.trim().toUpperCase(),
        specifications: d.specifications.trim().toUpperCase(),
        quantity: Math.max(0, Math.min(Number(d.quantity) || 0, MAX_QUANTITY)),
        barcode: d.barcode.trim(),
      }))
      .filter(d => d.name && d.specifications);
    if (!cleaned.length) {
      toast({ variant: 'destructive', title: 'Nada para salvar', description: 'Preencha Nome e Especificações para cada código.' });
      return;
    }
    try {
      setSaving(true);
      await onSave(cleaned);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Scan em Lote</DialogTitle>
          <DialogDescription>Escaneie vários códigos e complete os dados. Repetir um barcode incrementa a quantidade.</DialogDescription>
        </DialogHeader>
        <div className="p-3 space-y-4">
          {scannerActive && (
            <div className="border rounded-md p-2">
              <BarcodeScanner
                onScan={(code) => handleScan(code)}
                onCancel={() => setScannerActive(false)}
              />
            </div>
          )}
          {!scannerActive && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={() => setScannerActive(true)}>Reativar Scanner</Button>
            </div>
          )}
          <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-2">
            <div className="col-span-3">Barcode</div>
            <div className="col-span-3">Nome</div>
            <div className="col-span-4">Especificações</div>
            <div className="col-span-1">Qtd</div>
            <div className="col-span-1" />
          </div>
          <ScrollArea className="h-[40vh]">
            <div className="space-y-2 p-2">
              {drafts.map((d, idx) => (
                <div key={d.barcode + idx} className="grid grid-cols-12 items-center gap-2">
                  <Input
                    value={d.barcode}
                    readOnly
                    className="col-span-3 h-9 bg-muted"
                  />
                  <Input
                    value={d.name}
                    onChange={(e) => updateDraft(idx, 'name', e.target.value)}
                    placeholder="NOME"
                    className="col-span-3 h-9"
                  />
                  <Input
                    value={d.specifications}
                    onChange={(e) => updateDraft(idx, 'specifications', e.target.value)}
                    placeholder="ESPECIFICAÇÕES"
                    className="col-span-4 h-9"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={MAX_QUANTITY}
                    value={d.quantity}
                    onChange={(e) => updateDraft(idx, 'quantity', e.target.value)}
                    className="col-span-1 h-9"
                  />
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => removeDraft(idx)}>–</Button>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && (
                <div className="text-xs text-muted-foreground px-2 py-4">Nenhum código escaneado ainda.</div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-xs text-muted-foreground">Total: {drafts.length} | Válidos: {drafts.filter(d => d.name && d.specifications).length}</div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSave} disabled={saving || drafts.length === 0}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
