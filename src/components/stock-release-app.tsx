
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import type { StockItem, WithdrawalRecord, Tool, ToolRecord } from "@/lib/types";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Boxes, History, PackagePlus, RefreshCw, Wrench } from "lucide-react";

import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "./ui/sidebar";
import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";

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
  const handleItemDialogSubmit = (itemData: Omit<StockItem, 'id'>) => {
    if (editingItem) {
      // Update
      setStockItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...itemData } : item));
      toast({ title: "Item Atualizado", description: `${itemData.name} foi atualizado.` });
    } else {
      // Add
      const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]))) + 1 : 1).toString().padStart(3, '0');
      const newId = `ITM-${newIdNumber}`;
      const itemWithId: StockItem = { ...itemData, id: newId, barcode: itemData.barcode || '' };
      setStockItems(prev => [...prev, itemWithId]);
      toast({ title: "Item Adicionado", description: `${itemData.name} foi adicionado.` });
    }
    setAddItemDialogOpen(false);
    setEditingItem(null);
  };

  const handleItemDialogClose = (isOpen: boolean) => {
    if (!isOpen) setEditingItem(null);
    setAddItemDialogOpen(isOpen);
  }

  // Tool Management Handlers
  const handleToolDialogSubmit = (toolData: Omit<Tool, 'id'>) => {
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
  }

  const handleToolDialogClose = (isOpen: boolean) => {
    if (!isOpen) setEditingTool(null);
    setAddToolDialogOpen(isOpen);
  }

  const handleNewWithdrawal = (newRecords: WithdrawalRecord[]) => {
    setHistory(prev => [...newRecords, ...prev]);
  };
  
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

  const handleDeleteToolRecord = (recordId: string) => {
    setToolHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(record => record.id !== recordId);
      toast({
        title: "Registro de Ferramenta Excluído",
        description: "O registro foi removido permanentemente.",
      });
      return updatedHistory;
    });
  };


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
                    <NavButton view="tools" label="Ferramentas" icon={Wrench} />
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
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Controle de Saída</h1>
          </header>

          <main>
            {renderContent()}
          </main>
      </SidebarInset>
      
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

    

    
