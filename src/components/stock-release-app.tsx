
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from 'next/dynamic';

import type { StockItem, WithdrawalRecord, Tool, ToolRecord, EntryRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Boxes, History, RefreshCw, Wrench, PackagePlus, ArrowLeft, PackageSearch, ArchiveRestore, Gauge, Bell, Search as SearchIcon, Menu as MenuIcon } from "lucide-react";

import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";
import { MOCK_STOCK_ITEMS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

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
  const [lowStockFilter, setLowStockFilter] = useState(false);
  // densityLevel: -1 (mais compacto), 0 (normal), 1 (amplo)
  const [densityLevel, setDensityLevel] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const tracking = useRef(false);

  // Gesture: swipe from left edge to go back
  useEffect(() => {
    const threshold = 60; // mínimo px para considerar swipe
    const edgeZone = 30; // zona ativa a partir da borda esquerda
    const maxAngleDeg = 35; // tolerância de desvio vertical

    function onTouchStart(e: TouchEvent) {
      if (activeView === 'dashboard') return; // nada a fazer
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX <= edgeZone) {
        touchStartX.current = t.clientX;
        touchStartY.current = t.clientY;
        tracking.current = true;
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (!tracking.current || touchStartX.current == null || touchStartY.current == null) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      // se muito vertical, cancela
      const angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
      if (angle > maxAngleDeg) {
        tracking.current = false;
        return;
      }
      // opcional: poderíamos adicionar feedback visual (tradução do container)
    }
    function onTouchEnd(e: TouchEvent) {
      if (!tracking.current || touchStartX.current == null) return;
      const changed = e.changedTouches[0];
      const dx = changed.clientX - touchStartX.current;
      if (dx > threshold) {
        setActiveView('dashboard');
      }
      tracking.current = false;
      touchStartX.current = null;
      touchStartY.current = null;
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeView]);

  // Persist preferences: density and lowStock filter
  useEffect(() => {
    try {
      const d = localStorage.getItem("densityLevel");
      if (d != null && !Number.isNaN(parseInt(d))) setDensityLevel(parseInt(d));
      const ls = localStorage.getItem("lowStockFilter");
      if (ls != null) setLowStockFilter(ls === "true");
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("densityLevel", String(densityLevel)); } catch {}
  }, [densityLevel]);
  useEffect(() => {
    try { localStorage.setItem("lowStockFilter", String(lowStockFilter)); } catch {}
  }, [lowStockFilter]);

  // Fechar menu quando mudar de view
  useEffect(() => { setMenuOpen(false); }, [activeView]);

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

  const navItems = [
    { view: "release" as View, title: "Saída de Estoque", description: "Registrar retirada de itens do estoque.", icon: RefreshCw },
    { view: "entry" as View, title: "Entrada de Estoque", description: "Adicionar novos itens ao estoque.", icon: PackagePlus },
    { view: "items" as View, title: "Gerenciar Itens", description: "Adicionar, editar ou remover tipos de itens.", icon: Boxes },
    { view: "tools" as View, title: "Gerenciar Ferramentas", description: "Adicionar, editar e controlar ferramentas.", icon: Wrench },
    { view: "history" as View, title: "Histórico Geral", description: "Visualizar todas as movimentações.", icon: History },
  ];

  const lowStockThreshold = 5;
  const metrics = useMemo(() => {
    const totalItemTypes = stockItems.length;
    const totalUnits = stockItems.reduce((sum, i) => sum + i.quantity, 0);
    const lowStockItems = stockItems.filter(i => i.quantity <= lowStockThreshold).length;
    const totalTools = tools.length;
    return { totalItemTypes, totalUnits, lowStockItems, totalTools };
  }, [stockItems, tools]);

  const metricCards = [
    {
      title: 'Tipos de Itens',
      value: metrics.totalItemTypes,
      icon: Boxes,
      description: 'Itens cadastrados',
    },
    {
      title: 'Unidades em Estoque',
      value: metrics.totalUnits,
      icon: PackageSearch,
      description: 'Soma de quantidades',
    },
    {
      title: 'Itens em Baixo Nível',
      value: metrics.lowStockItems,
      icon: Gauge,
      description: `≤ ${lowStockThreshold} unidades`,
      actionable: true,
    },
    {
      title: 'Ferramentas',
      value: metrics.totalTools,
      icon: Wrench,
      description: 'Ferramentas ativas',
    },
  ];

  const renderContent = () => {
  if (isInitialLoad) return <ManagementSkeleton />;

    if (activeView === 'dashboard') {
      return (
        <div className="space-y-10">
          <section aria-labelledby="resumo-titulo" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id="resumo-titulo" className="text-base md:text-lg font-semibold tracking-tight">Resumo</h2>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setActiveView('items'); } }}
                  placeholder="Pesquisar itens..."
                  aria-label="Pesquisar itens"
                  className="h-9 px-3 rounded-md border bg-background w-28 sm:w-44 md:w-64"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveView('items')}>Ver Itens</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metricCards.map(card => {
                const isLowStockCard = card.title === 'Itens em Baixo Nível';
                const isTiposItens = card.title === 'Tipos de Itens';
                const isFerramentas = card.title === 'Ferramentas';
                const isActionable = (card as any).actionable || isTiposItens || isFerramentas;
                return (
                  <Card
                    key={card.title}
                    className={"relative overflow-hidden transition " + (isActionable ? 'cursor-pointer hover:shadow-sm focus-visible:ring-2 ring-primary/50' : '')}
                    tabIndex={isActionable ? 0 : -1}
                    onClick={() => {
                      if (isLowStockCard) { setLowStockFilter(true); setActiveView('items'); return; }
                      if (isTiposItens) { setLowStockFilter(false); setActiveView('items'); return; }
                      if (isFerramentas) { setActiveView('tools'); return; }
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      if (isLowStockCard) { setLowStockFilter(true); setActiveView('items'); }
                      else if (isTiposItens) { setLowStockFilter(false); setActiveView('items'); }
                      else if (isFerramentas) { setActiveView('tools'); }
                    }}
                    aria-pressed={isActionable && isLowStockCard ? lowStockFilter : undefined}
                    aria-label={isActionable ? 'Abrir seção relacionada' : undefined}
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {card.title}
                        {isLowStockCard && isActionable && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-medium">filtrável</span>
                        )}
                      </CardTitle>
                      <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
          {/* Seção de Ações Rápidas removida por solicitação: dashboard mantém apenas o Resumo */}
        </div>
      );
    }
    
    switch (activeView) {
      case "release": return <StockReleaseClient stockItems={stockItems} onUpdateHistory={handleNewWithdrawal} uniqueRequesters={uniqueRequesters} uniqueDestinations={uniqueDestinations} />;
      case "entry": return <StockEntryClient stockItems={stockItems} onUpdateHistory={handleNewEntry} uniqueAdders={uniqueAdders} />;
  case "items": return (
        <div className="space-y-4">
          <div className="hidden" aria-hidden="true" />
          <div>
            <div className="w-full">
              <div className="mb-3">
                <div role="tablist" className="grid w-full grid-cols-2 rounded-md border bg-background p-1 text-sm">
                  {([['entry','Entrada'], ['library','Biblioteca']] as const).map(([key,label]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={key === 'library'}
                      className={"rounded px-3 py-2 text-center data-[active=true]:bg-primary data-[active=true]:text-primary-foreground " + (key==='library' ? 'data-[active=true]:bg-primary' : '')}
                      data-active={key==='library'}
                      onClick={() => { if (key==='entry') setActiveView('entry'); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ItemManagement stockItems={stockItems} onSetStockItems={setStockItems} onSetIsAddItemDialogOpen={setAddItemDialogOpen} onSetEditingItem={setEditingItem} globalSearch={globalSearch} />
            </div>
          </div>
        </div>
      );
      case "history": return <HistoryPanel itemHistory={history} entryHistory={entryHistory} toolHistory={toolHistory} onDeleteItemRecord={(id) => handleDeleteRecord(id, 'withdrawals')} onDeleteEntryRecord={(id) => handleDeleteRecord(id, 'entries')} onDeleteToolRecord={(id) => handleDeleteRecord(id, 'tools')} onReturnItem={handleReturnItem} />;
      case "tools": return <ToolManagement tools={tools} setTools={setTools} toolHistory={toolHistory} setToolHistory={setToolHistory} onSetEditingTool={setEditingTool} onSetIsAddToolDialogOpen={setAddToolDialogOpen} />;
      default: return null;
    }
  };

    return (
  <div className="flex flex-col min-h-dvh bg-background text-foreground pb-[calc(env(safe-area-inset-bottom)+4.2rem)] pt-[env(safe-area-inset-top)] overflow-x-hidden">
  <header className="sticky top-0 z-40 flex items-start gap-3 border-b border-border px-4 py-3 shrink-0 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] h-6 w-6 text-muted-foreground"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M3 10h18v4H3zM12 16v-4"/></svg>
            <div className="leading-tight">
              <h1 className="text-xl font-extrabold tracking-tight">Controle de Almoxarifado</h1>
              <div className="text-sm text-muted-foreground">Resumo</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className={"flex-1 overflow-auto relative " + (densityLevel === -1 ? 'text-sm' : densityLevel === 1 ? 'text-base' : '')}>
          <div className={"max-w-6xl mx-auto w-full px-4 " + (densityLevel === -1 ? 'py-3 md:py-4 space-y-5' : densityLevel === 1 ? 'py-8 md:py-10 space-y-10' : 'py-6 md:py-8 space-y-8')}>
            {/* Busca abaixo do cabeçalho removida no novo layout */}
            {renderContent()}
          </div>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`Métricas atualizadas: ${metrics.totalItemTypes} tipos de itens, ${metrics.totalUnits} unidades totais, ${metrics.lowStockItems} itens em baixo nível, ${metrics.totalTools} ferramentas.`}
          </div>
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

        {/* Bottom tab bar */}
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-5 h-14">
              {[{key:'dashboard', label:'Menu', icon: MenuIcon}, {key:'entry', label:'Entrada', icon: PackagePlus}, {key:'items', label:'Itens', icon: Boxes}, {key:'tools', label:'Ferramentas', icon: Wrench}, {key:'history', label:'Histórico', icon: History}].map(tab => {
                const isActive = (activeView === tab.key) || (tab.key==='dashboard' && activeView==='dashboard');
                const Icon = tab.icon as any;
                return (
                  <button key={tab.key} className={"flex flex-col items-center justify-center gap-1 text-xs " + (isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')} onClick={() => setActiveView(tab.key as any)}>
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
    </div>
  );
}

function ClientSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
  <Skeleton className="h-56 w-full bg-muted-gray" />
  <Skeleton className="h-32 w-full bg-muted-gray" />
      <div className="flex justify-end gap-2">
    <Skeleton className="h-10 w-24 bg-muted-gray" />
    <Skeleton className="h-10 w-24 bg-muted-gray" />
      </div>
    </div>
  );
}

function ManagementSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-muted-gray" />
            <Skeleton className="h-4 w-64 bg-muted-gray" />
        </div>
  <Skeleton className="h-10 w-32 bg-muted-gray" />
      </div>
  <Skeleton className="h-10 w-full bg-muted-gray" />
  <Skeleton className="h-80 w-full bg-muted-gray" />
    </div>
  );
}

function HistorySkeleton() {
    return (
        <div className="space-y-4 p-4 md:p-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-muted-gray" />
                    <Skeleton className="h-4 w-64 bg-muted-gray" />
                </div>
                <Skeleton className="h-10 w-32 bg-muted-gray" />
            </div>
            <Skeleton className="h-10 w-full bg-muted-gray" />
            <Skeleton className="h-[500px] w-full bg-muted-gray" />
        </div>
    )
}
