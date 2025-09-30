
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from 'next/dynamic';
import type { StockItem, WithdrawalRecord } from "@/lib/types";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Boxes, History, PackagePlus, RefreshCw } from "lucide-react";

import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "./ui/sidebar";
import { AddItemDialog } from "./add-item-dialog";
import type { StockReleaseClientRef } from "./stock-release-client";
import { Skeleton } from "./ui/skeleton";

const StockReleaseClient = dynamic(() => import('./stock-release-client'), {
  loading: () => <ClientSkeleton />,
  ssr: false,
});
const ItemManagement = dynamic(() => import('./item-management'), {
  loading: () => <ManagementSkeleton />,
});
const HistoryPanel = dynamic(() => import('./history-panel').then(mod => mod.HistoryPanel), {
  loading: () => <HistorySkeleton />,
});


type View = "release" | "items" | "history";

export default function StockReleaseApp() {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [activeView, setActiveView] = useState<View>("release");
  const stockReleaseClientRef = useRef<StockReleaseClientRef>(null);

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
    setStockItems(prev => {
      const newIdNumber = (prev.length > 0 ? Math.max(...prev.map(item => parseInt(item.id.split('-')[1]))) + 1 : 1).toString().padStart(3, '0');
      const newId = `ITM-${newIdNumber}`;
      const itemWithId: StockItem = { ...newItem, id: newId, barcode: newItem.barcode || '' };
      return [...prev, itemWithId];
    });
    setAddItemDialogOpen(false);
    toast({
      title: "Item Adicionado",
      description: `${newItem.name} foi adicionado ao estoque.`,
    })
  }, [toast]);

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
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(record => record.id !== recordId);
      toast({
        title: "Registro Excluído",
        description: "O registro de retirada foi removido do histórico.",
      });
      return updatedHistory;
    });
  };

  const handleSelectItemForRelease = (item: StockItem) => {
    setActiveView("release");
    setTimeout(() => {
      stockReleaseClientRef.current?.setFormItem(item);
    }, 0);
    toast({
      title: "Item Selecionado",
      description: `"${item.name}" pronto para registrar a saída na aba 'Lançamento'.`,
    });
  };

  const renderContent = () => {
    switch (activeView) {
      case "release":
        return (
          <StockReleaseClient
            ref={stockReleaseClientRef}
            stockItems={stockItems}
            onUpdateHistory={setHistory}
            onSetIsAddItemDialogOpen={setAddItemDialogOpen}
          />
        );
      case "items":
        return (
          <ItemManagement
            stockItems={stockItems}
            onSetStockItems={setStockItems}
            onSetIsAddItemDialogOpen={setAddItemDialogOpen}
            onSetEditingItem={setEditingItem}
            onSelectItemForRelease={handleSelectItemForRelease}
          />
        );
      case "history":
        return (
          <HistoryPanel
            history={history}
            onDeleteRecord={handleDeleteRecord}
          />
        );
      default:
        return null;
    }
  };
  
  const NavButton = ({ view, label, icon: Icon }: { view: View; label: string; icon: React.ElementType }) => (
    <div className="flex flex-col items-center gap-1">
      <SidebarMenuButton
          isActive={activeView === view}
          onClick={() => setActiveView(view)}
          className="rounded-full h-16 w-16 !p-0 flex items-center justify-center text-primary bg-white shadow-md hover:shadow-lg transition-shadow"
      >
          <Icon className="h-7 w-7" />
      </SidebarMenuButton>
      <span className="text-xs text-muted-foreground">{label}</span>
  </div>
  );
  
  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      <Sidebar variant="sidebar" collapsible="none" className="bg-slate-50 border-r-0">
        <SidebarContent className="p-4 flex flex-col items-center justify-center gap-6">
            <SidebarMenu>
                <SidebarMenuItem>
                    <div className="flex flex-col items-center gap-1">
                        <SidebarMenuButton
                            onClick={() => { setEditingItem(null); setAddItemDialogOpen(true); }}
                            className="rounded-full h-16 w-16 !p-0 flex items-center justify-center text-primary bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <PackagePlus className="h-7 w-7 text-teal-500" />
                        </SidebarMenuButton>
                        <span className="text-xs text-muted-foreground">Cadastrar Itens</span>
                    </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <NavButton view="release" label="Lançamento" icon={RefreshCw} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <NavButton view="items" label="Itens" icon={Boxes} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <NavButton view="history" label="Histórico" icon={History} />
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex items-center gap-3 mb-8">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Controle de Estoque</h1>
          </header>

          <main>
            {renderContent()}
          </main>
      </SidebarInset>
      
      <AddItemDialog
          isOpen={isAddItemDialogOpen}
          onOpenChange={handleDialogClose}
          onAddItem={handleDialogSubmit}
          editingItem={editingItem}
      />
    </div>
  )
}

function ClientSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="p-4 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid sm:grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

function ManagementSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="border rounded-lg">
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full border-t" />
        ))}
      </div>
    </div>
  );
}

function HistorySkeleton() {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-72 mt-2" />
            </div>
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="border rounded-lg">
          <Skeleton className="h-12 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full border-t" />
          ))}
        </div>
      </div>
    );
}

    