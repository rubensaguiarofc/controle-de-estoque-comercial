"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast'; // Opcional, para mostrar alertas nativos
import { Capacitor } from '@capacitor/core';
// Using Material Icons font for offline-friendly icons

import type { WithdrawalRecord, ToolRecord, EntryRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { SignatureDisplayDialog } from "./signature-display-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { WithdrawalRecordDetailsDialog } from "./withdrawal-record-details-dialog";
import { ReturnItemDialog } from "./return-item-dialog";

const ITEMS_PER_PAGE = 10;

interface HistoryPanelProps {
  itemHistory: WithdrawalRecord[];
  toolHistory: ToolRecord[];
  entryHistory: EntryRecord[];
  onDeleteItemRecord: (recordId: string) => void;
  onDeleteToolRecord: (recordId: string) => void;
  onDeleteEntryRecord: (recordId: string) => void;
  onReturnItem: (recordId: string, quantity: number) => void;
  onClearAll?: () => void;
}

declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export function HistoryPanel({ itemHistory, toolHistory, entryHistory, onDeleteItemRecord, onDeleteToolRecord, onDeleteEntryRecord, onReturnItem, onClearAll }: HistoryPanelProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("withdrawals");
  const [pdfLandscape, setPdfLandscape] = useState(false);
  const [viewingToolRecord, setViewingToolRecord] = useState<ToolRecord | null>(null);
  const [viewingItemRecord, setViewingItemRecord] = useState<WithdrawalRecord | null>(null);
  const [returningRecord, setReturningRecord] = useState<WithdrawalRecord | null>(null);
  const [isConfirmClearAllOpen, setConfirmClearAllOpen] = useState(false);

  const historyToDisplay = useMemo(() => {
    switch (activeTab) {
      case 'withdrawals': return itemHistory;
      case 'entries': return entryHistory;
      case 'tools': return toolHistory;
      default: return [];
    }
  }, [activeTab, itemHistory, entryHistory, toolHistory]);


  const filteredHistory = useMemo(() => {
  let filtered = historyToDisplay as (WithdrawalRecord | EntryRecord | ToolRecord)[];

    if (startDate || endDate) {
        filtered = filtered.filter(record => {
            const d = new Date((record as any).date || (record as ToolRecord).checkoutDate).getTime();
            const s = startDate ? new Date(startDate).setHours(0,0,0,0) : -Infinity;
            const e = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
            return d >= s && d <= e;
        });
    }

    if (searchTerm) {
        const lowercasedSearch = searchTerm.toLowerCase();
    if (activeTab === 'withdrawals') {
            filtered = (filtered as WithdrawalRecord[]).filter(record =>
        record.item.name.toLowerCase().includes(lowercasedSearch) ||
        record.item.specifications.toLowerCase().includes(lowercasedSearch) ||
                record.requestedBy.toLowerCase().includes(lowercasedSearch) ||
                record.requestedFor.toLowerCase().includes(lowercasedSearch)
            );
        } else if (activeTab === 'entries') {
             filtered = (filtered as EntryRecord[]).filter(record =>
        record.item.name.toLowerCase().includes(lowercasedSearch) ||
        record.item.specifications.toLowerCase().includes(lowercasedSearch) ||
                record.addedBy.toLowerCase().includes(lowercasedSearch)
            );
    } else { // tools
      filtered = (filtered as ToolRecord[]).filter(record =>
        record.tool.name.toLowerCase().includes(lowercasedSearch) ||
        record.tool.assetId.toLowerCase().includes(lowercasedSearch) ||
        record.checkedOutBy.toLowerCase().includes(lowercasedSearch) ||
        (record.company?.toLowerCase() || '').includes(lowercasedSearch) ||
        record.usageLocation.toLowerCase().includes(lowercasedSearch)
      );
        }
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date((a as any).date || (a as ToolRecord).checkoutDate).getTime();
      const dateB = new Date((b as any).date || (b as ToolRecord).checkoutDate).getTime();
      return dateB - dateA;
    });
  }, [historyToDisplay, startDate, endDate, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);
  const canExport = filteredHistory.length > 0;
  

  const handleExportToPDF = () => {
    if (filteredHistory.length === 0) {
      toast({ variant: "destructive", title: "Nenhum dado para exportar" });
      return;
    }

    const doc = new jsPDF({ orientation: pdfLandscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    let title = "";
    let filename = "";
    
    doc.setFontSize(18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 30);
  
    if (activeTab === 'withdrawals') {
        title = "Histórico de Retirada de Itens";
        filename = `historico_retiradas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        (doc as any).autoTable({
            startY: 35,
            head: [['Data', 'Item', 'Qtd.', 'Devolvido', 'Quem Retirou', 'Destino']],
            body: (filteredHistory as WithdrawalRecord[]).map(record => [
              format(new Date(record.date), 'dd/MM/yy'), record.item.name, `${record.quantity} ${record.unit}`,
              `${record.returnedQuantity || 0} ${record.unit}`, record.requestedBy, record.requestedFor,
            ]),
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
            headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [242, 242, 242] },
          });
    } else if (activeTab === 'entries') {
        title = "Histórico de Entrada de Itens";
        filename = `historico_entradas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        (doc as any).autoTable({
            startY: 35,
            head: [['Data', 'Item', 'Qtd.', 'Adicionado Por']],
            body: (filteredHistory as EntryRecord[]).map(record => [
              format(new Date(record.date), 'dd/MM/yy'), record.item.name, `${record.quantity} ${record.unit}`, record.addedBy,
            ]),
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
            headStyles: { fillColor: [22, 74, 163], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [242, 242, 242] },
          });
    } else { // tools
        title = "Histórico de Movimentação de Ferramentas";
        filename = `historico_ferramentas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        (doc as any).autoTable({
            startY: 35,
            head: [['Ferramenta', 'Patrimônio', 'Retirado por', 'Empresa', 'Local', 'Data Retirada', 'Data Devolução', 'Status']],
            body: (filteredHistory as ToolRecord[]).map(record => [
              record.tool.name, record.tool.assetId, record.checkedOutBy, (record.company || '-'), record.usageLocation,
              format(new Date(record.checkoutDate), 'dd/MM/yy HH:mm'),
              record.returnDate ? format(new Date(record.returnDate), 'dd/MM/yy HH:mm') : '-',
              record.returnDate ? (record.isDamaged ? 'Devolvido com Avaria' : 'Devolvido') : 'Em uso',
            ]),
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [242, 242, 242] },
          });
    }
    
    doc.text(title, 14, 22);

    // Instead of forcing a browser download, try saving + sharing on native via Capacitor
    (async () => {
      try {
        const dataUri = doc.output('datauristring'); // data:application/pdf;base64,...
        const base64 = dataUri.split(',').pop() || '';
        await salvarECompartilharPdf(base64, filename);
        toast({ title: "Exportação Concluída", description: "Arquivo salvo/compartilhado com sucesso." });
      } catch (e) {
        console.error('Falha ao salvar/compartilhar PDF via Capacitor, fazendo download fallback', e);
        try {
          // as a fallback, trigger browser download
          doc.save(filename);
          toast({ title: "Exportação Concluída", description: "Seu arquivo PDF foi baixado." });
        } catch (err) {
          toast({ variant: 'destructive', title: 'Falha', description: 'Não foi possível exportar o PDF.' });
        }
      }
    })();
  };

  const handleExportToXLSX = () => {
    if (filteredHistory.length === 0) {
      toast({ variant: "destructive", title: "Nenhum dado para exportar" });
      return;
    }
    let wsData: any[] = [];
    let filename = '';
    if (activeTab === 'withdrawals') {
      wsData = [ ['Data', 'Item', 'Especificações', 'Qtd.', 'Devolvido', 'Quem Retirou', 'Destino'] ];
      (filteredHistory as WithdrawalRecord[]).forEach(r => {
        wsData.push([ format(new Date(r.date), 'dd/MM/yy'), r.item.name, r.item.specifications, `${r.quantity} ${r.unit}`, `${r.returnedQuantity || 0} ${r.unit}`, r.requestedBy, r.requestedFor ]);
      });
      filename = `historico_retiradas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    } else if (activeTab === 'entries') {
      wsData = [ ['Data', 'Item', 'Especificações', 'Qtd.', 'Adicionado Por'] ];
      (filteredHistory as EntryRecord[]).forEach(r => {
        wsData.push([ format(new Date(r.date), 'dd/MM/yy'), r.item.name, r.item.specifications, `${r.quantity} ${r.unit}`, r.addedBy ]);
      });
      filename = `historico_entradas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    } else {
      wsData = [ ['Ferramenta', 'Patrimônio', 'Retirado por', 'Empresa', 'Local', 'Data Retirada', 'Data Devolução', 'Status'] ];
      (filteredHistory as ToolRecord[]).forEach(r => {
        wsData.push([ r.tool.name, r.tool.assetId, r.checkedOutBy, (r.company || '-'), r.usageLocation, format(new Date(r.checkoutDate), 'dd/MM/yy HH:mm'), r.returnDate ? format(new Date(r.returnDate), 'dd/MM/yy HH:mm') : '-', r.returnDate ? (r.isDamaged ? 'Devolvido com Avaria' : 'Devolvido') : 'Em uso' ]);
      });
      filename = `historico_ferramentas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

    // Se estiver rodando nativamente (Capacitor), salvar e compartilhar via Filesystem + Share
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          const base64Xlsx = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
          await Filesystem.writeFile({ path: filename, data: base64Xlsx, directory: Directory.Documents });
          const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Documents });
          try {
            await Share.share({ title: 'Exportar XLSX', text: 'Seu relatório em Excel.', url: uri, dialogTitle: 'Compartilhar Planilha' });
          } catch {}
          toast({ title: 'Exportação Concluída', description: `Arquivo salvo: ${filename}` });
        } catch (err) {
          console.error('Falha ao salvar/compartilhar XLSX via Capacitor, tentando fallback web', err);
          try {
            XLSX.writeFile(wb, filename);
            toast({ title: 'Exportação Concluída', description: 'Arquivo XLSX baixado.' });
          } catch (e2) {
            toast({ variant: 'destructive', title: 'Falha', description: 'Não foi possível exportar o XLSX.' });
          }
        }
      })();
      return;
    }

    // Ambiente web: baixar o arquivo normalmente
    XLSX.writeFile(wb, filename);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    clearFilters();
  };

  const renderHistoryList = () => {
    if (paginatedHistory.length === 0) {
        return <p className="text-center text-muted-foreground py-12">Nenhum registro encontrado.</p>;
    }

    switch (activeTab) {
        case 'withdrawals':
            return <ItemWithdrawalHistoryList records={paginatedHistory as WithdrawalRecord[]} onViewDetails={setViewingItemRecord} onOpenReturnDialog={setReturningRecord} onDeleteRecord={onDeleteItemRecord} />;
        case 'entries':
            return <ItemEntryHistoryList records={paginatedHistory as EntryRecord[]} onDeleteRecord={onDeleteEntryRecord} />;
        case 'tools':
            return <ToolHistoryList records={paginatedHistory as ToolRecord[]} onShowDetails={setViewingToolRecord} onDeleteRecord={onDeleteToolRecord} />;
        default:
            return null;
    }
};


  return (
    <>
      <div className="flex flex-col">
        {/* Título e menu (kebab) */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.015em]">Histórico Geral</h2>
            <p className="text-base pt-1">Visualize, filtre e exporte todas as movimentações.</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações"><span className="material-icons">more_vert</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportToPDF} disabled={!canExport} className={!canExport ? 'opacity-60' : ''}>
                <span className="material-icons text-muted-foreground">picture_as_pdf</span>
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportToXLSX} disabled={!canExport} className={!canExport ? 'opacity-60' : ''}>
                <span className="material-icons text-muted-foreground">grid_on</span>
                Exportar XLSX
              </DropdownMenuItem>
              {onClearAll && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmClearAllOpen(true)}>
                    <span className="material-icons">delete_forever</span>
                    Apagar Histórico
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Ações: Exportar PDF e XLSX */}
        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={handleExportToPDF} className="h-10 px-4 bg-[#1172d4] hover:bg-[#0f63b8] text-white text-sm font-bold tracking-[0.015em]">Exportar PDF</Button>
              <Button variant="outline" onClick={handleExportToXLSX} className="h-10 px-4 bg-[#e7edf3] text-[#0d141b] hover:bg-[#dfe7f0] border-transparent text-sm font-bold tracking-[0.015em]">Exportar XLSX</Button>
            </div>
            {onClearAll && (
              <Button variant="destructive" className="h-10" onClick={() => setConfirmClearAllOpen(true)}>
                Apagar Histórico
              </Button>
            )}
          </div>
        </div>
        {/* Abas */}
        <div className="pb-3 border-b border-[#cfdbe7]">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger value="withdrawals" className="border-b-[3px] data-[state=active]:border-b-[#1172d4] border-b-transparent rounded-none pb-[13px] pt-4 text-sm font-bold data-[state=active]:text-foreground">Saídas</TabsTrigger>
              <TabsTrigger value="entries" className="border-b-[3px] data-[state=active]:border-b-[#1172d4] border-b-transparent rounded-none pb-[13px] pt-4 text-sm font-bold data-[state=active]:text-foreground">Entradas</TabsTrigger>
              <TabsTrigger value="tools" className="border-b-[3px] data-[state=active]:border-b-[#1172d4] border-b-transparent rounded-none pb-[13px] pt-4 text-sm font-bold data-[state=active]:text-foreground">Ferramentas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* Busca + Período (ícone) */}
        <div className="flex items-center gap-2 px-4 py-3 max-w-[640px]">
          <div className="relative flex-1">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 pl-10" />
          </div>
          <Popover open={isRangeOpen} onOpenChange={setIsRangeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 bg-[#e7edf3] text-[#0d141b] border-transparent">
                <span className="material-icons">calendar_month</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[680px] max-w-[95vw] p-3">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                {/* Presets */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold">Atalhos</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-8" onClick={() => { const now=new Date(); const s=new Date(now); s.setHours(0,0,0,0); setStartDate(s); setEndDate(now); setIsRangeOpen(false); }}>Hoje</Button>
                    <Button variant="outline" className="h-8" onClick={() => { const now=new Date(); const s=new Date(now); s.setDate(now.getDate()-1); s.setHours(0,0,0,0); const e=new Date(now); e.setDate(now.getDate()-1); e.setHours(23,59,59,999); setStartDate(s); setEndDate(e); setIsRangeOpen(false); }}>Ontem</Button>
                    <Button variant="outline" className="h-8" onClick={() => { const now=new Date(); const day=now.getDay(); const diff=(day===0?6:day-1); const s=new Date(now); s.setDate(now.getDate()-diff); s.setHours(0,0,0,0); const e=new Date(now); e.setHours(23,59,59,999); setStartDate(s); setEndDate(e); setIsRangeOpen(false); }}>Esta semana</Button>
                    <Button variant="outline" className="h-8" onClick={() => { const now=new Date(); const day=now.getDay(); const diff=(day===0?6:day-1)+7; const e=new Date(now); e.setDate(now.getDate()-diff+6); e.setHours(23,59,59,999); const s=new Date(e); s.setDate(e.getDate()-6); s.setHours(0,0,0,0); setStartDate(s); setEndDate(e); setIsRangeOpen(false); }}>Semana passada</Button>
                    <Button variant="outline" className="h-8" onClick={() => { const now=new Date(); const s=new Date(now.getFullYear(), now.getMonth(), 1); const e=new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999); setStartDate(s); setEndDate(e); setIsRangeOpen(false); }}>Este mês</Button>
                    <Button variant="outline" className="h-8" onClick={() => { const now=new Date(); const s=new Date(now.getFullYear(), now.getMonth()-1, 1); const e=new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59,999); setStartDate(s); setEndDate(e); setIsRangeOpen(false); }}>Mês passado</Button>
                    <Button variant="outline" className="h-8" onClick={() => { setStartDate(undefined); setEndDate(undefined); setIsRangeOpen(false); }}>Limpar</Button>
                  </div>
                </div>
                {/* Range picker (two months) */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">Selecione o intervalo</div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} className="border rounded-md" />
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} className="border rounded-md" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => setIsRangeOpen(false)} className="h-9">Aplicar</Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          { ((startDate||endDate) || searchTerm) && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="h-12 w-12">
              <span className="material-icons">close</span>
              <span className="sr-only">Limpar Filtros</span>
            </Button>
          )}
        </div>
        {/* Lista / estado vazio */}
        <div className="flex flex-col p-4">
          {paginatedHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#cfdbe7] px-6 py-14">
              <p className="text-lg font-bold tracking-[-0.015em] text-center">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderHistoryList()}
            </div>
          )}
        </div>
        {/* Paginação */}
        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-between">
            <Button variant="outline" className="h-10 px-4 bg-[#e7edf3] text-[#0d141b] border-transparent text-sm font-bold" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Anterior</Button>
            <span className="text-sm text-muted-foreground self-center">Página {currentPage} de {totalPages || 1}</span>
            <Button variant="outline" className="h-10 px-4 bg-[#e7edf3] text-[#0d141b] border-transparent text-sm font-bold" onClick={() => setCurrentPage(prev => Math.min(totalPages || 1, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>Próxima</Button>
          </div>
        </div>
      </div>
      <SignatureDisplayDialog 
          record={viewingToolRecord}
          isOpen={!!viewingToolRecord}
          onOpenChange={(isOpen) => !isOpen && setViewingToolRecord(null)}
        />
      <WithdrawalRecordDetailsDialog
          record={viewingItemRecord}
          isOpen={!!viewingItemRecord}
          onOpenChange={(isOpen) => !isOpen && setViewingItemRecord(null)}
        />
      <ReturnItemDialog
        isOpen={!!returningRecord}
        onOpenChange={(isOpen) => !isOpen && setReturningRecord(null)}
        record={returningRecord}
        onReturn={onReturnItem}
      />

      {/* Confirmar apagar todo o histórico */}
      <AlertDialog open={isConfirmClearAllOpen} onOpenChange={setConfirmClearAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar todo o histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente todos os registros de Saídas, Entradas e Ferramentas neste dispositivo. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmClearAllOpen(false); onClearAll && onClearAll(); }}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Item Withdrawal History
function ItemWithdrawalHistoryList({ records, onViewDetails, onOpenReturnDialog, onDeleteRecord }: { records: WithdrawalRecord[], onViewDetails: (record: WithdrawalRecord) => void, onOpenReturnDialog: (record: WithdrawalRecord) => void, onDeleteRecord: (id: string) => void }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {records.map(record => (
                <Card key={record.id} onClick={() => onViewDetails(record)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{record.item.name}</p>
                            <p className="text-sm text-muted-foreground">Retirado por: {record.requestedBy}</p>
                          </div>
                          <Badge variant="outline">{new Date(record.date).toLocaleDateString('pt-BR')}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <p>Qtd: {record.quantity} {record.unit}</p>
                            <p>Dev: {record.returnedQuantity || 0} {record.unit}</p>
                            <p>Dest: {record.requestedFor}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 bg-card-footer flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onOpenReturnDialog(record); }} disabled={record.quantity === (record.returnedQuantity || 0)}>
                        <span className="material-icons text-blue-500">undo</span>
                        <span className="sr-only">Devolver</span>
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                  <span className="material-icons">delete</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro e não irá reverter a baixa no estoque.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

// Item Entry History
function ItemEntryHistoryList({ records, onDeleteRecord }: { records: EntryRecord[], onDeleteRecord: (id: string) => void }) {
  return (
      <div className="grid gap-4 md:grid-cols-2">
          {records.map(record => (
              <Card key={record.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{record.item.name}</p>
                      <p className="text-sm text-muted-foreground">Adicionado por: {record.addedBy}</p>
                      <p className="text-sm text-muted-foreground">Qtd: {record.quantity} {record.unit}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">{new Date(record.date).toLocaleDateString('pt-BR')}</Badge>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <span className="material-icons">delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá o registro de entrada e não irá reverter a adição no estoque.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
              </Card>
          ))}
      </div>
  );
}

// Tool History
function ToolHistoryList({ records, onShowDetails, onDeleteRecord }: { records: ToolRecord[], onShowDetails: (record: ToolRecord) => void, onDeleteRecord: (id: string) => void }) {
  return (
      <div className="grid gap-4 md:grid-cols-2">
          {records.map(record => (
              <Card key={record.id} onClick={() => onShowDetails(record)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{record.tool.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{record.tool.assetId}</p>
                      </div>
                      {record.returnDate 
                          ? <Badge variant={record.isDamaged ? "destructive" : "secondary"}>{record.isDamaged ? "Com Avaria" : "Devolvido"}</Badge>
                          : <Badge>Em uso</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Retirado por: {record.checkedOutBy}{record.company ? ` - ${record.company}` : ''} para {record.usageLocation}</p>
                      <p>Data: {format(new Date(record.checkoutDate), 'dd/MM/yy HH:mm')}
                        {record.returnDate && ` - ${format(new Date(record.returnDate), 'dd/MM/yy HH:mm')}`}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 bg-card-footer flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}><span className="material-icons">delete</span></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e removerá este registro para sempre. Continue com cuidado.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardFooter>
              </Card>
          ))}
      </div>
  );
}

/**
 * Função para salvar e compartilhar um PDF gerado a partir de uma string base64.
 * @param base64string A string base64 pura do PDF (sem o prefixo "data:application/pdf;base64,").
 * @param nomeArquivo O nome que o arquivo terá, ex: "historico-geral-2024.pdf".
 */
async function salvarECompartilharPdf(base64string: string, nomeArquivo: string) {
  try {
    // 1. Salva o arquivo na pasta de Cache do aplicativo.
    await Filesystem.writeFile({
      path: nomeArquivo,
      data: base64string,
      directory: Directory.Cache,
    });

    // Resolve a URI compatível com compartilhamento (content://)
    const { uri } = await Filesystem.getUri({ path: nomeArquivo, directory: Directory.Cache });

    // 2. Usa o plugin Share para abrir o menu de compartilhamento nativo
    await Share.share({
      title: 'Salvar Relatório em PDF',
      text: `Aqui está o seu arquivo: ${nomeArquivo}`,
      url: uri,
    });

  } catch (error) {
    console.error('Erro ao salvar ou compartilhar PDF', error);
    try {
      await Toast.show({
        text: 'Não foi possível salvar ou compartilhar o PDF.',
        duration: 'long'
      });
    } catch (e) {
      // ignore toast errors
    }
    throw error;
  }
}