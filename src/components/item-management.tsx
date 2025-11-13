
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { StockItem } from '@/lib/types';
import { XLSXUtils } from '@/lib/xlsx-utils';
import { Capacitor } from '@capacitor/core';
import { MediaStoreSaver } from '@/lib/native/media-store-saver';
import { DocumentPicker } from '@/lib/native/document-picker';
import { AppSettings } from '@/lib/native/app-settings';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Edit, Trash, Search, Plus, Barcode, Printer, ShoppingCart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { BarcodeDisplayDialog } from './barcode-display-dialog';
import { ScrollArea } from './ui/scroll-area';
import { ItemDetailsDialog } from './item-details-dialog';
import { Badge } from './ui/badge';
import { MAX_QUANTITY } from '@/lib/constants';
import { BulkGridDialog, type GridRow } from './bulk-grid-dialog';
import { BatchScanDialog } from './batch-scan-dialog';
// Heavy libs loaded on demand during printing to improve initial load time

interface ItemManagementProps {
  stockItems: StockItem[];
  onSetStockItems: (items: StockItem[]) => void | Promise<void>;
  onSetIsAddItemDialogOpen: (isOpen: boolean) => void;
  onSetEditingItem: (item: StockItem | null) => void;
  lowStockOnly?: boolean;
  onClearLowStockFilter?: () => void;
  globalSearch?: string;
  onDeleteItem?: (id: string) => void;
  onUpdateItem?: (item: StockItem) => void;
  // optional: allow parent to navigate to release view when quick-adding
  onGoToRelease?: () => void;
  // optional: allow parent to navigate to entry tab from header button
  onGoToEntry?: () => void;
  // optional: bulk add hook implemented by parent (repo ou local)
  onBulkAddItems?: (items: Array<Omit<StockItem, 'id'>>) => Promise<{ added: number; skipped: number } | void>;
}

