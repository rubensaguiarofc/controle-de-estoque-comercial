
"use client";
import React from 'react';
import type { WithdrawalItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { MAX_QUANTITY } from "@/lib/constants";

interface WithdrawalCartProps {
  items: WithdrawalItem[];
  // Use cartKey to uniquely identify entries (item + unit)
  onRemove: (cartKey: string) => void;
  onUpdateQuantity: (cartKey: string, quantity: number) => void;
}

export const WithdrawalCart = React.memo(function WithdrawalCart({ items, onRemove, onUpdateQuantity }: WithdrawalCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg bg-card dark:bg-background">
        <p className="text-muted-foreground">Sua cesta de retirada está vazia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-medium">Itens para Retirada</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ item, quantity, unit, cartKey }) => (
              <Card key={cartKey || `${item.id}__${unit}`} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.specifications}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          let next = Number.isNaN(v) ? 1 : v;
                          if (next > MAX_QUANTITY) next = MAX_QUANTITY;
                          onUpdateQuantity(cartKey || `${item.id}__${unit}`, next);
                        }}
                        className="h-9 w-24"
                        min="1"
                        max={MAX_QUANTITY}
                    />
                    <span className="text-sm text-muted-foreground">{unit}</span>
                    <div className="flex-grow" />
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(cartKey || `${item.id}__${unit}`)}>
            <Trash className="h-4 w-4 text-destructive" />
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
