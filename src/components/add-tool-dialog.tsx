
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Tool } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "O nome da ferramenta é obrigatório.").toUpperCase(),
  assetId: z.string().min(1, "O número de patrimônio é obrigatório.").toUpperCase(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTool: (newTool: Omit<Tool, "id">) => void;
  editingTool?: Tool | null;
}

export function AddToolDialog({ isOpen, onOpenChange, onAddTool, editingTool }: AddToolDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", assetId: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingTool) {
        form.reset(editingTool);
      } else {
        form.reset({ name: "", assetId: "" });
      }
    }
  }, [isOpen, editingTool, form]);

  const dialogTitle = editingTool ? "Editar Ferramenta" : "Cadastrar Nova Ferramenta";
  const dialogDescription = editingTool ? "Atualize as informações da ferramenta." : "Preencha as informações da nova ferramenta.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onAddTool)}>
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
                    <FormLabel>Nome da Ferramenta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Furadeira de Impacto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrimônio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AS-00123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Salvar Ferramenta</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    