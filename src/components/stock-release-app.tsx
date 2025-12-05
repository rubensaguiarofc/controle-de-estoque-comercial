
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';
import { App, type BackButtonListenerEvent } from '@capacitor/app';
import { Dialog } from '@capacitor/dialog';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DocumentPicker } from '@/lib/native/document-picker';

import type { StockItem, WithdrawalRecord, Tool, ToolRecord, EntryRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
// Removed lucide-react icon imports to avoid extra bundle weight in dev; using Material Icons font instead

import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "./ui/skeleton";
import { AddToolDialog } from "./add-tool-dialog";
import { HistoryPanel } from './history-panel';
import { BackupListDialog } from './backup-list-dialog';
import { SettingsDialog } from './settings-dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Lazy-load AdMob banner only on client to keep web/dev bundle lighter
const AdmobBanner = dynamic(() => import('./admob-banner').then(m => m.AdmobBanner), { ssr: false });
import { useFirestore } from "@/firebase/provider";
import { StockRepo } from "@/lib/data/firestore-repo";
import { BackupManager } from "@/lib/backup/backup-manager";

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
  // Backup UI state
  const [isBackupListOpen, setBackupListOpen] = useState(false);
  // Settings UI state
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  // Restore options UI state (deprecated - mantido para compatibilidade)
  const [isRestoreMenuOpen, setIsRestoreMenuOpen] = useState(false);
  const [restoreMerge, setRestoreMerge] = useState(true); // sempre merge agora
  const [syncItemsToCloud, setSyncItemsToCloud] = useState(false);
  
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
  const storagePermissionState = useRef<'unknown' | 'granted' | 'denied'>('unknown');

  const ensureLegacyStoragePermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const platform = typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : undefined;
      if (platform && platform !== 'android') return true;

      if (storagePermissionState.current === 'granted') return true;
      const win = typeof window !== 'undefined' ? (window as any) : undefined;
      const capCore = await import('@capacitor/core').catch(() => null);
      const plugins = (capCore as any)?.Plugins || win?.Capacitor?.Plugins || (win as any)?.Plugins;
      const Permissions = plugins?.Permissions;
      if (!Permissions) return true; // nothing to request

      // Try querying first to avoid duplicate prompts
      try {
        if (typeof Permissions.query === 'function') {
          const queryRes = await Permissions.query({ name: 'android.permission.WRITE_EXTERNAL_STORAGE' }).catch(() => null);
          const granted = queryRes && (queryRes.state === 'granted' || queryRes.granted === true);
          if (granted) {
            storagePermissionState.current = 'granted';
            return true;
          }
        }
      } catch {
        // ignore query errors
      }

      const requestNames = [
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'storage',
      ];

      for (const name of requestNames) {
        try {
          if (typeof Permissions.request !== 'function') break;
          const res = await Permissions.request({ name });
          const granted = res && (res.state === 'granted' || res.granted === true);
          if (granted) {
            storagePermissionState.current = 'granted';
            return true;
          }
        } catch (_err) {
          // try next alias
        }
      }

      storagePermissionState.current = 'denied';
      return false;
    } catch (err) {
      console.warn('Storage permission request failed', err);
      return true;
    }
  }, []);

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
    
    let listener: any = null;
    
    const setupListener = async () => {
      try {
        listener = await App.addListener('backButton', async ({ canGoBack }: BackButtonListenerEvent) => {
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
          } catch (err) {
            // Fallback: no dialog available - just minimize instead of exit
            console.warn('Dialog failed, not exiting:', err);
          }
        });
      } catch (err) {
        console.error('Failed to setup back button listener:', err);
      }
    };
    
    setupListener();
    
    return () => {
      if (listener) {
        try {
          listener.remove();
        } catch (err) {
          console.error('Failed to remove back button listener:', err);
        }
      }
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
      // keep only the most recent 200 entries to avoid huge startup payloads
      setHistory(storedWithdrawals.slice(0, 200));
    }
    const storedEntries = safeGetArray<EntryRecord>('local:entryHistory');
    if (storedEntries.length) {
      setEntryHistory(storedEntries.slice(0, 200));
    }
  }, [repo]);

  useEffect(() => {
    if (repo) return;
    // persist only the most recent 200 records locally
    try { safeSetArray('local:history', history.slice(0, 200)); } catch {}
  }, [repo, history]);
  useEffect(() => {
    if (repo) return;
    try { safeSetArray('local:entryHistory', entryHistory.slice(0, 200)); } catch {}
  }, [repo, entryHistory]);

  // Source of truth for tools and toolHistory: subscribe when Firestore is available;
  // otherwise, restore from and persist to localStorage
  useEffect(() => {
    if (repo) {
      const unsubs: Array<() => void> = [];
      try {
        unsubs.push(repo.onTools(list => {
          const snapshot = Array.isArray(list) ? list : [];
          setTools(snapshot);
          safeSetArray('local:tools:lastSnapshot', snapshot);
        }));
      } catch {}
      try {
        unsubs.push(repo.onToolHistory(list => {
          const snapshot = Array.isArray(list) ? list : [];
          setToolHistory(snapshot);
          safeSetArray('local:toolHistory:lastSnapshot', snapshot);
        }));
      } catch {}
      return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
    }

    const storedTools = safeGetArray<Tool>('local:tools');
    if (storedTools.length) {
      setTools(storedTools);
    }
    const storedToolHistory = safeGetArray<ToolRecord>('local:toolHistory');
    if (storedToolHistory.length) {
      setToolHistory(storedToolHistory);
    }
  }, [repo]);

  useEffect(() => {
    if (repo) return;
    safeSetArray('local:tools', tools);
  }, [repo, tools]);
  useEffect(() => {
    if (repo) return;
    safeSetArray('local:toolHistory', toolHistory);
  }, [repo, toolHistory]);

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

  // Backup: exportar dados usando o novo BackupManager
  const handleExportBackup = useCallback(async (): Promise<void> => {
    try {
      toast({
        title: 'Criando backup...',
        description: 'Aguarde enquanto salvamos seus dados.',
      });

      const data = {
        stockItems,
        history,
        entryHistory,
        tools,
        toolHistory,
      };

      const path = await BackupManager.createLocalBackup(data);

      toast({
        title: 'Backup criado com sucesso!',
        description: Capacitor.isNativePlatform() 
          ? 'Salvo em Documents/Backups/'
          : `Download iniciado`,
      });

      // Após exportar dados, exibir vídeo de 30s (rewarded)
      try {
        const { showLongRewarded } = await import('@/lib/native/ad-manager');
        await showLongRewarded();
      } catch {}
    } catch (error) {
      console.error('Backup export error', error);
      toast({ 
        variant: 'destructive', 
        title: 'Falha no Backup', 
        description: 'Erro inesperado ao criar backup.' 
      });
    }
  }, [stockItems, history, entryHistory, tools, toolHistory, toast]);

  // Restore: função simplificada que recebe dados do BackupListDialog ou arquivo antigo
  const handleRestoreBackup = useCallback(async (data: any) => {
    try {
      // Normalizar estrutura (compatível com v1 e v2)
      const root = (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data && typeof data.data === 'object') ? data.data : data;
      const toArray = (v: any) => (Array.isArray(v) ? v : []);

      const normalized = {
        stockItems: toArray(root.stockItems ?? root.items ?? root.inventory ?? []),
        history: toArray(root.history ?? root.withdrawals ?? root.withdrawalsHistory ?? []),
        entryHistory: toArray(root.entryHistory ?? root.entries ?? root.entriesHistory ?? []),
        tools: toArray(root.tools ?? root.ferramentas ?? []),
        toolHistory: toArray(root.toolHistory ?? root.toolsHistory ?? root.toolRecords ?? []),
      };

      if (Array.isArray(data)) {
        // Legacy: array direto de itens
        normalized.stockItems = data;
      }

      // Validar conteúdo
      const totalCount = normalized.stockItems.length + normalized.history.length + 
        normalized.entryHistory.length + normalized.tools.length + normalized.toolHistory.length;
      
      if (totalCount === 0) {
        throw new Error('Backup vazio ou formato inválido');
      }

      // Sempre fazer merge (não sobrescrever dados mais recentes)
      const mergeById = <T extends { id: string }>(current: T[], incoming: T[]) => {
        const map = new Map<string, T>();
        current.forEach(i => map.set(i.id, i));
        incoming.forEach(i => map.set(i.id, i));
        return Array.from(map.values());
      };

      setStockItems(prev => mergeById(prev as any, normalized.stockItems as any) as any);
      setHistory(prev => {
        const map = new Map<string, any>();
        [...prev, ...normalized.history].forEach(r => map.set(r.id, r));
        return Array.from(map.values()).sort((a, b) => 
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        );
      });
      setEntryHistory(prev => {
        const map = new Map<string, any>();
        [...prev, ...normalized.entryHistory].forEach(r => map.set(r.id, r));
        return Array.from(map.values()).sort((a, b) => 
          new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()
        );
      });
      setTools(prev => mergeById(prev as any, normalized.tools as any) as any);
      setToolHistory(prev => {
        const map = new Map<string, any>();
        [...prev, ...normalized.toolHistory].forEach(r => map.set(r.id, r));
        return Array.from(map.values()).sort((a, b) => 
          new Date(b.checkedOutAt).getTime() - new Date(a.checkedOutAt).getTime()
        );
      });

      // Sincronizar com nuvem se solicitado
      if (syncItemsToCloud && repo) {
        try {
          const mergedItems = mergeById(stockItems as any, normalized.stockItems as any) as any;
          for (const item of mergedItems) {
            await repo.upsertItem(item).catch(() => {});
          }
        } catch (err) {
          console.error('Cloud sync error:', err);
        }
      }

      // Persist marker
      safeSetItem('lastRestoreAt', new Date().toISOString());

      toast({ 
        title: 'Backup restaurado!', 
        description: `${totalCount} registros importados (mesclados com dados existentes).`
      });
    } catch (e: any) {
      console.error('Restore error', e);
      const msg = e?.message || 'Arquivo inválido ou corrompido';
      toast({ 
        variant: 'destructive', 
        title: 'Falha na Restauração', 
        description: msg 
      });
      throw e;
    }
  }, [toast, syncItemsToCloud, repo, stockItems]);

  // Função auxiliar para importação via Document Picker (deprecated, mas mantida)
  const performRestoreFromText = useCallback((textOrBytes: string | ArrayBuffer) => {
    try {
      let jsonText: string;
      if (typeof textOrBytes === 'string') {
        jsonText = textOrBytes;
      } else {
        try {
          jsonText = new TextDecoder('utf-8').decode(new Uint8Array(textOrBytes));
        } catch {
          jsonText = String.fromCharCode.apply(null, Array.from(new Uint8Array(textOrBytes)) as any);
        }
      }

      const parsed = JSON.parse(jsonText);
      handleRestoreBackup(parsed);
    } catch (e: any) {
      console.error('Restore parse error', e);
      const msg = e?.message || 'Arquivo inválido ou corrompido';
      toast({ 
        variant: 'destructive', 
        title: 'Falha na Restauração', 
        description: `${msg}. Certifique-se de selecionar um backup JSON exportado pelo app.` 
      });
    }
  }, [handleRestoreBackup, toast]);

  const handleTriggerImport = useCallback(async () => {
    setIsRestoreMenuOpen(false);
    
    if (Capacitor.isNativePlatform()) {
      // Usar Document Picker no mobile
      try {
        const result = await DocumentPicker.pickFile({
          mimeTypes: ['application/json', 'text/plain', '*/*'],
          openDownloads: true // Abre direto na pasta Downloads
        });
        
        if (!result.base64) {
          toast({ title: 'Cancelado', description: 'Nenhum arquivo selecionado.' });
          return;
        }
        
        console.log('[RESTORE] Arquivo selecionado:', result.name);
        
        // Decodificar o base64 para texto
        const jsonText = atob(result.base64);
        performRestoreFromText(jsonText);
        
      } catch (error: any) {
        console.error('[RESTORE] Erro:', error);
        if (error.message && (error.message.includes('canceled') || error.message.includes('cancelled'))) {
          // Usuário cancelou - não mostrar erro
          return;
        }
        toast({ 
          variant: 'destructive', 
          title: 'Falha ao restaurar', 
          description: 'Não foi possível ler o arquivo selecionado.' 
        });
      }
    } else {
      // Web: usar input file
      if (fileInputRef.current) fileInputRef.current.click();
    }
  }, [toast, performRestoreFromText]);

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

  const handleBulkAddItems = useCallback(async (items: Array<Omit<StockItem, 'id'>>) => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
    const existingByName = new Set(stockItems.map(i => normalize(i.name)));
    let maxNum = stockItems.reduce((acc, i) => Math.max(acc, parseInt(i.id.split('-')[1]) || 0), 0);
    const toSave: StockItem[] = [];
    let skipped = 0;
    for (const it of items) {
      if (!it.name || !it.specifications) continue;
      if (existingByName.has(normalize(it.name))) { skipped++; continue; }
      maxNum += 1;
      const id = `ITM-${String(maxNum).padStart(3, '0')}`;
  toSave.push({ id, quantity: it.quantity ?? 0, unit: it.unit ?? 'un', name: it.name, specifications: it.specifications, barcode: it.barcode ?? null });
      existingByName.add(normalize(it.name));
    }
    if (toSave.length === 0) return { added: 0, skipped };
    if (repo) {
      await Promise.all(toSave.map(i => repo.upsertItem(i).catch(console.error)));
    } else {
      setStockItems(prev => [...toSave, ...prev]);
    }
    return { added: toSave.length, skipped };
  }, [repo, stockItems]);

  const handleItemDialogSubmit = useCallback((itemData: Omit<StockItem, 'id' | 'quantity'> & { quantity?: number }) => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
    let itemToSave: StockItem;
    if (editingItem) {
      itemToSave = {
        ...editingItem,
        name: itemData.name,
        specifications: itemData.specifications,
        barcode: typeof itemData.barcode === 'undefined' ? editingItem.barcode : itemData.barcode ?? null,
        // allow updating quantity when editing
        quantity: typeof itemData.quantity === 'number' ? itemData.quantity : editingItem.quantity,
        unit: typeof (itemData as any).unit === 'string' ? (itemData as any).unit : (editingItem.unit ?? 'un'),
      };
      // Prevent renaming to an existing item name (exact normalized match)
      const existsOther = stockItems.some(i => i.id !== editingItem.id && normalize(i.name) === normalize(itemToSave.name));
      if (existsOther) {
        toast({ variant: 'destructive', title: 'Nome já cadastrado', description: 'Já existe um item com este nome. Ajuste o nome ou edite o item existente.' });
        return;
      }
      if (repo) {
        repo.upsertItem(itemToSave).catch(err => console.error('Failed to update item', err));
      } else {
        setStockItems(prev => prev.map(item => item.id === editingItem.id ? itemToSave : item));
      }
    } else {
      // Block exact duplicate by normalized name
      const exists = stockItems.some(i => normalize(i.name) === normalize(itemData.name));
      if (exists) {
        toast({ variant: 'destructive', title: 'Item duplicado', description: 'Já existe um item com o mesmo nome. Evite cadastros duplicados.' });
        return;
      }
      const newIdNumber = (stockItems.length > 0 ? Math.max(...stockItems.map(item => parseInt(item.id.split('-')[1]) || 0)) + 1 : 1).toString().padStart(3, '0');
      const newId = `ITM-${newIdNumber}`;
  itemToSave = { ...itemData, id: newId, quantity: itemData.quantity || 0, unit: (itemData as any).unit ?? 'un', barcode: itemData.barcode ?? null } as StockItem;
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
      // Sync to Firestore if enabled
      if (repo) {
        repo.upsertTool(toolToSave).catch(console.error);
      }
    } else {
      const newId = `TOOL-${Date.now()}`;
      toolToSave = { ...toolData, id: newId };
      setTools(prev => [toolToSave, ...prev]);
      // Sync to Firestore if enabled
      if (repo) {
        repo.upsertTool(toolToSave).catch(console.error);
      }
    }
    toast({ title: editingTool ? "Ferramenta Atualizada" : "Ferramenta Adicionada", description: `${toolToSave.name} foi salva.` });
    setAddToolDialogOpen(false);
    setEditingTool(null);
  }, [editingTool, repo, toast]);

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
          const matchUnit = (v?: string) => v ?? 'un';
          const itemIndex = updatedStock.findIndex(i => i.id === record.item.id && matchUnit(i.unit) === matchUnit(record.unit));
          if (itemIndex > -1) {
            updatedStock[itemIndex].quantity -= record.quantity;
          }
        });
        return updatedStock;
      });
      // persist pending withdrawals for later sync
      try {
        import('@/lib/offline-queue').then(m => {
          newRecords.forEach(rec => m.pushPendingOp({ id: rec.id, type: 'withdrawal', payload: rec }));
        }).catch(() => {});
      } catch {}
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
          const matchUnit = (v?: string) => v ?? 'un';
          const itemIndex = updatedStock.findIndex(i => i.id === record.item.id && matchUnit(i.unit) === matchUnit(record.unit));
          if (itemIndex > -1) {
            updatedStock[itemIndex].quantity += record.quantity;
          }
        });
        return updatedStock;
      });
      try {
        import('@/lib/offline-queue').then(m => {
          newRecords.forEach(rec => m.pushPendingOp({ id: rec.id, type: 'entry', payload: rec }));
        }).catch(() => {});
      } catch {}
    }
  }, [repo]);

  // When repo becomes available, attempt to flush any pending offline ops
  useEffect(() => {
    if (!repo) return;
    (async () => {
      try {
        const { flushPendingOps } = await import('@/lib/offline-queue');
        await flushPendingOps(repo);
      } catch (err) {
        console.debug('Failed to flush pending ops', err);
      }
    })();
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
                  // Atualiza estado local imediatamente
                  setStockItems(prev => prev.filter(i => i.id !== id));
                  // Sincroniza com Firestore se habilitado
                  if (repo) {
                    repo.deleteItem(id).catch(console.error);
                  }
                }}
                onUpdateItem={(item) => {
                  if (repo) repo.upsertItem(item).catch(console.error);
                  else setStockItems(prev => prev.map(i => i.id === item.id ? item : i));
                }}
                onBulkAddItems={handleBulkAddItems}
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
      case "tools": return <ToolManagement tools={tools} setTools={setTools} toolHistory={toolHistory} setToolHistory={setToolHistory} onSetEditingTool={setEditingTool} onSetIsAddToolDialogOpen={setAddToolDialogOpen} repo={repo} />;
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
              <button 
                className="relative" 
                aria-label="Restaurar Backup" 
                onClick={() => setBackupListOpen(true)}
                title="Restaurar Backup"
              >
                <span className="material-icons text-foreground">upload_file</span>
              </button>
              <button 
                className="relative" 
                aria-label="Configurações" 
                onClick={() => setSettingsOpen(true)}
                title="Configurações"
              >
                <span className="material-icons text-foreground">settings</span>
              </button>
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
  <nav className="bottom-nav fixed inset-x-0 z-40 border-t border-border bg-card shadow-sm" style={{ 
    bottom: 'env(safe-area-inset-bottom)',
    paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
    marginBottom: 'var(--admob-bottom-inset, 0px)'
  }}>
          <div className="mx-auto max-w-md px-2">
            <div className="flex justify-around h-14">
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
        {/* Hidden input for backup restore (legacy, mantido para compatibilidade web) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.backup.json,application/json,text/json,text/plain,application/octet-stream,application/*+json"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Backup Management Dialog */}
        <BackupListDialog
          open={isBackupListOpen}
          onOpenChange={setBackupListOpen}
          onRestore={handleRestoreBackup}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setSettingsOpen}
        />

        {/* Mobile debug panel (visible when URL contains ?mobileDebug=1 or when localStorage.mobileDebug === '1') */}
        {typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('mobileDebug') === '1' || window.localStorage.getItem('mobileDebug') === '1') && (
          <MobileDebugPanel />
        )}
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

