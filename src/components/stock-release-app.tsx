
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import type { StockItem, WithdrawalRecord, Tool, ToolRecord } from "@/lib/types";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Boxes, History, PackagePlus, RefreshCw, Wrench } from "lucide-react";

import { Sidebar, SidebarContent, SidebarInset, SidebarItem, SidebarTrigger } from "./ui/sidebar-vertical";
import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";
import { cn } from "@/lib/utils";

const StockReleaseClient = dynamic(() => import('./stock-release-client'), {
  loading: () => <ClientSkeleton />,
  ssr: false,
});
const ItemManagement = dynamic(() => import('./item-management'), {
  loading: () => <ManagementSkeleton />,
  ssr: false,
});
const HistoryPanel = dynamic(() => import('./history-panel').then(mod => mod.HistoryPanel), {
  loading: () => <HistorySkeleton />,
  ssr: false,
});
const ToolManagement = dynamic(() => import('./tool-management'), {
  loading: () => <ManagementSkeleton />, // Re-use skeleton for now
  ssr: false,
});


type View = "release" | "items" | "history" | "tools";

export default function StockReleaseApp() {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolHistory, setToolHistory] = useState<ToolRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Item Dialog State
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Tool Dialog State
  const [isAddToolDialogOpen, setAddToolDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const [activeView, setActiveView] = useState<View>("release");

  useEffect(() => {
    try {
      // Load stock and history
      const storedHistory = localStorage.getItem("withdrawalHistory");
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      
      const storedStockItems = localStorage.getItem("stockItems");
      if (storedStockItems) {
        setStockItems(JSON.parse(storedStockItems));
      } else {
        setStockItems(MOCK_STOCK_ITEMS);
      }

      // Load tools and tool history
      const storedTools = localStorage.getItem("tools");
      if (storedTools) setTools(JSON.parse(storedTools));

      const storedToolHistory = localStorage.getItem("toolHistory");
      if (storedToolHistory) setToolHistory(JSON.parse(storedToolHistory));

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      toast({ variant: 'destructive', title: "Erro ao Carregar Dados", description: "Não foi possível carregar os dados salvos."});
    } finally {
      setIsInitialLoad(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isInitialLoad) {
      try {
        localStorage.setItem("withdrawalHistory", JSON.stringify(history));
        localStorage.setItem("stockItems", JSON.stringify(stockItems));
        localStorage.setItem("tools", JSON.stringify(tools));
        localStorage.setItem("toolHistory", JSON.stringify(toolHistory.sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime())));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
        toast({ variant: 'destructive', title: "Erro ao Salvar Dados", description: "Não foi possível salvar as alterações."});
      }
    }
  }, [history, stockItems, tools, toolHistory, isInitialLoad, toast]);

  const { uniqueRequesters, uniqueDestinations } = useMemo(() => {
    const requesters = new Set<string>();
    const destinations = new Set<string>();
    history.forEach(record => {
      if (record.requestedBy) requesters.add(record.requestedBy);
      if (record.requestedFor) destinations.add(record.requestedFor);
    });
    return {
      uniqueRequesters: Array.from(requesters),
      uniqueDestinations: Array.from(destinations),
    };
  }, [history]);

  // Item Management Handlers
  const handleItemDialogSubmit = useCallback((itemData: Omit<StockItem, 'id'>) => {
    if (editingItem) {
      // Update
      setStockItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...itemData } : item));
      toast({ title: "Item Atualizado", description: `${itemData.name} foi atualizado.` });
    } else {
      // Add
      setStockItems(prev => {
        const newIdNumber = (prev.length > 0 ? Math.max(...prev.map(item => parseInt(item.id.split('-')[1]))) + 1 : 1).toString().padStart(3, '0');
        const newId = `ITM-${newIdNumber}`;
        const itemWithId: StockItem = { ...itemData, id: newId, barcode: itemData.barcode || '' };
        return [...prev, itemWithId]
      });
      toast({ title: "Item Adicionado", description: `${itemData.name} foi adicionado.` });
    }
    setAddItemDialogOpen(false);
    setEditingItem(null);
  }, [editingItem, toast]);

  const handleItemDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setEditingItem(null);
    setAddItemDialogOpen(isOpen);
  }, []);

  // Tool Management Handlers
  const handleToolDialogSubmit = useCallback((toolData: Omit<Tool, 'id'>) => {
    if (editingTool) {
      // Update
      setTools(prev => prev.map(tool => tool.id === editingTool.id ? { ...tool, ...toolData } : tool));
      toast({ title: "Ferramenta Atualizada", description: `${toolData.name} foi atualizada.` });
    } else {
      // Add
      const newId = `TOOL-${Date.now()}`;
      const toolWithId: Tool = { ...toolData, id: newId };
      setTools(prev => [...prev, toolWithId]);
      toast({ title: "Ferramenta Adicionada", description: `${toolData.name} foi adicionada.` });
    }
    setAddToolDialogOpen(false);
    setEditingTool(null);
  }, [editingTool, toast]);

  const handleToolDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setEditingTool(null);
    setAddToolDialogOpen(isOpen);
  }, []);

  const handleNewWithdrawal = useCallback((newRecords: WithdrawalRecord[]) => {
    setHistory(prev => [...newRecords, ...prev]);
  }, []);
  
  const handleDeleteRecord = useCallback((recordId: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(record => record.id !== recordId);
      toast({
        title: "Registro Excluído",
        description: "O registro de retirada foi removido do histórico.",
      });
      return updatedHistory;
    });
  }, [toast]);

  const handleDeleteToolRecord = useCallback((recordId: string) => {
    setToolHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(record => record.id !== recordId);
      toast({
        title: "Registro de Ferramenta Excluído",
        description: "O registro foi removido permanentemente.",
      });
      return updatedHistory;
    });
  }, [toast]);

  const renderContent = () => {
    switch (activeView) {
      case "release":
        return (
          <StockReleaseClient
            stockItems={stockItems}
            onUpdateHistory={handleNewWithdrawal}
            uniqueRequesters={uniqueRequesters}
            uniqueDestinations={uniqueDestinations}
          />
        );
      case "items":
        return (
          <ItemManagement
            stockItems={stockItems}
            onSetStockItems={setStockItems}
            onSetIsAddItemDialogOpen={setAddItemDialogOpen}
            onSetEditingItem={setEditingItem}
          />
        );
      case "history":
        return (
          <HistoryPanel
            itemHistory={history}
            toolHistory={toolHistory}
            onDeleteItemRecord={handleDeleteRecord}
            onDeleteToolRecord={handleDeleteToolRecord}
          />
        );
      case "tools":
        return (
            <ToolManagement
              tools={tools}
              setTools={setTools}
              toolHistory={toolHistory}
              setToolHistory={setToolHistory}
              onSetEditingTool={setEditingTool}
              onSetIsAddToolDialogOpen={setAddToolDialogOpen}
            />
        );
      default:
        return null;
    }
  };

  const navItems = [
    { view: "release" as View, icon: RefreshCw, label: "Lançamento" },
    { view: "items" as View, icon: Boxes, label: "Itens" },
    { view: "tools" as View, icon: Wrench, label: "Ferramentas" },
    { view: "history" as View, icon: History, label: "Histórico" },
  ];

  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar className="hidden md:block">
        <SidebarContent className="flex flex-col">
          <div className="flex-grow">
            <h2 className="text-2xl font-bold p-4 flex items-center gap-2">
              <PackagePlus />
              Controle
            </h2>
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map(item => (
                <SidebarItem key={item.view} icon={<item.icon />} isActive={activeView === item.view} onClick={() => setActiveView(item.view)}>{item.label}</SidebarItem>
              ))}
            </nav>
          </div>
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col flex-1 pb-16 md:pb-0">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold md:text-2xl capitalize">{navItems.find(i => i.view === activeView)?.label}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

       {/* Mobile Bottom Navigation */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
        <nav className="flex h-full">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center text-xs gap-1 transition-colors",
                activeView === item.view ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <AddItemDialog
          isOpen={isAddItemDialogOpen}
          onOpenChange={handleItemDialogClose}
          onAddItem={handleItemDialogSubmit}
          editingItem={editingItem}
      />

      <AddToolDialog
          isOpen={isAddToolDialogOpen}
          onOpenChange={handleToolDialogClose}
          onAddTool={handleToolDialogSubmit}
          editingTool={editingTool}
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

    