export default function ItemManagement({
  stockItems,
  onSetStockItems,
  onSetIsAddItemDialogOpen,
  onSetEditingItem,
  lowStockOnly = false,
  onClearLowStockFilter,
  globalSearch,
  onDeleteItem,
  onUpdateItem,
  onGoToRelease,
  onGoToEntry,
  onBulkAddItems,
}: ItemManagementProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeItem, setBarcodeItem] = useState<StockItem | null>(null);
  const [viewingItem, setViewingItem] = useState<StockItem | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [gridRows, setGridRows] = useState<GridRow[] | undefined>(undefined);
  const [batchOpen, setBatchOpen] = useState(false);
  // Feature flag: desabilitar temporariamente importação/exportação por CSV/XLSX
  const CSV_IMPORT_EXPORT_ENABLED = false;

  const handleEdit = (item: StockItem) => {
    onSetEditingItem(item);
    onSetIsAddItemDialogOpen(true);
  };

  // Minimal debug dump helper (writes console + attempts to save JSON on native devices)
  const dumpParsedDebug = async (rows: any[], label = 'parsed-rows') => {
    try {
      console.debug('dumpParsedDebug rows sample:', Array.isArray(rows) ? rows.slice(0,3) : rows);
      if (Capacitor.isNativePlatform()) {
        try {
          const cap = await import('@capacitor/filesystem');
          const { Filesystem, Directory } = cap;
          const json = JSON.stringify(rows, null, 2);
          const filename = `${label}-${Date.now()}.json`;
          await Filesystem.writeFile({ path: filename, data: json, directory: Directory.Documents, recursive: true } as any);
        } catch (e) {
          console.debug('dumpParsedDebug native write failed', e);
        }
      }
    } catch (e) {
      console.debug('dumpParsedDebug failed', e);
    }
  };

  // Centralize processing of parsed rows -> candidates -> bulk add
  const processImportedRows = async (rows: any[]) => {
    try {
      if (!rows || rows.length === 0) {
        toast({ variant: 'destructive', title: 'Planilha vazia', description: 'Nenhuma linha encontrada.' });
        return;
      }
      const normalizeKey = (k: string) => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const toItem = (r: any) => {
        const m: Record<string, any> = {};
        Object.keys(r).forEach(k => { m[normalizeKey(k)] = r[k]; });
        const name = String(m['name'] ?? m['nome'] ?? '').toUpperCase().trim();
        const specifications = String(m['specifications'] ?? m['especificacoes'] ?? m['especificações'] ?? '').toUpperCase().trim();
        const quantityRaw = m['quantity'] ?? m['quantidade'] ?? 0;
        const quantity = Math.max(0, Math.min(Number(quantityRaw) || 0, MAX_QUANTITY));
        const barcode = String(m['barcode'] ?? m['codigo'] ?? m['código'] ?? '').trim() || undefined;
        return { name, specifications, quantity, barcode } as Omit<StockItem,'id'>;
      };
      const candidates = rows.map(toItem).filter(i => i.name && i.specifications);
      if (candidates.length === 0) {
        console.debug('Parsed rows keys sample:', Array.isArray(rows) && rows.length ? Object.keys(rows[0]) : rows);
        toast({ variant: 'destructive', title: 'Colunas ausentes', description: 'Certifique-se de ter Nome, Especificações e (opcional) Quantidade/Código.' });
        return;
      }

      if (onBulkAddItems) {
        const res = await onBulkAddItems(candidates) as any;
        const added = res?.added ?? 0;
        const skipped = res?.skipped ?? 0;
        toast({ title: 'Importação concluída', description: `${added} itens adicionados, ${skipped} ignorados.` });
      } else {
        const res = await performLocalBulkAdd(candidates);
        toast({ title: 'Importação concluída', description: `${res.added} itens adicionados (local), ${res.skipped} ignorados.` });
      }
    } catch (e) {
      console.error('processImportedRows error', e);
      toast({ variant: 'destructive', title: 'Falha na importação', description: 'Verifique o arquivo e tente novamente.' });
    }
  };

  // Show a native dialog offering to open app settings when permission denied
  const promptOpenAppSettings = async (message: string) => {
    try {
      const { Dialog } = await import('@capacitor/dialog');
      const res = await Dialog.confirm({
        title: 'Permissão necessária',
        message: message + '\n\nDeseja abrir as configurações do aplicativo para conceder a permissão?',
        okButtonTitle: 'Abrir configurações',
        cancelButtonTitle: 'Cancelar',
      } as any);
      if ((res as any).value) {
        try {
          // Call native plugin to open app settings
          try {
            await AppSettings.openAppSettings();
          } catch (e) {
            console.debug('AppSettings plugin call failed', e);
          }
        } catch (e) {
          console.debug('Failed to open app settings', e);
        }
      }
    } catch (e) {
      console.debug('promptOpenAppSettings failed', e);
      toast({ variant: 'destructive', title: 'Permissão necessária', description: message });
    }
  };

  // Local helper to add items using the same logic as the main registration flow
  const performLocalBulkAdd = async (items: Array<Omit<StockItem, 'id'>>) => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
    const existingByName = new Set(stockItems.map(i => normalize(i.name)));
    let maxNum = stockItems.reduce((acc, i) => Math.max(acc, parseInt(i.id.split('-')[1]) || 0), 0);
    const toSave: StockItem[] = [];
    for (const it of items) {
      if (!it.name || !it.specifications) continue;
      const n = normalize(it.name);
      if (existingByName.has(n)) continue;
      maxNum += 1;
      const id = `ITM-${String(maxNum).padStart(3, '0')}`;
  toSave.push({ id, quantity: it.quantity ?? 0, name: it.name, specifications: it.specifications, barcode: it.barcode ?? null });
      existingByName.add(n);
    }

    if (toSave.length === 0) return { added: 0, skipped: items.length };

    await onSetStockItems([...toSave, ...stockItems]);
    return { added: toSave.length, skipped: items.length - toSave.length };
  };

  const handleDelete = (itemId: string) => {
    if (onDeleteItem) { onDeleteItem(itemId); return; }
    const updatedItems = stockItems.filter(item => item.id !== itemId);
    onSetStockItems(updatedItems);
    toast({
        title: "Item Excluído",
        description: "O item foi removido.",
    })
  };

  const handleGenerateBarcode = (itemToUpdate: StockItem) => {
    const newBarcode = `${itemToUpdate.id}-${Date.now()}`;
    const updatedItems = stockItems.map(item =>
      item.id === itemToUpdate.id ? { ...item, barcode: newBarcode } : item
    );
    if (onUpdateItem) {
      const updated = updatedItems.find(i => i.id === itemToUpdate.id)!;
      onUpdateItem(updated);
    } else {
      onSetStockItems(updatedItems);
    }
    toast({
      title: "Código de Barras Gerado",
      description: `Novo código para ${itemToUpdate.name}: ${newBarcode}`,
    });
  };

  const handlePrintAllBarcodes = async () => {
    const itemsWithBarcode = stockItems.filter(item => item.barcode);
    if (itemsWithBarcode.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum código de barras",
        description: "Não há itens com código de barras para imprimir."
      });
      return;
    }
    // Dynamic imports to keep the main bundle lean
    const [{ default: jsPDF }, { default: JsBarcode }, { savePdf }] = await Promise.all([
      import('jspdf'),
      import('jsbarcode'),
      import('@/lib/save-pdf'),
    ]);

    const doc = new jsPDF('p', 'mm', 'a4');
    const tempCanvas = document.createElement('canvas');

    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const MARGIN_X = 10;
    const MARGIN_Y = 15;
    const LABEL_WIDTH = (PAGE_WIDTH - (MARGIN_X * 2)) / 3;
    const LABEL_HEIGHT = 25;
    const GUTTER_X = 0;
    const GUTTER_Y = 5;

    let x = MARGIN_X;
    let y = MARGIN_Y;

  itemsWithBarcode.forEach((item, index) => {
      if (y + LABEL_HEIGHT > PAGE_HEIGHT - MARGIN_Y) {
        doc.addPage();
        x = MARGIN_X;
        y = MARGIN_Y;
      }
      
      try {
        const barcodeValue = item.barcode!;
        const textToDisplay = barcodeValue.split('-').pop() || barcodeValue;

        const barcodeOptions: any = {
          format: "CODE128",
          ['width']: 1.5,
          ['height']: 30,
          displayValue: false, // O valor será adicionado manualmente
        };
        JsBarcode(tempCanvas, barcodeValue, barcodeOptions);
        const barcodeDataUrl = tempCanvas.toDataURL('image/png');

        const contentX = x + LABEL_WIDTH / 2;

        doc.setFontSize(8);
        const itemName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
        doc.text(itemName.toUpperCase(), contentX, y + 4, { align: 'center' });
        
        doc.setFontSize(6);
        const itemSpecs = item.specifications.length > 45 ? item.specifications.substring(0, 42) + '...' : item.specifications;
        doc.text(itemSpecs.toUpperCase(), contentX, y + 7, { align: 'center' });

        const barcodeWidth = 40; // Largura fixa para o código de barras na etiqueta
        const barcodeHeight = 10;
        const barcodeX = x + (LABEL_WIDTH - barcodeWidth) / 2;
        doc.addImage(barcodeDataUrl, 'PNG', barcodeX, y + 9, barcodeWidth, barcodeHeight);
        
        doc.setFontSize(8);
        doc.text(textToDisplay, contentX, y + 22, { align: 'center' });

        x += LABEL_WIDTH + GUTTER_X;
        if (x + LABEL_WIDTH > PAGE_WIDTH - MARGIN_X) {
          x = MARGIN_X;
          y += LABEL_HEIGHT + GUTTER_Y;
        }

      } catch (e) {
        console.error(`Erro ao gerar etiqueta para ${item.name}:`, e);
      }
    });

    const filename = `etiquetas_todos_itens_${new Date().toISOString().split('T')[0]}.pdf`;
    const res = await savePdf(doc, filename);
    if (res && res.success) {
      toast({ title: "PDF Gerado", description: "O arquivo com as etiquetas foi salvo." });
      // Contabiliza N impressões (quantidade de etiquetas geradas)
      try {
        const { incrementPrintCounter, showShortInterstitial } = await import('@/lib/native/ad-manager');
        if (incrementPrintCounter(itemsWithBarcode.length)) {
          await showShortInterstitial();
        }
      } catch {}
    } else {
      toast({ variant: 'destructive', title: 'Falha ao salvar PDF' });
    }
  };

  // Unified handler to save bulk rows from grid or batch scanner
  const handleSaveBulkRows = async (rows: Array<Omit<StockItem, 'id'>>) => {
    if (!rows || rows.length === 0) return;
    if (onBulkAddItems) {
      const res = await onBulkAddItems(rows) as any;
      const added = res?.added ?? 0;
      const skipped = res?.skipped ?? 0;
      toast({ title: 'Itens adicionados', description: `${added} adicionados, ${skipped} ignorados.` });
    } else {
      const res = await performLocalBulkAdd(rows);
      toast({ title: 'Itens adicionados', description: `${res.added} adicionados (local), ${res.skipped} ignorados.` });
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      setImporting(true);
      try { toast({ title: 'Lendo arquivo…', description: file.name }); } catch {}
      // Use XLSXUtils which includes robust CSV/base64 decoding fallbacks
      const rows: any[] = await XLSXUtils.importFile(file);
      console.debug('handleImportFile: parsed rows count=', Array.isArray(rows) ? rows.length : 0, 'sample=', Array.isArray(rows) ? rows.slice(0,3) : rows);
      try { await dumpParsedDebug(rows, 'import-file'); } catch (e) { console.debug('dump parsed rows failed', e); }
      try { toast({ title: 'Arquivo analisado', description: `${Array.isArray(rows) ? rows.length : 0} linhas encontradas` }); } catch {}
      await processImportedRows(rows);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Falha na importação', description: 'Verifique o arquivo e tente novamente.' });
    } finally {
      setImporting(false);
    }
  };

  const [fabOpen, setFabOpen] = useState(false);
  const filteredItems = useMemo(() => {
    let list = stockItems;
    if (lowStockOnly) {
      list = list.filter(i => i.quantity <= 5);
    }
    const effectiveQuery = (globalSearch || searchQuery).trim();
    if (!effectiveQuery) return list;
    const q = effectiveQuery.toLowerCase();
    return list.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.specifications.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q))
    );
  }, [stockItems, searchQuery, lowStockOnly, globalSearch]);

  // Draggable/movable FAB component (defined inline so it can access component scope)
  function DraggableFab() {
    const storageKey = 'fabPos_items';
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, moved: false });
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
    const posRef = useRef(pos);

    useEffect(() => { posRef.current = pos; }, [pos]);

    useEffect(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p.left === 'number' && typeof p.top === 'number') { setPos(p); return; }
        }
      } catch {}
      // default: bottom-right above nav (approx 5rem + safe gap)
      const btnSize = 56; // h-14 w-14
      const right = 16;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const safetyGap = rem * 0.5; // --system-nav-gap in rem units
      const bottomGap = rem * 5 + safetyGap; // Additional gap above system nav
      const left = Math.max(8, window.innerWidth - btnSize - right);
      const top = Math.max(8, window.innerHeight - bottomGap - btnSize);
      setPos({ left, top });
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
      if (fabOpen || (e.button && e.button !== 0)) return; // Don't start drag if menu is open
      e.preventDefault(); // Prevent text selection during drag
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current.dragging = true;
      dragRef.current.moved = false;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.startLeft = posRef.current?.left ?? 0;
      dragRef.current.startTop = posRef.current?.top ?? 0;

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current.dragging) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true; // Increased threshold for drag detection
        const btnW = btnRef.current?.offsetWidth ?? 56;
        let newLeft = dragRef.current.startLeft + dx;
        let newTop = dragRef.current.startTop + dy;
        newLeft = Math.max(8, Math.min(window.innerWidth - btnW - 8, newLeft));
        newTop = Math.max(8, Math.min(window.innerHeight - btnW - 8, newTop));
        setPos({ left: newLeft, top: newTop });
      };

      const onUp = () => {
        if (!dragRef.current.dragging) return;
        dragRef.current.dragging = false;
        try { localStorage.setItem(storageKey, JSON.stringify(posRef.current ?? pos)); } catch {}
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }, [pos]);

    if (!pos) return null;

    return (
      <div style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 60 }}>
        <Popover open={fabOpen} onOpenChange={setFabOpen}>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    ref={btnRef}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg"
                    aria-label="Ações de Itens"
                    onPointerDown={onPointerDown}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="sr-only">Abrir ações</span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Ações de Itens</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent align="end" side="top" className="w-64 p-2">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onSetEditingItem(null);
                  onSetIsAddItemDialogOpen(true);
                  setFabOpen(false);
                }}
              >
                Cadastrar Item
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setGridRows(undefined);
                  setGridOpen(true);
                  setFabOpen(false);
                }}
              >
                Cadastro em Grade (Rápido)
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setBatchOpen(true);
                  setFabOpen(false);
                }}
              >
                Escanear em Lote
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (onGoToEntry) onGoToEntry();
                  setFabOpen(false);
                }}
              >
                Entrada de Estoque
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  handlePrintAllBarcodes();
                  setFabOpen(false);
                }}
              >
                Imprimir Etiquetas
              </Button>
              {CSV_IMPORT_EXPORT_ENABLED && (
                <>
                  <Button
                    variant="ghost"
                    disabled={importing}
                    className="justify-start"
                    onClick={async () => {
                      try {
                        if (Capacitor.isNativePlatform()) {
                          // Primeiro tenta ler diretamente possíveis arquivos em Downloads
                          let triedDirectDownloads = false;
                          try {
                            const capFS = await import('@capacitor/filesystem');
                            const { Filesystem } = capFS;
                            try {
                              const perm = await Filesystem.checkPermissions();
                              if (!perm || (perm as any).publicStorage !== 'granted') {
                                const req = await Filesystem.requestPermissions();
                                if (!req || (req as any).publicStorage !== 'granted') {
                                  toast({ variant: 'destructive', title: 'Permissão necessária', description: 'Autorize acesso ao armazenamento para importar arquivos.' });
                                  await promptOpenAppSettings('Conceda acesso ao armazenamento para continuar.');
                                }
                              }
                            } catch {}
                            // Listar arquivos CSV/XLSX em Download (nome comum "Download" em External storage)
                            triedDirectDownloads = true;
                            try {
                              const listing: any = await Filesystem.readdir({ path: 'Download', directory: (Filesystem as any).Directory?.External || (Filesystem as any).Directory?.Documents || 'EXTERNAL' } as any);
                              const names: string[] = Array.isArray(listing.files) ? listing.files.map((f: any) => typeof f === 'string' ? f : f.name) : [];
                              const candidates = names.filter(n => /\.(csv|xlsx)$/i.test(n));
                              if (candidates.length > 0) {
                                // Pega o mais recente por nome (simples) e importa
                                candidates.sort((a,b) => b.localeCompare(a));
                                const chosen = candidates[0];
                                try {
                                  const fileRes: any = await Filesystem.readFile({ path: `Download/${chosen}`, directory: (Filesystem as any).Directory?.External || (Filesystem as any).Directory?.Documents || 'EXTERNAL', encoding: 'base64' } as any);
                                  if (fileRes?.data) {
                                    setImporting(true);
                                    try {
                                      const rows = await XLSXUtils.importFromBase64(fileRes.data as string);
                                      await processImportedRows(rows);
                                      console.debug('Import direto de Downloads concluído', chosen, rows?.length);
                                    } finally { setImporting(false); }
                                    setFabOpen(false);
                                    return;
                                  }
                                } catch (readErr) {
                                  console.debug('Falha ao ler direto de Downloads', readErr);
                                }
                              }
                            } catch (listErr) {
                              console.debug('Falha ao listar Downloads', listErr);
                            }
                          } catch (directErr) {
                            console.debug('Erro fluxo direto Downloads', directErr);
                          }
                          // Se não importou direto, abrir picker iniciando em Downloads
                          try {
                            const picked = await DocumentPicker.pickFile({ mimeTypes: ['text/csv','application/csv','text/plain','text/comma-separated-values','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], openDownloads: true });
                            if (picked?.base64) {
                              setImporting(true);
                              try {
                                try { toast({ title: 'Arquivo selecionado', description: picked.name || picked.mimeType || 'Documento' }); } catch {}
                                const rows = await XLSXUtils.importFromBase64(picked.base64);
                                try { toast({ title: 'Arquivo analisado', description: `${Array.isArray(rows) ? rows.length : 0} linhas encontradas` }); } catch {}
                                await processImportedRows(rows);
                                console.debug('DocumentPicker (Downloads) import concluído', { name: picked.name, mime: picked.mimeType, sizeBase64: picked.base64.length });
                                if (!rows || rows.length === 0) {
                                  toast({ variant: 'destructive', title: 'Arquivo vazio', description: 'Verifique se o CSV/XLSX possui conteúdo.' });
                                }
                              } finally { setImporting(false); }
                              setFabOpen(false);
                              return;
                            }
                            toast({ variant: 'destructive', title: 'Falha na importação', description: 'Arquivo sem dados base64 retornado.' });
                          } catch (e) {
                            console.debug('DocumentPicker erro (Downloads)', e);
                            toast({ variant: 'destructive', title: 'Erro ao abrir arquivo', description: 'Abrindo fallback manual.' });
                            setImportDialogOpen(true);
                            setFabOpen(false);
                            return;
                          }
                        }
                        // Web: abrir input oculto
                        fileInputRef.current?.click();
                        setFabOpen(false);
                      } catch (e) {
                        console.debug('open import failed', e);
                        toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Não foi possível iniciar importação.' });
                      }
                    }}
                  >
                    {importing ? 'Importando...' : 'Importar Planilha'}
                  </Button>
                  {Capacitor.isNativePlatform() && (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        // Abrir diretamente o diálogo com input visível (fallback manual)
                        setImportDialogOpen(true);
                        setFabOpen(false);
                      }}
                    >
                      Importar (fallback manual)
                    </Button>
                  )}
                </>
              )}
              {CSV_IMPORT_EXPORT_ENABLED && (
                <>
                  {/* Template download: on native, fetch and write to Documents + share; on web, rely on anchor download */}
                  {Capacitor.isNativePlatform() ? (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={async () => { setFabOpen(false); await handleDownloadTemplate(); }}
                    >
                      Baixar Modelo (CSV)
                    </Button>
                  ) : (
                    <a
                      href="/templates/estoque-import-template.csv"
                      download
                      className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm h-9 px-3 hover:bg-accent"
                      onClick={() => setFabOpen(false)}
                    >
                      Baixar Modelo (CSV)
                    </a>
                  )}
                  {Capacitor.isNativePlatform() && (
                    <Button variant="ghost" className="justify-start" onClick={async () => { setFabOpen(false); await handleListAndImportDocuments(); }}>
                      Importar de Documentos
                    </Button>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Fetch template from web root and write/share on native devices
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/templates/estoque-import-template.csv');
      if (!res.ok) throw new Error('Failed to fetch template');
      const text = await res.text();
      if (Capacitor.isNativePlatform()) {
        try {
          const cap = await import('@capacitor/filesystem');
          const share = await import('@capacitor/share');
          const { Filesystem, Directory } = cap;
          const filename = 'estoque-import-template.csv';

          // Estratégia confiável: gravar em Cache e compartilhar (o usuário escolhe onde salvar)
          await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache } as any);
          const cacheUriRes: any = await Filesystem.getUri({ path: filename, directory: Directory.Cache } as any);
          const shareUrl = cacheUriRes?.uri;
          try {
            await share.Share.share({ title: 'Modelo CSV', text: 'Modelo de importação de estoque.', url: shareUrl });
            toast({ title: 'Modelo pronto', description: 'Escolha "Salvar em..." no menu de compartilhamento.' });
          } catch (shareErr) {
            console.debug('Share from cache failed', shareErr);
          }

          // Tentativa secundária: salvar em Downloads via plugin nativo (quando disponível)
          try {
            const base64 = btoa(unescape(encodeURIComponent(text)));
            if (MediaStoreSaver && (MediaStoreSaver as any).saveToDownloads) {
              await MediaStoreSaver.saveToDownloads({ base64, filename, mimeType: 'text/csv' });
              toast({ title: 'Também salvo em Downloads', description: filename });
            }
          } catch (e) {
            console.debug('Secondary Downloads save attempt failed', e);
          }
        } catch (e) {
          console.error('native template save failed', e);
          toast({ variant: 'destructive', title: 'Falha', description: `Não foi possível salvar o modelo no dispositivo: ${(e as any)?.message || e}` });
        }
      }
    } catch (e) {
      console.error('handleDownloadTemplate failed', e);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível baixar o modelo: ${(e as any)?.message || e}` });
    }
  };

  // List Documents and import the most relevant CSV/XLSX file (native fallback)
  const handleListAndImportDocuments = async () => {
    try {
      const cap = await import('@capacitor/filesystem');
      const { Filesystem, Directory } = cap;

      // Request/check permissions to access Documents/Public storage on Android
      try {
        const current = await Filesystem.checkPermissions();
        if (!current || (current as any).publicStorage !== 'granted') {
          const requested = await Filesystem.requestPermissions();
          if (!requested || (requested as any).publicStorage !== 'granted') {
            await promptOpenAppSettings('Permita acesso ao armazenamento para importar arquivos.');
            return;
          }
        }
      } catch (permErr) {
        console.debug('Filesystem permission check/request failed', permErr);
      }

      const res: any = await Filesystem.readdir({ path: '', directory: Directory.Documents } as any);
      const names: string[] = Array.isArray(res.files) ? (res.files as any).map((f: any) => typeof f === 'string' ? f : f.name) : (Array.isArray(res) ? (res as string[]) : []);
      const candidates = names.filter(n => n && /\.(csv|xlsx)$/i.test(n));
      if (candidates.length === 0) {
        // Tentar ler arquivo padrão salvo em Downloads via MediaStore (caminho usual)
        const fallbackName = 'estoque-import-template.csv';
        try {
          // Tentativa: ler via External + caminho relativo
          // Nem todos dispositivos permitem Directory.External; se falhar, seguimos para file picker no futuro
          const dlBase64Res: any = await Filesystem.readFile({ path: `Download/${fallbackName}`, directory: (Filesystem as any).Directory?.External || Directory.External, encoding: 'base64' } as any);
          if (dlBase64Res?.data) {
            const rows = await XLSXUtils.importFromBase64(dlBase64Res.data as string);
            await dumpParsedDebug(rows, `import-download-${fallbackName}`);
            await processImportedRows(rows);
            return;
          }
        } catch (downloadErr) {
          console.debug('Fallback leitura de Download falhou', downloadErr);
        }
        toast({ variant: 'destructive', title: 'Nenhum arquivo', description: 'Nenhum CSV/XLSX em Documentos ou Downloads. Re-baixe o modelo ou use o seletor (futuro).' });
        return;
      }
      // pick newest by lexicographic sort (filename may include date) or first
      candidates.sort((a,b) => b.localeCompare(a));
      const chosen = candidates[0];
      try {
        const fileRes: any = await Filesystem.readFile({ path: chosen, directory: Directory.Documents, encoding: 'base64' } as any);
        const base64 = fileRes.data as string;
        const rows = await XLSXUtils.importFromBase64(base64);
        await dumpParsedDebug(rows, `import-docs-${chosen}`);
        await processImportedRows(rows);
      } catch (e) {
        console.error('Failed to read/import chosen document from Documents', e);
        // Tentar leitura alternativa em Downloads se o arquivo veio do MediaStore
        try {
          const altRes: any = await Filesystem.readFile({ path: `Download/${chosen}`, directory: (Filesystem as any).Directory?.External || Directory.External, encoding: 'base64' } as any);
          const altBase64 = altRes.data as string;
          const rows = await XLSXUtils.importFromBase64(altBase64);
          await dumpParsedDebug(rows, `import-alt-download-${chosen}`);
          await processImportedRows(rows);
          return;
        } catch (altErr) {
          console.error('Alternate download read failed', altErr);
        }
        toast({ variant: 'destructive', title: 'Falha na leitura', description: `Erro ao ler/processar em Documentos/Downloads: ${(e as any)?.message || e}` });
      }
    } catch (e) {
      console.error('handleListAndImportDocuments failed', e);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível acessar Documentos: ${(e as any)?.message || e}` });
    }
  };

  // New: Explicit helper to auto-import from Downloads (scan + pick newest)
  const handleAutoImportFromDownloads = async () => {
    try {
      const capFS = await import('@capacitor/filesystem');
      const { Filesystem, Directory } = capFS;

      // Ensure permission for public storage
      try {
        const perm = await Filesystem.checkPermissions();
        if (!perm || (perm as any).publicStorage !== 'granted') {
          const req = await Filesystem.requestPermissions();
          if (!req || (req as any).publicStorage !== 'granted') {
            await promptOpenAppSettings('Permita acesso ao armazenamento para importar arquivos.');
            return;
          }
        }
      } catch {}

      // List Downloads folder (may vary by OEM; try External first)
      let chosen: string | null = null;
      try {
        const listing: any = await Filesystem.readdir({ path: 'Download', directory: (Filesystem as any).Directory?.External || Directory.External } as any);
        const names: string[] = Array.isArray(listing.files) ? listing.files.map((f: any) => typeof f === 'string' ? f : f.name) : [];
        const candidates = names.filter(n => n && /\.(csv|xlsx)$/i.test(n));
        if (candidates.length > 0) {
          candidates.sort((a,b) => b.localeCompare(a));
          chosen = candidates[0];
        }
      } catch (e) {
        console.debug('Downloads listing failed', e);
      }

      if (!chosen) {
        toast({ variant: 'destructive', title: 'Nenhum arquivo encontrado', description: 'Nenhum CSV/XLSX detectado em Downloads.' });
        return;
      }

      try {
        setImporting(true);
        const fileRes: any = await Filesystem.readFile({ path: `Download/${chosen}`, directory: (Filesystem as any).Directory?.External || Directory.External, encoding: 'base64' } as any);
        if (fileRes?.data) {
          const rows = await XLSXUtils.importFromBase64(fileRes.data as string);
          try { toast({ title: 'Arquivo analisado', description: `${Array.isArray(rows) ? rows.length : 0} linhas` }); } catch {}
          await processImportedRows(rows);
          return;
        }
        toast({ variant: 'destructive', title: 'Falha na leitura', description: 'Não foi possível ler arquivo de Downloads.' });
      } finally {
        setImporting(false);
      }
    } catch (e) {
      console.debug('handleAutoImportFromDownloads error', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Importação automática de Downloads falhou.' });
    }
  };
  return (
    <>
      <Card className="shadow-lg h-full flex flex-col bg-transparent sm:bg-card border-none sm:border">
          <CardHeader className="bg-card rounded-t-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                      <CardTitle>Cadastro de Itens</CardTitle>
                      <CardDescription>
                        {lowStockOnly ? 'Exibindo apenas itens em baixo nível (≤5). ' : 'Gerencie e cadastre itens.'}
                        {lowStockOnly && (
                          <button
                            type="button"
                            onClick={onClearLowStockFilter}
                            className="underline text-primary ml-1 text-xs"
                          >
                            Limpar filtro
                          </button>
                        )}
                      </CardDescription>
                  </div>
                      {/* Ações movidas para FAB flutuante */}
              </div>
              <div className="relative pt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar por nome, especificações, código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0 sm:p-6">
            <ScrollArea className="h-full w-full">
              <div className="p-4 sm:p-0 space-y-4">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <Card key={item.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-grow cursor-pointer" onClick={() => setViewingItem(item)}>
                          <p className="font-semibold text-card-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.specifications}</p>
                          <div className="sm:hidden mt-2">
                            <Badge variant={item.quantity <= 0 ? 'destructive' : (item.quantity < 10 ? 'secondary' : 'default')}>
                              Qtd: {item.quantity ?? 0}
                            </Badge>
                          </div>
                        </div>
                
                        <div className="hidden sm:block mx-4">
                            <Badge variant={item.quantity <= 0 ? 'destructive' : (item.quantity < 10 ? 'secondary' : 'default')}>
                              {item.quantity ?? 0}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center">
                          <QuickAddButton item={item} onGoToRelease={onGoToRelease} />
                          {item.barcode ? (
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setBarcodeItem(item);}}>
                                <Barcode className="h-4 w-4" />
                                <span className="sr-only">Visualizar código de barras</span>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleGenerateBarcode(item);}}>
                              <Barcode className="h-4 w-4 text-teal-500" />
                              <span className="sr-only">Gerar código de barras</span>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o item.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">Nenhum item encontrado.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
      </Card>
      {/* Floating Action Button (draggable) */}
      <div data-fab>
        <DraggableFab />
      </div>
      {CSV_IMPORT_EXPORT_ENABLED && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
          }}
        />
      )}

      {/* Dialogs / Modals */}
      {barcodeItem && (
        <BarcodeDisplayDialog item={barcodeItem} isOpen={!!barcodeItem} onOpenChange={(open) => { if (!open) setBarcodeItem(null); }} />
      )}
      {viewingItem && (
        <ItemDetailsDialog item={viewingItem} isOpen={!!viewingItem} onOpenChange={(open) => { if (!open) setViewingItem(null); }} />
      )}
      <BulkGridDialog
        open={gridOpen}
        rows={gridRows}
        onOpenChange={setGridOpen}
        onSave={async (rows) => {
          await handleSaveBulkRows(rows);
          setGridRows(undefined);
        }}
      />
      <BatchScanDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        onSave={async (rows) => {
          await handleSaveBulkRows(rows);
        }}
      />
    </>
  );
}

