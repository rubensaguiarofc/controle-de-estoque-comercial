
"use client";
import React from 'react';
import type { WithdrawalItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Trash } from "lucide-react";

interface WithdrawalCartProps {
  items: WithdrawalItem[];
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export const WithdrawalCart = React.memo(function WithdrawalCart({ items, onRemove, onUpdateQuantity }: WithdrawalCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Sua cesta de retirada está vazia.</p>
      </div>
    );
  }

  return (
    <div>
        <h3 className="text-lg font-medium mb-2">Itens para Retirada</h3>
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[100px]">Qtd.</TableHead>
                <TableHead className="w-[80px]">Un.</TableHead>
                <TableHead className="w-[50px] text-right">Ação</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map(({ item, quantity, unit }) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">
                        <p>{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.specifications}</p>
                    </TableCell>
                    <TableCell>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="h-8"
                        />
                    </TableCell>
                    <TableCell>{unit}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(item.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
});

    