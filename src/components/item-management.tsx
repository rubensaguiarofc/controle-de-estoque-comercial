
"use client";

import { useState, useMemo } from 'react';
import type { StockItem } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, Trash, Search, Plus, Send, Barcode } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { BarcodeDisplayDialog } from './barcode-display-dialog';

interface ItemManagementProps {
  stockItems: StockItem[];
  onSetStockItems: (items: StockItem[]) => void;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
  onSetEditingItem: (item: StockItem | null) => void;
  onSelectItemForRelease: (item: StockItem) => void;
}

export default function ItemManagement({
  stockItems,
  onSetStockItems,
  onSetIsAddItemDialogOpen,
  onSetEditingItem,
  onSelectItemForRelease,
}: ItemManagementProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeItem, setBarcodeItem] = useState<StockItem | null>(null);

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

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return stockItems;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(lowercasedQuery) ||
      item.specifications.toLowerCase().includes(lowercasedQuery) ||
      (item.barcode && item.barcode.toLowerCase().includes(lowercasedQuery))
    );
  }, [stockItems, searchQuery]);

  return (
    <>
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
            <div>
                <CardTitle>Biblioteca de Itens</CardTitle>
                <CardDescription>Gerencie todos os itens do seu estoque.</CardDescription>
            </div>
            <Button onClick={() => { onSetEditingItem(null); onSetIsAddItemDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Novo Item
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar por nome, especificações, código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
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
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <TableRow key={item.id} >
                  <TableCell className="text-muted-foreground">{item.id}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.specifications}</TableCell>
                  <TableCell className="font-mono text-sm">{item.barcode || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setBarcodeItem(item); }}>
                        <Barcode className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Gerar Código de Barras</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelectItemForRelease(item); }}>
                        <Send className="h-4 w-4 text-sky-500" />
                        <span className="sr-only">Lançar</span>
                      </Button>
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
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
     <BarcodeDisplayDialog 
        item={barcodeItem}
        isOpen={!!barcodeItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setBarcodeItem(null);
          }
        }}
      />
    </>
  );
}
