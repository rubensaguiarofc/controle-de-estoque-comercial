
"use client";
import React from 'react';
import type { WithdrawalItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface WithdrawalCartProps {
  items: WithdrawalItem[];
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export const WithdrawalCart = React.memo(function WithdrawalCart({ items, onRemove, onUpdateQuantity }: WithdrawalCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg bg-background">
        <p className="text-muted-foreground">Sua cesta de retirada está vazia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-medium">Itens para Retirada</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ item, quantity, unit }) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <p className="font-semibold text-card-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.specifications}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="h-9 w-24"
                        min="1"
                    />
                    <span className="text-sm text-muted-foreground">{unit}</span>
                    <div className="flex-grow" />
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(item.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
    </div>
  );
});
