
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from 'next/dynamic';

import type { StockItem } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddItemForm } from "./add-item-form";
import { Form } from "./ui/form";
import { Skeleton } from "./ui/skeleton";

const BarcodeScanner = dynamic(() => import('./barcode-scanner').then(mod => mod.BarcodeScanner), {
  ssr: false,
  loading: () => <ScannerSkeleton />,
});

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

function ScannerSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
        <div className="space-y-2 text-center">
            <Skeleton className="h-6 w-64 mx-auto" />
            <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <Skeleton className="w-full aspect-video rounded-md" />
        <Skeleton className="h-10 w-28" />
    </div>
  )
}
