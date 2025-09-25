
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { StockItem } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddItemForm } from "./add-item-form";
import { BarcodeScanner } from "./barcode-scanner";
import { Form } from "./ui/form";

const formSchema = z.object({
  name: z.string().min(1, "O nome do item é obrigatório.").toUpperCase(),
  specifications: z.string().min(1, "As especificações são obrigatórias.").toUpperCase(),
  barcode: z.string().optional(),
});

export type AddItemFormValues = z.infer<typeof formSchema>;

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (newItem: Omit<StockItem, "id">) => void;
  editingItem?: StockItem | null;
}

type View = "form" | "scanner";

export function AddItemDialog({ isOpen, onOpenChange, onAddItem, editingItem }: AddItemDialogProps) {
  const [view, setView] = useState<View>("form");

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", specifications: "", barcode: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        form.reset(editingItem);
      } else {
        form.reset({ name: "", specifications: "", barcode: "" });
      }
      setView("form");
    }
  }, [isOpen, editingItem, form]);

  const handleDialogSubmit = (values: AddItemFormValues) => {
    onAddItem(values);
  };

  const renderContent = () => {
    switch (view) {
      case "scanner":
        return (
          <BarcodeScanner
            onScan={(barcode) => {
              form.setValue("barcode", barcode);
              setView("form");
            }}
            onCancel={() => setView("form")}
          />
        );
      case "form":
      default:
        return (
          <AddItemForm
            editingItem={editingItem}
            onOpenChange={onOpenChange}
            onSwitchToScanner={() => setView("scanner")}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDialogSubmit)}>
            {renderContent()}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
