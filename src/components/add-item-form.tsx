
"use client";

import { Camera } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { StockItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AddItemFormValues } from "./add-item-dialog";

interface AddItemFormProps {
  editingItem?: StockItem | null;
  onOpenChange: (isOpen: boolean) => void;
  onSwitchToScanner: () => void;
}

export function AddItemForm({ editingItem, onOpenChange, onSwitchToScanner }: AddItemFormProps) {
  const form = useFormContext<AddItemFormValues>();

  const dialogTitle = editingItem ? "Editar Item" : "Cadastrar Novo Item";
  const dialogDescription = editingItem ? "Atualize as informações do item." : "Preencha as informações do novo item.";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Item</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Mouse sem fio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especificações</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 8000 DPI, USB-C" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Barras (Opcional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="Escaneie ou digite o código" {...field} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={onSwitchToScanner}>
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Escanear código de barras</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <DialogFooter className="sm:justify-end gap-2 pt-4">
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit">Salvar Item</Button>
        </div>
      </DialogFooter>
    </>
  );
}
