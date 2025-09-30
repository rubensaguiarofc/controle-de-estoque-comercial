
"use client";

import { useEffect, useState, useCallback } from "react";
import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

import { AppLogo } from "./icons";
import StockReleaseClient from "./stock-release-client";
import ItemManagement from "./item-management";
import { AddItemDialog } from "./add-item-dialog";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { HistoryPanel } from "./history-panel";

export default function StockReleaseApp() {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("withdrawalHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedStockItems = localStorage.getItem("stockItems");
      if (storedStockItems) {
        setStockItems(JSON.parse(storedStockItems));
      } else {
        setStockItems(MOCK_STOCK_ITEMS);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      try {
        localStorage.setItem("withdrawalHistory", JSON.stringify(history));
        localStorage.setItem("stockItems", JSON.stringify(stockItems));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [history, stockItems, isInitialLoad]);

  const handleAddItem = useCallback((newItem: Omit<StockItem, 'id'>) => {
    const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]))) + 1 : 1).toString().padStart(3, '0');
    const newId = `ITM-${newIdNumber}`;
    const itemWithId: StockItem = { ...newItem, id: newId, barcode: newItem.barcode || '' };
    
    setStockItems(prev => [...prev, itemWithId]);
    setAddItemDialogOpen(false);
    toast({
      title: "Item Adicionado",
      description: `${newItem.name} foi adicionado ao estoque.`,
    })
  }, [stockItems, toast]);

  const handleUpdateItem = useCallback((updatedItem: StockItem) => {
    setStockItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setAddItemDialogOpen(false);
    setEditingItem(null);
    toast({
      title: "Item Atualizado",
      description: `${updatedItem.name} foi atualizado com sucesso.`,
    })
  }, [toast]);

  const handleDialogSubmit = (itemData: Omit<StockItem, 'id'>) => {
    if (editingItem) {
      handleUpdateItem({ ...editingItem, ...itemData });
    } else {
      handleAddItem(itemData);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingItem(null);
    }
    setAddItemDialogOpen(isOpen);
  }

  const handleDeleteRecord = (recordId: string) => {
    const updatedHistory = history.filter(record => record.id !== recordId);
    setHistory(updatedHistory);
    toast({
      title: "Registro Excluído",
      description: "O registro de retirada foi removido do histórico.",
    });
  };

  const handleSelectItemForRelease = (item: StockItem) => {
    // This function will need to be adapted to work with the tabbed layout
    // For now, it will show a toast. A better implementation would switch tabs and populate the form.
    toast({
      title: "Item Selecionado",
      description: `"${item.name}" pronto para registrar a saída na aba 'Lançamento'.`,
    });
  };
  
  return (
    <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppLogo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Controle de Estoque</h1>
          </div>
          <Button onClick={() => setAddItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Item
          </Button>
        </header>

        <main>
          <Tabs defaultValue="release">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="release">Lançamento</TabsTrigger>
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="release">
              <StockReleaseClient
                stockItems={stockItems}
                history={history}
                onUpdateHistory={setHistory}
                onSetIsAddItemDialogOpen={setAddItemDialogOpen}
              />
            </TabsContent>
            <TabsContent value="items">
              <ItemManagement 
                stockItems={stockItems}
                onSetStockItems={setStockItems}
                onSetIsAddItemDialogOpen={setAddItemDialogOpen}
                onSetEditingItem={setEditingItem}
                onSelectItemForRelease={handleSelectItemForRelease}
              />
            </TabsContent>
            <TabsContent value="history">
              <HistoryPanel
                history={history}
                onDeleteRecord={handleDeleteRecord}
              />
            </TabsContent>
          </Tabs>
        </main>
        
        <AddItemDialog
            isOpen={isAddItemDialogOpen}
            onOpenChange={handleDialogClose}
            onAddItem={handleDialogSubmit}
            editingItem={editingItem}
        />
    </div>
  )
}