function MobileDebugPanel() {
  // lightweight debug controls for mobile device testing
  const logState = () => {
    try {
      const wrapper = document.querySelector('[data-fab]');
      const btn = document.querySelector('button[aria-label="Ações de Itens"]') || wrapper?.querySelector('button');
      const bottomNav = document.querySelector('.bottom-nav');
      const admobVisible = document.documentElement.classList.contains('admob-banner-visible');
      console.log('MOBILE DEBUG STATE', {
        fabWrapper: wrapper,
        fabButton: btn,
        fabRect: btn ? btn.getBoundingClientRect() : null,
        fabLocalStorage: window.localStorage.getItem('fabPos_items'),
        bottomNav,
        bottomNavStyle: bottomNav ? getComputedStyle(bottomNav) : null,
        admobVisible,
        admobInset: getComputedStyle(document.documentElement).getPropertyValue('--admob-bottom-inset'),
        admobLastClosed: window.localStorage.getItem('admob_last_closed_ts')
      });
      alert('Estado de debug impresso no console do dispositivo.');
    } catch (e) { console.error(e); alert(String(e)); }
  };

  const resetFabPos = () => {
    try { window.localStorage.removeItem('fabPos_items'); alert('fabPos_items removido. Recarregue a página.'); } catch(e){alert(String(e))}
  };

  const resetAdmob = () => {
    try {
      window.localStorage.removeItem('admob_last_closed_ts');
      document.documentElement.classList.remove('admob-banner-visible');
      document.documentElement.style.setProperty('--admob-bottom-inset', '0px');
      alert('Estado AdMob resetado. Recarregue a página.');
    } catch (e) { alert(String(e)); }
  };

  const clearAll = () => {
    try {
      window.localStorage.removeItem('fabPos_items');
      window.localStorage.removeItem('admob_last_closed_ts');
      document.documentElement.classList.remove('admob-banner-visible');
      document.documentElement.style.setProperty('--admob-bottom-inset', '0px');
      alert('Reset completo realizado. Recarregue a página.');
    } catch (e) { alert(String(e)); }
  };

  return (
    <div className="fixed left-3 top-3 z-60 bg-card/90 border border-border p-2 rounded-md shadow-sm text-xs">
      <div className="font-medium mb-1">Mobile Debug</div>
      <div className="flex flex-col gap-2">
        <button className="btn" onClick={logState}>Log estado (console)</button>
        <button className="btn" onClick={resetFabPos}>Reset FAB pos</button>
        <button className="btn" onClick={resetAdmob}>Reset AdMob</button>
        <button className="btn" onClick={clearAll}>Reset tudo</button>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">Ative com ?mobileDebug=1 ou localStorage.mobileDebug='1'</div>
    </div>
  );
}
