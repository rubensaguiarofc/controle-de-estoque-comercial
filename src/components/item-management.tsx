
"use client";

import { useState, useMemo } from 'react';
import type { StockItem } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Edit, Trash, Search, Plus, Barcode, Printer } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { BarcodeDisplayDialog } from './barcode-display-dialog';
import { ScrollArea } from './ui/scroll-area';
import { ItemDetailsDialog } from './item-details-dialog';
import { Badge } from './ui/badge';
import jsPDF from 'jspdf';
import { savePdf } from '@/lib/save-pdf';
import JsBarcode from 'jsbarcode';

interface ItemManagementProps {
  stockItems: StockItem[];
  onSetStockItems: (items: StockItem[]) => void | Promise<void>;
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

  const handlePrintAllBarcodes = async () => {
    const itemsWithBarcode = stockItems.filter(item => item.barcode);
    if (itemsWithBarcode.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum código de barras",
        description: "Não há itens com código de barras para imprimir."
      });
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const tempCanvas = document.createElement('canvas');

    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const MARGIN_X = 10;
    const MARGIN_Y = 15;
    const LABEL_WIDTH = (PAGE_WIDTH - (MARGIN_X * 2)) / 3;
    const LABEL_HEIGHT = 25;
    const GUTTER_X = 0;
    const GUTTER_Y = 5;

    let x = MARGIN_X;
    let y = MARGIN_Y;

  itemsWithBarcode.forEach((item, index) => {
      if (y + LABEL_HEIGHT > PAGE_HEIGHT - MARGIN_Y) {
        doc.addPage();
        x = MARGIN_X;
        y = MARGIN_Y;
      }
      
      try {
        const barcodeValue = item.barcode!;
        const textToDisplay = barcodeValue.split('-').pop() || barcodeValue;

        JsBarcode(tempCanvas, barcodeValue, {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: false, // O valor será adicionado manualmente
        });
        const barcodeDataUrl = tempCanvas.toDataURL('image/png');

        const contentX = x + LABEL_WIDTH / 2;

        doc.setFontSize(8);
        const itemName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
        doc.text(itemName.toUpperCase(), contentX, y + 4, { align: 'center' });
        
        doc.setFontSize(6);
        const itemSpecs = item.specifications.length > 45 ? item.specifications.substring(0, 42) + '...' : item.specifications;
        doc.text(itemSpecs.toUpperCase(), contentX, y + 7, { align: 'center' });

        const barcodeWidth = 40; // Largura fixa para o código de barras na etiqueta
        const barcodeHeight = 10;
        const barcodeX = x + (LABEL_WIDTH - barcodeWidth) / 2;
        doc.addImage(barcodeDataUrl, 'PNG', barcodeX, y + 9, barcodeWidth, barcodeHeight);
        
        doc.setFontSize(8);
        doc.text(textToDisplay, contentX, y + 22, { align: 'center' });

        x += LABEL_WIDTH + GUTTER_X;
        if (x + LABEL_WIDTH > PAGE_WIDTH - MARGIN_X) {
          x = MARGIN_X;
          y += LABEL_HEIGHT + GUTTER_Y;
        }

      } catch (e) {
        console.error(`Erro ao gerar etiqueta para ${item.name}:`, e);
      }
    });

    const filename = `etiquetas_todos_itens_${new Date().toISOString().split('T')[0]}.pdf`;
    const res = await savePdf(doc, filename);
    if (res && res.success) {
      toast({ title: "PDF Gerado", description: "O arquivo com as etiquetas foi salvo." });
    } else {
      toast({ variant: 'destructive', title: 'Falha ao salvar PDF' });
    }
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
      <Card className="shadow-lg h-full flex flex-col bg-transparent sm:bg-card border-none sm:border">
          <CardHeader className="bg-card rounded-t-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                      <CardTitle>Biblioteca de Itens</CardTitle>
                      <CardDescription>Gerencie todos os itens cadastrados.</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button size="sm" className="w-full sm:w-auto" onClick={() => { onSetEditingItem(null); onSetIsAddItemDialogOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Cadastrar Item
                      </Button>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handlePrintAllBarcodes}>
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir Etiquetas
                      </Button>
                  </div>
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
          <CardContent className="flex-grow p-0 sm:p-6">
            <ScrollArea className="h-full w-full">
              <div className="p-4 sm:p-0 space-y-4">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <Card key={item.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-grow cursor-pointer" onClick={() => setViewingItem(item)}>
                          <p className="font-semibold text-card-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.specifications}</p>
                          <div className="sm:hidden mt-2">
                            <Badge variant={item.quantity <= 0 ? 'destructive' : (item.quantity < 10 ? 'secondary' : 'default')}>
                              Qtd: {item.quantity ?? 0}
                            </Badge>
                          </div>
                        </div>
                
                        <div className="hidden sm:block mx-4">
                            <Badge variant={item.quantity <= 0 ? 'destructive' : (item.quantity < 10 ? 'secondary' : 'default')}>
                              {item.quantity ?? 0}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center">
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
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Nenhum item encontrado.
                  </div>
                )}
              </div>
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
