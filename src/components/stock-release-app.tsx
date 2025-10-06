
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

import type { StockItem, WithdrawalRecord, Tool, ToolRecord, EntryRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Boxes, History, Menu, RefreshCw, Wrench, LogIn, LogOut } from "lucide-react";

import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";

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
  loading: () => <ManagementSkeleton />, // Re-use skeleton for now
  ssr: false,
});


type View = "release" | "entry" | "items" | "history" | "tools";

export default function StockReleaseApp() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [entryHistory, setEntryHistory] = useState<EntryRecord[]>([]);
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

  const fetchData = useCallback(async () => {
    if (!user || !firestore) return;
    setIsInitialLoad(true);
    try {
      const collections = {
        stockItems: collection(firestore, 'users', user.uid, 'stockItems'),
        withdrawalHistory: collection(firestore, 'users', user.uid, 'withdrawalHistory'),
        entryHistory: collection(firestore, 'users', user.uid, 'entryHistory'),
        tools: collection(firestore, 'users', user.uid, 'tools'),
        toolHistory: collection(firestore, 'users', user.uid, 'toolHistory'),
      };

      const [
        stockItemsSnap,
        historySnap,
        entryHistorySnap,
        toolsSnap,
        toolHistorySnap,
      ] = await Promise.all([
        getDocs(query(collections.stockItems, orderBy('name'))),
        getDocs(query(collections.withdrawalHistory, orderBy('date', 'desc'))),
        getDocs(query(collections.entryHistory, orderBy('date', 'desc'))),
        getDocs(query(collections.tools, orderBy('name'))),
        getDocs(query(collections.toolHistory, orderBy('checkoutDate', 'desc'))),
      ]);

      setStockItems(stockItemsSnap.docs.map(d => d.data() as StockItem));
      setHistory(historySnap.docs.map(d => d.data() as WithdrawalRecord));
      setEntryHistory(entryHistorySnap.docs.map(d => d.data() as EntryRecord));
      setTools(toolsSnap.docs.map(d => d.data() as Tool));
      setToolHistory(toolHistorySnap.docs.map(d => d.data() as ToolRecord));

    } catch (error) {
      console.error("Failed to fetch data from Firestore", error);
      toast({ variant: 'destructive', title: "Erro ao Carregar Dados", description: "Não foi possível carregar os dados do Firestore." });
    } finally {
      setIsInitialLoad(false);
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Item Management Handlers
  const handleItemDialogSubmit = useCallback(async (itemData: Omit<StockItem, 'id'>) => {
    if (!user || !firestore) return;
    
    let itemToSave: StockItem;
    const batch = writeBatch(firestore);

    if (editingItem) {
      itemToSave = { ...editingItem, name: itemData.name, specifications: itemData.specifications, barcode: itemData.barcode };
      const itemRef = doc(firestore, 'users', user.uid, 'stockItems', itemToSave.id);
      batch.update(itemRef, { name: itemToSave.name, specifications: itemToSave.specifications, barcode: itemToSave.barcode });
    } else {
      const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]))) + 1 : 1).toString().padStart(3, '0');
      const newId = `ITM-${newIdNumber}`;
      itemToSave = { ...itemData, id: newId, quantity: itemData.quantity || 0 };
      const itemRef = doc(firestore, 'users', user.uid, 'stockItems', newId);
      batch.set(itemRef, itemToSave);
    }

    try {
        await batch.commit();
        await fetchData();
        toast({ title: editingItem ? "Item Atualizado" : "Item Adicionado", description: `${itemToSave.name} foi salvo.` });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: "Erro ao Salvar", description: "Não foi possível salvar o item." });
    }

    setAddItemDialogOpen(false);
    setEditingItem(null);
  }, [editingItem, toast, user, firestore, stockItems, fetchData]);

  const handleItemDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setEditingItem(null);
    setAddItemDialogOpen(isOpen);
  }, []);

  // Tool Management Handlers
  const handleToolDialogSubmit = useCallback(async (toolData: Omit<Tool, 'id'>) => {
    if (!user || !firestore) return;
    
    let toolToSave: Tool;
    const batch = writeBatch(firestore);

    if (editingTool) {
      toolToSave = { ...editingTool, ...toolData };
      const toolRef = doc(firestore, 'users', user.uid, 'tools', toolToSave.id);
      batch.update(toolRef, toolData);
    } else {
      const newId = `TOOL-${Date.now()}`;
      toolToSave = { ...toolData, id: newId };
      const toolRef = doc(firestore, 'users', user.uid, 'tools', newId);
      batch.set(toolRef, toolToSave);
    }

    try {
        await batch.commit();
        await fetchData();
        toast({ title: editingTool ? "Ferramenta Atualizada" : "Ferramenta Adicionada", description: `${toolToSave.name} foi salva.` });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: "Erro ao Salvar", description: "Não foi possível salvar a ferramenta." });
    }

    setAddToolDialogOpen(false);
    setEditingTool(null);
  }, [editingTool, toast, user, firestore, fetchData]);

  const handleToolDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setEditingTool(null);
    setAddToolDialogOpen(isOpen);
  }, []);

  const handleNewWithdrawal = useCallback(async (newRecords: WithdrawalRecord[]) => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);

    newRecords.forEach(record => {
      const historyRef = doc(firestore, 'users', user.uid, 'withdrawalHistory', record.id);
      batch.set(historyRef, record);

      const itemRef = doc(firestore, 'users', user.uid, 'stockItems', record.item.id);
      const currentQuantity = stockItems.find(i => i.id === record.item.id)?.quantity ?? 0;
      batch.update(itemRef, { quantity: currentQuantity - record.quantity });
    });
    
    try {
        await batch.commit();
        await fetchData();
        toast({ title: "Sucesso!", description: `${newRecords.length} retirada(s) foram registradas.` });
    } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Erro ao Registrar Retirada", description: "Não foi possível salvar os registros." });
    }
  }, [user, firestore, stockItems, fetchData, toast]);
  
  const handleNewEntry = useCallback(async (newRecords: EntryRecord[]) => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);

    newRecords.forEach(record => {
      const entryRef = doc(firestore, 'users', user.uid, 'entryHistory', record.id);
      batch.set(entryRef, record);

      const itemRef = doc(firestore, 'users', user.uid, 'stockItems', record.item.id);
      const currentQuantity = stockItems.find(i => i.id === record.item.id)?.quantity ?? 0;
      batch.update(itemRef, { quantity: currentQuantity + record.quantity });
    });

    try {
        await batch.commit();
        await fetchData();
        toast({ title: "Sucesso!", description: `Entrada de ${newRecords.length} item(ns) registrada.` });
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "Erro ao Registrar Entrada", description: "Não foi possível salvar as entradas." });
    }
  }, [user, firestore, stockItems, fetchData, toast]);

  const handleDeleteRecord = useCallback(async (recordId: string, type: 'withdrawals' | 'entries' | 'tools') => {
    if (!user || !firestore) return;

    let collectionName: string;
    let successMessage: string;
    switch(type) {
        case 'withdrawals': 
            collectionName = 'withdrawalHistory';
            successMessage = "Registro de Saída Excluído";
            break;
        case 'entries':
            collectionName = 'entryHistory';
            successMessage = "Registro de Entrada Excluído";
            break;
        case 'tools':
            collectionName = 'toolHistory';
            successMessage = "Registro de Ferramenta Excluído";
            break;
    }

    try {
        const batch = writeBatch(firestore);
        const recordRef = doc(firestore, 'users', user.uid, collectionName, recordId);
        batch.delete(recordRef);
        await batch.commit();
        await fetchData();
        toast({ title: successMessage, description: "O registro foi removido permanentemente." });
    } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Erro ao Excluir", description: "Não foi possível excluir o registro." });
    }
  }, [user, firestore, fetchData, toast]);

  const handleSignOut = async () => {
    await signOut(getAuth());
    // The useUser hook will handle redirection
  };

  const renderContent = () => {
    if (isInitialLoad) {
      return <ManagementSkeleton />;
    }
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
            onSetStockItems={async (items) => {
              if (!user || !firestore) return;
              const batch = writeBatch(firestore);
              const itemCollection = collection(firestore, 'users', user.uid, 'stockItems');
              const snapshot = await getDocs(itemCollection);
              snapshot.docs.forEach(d => batch.delete(d.ref));
              items.forEach(item => {
                const itemRef = doc(itemCollection, item.id);
                batch.set(itemRef, item);
              });
              await batch.commit();
              await fetchData();
            }}
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
          />
        );
      case "tools":
        return (
            <ToolManagement
              tools={tools}
              setTools={async (tools) => {
                if (!user || !firestore) return;
                const batch = writeBatch(firestore);
                const toolCollection = collection(firestore, 'users', user.uid, 'tools');
                const snapshot = await getDocs(toolCollection);
                snapshot.docs.forEach(d => batch.delete(d.ref));
                tools.forEach(tool => {
                    const toolRef = doc(toolCollection, tool.id);
                    batch.set(toolRef, tool);
                });
                await batch.commit();
                await fetchData();
              }}
              toolHistory={toolHistory}
              setToolHistory={async (history) => {
                 if (!user || !firestore) return;
                const batch = writeBatch(firestore);
                history.forEach(record => {
                    const recordRef = doc(collection(firestore, 'users', user.uid, 'toolHistory'), record.id);
                    batch.set(recordRef, record, { merge: true });
                });
                await batch.commit();
                await fetchData();
              }}
              onSetEditingTool={setEditingTool}
              onSetIsAddToolDialogOpen={setAddToolDialogOpen}
            />
        );
      default:
        return null;
    }
  };

  const navItems = [
    { view: "release" as View, icon: RefreshCw, label: "Saída" },
    { view: "entry" as View, icon: LogIn, label: "Entrada" },
    { view: "items" as View, icon: Boxes, label: "Itens" },
    { view: "tools" as View, icon: Wrench, label: "Ferramentas" },
    { view: "history" as View, icon: History, label: "Histórico" },
  ];

  return (
    <div className="flex flex-col h-screen bg-muted/40">
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Navegação</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {navItems.map(item => (
              <DropdownMenuItem
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={cn(
                  "flex items-center gap-2",
                  activeView === item.view && "bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
             <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M3 10h18v4H3zM12 16v-4"/></svg>
            <h1 className="text-lg font-semibold md:text-xl">
                Controle de Estoque
            </h1>
        </div>
        {user && <img src={user.photoURL || ''} alt="User avatar" className="h-8 w-8 rounded-full" />}
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto pb-28">
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
