
"use client";

import { Trash } from "lucide-react";
import type { WithdrawalItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface WithdrawalCartProps {
  items: WithdrawalItem[];
  onRemove: (index: number) => void;
}

export function WithdrawalCart({ items, onRemove }: WithdrawalCartProps) {
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        A cesta de retirada está vazia. Adicione itens abaixo.
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="w-20 text-center">Qtd.</TableHead>
            <TableHead className="w-20 text-center">Un.</TableHead>
            <TableHead className="w-12 text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.specifications}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-center">{item.unit}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(index)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
