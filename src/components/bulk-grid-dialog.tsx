"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockItem } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MAX_QUANTITY } from "@/lib/constants";

export type GridRow = {
  name: string;
  specifications: string;
  quantity: number;
  barcode?: string;
};

interface BulkGridDialogProps {
  open: boolean;
  rows?: GridRow[];
  onOpenChange: (open: boolean) => void;
  onSave: (rows: GridRow[]) => Promise<void> | void;
}

// Simple, mobile-friendly editable grid for bulk item entry
export function BulkGridDialog({ open, rows, onOpenChange, onSave }: BulkGridDialogProps) {
  const [data, setData] = useState<GridRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Initialize with provided rows or 10 empty rows
      const base: GridRow[] = (rows && rows.length ? rows : Array.from({ length: 10 }, () => ({ name: "", specifications: "", quantity: 0, barcode: "" })));
      setData(base);
    }
  }, [open, rows]);

  const validCount = useMemo(() => data.filter(r => r.name.trim() && r.specifications.trim()).length, [data]);

  const updateCell = (idx: number, key: keyof GridRow, value: string) => {
    setData(prev => prev.map((r, i) => i === idx ? {
      ...r,
      [key]: key === 'quantity' ? Math.max(0, Math.min(Number(value) || 0, MAX_QUANTITY)) : (key === 'name' || key === 'specifications' ? value.toUpperCase() : value)
    } as GridRow : r));
  };

  const addRow = () => setData(prev => [...prev, { name: "", specifications: "", quantity: 0, barcode: "" }]);
  const removeRow = (idx: number) => setData(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const cleaned = data
      .map(r => ({
        name: r.name.trim().toUpperCase(),
        specifications: r.specifications.trim().toUpperCase(),
        quantity: Math.max(0, Math.min(Number(r.quantity) || 0, MAX_QUANTITY)),
        barcode: r.barcode?.toString().trim() || undefined,
      }))
      .filter(r => r.name && r.specifications);
    if (!cleaned.length) {
      onOpenChange(false);
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
          <DialogTitle>Cadastro Rápido (Grade)</DialogTitle>
          <DialogDescription>Preencha várias linhas e salve tudo de uma vez. Campos obrigatórios: Nome e Especificações.</DialogDescription>
        </DialogHeader>
        <div className="p-3">
          <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-2">
            <div className="col-span-4">Nome</div>
            <div className="col-span-5">Especificações</div>
            <div className="col-span-2">Quantidade</div>
            <div className="col-span-1">Código</div>
          </div>
          <ScrollArea className="h-[50vh]">
            <div className="space-y-2 p-2">
              {data.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center gap-2">
                  <Input
                    value={row.name}
                    onChange={(e) => updateCell(idx, 'name', e.target.value)}
                    placeholder="Ex: CABO HDMI"
                    className="col-span-4 h-9"
                  />
                  <Input
                    value={row.specifications}
                    onChange={(e) => updateCell(idx, 'specifications', e.target.value)}
                    placeholder="Ex: 2M, 4K, 60HZ"
                    className="col-span-5 h-9"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={MAX_QUANTITY}
                    value={row.quantity}
                    onChange={(e) => updateCell(idx, 'quantity', e.target.value)}
                    className="col-span-2 h-9"
                  />
                  <div className="col-span-1 flex items-center gap-2">
                    <Input
                      value={row.barcode || ""}
                      onChange={(e) => updateCell(idx, 'barcode', e.target.value)}
                      placeholder=""
                      className="h-9"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(idx)}>–</Button>
                  </div>
                </div>
              ))}
              <div>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>Adicionar linha</Button>
              </div>
            </div>
          </ScrollArea>
        </div>
        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-xs text-muted-foreground">Linhas válidas: {validCount}</div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSave} disabled={saving}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
