
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
    <div className="relative h-full">
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
            <div className="flex-1">
                <CardTitle>Biblioteca de Itens</CardTitle>
                <CardDescription>Gerencie todos os itens cadastrados.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Pesquisar por nome, especificações, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
              />
          </div>
          <ScrollArea className="flex-grow rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Especificações</TableHead>
                <TableHead>Código de Barras</TableHead>
                <TableHead className="text-right min-w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <TableRow key={item.id} >
                    <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.specifications}</TableCell>
                    <TableCell className="font-mono text-sm whitespace-nowrap">{item.barcode || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {item.barcode ? (
                          <Button variant="ghost" size="icon" onClick={() => setBarcodeItem(item)}>
                              <Barcode className="h-4 w-4" />
                              <span className="sr-only">Visualizar código de barras</span>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleGenerateBarcode(item)}>
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
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Button 
        onClick={() => { onSetEditingItem(null); onSetIsAddItemDialogOpen(true); }}
        className="fixed bottom-20 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-lg z-20"
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Cadastrar Novo Item</span>
      </Button>
    </div>

    {barcodeItem && (
        <BarcodeDisplayDialog
            isOpen={!!barcodeItem}
            onOpenChange={() => setBarcodeItem(null)}
            item={barcodeItem}
        />
    )}
    </>
  );
}
