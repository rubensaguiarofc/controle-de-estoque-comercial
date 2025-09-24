
"use client";

import { useState } from 'react';
import type { StockItem } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, Trash, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ItemManagementProps {
  stockItems: StockItem[];
  onSetStockItems: (items: StockItem[]) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
  onSetEditingItem: (item: StockItem | null) => void;
}

export default function ItemManagement({
  stockItems,
  onSetStockItems,
  onSetIsAddItemDialogOpen,
  onSetEditingItem,
}: ItemManagementProps) {
  const { toast } = useToast();

  const handleEdit = (item: StockItem) => {
    onSetEditingItem(item);
    onSetIsAddItemDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    const updatedItems = stockItems.filter(item => item.id !== itemId);
    onSetStockItems(updatedItems);
    toast({
        title: "Item Excluído",
        description: "O item foi removido do seu estoque.",
    })
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Gerenciamento de Itens</CardTitle>
                <CardDescription>Adicione, edite ou remova itens do seu estoque.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => { onSetEditingItem(null); onSetIsAddItemDialogOpen(true)}}>
              <PlusCircle className="mr-2" />
              Cadastrar Item
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Especificações</TableHead>
              <TableHead>Código de Barras</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockItems.length > 0 ? (
              stockItems.map(item => (
                <TableRow key={item.id} onClick={() => handleEdit(item)} className="cursor-pointer">
                  <TableCell className="text-muted-foreground">{item.id}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.specifications}</TableCell>
                  <TableCell className="font-mono text-sm">{item.barcode || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o item
                                do seu estoque.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Nenhum item cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
