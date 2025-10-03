
"use client";

import { useState, useMemo } from 'react';
import type { StockItem } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, Trash, Search, Plus, Barcode } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { BarcodeDisplayDialog } from './barcode-display-dialog';
import { ScrollArea } from './ui/scroll-area';
import { ItemDetailsDialog } from './item-details-dialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeItem, setBarcodeItem] = useState<StockItem | null>(null);
  const [viewingItem, setViewingItem] = useState<StockItem | null>(null);

  const handleEdit = (item: StockItem) => {
    onSetEditingItem(item);
    onSetIsAddItemDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    const updatedItems = stockItems.filter(item => item.id !== itemId);
    onSetStockItems(updatedItems);
    toast({
        title: "Item Excluído",
        description: "O item foi removido.",
    })
  };

  const handleGenerateBarcode = (itemToUpdate: StockItem) => {
    const newBarcode = `${itemToUpdate.id}-${Date.now()}`;
    const updatedItems = stockItems.map(item =>
      item.id === itemToUpdate.id ? { ...item, barcode: newBarcode } : item
    );
    onSetStockItems(updatedItems);
    toast({
      title: "Código de Barras Gerado",
      description: `Novo código para ${itemToUpdate.name}: ${newBarcode}`,
    });
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
    <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <CardTitle>Biblioteca de Itens</CardTitle>
                    <CardDescription>Gerencie todos os itens cadastrados.</CardDescription>
                </div>
                <Button size="sm" className="w-full sm:w-auto" onClick={() => { onSetEditingItem(null); onSetIsAddItemDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Item
                </Button>
            </div>
            <div className="relative pt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Pesquisar por nome, especificações, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
              />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Especificações</TableHead>
                  <TableHead className="hidden md:table-cell">Código de Barras</TableHead>
                  <TableHead className="text-center min-w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <TableRow key={item.id} onClick={() => setViewingItem(item)} className="cursor-pointer">
                      <TableCell className="font-medium whitespace-nowrap p-4">{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell whitespace-nowrap p-4">{item.specifications}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-sm whitespace-nowrap p-4">{item.barcode || 'N/A'}</TableCell>
                      <TableCell className="text-center p-4">
                        <div className="flex gap-1 justify-center">
                          {item.barcode ? (
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setBarcodeItem(item);}}>
                                <Barcode className="h-4 w-4" />
                                <span className="sr-only">Visualizar código de barras</span>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleGenerateBarcode(item);}}>
                              <Barcode className="h-4 w-4 text-teal-500" />
                              <span className="sr-only">Gerar código de barras</span>
                            </Button>
                          )}
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
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o item.
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
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground p-4">
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    
    {barcodeItem && (
        <BarcodeDisplayDialog
            isOpen={!!barcodeItem}
            onOpenChange={() => setBarcodeItem(null)}
            item={barcodeItem}
        />
    )}

    {viewingItem && (
        <ItemDetailsDialog
            isOpen={!!viewingItem}
            onOpenChange={() => setViewingItem(null)}
            item={viewingItem}
        />
    )}
    </>
  );
}