// Quick add popover component (restored after accidental corruption)
function QuickAddButton({ item, onGoToRelease }: { item: StockItem; onGoToRelease?: () => void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<number | string>('');
  const [unit, setUnit] = useState<string>('UN');
  const unitOptions = ['UN','PC','CX','KG','RL','BL','PCT','M','L','OUTRA'];
  const [customUnit, setCustomUnit] = useState('');

  const addToRelease = (e: React.MouseEvent) => {
    e.stopPropagation();
    let quantity = Number(qty);
    if (!quantity || quantity <= 0) quantity = 1;
    if (quantity > MAX_QUANTITY) quantity = MAX_QUANTITY;
    const finalUnit = unit === 'OUTRA' ? (customUnit || 'UN') : unit;
    try {
      localStorage.setItem('prefillReleaseForm', JSON.stringify({ itemId: item.id, quantity, unit: finalUnit }));
    } catch {}
    if (onGoToRelease) onGoToRelease();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Adicionar na Saída"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="sr-only">Adicionar na Saída</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="font-medium text-sm">Adicionar na Saída</div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Quantidade</div>
              <input
                type="number"
                min="1"
                max={MAX_QUANTITY}
                placeholder="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-24 h-8 rounded border border-input bg-background px-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Unidade</div>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="UN" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unit === 'OUTRA' && (
                <input
                  className="mt-2 w-full h-8 rounded border border-input bg-background px-2 text-sm"
                  placeholder="Digite a unidade"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={addToRelease}>Adicionar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
