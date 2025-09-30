
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

import { SaidaMarisLogo } from "./icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import StockReleaseClient from "./stock-release-client";
import ItemManagement from "./item-management";
import { AddItemDialog } from "./add-item-dialog";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";

const HistoryPanel = dynamic(() => import('./history-panel').then(mod => mod.HistoryPanel), {
  ssr: false,
  loading: () => <HistoryPanelSkeleton />,
});

type View = 'release' | 'items' | 'history';

export default function StockReleaseApp() {
  const { toast } = useToast();
  const [view, setView] = useState<View>('release');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const releaseClientRef = useRef<{ setFormItem: (item: StockItem) => void }>(null);


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

  const handleSelectItemForRelease = (item: StockItem) => {
    if (releaseClientRef.current) {
      releaseClientRef.current.setFormItem(item);
    }
    setView('release');
    toast({
      title: "Item Selecionado",
      description: `"${item.name}" pronto para registrar a saída.`,
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    const updatedHistory = history.filter(record => record.id !== recordId);
    setHistory(updatedHistory);
    toast({
      title: "Registro Excluído",
      description: "O registro de retirada foi removido do histórico.",
    });
  };
  
  const tabTriggerStyle = "pb-2 text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary";


  return (
    <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SaidaMarisLogo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Controle de Estoque</h1>
          </div>
        </header>

        <Tabs value={view} onValueChange={(value) => setView(value as View)} className="w-full">
            <TabsList className="bg-transparent p-0 justify-start gap-6 border-b">
                <TabsTrigger value="release" className={cn(tabTriggerStyle, 'rounded-none shadow-none px-0')}>Lançamento</TabsTrigger>
                <TabsTrigger value="items" className={cn(tabTriggerStyle, 'rounded-none shadow-none px-0')}>Itens</TabsTrigger>
                <TabsTrigger value="history" className={cn(tabTriggerStyle, 'rounded-none shadow-none px-0')}>Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="release" className="mt-6">
                <StockReleaseClient
                    ref={releaseClientRef}
                    stockItems={stockItems}
                    history={history}
                    onUpdateHistory={setHistory}
                    onSetIsAddItemDialogOpen={() => {
                        setEditingItem(null);
                        setAddItemDialogOpen(true);
                    }}
                />
            </TabsContent>
            <TabsContent value="items" className="mt-6">
                <ItemManagement 
                    stockItems={stockItems}
                    onSetStockItems={setStockItems}
                    onSetIsAddItemDialogOpen={setAddItemDialogOpen}
                    onSetEditingItem={setEditingItem}
                    onSelectItemForRelease={handleSelectItemForRelease}
                />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
                <HistoryPanel
                  history={history}
                  onDeleteRecord={handleDeleteRecord}
                />
            </TabsContent>
        </Tabs>
        
        <AddItemDialog
            isOpen={isAddItemDialogOpen}
            onOpenChange={handleDialogClose}
            onAddItem={handleDialogSubmit}
            editingItem={editingItem}
        />
    </div>
  )
}

function HistoryPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="border rounded-lg p-4">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
