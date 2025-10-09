
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';

import type { StockItem, WithdrawalRecord, Tool, ToolRecord, EntryRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Boxes, History, Menu, RefreshCw, Wrench, PackagePlus, ArrowLeft } from "lucide-react";

import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { HoverEffect } from "./ui/card-hover-effect";

const StockReleaseClient = dynamic(() => import('./stock-release-client'), {
  loading: () => <ClientSkeleton />,
  ssr: false,
});
const StockEntryClient = dynamic(() => import('./stock-entry-client'), {
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
  loading: () => <ManagementSkeleton />,
  ssr: false,
});


type View = "dashboard" | "release" | "entry" | "items" | "history" | "tools";

export default function StockReleaseApp() {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [entryHistory, setEntryHistory] = useState<EntryRecord[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolHistory, setToolHistory] = useState<ToolRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const [isAddToolDialogOpen, setAddToolDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const [activeView, setActiveView] = useState<View>("dashboard");

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("stockItems");
      if (savedItems) {
        setStockItems(JSON.parse(savedItems));
      } else {
        setStockItems(MOCK_STOCK_ITEMS);
      }

      const savedHistory = localStorage.getItem("withdrawalHistory");
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedEntryHistory = localStorage.getItem("entryHistory");
      if (savedEntryHistory) setEntryHistory(JSON.parse(savedEntryHistory));

      const savedTools = localStorage.getItem("tools");
      if (savedTools) setTools(JSON.parse(savedTools));

      const savedToolHistory = localStorage.getItem("toolHistory");
      if (savedToolHistory) setToolHistory(JSON.parse(savedToolHistory));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: 'destructive', title: "Erro ao Carregar Dados", description: "Não foi possível carregar os dados salvos." });
    } finally {
      setIsInitialLoad(false);
    }
  }, [toast]);

  const saveDataToLocalStorage = useCallback(<T,>(key: string, data: T) => {
    try {
      const jsonValue = JSON.stringify(data);
      localStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage`, error);
      toast({ variant: 'destructive', title: "Erro ao Salvar", description: `Não foi possível salvar os dados de ${key}.` });
    }
  }, [toast]);

  useEffect(() => { if (!isInitialLoad) saveDataToLocalStorage("stockItems", stockItems) }, [stockItems, isInitialLoad, saveDataToLocalStorage]);
  useEffect(() => { if (!isInitialLoad) saveDataToLocalStorage("withdrawalHistory", history) }, [history, isInitialLoad, saveDataToLocalStorage]);
  useEffect(() => { if (!isInitialLoad) saveDataToLocalStorage("entryHistory", entryHistory) }, [entryHistory, isInitialLoad, saveDataToLocalStorage]);
  useEffect(() => { if (!isInitialLoad) saveDataToLocalStorage("tools", tools) }, [tools, isInitialLoad, saveDataToLocalStorage]);
  useEffect(() => { if (!isInitialLoad) saveDataToLocalStorage("toolHistory", toolHistory) }, [toolHistory, isInitialLoad, saveDataToLocalStorage]);


  const { uniqueRequesters, uniqueDestinations, uniqueAdders } = useMemo(() => {
    const requesters = new Set<string>();
    const destinations = new Set<string>();
    history.forEach(record => {
      if (record.requestedBy) requesters.add(record.requestedBy);
      if (record.requestedFor) destinations.add(record.requestedFor);
    });

    const adders = new Set<string>();
    entryHistory.forEach(record => {
        if (record.addedBy) adders.add(record.addedBy);
    });

    return {
      uniqueRequesters: Array.from(requesters),
      uniqueDestinations: Array.from(destinations),
      uniqueAdders: Array.from(adders),
    };
  }, [history, entryHistory]);

  const handleItemDialogSubmit = useCallback((itemData: Omit<StockItem, 'id' | 'quantity'> & { quantity?: number }) => {
    let itemToSave: StockItem;
    if (editingItem) {
      itemToSave = { ...editingItem, name: itemData.name, specifications: itemData.specifications, barcode: itemData.barcode };
      setStockItems(prev => prev.map(item => item.id === editingItem.id ? itemToSave : item));
    } else {
      const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]) || 0)) + 1 : 1).toString().padStart(3, '0');
      const newId = `ITM-${newIdNumber}`;
      itemToSave = { ...itemData, id: newId, quantity: itemData.quantity || 0 };
      setStockItems(prev => [itemToSave, ...prev]);
    }
    toast({ title: editingItem ? "Item Atualizado" : "Item Adicionado", description: `${itemToSave.name} foi salvo.` });
    setAddItemDialogOpen(false);
    setEditingItem(null);
  }, [editingItem, toast, stockItems]);

  const handleItemDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setEditingItem(null);
    setAddItemDialogOpen(isOpen);
  }, []);

  const handleToolDialogSubmit = useCallback((toolData: Omit<Tool, 'id'>) => {
    let toolToSave: Tool;
    if (editingTool) {
      toolToSave = { ...editingTool, ...toolData };
      setTools(prev => prev.map(tool => tool.id === editingTool.id ? toolToSave : tool));
    } else {
      const newId = `TOOL-${Date.now()}`;
      toolToSave = { ...toolData, id: newId };
      setTools(prev => [toolToSave, ...prev]);
    }
    toast({ title: editingTool ? "Ferramenta Atualizada" : "Ferramenta Adicionada", description: `${toolToSave.name} foi salva.` });
    setAddToolDialogOpen(false);
    setEditingTool(null);
  }, [editingTool, toast]);

  const handleToolDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setEditingTool(null);
    setAddToolDialogOpen(isOpen);
  }, []);

  const handleNewWithdrawal = useCallback((newRecords: WithdrawalRecord[]) => {
    setHistory(prev => [...newRecords, ...prev]);
    
    setStockItems(currentStock => {
      const updatedStock = [...currentStock];
      newRecords.forEach(record => {
        const itemIndex = updatedStock.findIndex(i => i.id === record.item.id);
        if (itemIndex > -1) {
          updatedStock[itemIndex].quantity -= record.quantity;
        }
      });
      return updatedStock;
    });

  }, []);
  
  const handleNewEntry = useCallback((newRecords: EntryRecord[]) => {
    setEntryHistory(prev => [...newRecords, ...prev]);
    
    setStockItems(currentStock => {
      const updatedStock = [...currentStock];
      newRecords.forEach(record => {
        const itemIndex = updatedStock.findIndex(i => i.id === record.item.id);
        if (itemIndex > -1) {
          updatedStock[itemIndex].quantity += record.quantity;
        }
      });
      return updatedStock;
    });
  }, []);

  const handleReturnItem = useCallback((recordId: string, quantity: number) => {
    setHistory(prev => prev.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          returnedQuantity: (rec.returnedQuantity || 0) + quantity,
        };
      }
      return rec;
    }));

    const record = history.find(rec => rec.id === recordId);
    if (record) {
      setStockItems(prev => prev.map(item => {
        if (item.id === record.item.id) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      }));
      toast({ title: "Item Devolvido", description: `${quantity} unidade(s) de ${record.item.name} foram devolvidas ao estoque.` });
    }
  }, [history, toast]);

  const handleDeleteRecord = useCallback((recordId: string, type: 'withdrawals' | 'entries' | 'tools') => {
    switch(type) {
        case 'withdrawals': 
            setHistory(prev => prev.filter(rec => rec.id !== recordId));
            toast({ title: "Registro de Saída Excluído", description: "O registro foi removido do histórico." });
            break;
        case 'entries':
            setEntryHistory(prev => prev.filter(rec => rec.id !== recordId));
            toast({ title: "Registro de Entrada Excluído", description: "O registro foi removido do histórico." });
            break;
        case 'tools':
            setToolHistory(prev => prev.filter(rec => rec.id !== recordId));
            toast({ title: "Registro de Ferramenta Excluído", description: "O registro foi removido permanentemente." });
            break;
    }
  }, [toast]);

<<<<<<< HEAD
  const handleReturnItemRecord = useCallback((recordId: string, quantity: number, note?: string) => {
    setHistory(prev => prev.map(rec => rec.id === recordId ? { ...rec, returnedQuantity: (rec.returnedQuantity || 0) + quantity, returns: [...(rec.returns || []), { date: new Date().toISOString(), quantity, note }] } : rec));

    // Update stock quantities (add back)
    setStockItems(currentStock => {
      const updatedStock = [...currentStock];
      const record = history.find(r => r.id === recordId);
      if (record) {
        const idx = updatedStock.findIndex(i => i.id === record.item.id);
        if (idx > -1) {
          updatedStock[idx].quantity += quantity;
        }
      }
      return updatedStock;
    });

    toast({ title: 'Devolução Registrada', description: `Quantidade devolvida: ${quantity}` });
  }, [history, toast]);

=======
  const navItems = [
    { view: "release" as View, title: "Saída de Estoque", description: "Registrar retirada de itens do estoque.", icon: RefreshCw },
    { view: "entry" as View, title: "Entrada de Estoque", description: "Adicionar novos itens ao estoque.", icon: PackagePlus },
    { view: "items" as View, title: "Gerenciar Itens", description: "Adicionar, editar ou remover tipos de itens.", icon: Boxes },
    { view: "tools" as View, title: "Gerenciar Ferramentas", description: "Adicionar, editar e controlar ferramentas.", icon: Wrench },
    { view: "history" as View, title: "Histórico Geral", description: "Visualizar todas as movimentações.", icon: History },
  ];
>>>>>>> origin/main

  const renderContent = () => {
    if (isInitialLoad) return <ManagementSkeleton />;

    if (activeView === 'dashboard') {
      return (
          <div className="max-w-5xl mx-auto px-8">
              <HoverEffect items={navItems.map(item => ({ ...item, content: <item.icon className="h-8 w-8 mx-auto text-white" />, onClick: () => setActiveView(item.view) }))} />
          </div>
      );
    }
    
    switch (activeView) {
<<<<<<< HEAD
      case "release":
        return (
          <StockReleaseClient
            stockItems={stockItems}
            onUpdateHistory={handleNewWithdrawal}
            uniqueRequesters={uniqueRequesters}
            uniqueDestinations={uniqueDestinations}
          />
        );
      case "entry":
        return (
          <StockEntryClient
            stockItems={stockItems}
            onUpdateHistory={handleNewEntry}
            uniqueAdders={uniqueAdders}
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
            entryHistory={entryHistory}
            toolHistory={toolHistory}
            onDeleteItemRecord={(id) => handleDeleteRecord(id, 'withdrawals')}
            onDeleteEntryRecord={(id) => handleDeleteRecord(id, 'entries')}
            onDeleteToolRecord={(id) => handleDeleteRecord(id, 'tools')}
            onReturnItemRecord={(id, qty, note) => handleReturnItemRecord(id, qty, note)}
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
=======
      case "release": return <StockReleaseClient stockItems={stockItems} onUpdateHistory={handleNewWithdrawal} uniqueRequesters={uniqueRequesters} uniqueDestinations={uniqueDestinations} />;
      case "entry": return <StockEntryClient stockItems={stockItems} onUpdateHistory={handleNewEntry} uniqueAdders={uniqueAdders} />;
      case "items": return <ItemManagement stockItems={stockItems} onSetStockItems={setStockItems} onSetIsAddItemDialogOpen={setAddItemDialogOpen} onSetEditingItem={setEditingItem} />;
      case "history": return <HistoryPanel itemHistory={history} entryHistory={entryHistory} toolHistory={toolHistory} onDeleteItemRecord={(id) => handleDeleteRecord(id, 'withdrawals')} onDeleteEntryRecord={(id) => handleDeleteRecord(id, 'entries')} onDeleteToolRecord={(id) => handleDeleteRecord(id, 'tools')} onReturnItem={handleReturnItem} />;
      case "tools": return <ToolManagement tools={tools} setTools={setTools} toolHistory={toolHistory} setToolHistory={setToolHistory} onSetEditingTool={setEditingTool} onSetIsAddToolDialogOpen={setAddToolDialogOpen} />;
      default: return null;
>>>>>>> origin/main
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
        <header className="flex h-16 items-center gap-4 border-b border-gray-800 px-4 shrink-0">
          {activeView !== 'dashboard' && (
              <Button variant="ghost" size="icon" onClick={() => setActiveView('dashboard')}>
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Voltar para o ínicio</span>
              </Button>
          )}
          <div className="flex-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-300"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M3 10h18v4H3zM12 16v-4"/></svg>
              <h1 className="text-lg font-semibold md:text-xl text-gray-200">
                  Controle de Almoxarifado
              </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-grid-small-white/[0.2] relative">
          {renderContent()}
        </main>

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
  );
}

function ClientSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-56 w-full bg-gray-800" />
      <Skeleton className="h-32 w-full bg-gray-800" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24 bg-gray-800" />
        <Skeleton className="h-10 w-24 bg-gray-800" />
      </div>
    </div>
  );
}

function ManagementSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-gray-800" />
            <Skeleton className="h-4 w-64 bg-gray-800" />
        </div>
        <Skeleton className="h-10 w-32 bg-gray-800" />
      </div>
      <Skeleton className="h-10 w-full bg-gray-800" />
      <Skeleton className="h-80 w-full bg-gray-800" />
    </div>
  );
}

function HistorySkeleton() {
    return (
        <div className="space-y-4 p-4 md:p-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-gray-800" />
                    <Skeleton className="h-4 w-64 bg-gray-800" />
                </div>
                <Skeleton className="h-10 w-32 bg-gray-800" />
            </div>
            <Skeleton className="h-10 w-full bg-gray-800" />
            <Skeleton className="h-[500px] w-full bg-gray-800" />
        </div>
    )
}
