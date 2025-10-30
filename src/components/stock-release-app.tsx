
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';
import { App, type BackButtonListenerEvent } from '@capacitor/app';
import { Dialog } from '@capacitor/dialog';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import type { StockItem, WithdrawalRecord, Tool, ToolRecord, EntryRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
// Removed lucide-react icon imports to avoid extra bundle weight in dev; using Material Icons font instead

import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Lazy-load AdMob banner only on client to keep web/dev bundle lighter
const AdmobBanner = dynamic(() => import('./admob-banner').then(m => m.AdmobBanner), { ssr: false });
import { useFirestore } from "@/firebase/provider";
import { StockRepo } from "@/lib/data/firestore-repo";

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

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const safeGetItem = (key: string) => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {}
};

const safeGetArray = <T,>(key: string): T[] => {
  const raw = safeGetItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const safeSetArray = (key: string, value: unknown[]) => {
  try {
    safeSetItem(key, JSON.stringify(value));
  } catch {}
};

type View = "release" | "entry" | "items" | "history" | "tools";

export default function StockReleaseApp() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [repo, setRepo] = useState<StockRepo | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [entryHistory, setEntryHistory] = useState<EntryRecord[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolHistory, setToolHistory] = useState<ToolRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Restore options UI state
  const [isRestoreMenuOpen, setIsRestoreMenuOpen] = useState(false);
  const [restoreMerge, setRestoreMerge] = useState(false); // false = replace, true = merge
  const [syncItemsToCloud, setSyncItemsToCloud] = useState(false);
  const [docFiles, setDocFiles] = useState<string[] | null>(null);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const [isAddToolDialogOpen, setAddToolDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  // Página de Saída como tela inicial
  const [activeView, setActiveView] = useState<View>("release");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  // densityLevel: -1 (mais compacto), 0 (normal), 1 (amplo)
  const [densityLevel, setDensityLevel] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  // Controla as abas internas do módulo "Itens" (métricas/cadastro/entrada)
  const [itemsTab, setItemsTab] = useState<'metrics' | 'cadastro' | 'entry'>('metrics');
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const tracking = useRef(false);

  // Gesture: swipe from left edge to go back
  useEffect(() => {
    const threshold = 60; // mínimo px para considerar swipe
    const edgeZone = 30; // zona ativa a partir da borda esquerda
    const maxAngleDeg = 35; // tolerância de desvio vertical

    function onTouchStart(e: TouchEvent) {
      if (activeView === 'release') return; // nada a fazer na tela inicial
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
        setActiveView('release');
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
    const storedDensity = safeGetItem("densityLevel");
    if (storedDensity != null && !Number.isNaN(parseInt(storedDensity))) {
      setDensityLevel(parseInt(storedDensity));
    }
    const storedLowStock = safeGetItem("lowStockFilter");
    if (storedLowStock != null) {
      setLowStockFilter(storedLowStock === "true");
    }
  }, []);
  
  // Android hardware back button: confirm exit when at root, otherwise navigate back/close dialogs
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
  let handlePromise = App.addListener('backButton', async ({ canGoBack }: BackButtonListenerEvent) => {
      // Close any open dialog first
      if (isAddItemDialogOpen) { setAddItemDialogOpen(false); return; }
      if (isAddToolDialogOpen) { setAddToolDialogOpen(false); return; }
      // If we're not on the release page, go back to it
      if (activeView !== 'release') { setActiveView('release'); return; }
      // If webview can go back in history, prefer that
      if (canGoBack) { window.history.back(); return; }
      // Ask to exit the app
      try {
        const { value } = await Dialog.confirm({
          title: 'Sair do aplicativo',
          message: 'Deseja realmente sair?',
          okButtonTitle: 'Sair',
          cancelButtonTitle: 'Cancelar',
        });
        if (value) {
          App.exitApp();
        }
      } catch {
        // Fallback: no dialog available
        App.exitApp();
      }
    });
    return () => {
      handlePromise.then(h => h.remove()).catch(() => {});
    };
  }, [activeView, isAddItemDialogOpen, isAddToolDialogOpen]);
  // Ensure we don't get stuck on an endless initial loading state
  useEffect(() => {
    // Render the UI as soon as the component mounts; downstream data will hydrate when ready
    setIsInitialLoad(false);
  }, []);
  useEffect(() => {
    safeSetItem("densityLevel", String(densityLevel));
  }, [densityLevel]);
  useEffect(() => {
    safeSetItem("lowStockFilter", String(lowStockFilter));
  }, [lowStockFilter]);

  // (nav menu removido do topo por decisão de design)

  // Initialize repository if Firestore is available
  useEffect(() => {
    if (firestore) {
      setRepo(new StockRepo(firestore));
    } else {
      setRepo(null);
    }
  }, [firestore]);

  // Source of truth for itens:
  // - Quando Firestore está disponível: assina a coleção e popula o estado a partir da nuvem (com cache offline do Firestore).
  // - Quando Firestore NÃO está configurado: persiste e restaura do localStorage para não perder dados ao fechar o app.
  useEffect(() => {
    if (repo) {
      const unsubscribeItems = repo.onItems(itemsSnapshot => {
        const nextItems = Array.isArray(itemsSnapshot) ? itemsSnapshot : [];
        setStockItems(nextItems);
        safeSetArray('local:stockItems:lastSnapshot', nextItems);
      });
      return () => {
        try { unsubscribeItems(); } catch {}
      };
    }

    const storedItems = safeGetArray<StockItem>('local:stockItems');
    if (storedItems.length) {
      setStockItems(storedItems);
    }
  }, [repo]);

  // Persistência local apenas quando não há Firestore configurado
  useEffect(() => {
    if (repo) return;
    safeSetArray('local:stockItems', stockItems);
  }, [repo, stockItems]);

  // Source of truth for histories (withdrawals and entries): subscribe when Firestore is available;
  // otherwise, restore from and persist to localStorage to survive app restarts.
  useEffect(() => {
    if (repo) {
      const unsubs: Array<() => void> = [];
      try {
        unsubs.push(repo.onWithdrawals(list => {
          const snapshot = Array.isArray(list) ? list : [];
          setHistory(snapshot);
          safeSetArray('local:history:lastSnapshot', snapshot);
        }));
      } catch {}
      try {
        unsubs.push(repo.onEntries(list => {
          const snapshot = Array.isArray(list) ? list : [];
          setEntryHistory(snapshot);
          safeSetArray('local:entryHistory:lastSnapshot', snapshot);
        }));
      } catch {}
      return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
    }

    const storedWithdrawals = safeGetArray<WithdrawalRecord>('local:history');
    if (storedWithdrawals.length) {
      setHistory(storedWithdrawals);
    }
    const storedEntries = safeGetArray<EntryRecord>('local:entryHistory');
    if (storedEntries.length) {
      setEntryHistory(storedEntries);
    }
  }, [repo]);

  useEffect(() => {
    if (repo) return;
    safeSetArray('local:history', history);
  }, [repo, history]);
  useEffect(() => {
    if (repo) return;
    safeSetArray('local:entryHistory', entryHistory);
  }, [repo, entryHistory]);

  // Prefetch heavy client chunks on idle to reduce first navigation delay
  useEffect(() => {
    const prefetch = () => {
      import('./stock-release-client');
      import('./stock-entry-client');
      import('./item-management');
      import('./history-panel');
      import('./tool-management');
    };
    const w = typeof window !== 'undefined' ? window as any : undefined;
    if (w && typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 1000);
    }
  }, []);

  // Backup: exportar dados para arquivo e compartilhar
  const handleExportBackup = useCallback(async () => {
    try {
      const payload = {
        schema: 'almoxarifado.backup.v1',
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.9',
        data: { stockItems, history, entryHistory, tools, toolHistory },
      };
      const json = JSON.stringify(payload, null, 2);
      const filename = `almoxarifado_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Documents,
          recursive: false,
        });
        const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Documents });
        try {
          await Share.share({ title: 'Backup do Almoxarifado', text: 'Backup dos dados do aplicativo.', url: uri, dialogTitle: 'Compartilhar Backup' });
        } catch {}
      } else {
        // Web fallback: trigger a file download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      toast({ title: 'Backup criado', description: `Arquivo salvo: ${filename}` });
      // Após exportar dados, exibir vídeo de 30s (rewarded)
      try {
        const { showLongRewarded } = await import('@/lib/native/ad-manager');
        await showLongRewarded();
      } catch {}
    } catch (error) {
      console.error('Backup export error', error);
      toast({ variant: 'destructive', title: 'Falha no Backup', description: 'Não foi possível criar o backup.' });
    }
  }, [stockItems, history, entryHistory, tools, toolHistory, toast]);

  // Restore: importar dados de um arquivo JSON selecionado
  const performRestoreFromText = useCallback((textOrBytes: string | ArrayBuffer) => {
    try {
      let jsonText: string;
      if (typeof textOrBytes === 'string') {
        jsonText = textOrBytes;
      } else {
        try {
          jsonText = new TextDecoder('utf-8').decode(new Uint8Array(textOrBytes));
        } catch {
          // last resort: assume latin1
          jsonText = String.fromCharCode.apply(null, Array.from(new Uint8Array(textOrBytes)) as any);
        }
      }

      const parsed = JSON.parse(jsonText);

      // Normalize various possible backup shapes (for compatibility with older exports)
      // Accepted shapes:
      // 1) { schema: 'almoxarifado.backup.v1', data: { stockItems, history, entryHistory, tools, toolHistory } }
      // 2) { data: { ...same keys... } }
      // 3) { stockItems?, items?, history?|withdrawals?, entryHistory?|entries?, tools?, toolHistory?|toolRecords? }
      // 4) A single array of stock items (legacy): [...]
      const toArray = (v: any) => (Array.isArray(v) ? v : []);

      const root = (parsed && parsed.data && typeof parsed.data === 'object') ? parsed.data : parsed;
      let normalized = {
        stockItems: [] as any[],
        history: [] as any[],
        entryHistory: [] as any[],
        tools: [] as any[],
        toolHistory: [] as any[],
      };

      if (Array.isArray(parsed)) {
        // Legacy: only items array
        normalized.stockItems = parsed;
      } else if (root && typeof root === 'object') {
        // Map common aliases
        const stockItems = root.stockItems ?? root.items ?? root.inventory ?? [];
        const history = root.history ?? root.withdrawals ?? root.withdrawalsHistory ?? [];
        const entryHistory = root.entryHistory ?? root.entries ?? root.entriesHistory ?? [];
        const tools = root.tools ?? root.ferramentas ?? [];
        const toolHistory = root.toolHistory ?? root.toolsHistory ?? root.toolRecords ?? [];
        normalized = {
          stockItems: toArray(stockItems),
          history: toArray(history),
          entryHistory: toArray(entryHistory),
          tools: toArray(tools),
          toolHistory: toArray(toolHistory),
        };
      }

      // If nothing recognized, fail gracefully
      const totalCount = normalized.stockItems.length + normalized.history.length + normalized.entryHistory.length + normalized.tools.length + normalized.toolHistory.length;
      if (totalCount === 0) {
        throw new Error('Estrutura de backup não reconhecida');
      }

      if (restoreMerge) {
        // Merge with existing state
        const mergeById = <T extends { id: string }>(current: T[], incoming: T[]) => {
          const map = new Map<string, T>();
          current.forEach(i => map.set(i.id, i));
          incoming.forEach(i => map.set(i.id, i)); // incoming overwrites by id
          return Array.from(map.values());
        };
        setStockItems(prev => mergeById(prev as any, normalized.stockItems as any) as any);
        setHistory(prev => {
          const map = new Map<string, any>();
          [...prev, ...normalized.history].forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
        setEntryHistory(prev => {
          const map = new Map<string, any>();
          [...prev, ...normalized.entryHistory].forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
        setTools(prev => mergeById(prev as any, normalized.tools as any) as any);
        setToolHistory(prev => {
          const map = new Map<string, any>();
          [...prev, ...normalized.toolHistory].forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
      } else {
        // Replace
        setStockItems(normalized.stockItems);
        setHistory(normalized.history);
        setEntryHistory(normalized.entryHistory);
        setTools(normalized.tools);
        setToolHistory(normalized.toolHistory);
      }

  // Persist a small marker for UX and optional re-restore (does not alter Firestore)
  safeSetItem('lastRestoreAt', new Date().toISOString());

      toast({ title: 'Restauração concluída', description: `${restoreMerge ? 'Mesclado' : 'Substituído'}: ${normalized.stockItems.length} itens, ${normalized.history.length} saídas, ${normalized.entryHistory.length} entradas, ${normalized.tools.length} ferramentas, ${normalized.toolHistory.length} registros de ferramentas.` });

      // Optional: sync items to cloud repo if available and opted-in
      if (syncItemsToCloud && repo) {
        try {
          normalized.stockItems.forEach((item: any) => {
            repo.upsertItem(item as any).catch(() => {});
          });
        } catch {}
      }
    } catch (e: any) {
      console.error('Restore parse error', e);
      const msg = (e && e.message) ? e.message : 'Arquivo inválido ou corrompido';
      toast({ variant: 'destructive', title: 'Falha na Restauração', description: `${msg}. Certifique-se de selecionar um backup JSON exportado pelo app.` });
    }
  }, [toast, restoreMerge, syncItemsToCloud, repo]);

  const handleTriggerImport = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click();
    setIsRestoreMenuOpen(false);
  }, []);

  const handleListDeviceBackups = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      setIsDocsLoading(true);
      setDocFiles(null);
      const res = await Filesystem.readdir({ path: '', directory: Directory.Documents } as any);
      const names = (res.files || res) as any; // compat with different plugin returns
      const list: string[] = Array.isArray(names)
        ? names.map((f: any) => typeof f === 'string' ? f : f.name)
        : [];
      const filtered = list.filter(n => n && (n.endsWith('.json') || n.endsWith('.backup.json')));
      filtered.sort((a, b) => b.localeCompare(a));
      setDocFiles(filtered);
    } catch (e) {
      console.error('Erro ao listar backups', e);
      toast({ variant: 'destructive', title: 'Falha ao listar backups', description: 'Não foi possível acessar Documentos.' });
    } finally {
      setIsDocsLoading(false);
    }
  }, [toast]);

  const handleRestoreFromDocuments = useCallback(async (filename: string) => {
    try {
      const res = await Filesystem.readFile({ path: filename, directory: Directory.Documents, encoding: 'utf8' as any } as any);
      const data: any = (res as any).data;
      if (typeof data === 'string') {
        performRestoreFromText(data);
      } else if (data && typeof (data as any).arrayBuffer === 'function') {
        const ab = await (data as Blob).arrayBuffer();
        performRestoreFromText(ab);
      } else {
        throw new Error('Formato de leitura desconhecido');
      }
      setIsRestoreMenuOpen(false);
    } catch (e) {
      console.error('Erro ao ler backup de Documentos', e);
      toast({ variant: 'destructive', title: 'Falha na Restauração', description: 'Não foi possível ler o arquivo selecionado.' });
    }
  }, [performRestoreFromText, toast]);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    // Prefer array buffer to avoid encoding issues then decode manually
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      performRestoreFromText(result);
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: 'Não foi possível ler o arquivo selecionado.' });
    };
  reader.readAsArrayBuffer(file);
    // reset input value to allow re-selecting the same file later
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [performRestoreFromText, toast]);

  // Derive unique requester/destination/adders lists from histories
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
      itemToSave = {
        ...editingItem,
        name: itemData.name,
        specifications: itemData.specifications,
        barcode: itemData.barcode,
        // allow updating quantity when editing
        quantity: typeof itemData.quantity === 'number' ? itemData.quantity : editingItem.quantity,
      };
      if (repo) {
        repo.upsertItem(itemToSave).catch(err => console.error('Failed to update item', err));
      } else {
        setStockItems(prev => prev.map(item => item.id === editingItem.id ? itemToSave : item));
      }
    } else {
      const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]) || 0)) + 1 : 1).toString().padStart(3, '0');
      const newId = `ITM-${newIdNumber}`;
      itemToSave = { ...itemData, id: newId, quantity: itemData.quantity || 0 } as StockItem;
      if (repo) {
        repo.upsertItem(itemToSave).catch(err => console.error('Failed to add item', err));
      } else {
        setStockItems(prev => [itemToSave, ...prev]);
      }
    }
    toast({ title: editingItem ? "Item Atualizado" : "Item Adicionado", description: `${itemToSave.name} foi salvo.` });
    setAddItemDialogOpen(false);
    setEditingItem(null);
  }, [editingItem, toast, stockItems, repo]);

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
    if (repo) {
      // Fire-and-forget writes; UI updates come from onItems subscription
      newRecords.forEach(rec => repo.addWithdrawal(rec).catch(err => console.error('Failed to add withdrawal', err)));
    } else {
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
    }

  }, [repo]);
  
  const handleNewEntry = useCallback((newRecords: EntryRecord[]) => {
    setEntryHistory(prev => [...newRecords, ...prev]);
    if (repo) {
      newRecords.forEach(rec => repo.addEntry(rec).catch(err => console.error('Failed to add entry', err)));
    } else {
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
    }
  }, [repo]);

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

  const handleClearAllHistory = useCallback(() => {
    setHistory([]);
    setEntryHistory([]);
    setToolHistory([]);
    toast({ title: 'Histórico apagado', description: 'Todos os registros de saídas, entradas e ferramentas foram removidos deste dispositivo.' });
  }, [toast]);

  const lowStockThreshold = 5;
  const metrics = useMemo(() => {
    const totalItemTypes = stockItems.length;
    const lowStockItems = stockItems.filter(i => i.quantity <= lowStockThreshold).length;
    const totalTools = tools.length;
    return { totalItemTypes, lowStockItems, totalTools };
  }, [stockItems, tools]);

  const metricCards = [
    { title: 'Itens', value: metrics.totalItemTypes, icon: 'category', description: 'Itens cadastrados' },
    { title: 'Itens em Baixo Nível', value: metrics.lowStockItems, icon: 'warning', description: `≤ ${lowStockThreshold} unidades`, actionable: true },
    { title: 'Ferramentas', value: metrics.totalTools, icon: 'build', description: 'Ferramentas ativas' },
  ];

  const renderContent = () => {
  if (isInitialLoad) return <ManagementSkeleton />;
    
    switch (activeView) {
      case "release": return <StockReleaseClient stockItems={stockItems} onUpdateHistory={handleNewWithdrawal} uniqueRequesters={uniqueRequesters} uniqueDestinations={uniqueDestinations} />;
      case "entry": return <StockEntryClient stockItems={stockItems} onUpdateHistory={handleNewEntry} uniqueAdders={uniqueAdders} />;
      case "items": return (
        <div className="space-y-4">
          <Tabs value={itemsTab} onValueChange={(v)=>setItemsTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="metrics" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metricCards.map(card => {
                  const isLowStockCard = card.title === 'Itens em Baixo Nível';
                  const isTiposItens = card.title === 'Itens';
                  const isFerramentas = card.title === 'Ferramentas';
                  const isActionable = (card as any).actionable || isTiposItens || isFerramentas || isLowStockCard;
                  return (
                    <div
                      key={card.title}
                      className={"bg-card p-5 rounded-lg shadow-sm flex justify-between items-start " + (isActionable ? 'cursor-pointer hover:shadow-sm focus-visible:ring-2 ring-primary/50' : '')}
                      tabIndex={isActionable ? 0 : -1}
                      onClick={() => {
                        if (isLowStockCard) { setLowStockFilter(true); setItemsTab('cadastro'); return; }
                        if (isTiposItens) { setLowStockFilter(false); setItemsTab('cadastro'); return; }
                        if (isFerramentas) { setActiveView('tools'); return; }
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        if (isLowStockCard) { setLowStockFilter(true); setItemsTab('cadastro'); }
                        else if (isTiposItens) { setLowStockFilter(false); setItemsTab('cadastro'); }
                        else if (isFerramentas) { setActiveView('tools'); }
                      }}
                      aria-pressed={isActionable && isLowStockCard ? lowStockFilter : undefined}
                      aria-label={isActionable ? 'Abrir seção relacionada' : undefined}
                    >
                      <div>
                        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          {card.title}
                          {isLowStockCard && isActionable && (
                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">filtrável</span>
                          )}
                        </h2>
                        <p className={`text-3xl font-bold mt-1 ${isLowStockCard ? 'text-red-500' : 'text-foreground'}`}>{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                      </div>
                      <span className={`material-icons ${ isLowStockCard ? 'text-red-500' : 'text-primary' }`}>
                        {isLowStockCard ? 'warning' : card.title === 'Ferramentas' ? 'build' : 'category'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="cadastro" className="mt-4">
              <ItemManagement
                stockItems={stockItems}
                onSetStockItems={setStockItems}
                onSetIsAddItemDialogOpen={setAddItemDialogOpen}
                onSetEditingItem={setEditingItem}
                globalSearch={globalSearch}
                lowStockOnly={lowStockFilter}
                onClearLowStockFilter={() => setLowStockFilter(false)}
                onDeleteItem={(id) => {
                  if (repo) {
                    // Soft delete by setting quantity 0 or implement a delete function if needed
                    const target = stockItems.find(i => i.id === id);
                    if (target) repo.upsertItem({ ...target, quantity: 0 }).catch(console.error);
                  } else {
                    setStockItems(prev => prev.filter(i => i.id !== id));
                  }
                }}
                onUpdateItem={(item) => {
                  if (repo) repo.upsertItem(item).catch(console.error);
                  else setStockItems(prev => prev.map(i => i.id === item.id ? item : i));
                }}
                onGoToRelease={() => setActiveView('release')}
                onGoToEntry={() => setItemsTab('entry')}
              />
            </TabsContent>
            <TabsContent value="entry" className="mt-4">
              <StockEntryClient
                stockItems={stockItems}
                onUpdateHistory={handleNewEntry}
                uniqueAdders={uniqueAdders}
              />
            </TabsContent>
          </Tabs>
        </div>
      );
  case "history": return <HistoryPanel itemHistory={history} entryHistory={entryHistory} toolHistory={toolHistory} onDeleteItemRecord={(id) => handleDeleteRecord(id, 'withdrawals')} onDeleteEntryRecord={(id) => handleDeleteRecord(id, 'entries')} onDeleteToolRecord={(id) => handleDeleteRecord(id, 'tools')} onReturnItem={handleReturnItem} onClearAll={handleClearAllHistory} />;
      case "tools": return <ToolManagement tools={tools} setTools={setTools} toolHistory={toolHistory} setToolHistory={setToolHistory} onSetEditingTool={setEditingTool} onSetIsAddToolDialogOpen={setAddToolDialogOpen} />;
      default: return null;
    }
  };

    return (
  <div className="flex flex-col min-h-dvh bg-background text-foreground pt-[env(safe-area-inset-top)] overflow-x-hidden" style={{ paddingBlockEnd: 'calc(var(--admob-bottom-inset, 0px) + env(safe-area-inset-bottom) + var(--bottom-bar-height, 5.2rem))' }}>
  
  {/* Header principal */}
    <header className="sticky top-0 z-40 bg-card shadow-sm px-4 py-2.5 border-b border-border pt-[env(safe-area-inset-top)]">
          <div className="mx-auto max-w-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-icons text-foreground">inventory</span>
              <h1 className="text-lg font-semibold truncate">Controle de Almoxarifado</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative" aria-label="Exportar Backup" onClick={handleExportBackup} title="Exportar Backup">
                <span className="material-icons text-foreground">save_alt</span>
              </button>
              <Popover open={isRestoreMenuOpen} onOpenChange={setIsRestoreMenuOpen}>
                <PopoverTrigger asChild>
                  <button className="relative" aria-label="Restaurar Backup" title="Restaurar Backup">
                    <span className="material-icons text-foreground">upload_file</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3">
                  <div className="space-y-3">
                    <div className="font-medium">Restauração de Backup</div>
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 rounded border hover:bg-accent" onClick={handleTriggerImport}>Escolher arquivo…</button>
                      {Capacitor.isNativePlatform() && (
                        <div className="space-y-2">
                          <button className="w-full text-left px-3 py-2 rounded border hover:bg-accent" onClick={handleListDeviceBackups} disabled={isDocsLoading}>
                            {isDocsLoading ? 'Carregando backups…' : 'Listar backups (Documentos)'}
                          </button>
                          {docFiles && docFiles.length > 0 && (
                            <div className="max-h-40 overflow-auto border rounded">
                              {docFiles.map(name => (
                                <button key={name} className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-0" onClick={() => handleRestoreFromDocuments(name)}>
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}
                          {docFiles && docFiles.length === 0 && (
                            <div className="text-sm text-muted-foreground">Nenhum backup .json encontrado em Documentos.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 pt-2 border-t">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={restoreMerge} onChange={(e) => setRestoreMerge(e.target.checked)} />
                        Mesclar com os dados atuais (em vez de substituir)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={syncItemsToCloud} onChange={(e) => setSyncItemsToCloud(e.target.checked)} />
                        Sincronizar itens com a nuvem (se conectado)
                      </label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* No 'Menu' text button */}
            </div>
          </div>
        </header>
        
        {/* Main content */}
          <main className={"flex-1 overflow-auto relative " + (densityLevel === -1 ? 'text-sm' : densityLevel === 1 ? 'text-base' : '')}>
            <div className={"max-w-md mx-auto w-full px-4 " + (densityLevel === -1 ? 'py-3 md:py-4 space-y-5' : densityLevel === 1 ? 'py-8 md:py-10 space-y-10' : 'py-6 md:py-8 space-y-8')}>
              {renderContent()}
            </div>
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {`Métricas: ${metrics.totalItemTypes} itens cadastrados, ${metrics.lowStockItems} itens em baixo nível, ${metrics.totalTools} ferramentas.`}
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

  {/* AdMob banner (native builds only). It's a system overlay at bottom-center. */}
  {process.env.NODE_ENV === 'production' && <AdmobBanner />}
  {/* Spacer removed: nav is hidden while banner is visible; no need for a background filler */}
  {/* Bottom tab bar (Material Icons) - Menu + módulos */}
  <nav className="bottom-nav fixed inset-x-0 z-40 border-t border-border bg-card shadow-sm pb-[calc(env(safe-area-inset-bottom)+0.25rem)]" style={{ insetBlockEnd: 'calc(var(--admob-bottom-inset, 0px) + env(safe-area-inset-bottom))' }}>
          <div className="mx-auto max-w-md px-2">
            <div className="flex justify-around h-16">
              {[{key:'release', label:'Saída', icon:'home'},{key:'items', label:'Itens', icon:'inventory'}, {key:'tools', label:'Ferramentas', icon:'build'}, {key:'history', label:'Histórico', icon:'history'}].map(tab => {
                const isActive = activeView === tab.key;
                return (
                  <button key={tab.key} className={"flex flex-col items-center justify-center w-1/4 p-2 rounded-lg text-xs " + (isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary')} onClick={() => setActiveView(tab.key as any)}>
                    <span className="material-icons">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
        {/* Hidden input for backup restore */}
        <input
          ref={fileInputRef}
          type="file"
          // Broaden accepted types to handle file pickers that don't set application/json
          accept=".json,.backup.json,application/json,text/json,text/plain,application/octet-stream,application/*+json"
          className="hidden"
          onChange={handleFileSelected}
        />
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
