"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast'; // Opcional, para mostrar alertas nativos
import { Calendar as CalendarIcon, FileDown, Trash, X, Undo2 } from "lucide-react";

import type { WithdrawalRecord, ToolRecord, EntryRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
}

declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export function HistoryPanel({ itemHistory, toolHistory, entryHistory, onDeleteItemRecord, onDeleteToolRecord, onDeleteEntryRecord, onReturnItem }: HistoryPanelProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("withdrawals");
  const [viewingToolRecord, setViewingToolRecord] = useState<ToolRecord | null>(null);
  const [viewingItemRecord, setViewingItemRecord] = useState<WithdrawalRecord | null>(null);
  const [returningRecord, setReturningRecord] = useState<WithdrawalRecord | null>(null);

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

    if (dateFilter) {
        filtered = filtered.filter(record => {
            const recordDate = new Date((record as any).date || (record as ToolRecord).checkoutDate);
            return recordDate.getFullYear() === dateFilter.getFullYear() &&
                   recordDate.getMonth() === dateFilter.getMonth() &&
                   recordDate.getDate() === dateFilter.getDate();
        });
    }

    if (searchTerm) {
        const lowercasedSearch = searchTerm.toLowerCase();
        if (activeTab === 'withdrawals') {
            filtered = (filtered as WithdrawalRecord[]).filter(record =>
                record.item.name.toLowerCase().includes(lowercasedSearch) ||
                record.requestedBy.toLowerCase().includes(lowercasedSearch) ||
                record.requestedFor.toLowerCase().includes(lowercasedSearch)
            );
        } else if (activeTab === 'entries') {
             filtered = (filtered as EntryRecord[]).filter(record =>
                record.item.name.toLowerCase().includes(lowercasedSearch) ||
                record.addedBy.toLowerCase().includes(lowercasedSearch)
            );
        } else { // tools
            filtered = (filtered as ToolRecord[]).filter(record =>
                record.tool.name.toLowerCase().includes(lowercasedSearch) ||
                record.tool.assetId.toLowerCase().includes(lowercasedSearch) ||
                record.checkedOutBy.toLowerCase().includes(lowercasedSearch) ||
                record.usageLocation.toLowerCase().includes(lowercasedSearch)
            );
        }
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date((a as any).date || (a as ToolRecord).checkoutDate).getTime();
      const dateB = new Date((b as any).date || (b as ToolRecord).checkoutDate).getTime();
      return dateB - dateA;
    });
  }, [historyToDisplay, dateFilter, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);
  

  const handleExportToPDF = () => {
    if (filteredHistory.length === 0) {
      toast({ variant: "destructive", title: "Nenhum dado para exportar" });
      return;
    }
  
    const doc = new jsPDF();
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
            head: [['Ferramenta', 'Patrimônio', 'Retirado por', 'Local', 'Data Retirada', 'Data Devolução', 'Status']],
            body: (filteredHistory as ToolRecord[]).map(record => [
              record.tool.name, record.tool.assetId, record.checkedOutBy, record.usageLocation,
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

  const clearFilters = () => {
    setDateFilter(undefined);
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
      <Card className="shadow-lg h-full flex flex-col bg-transparent sm:bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                  <CardTitle>Histórico Geral</CardTitle>
                  <CardDescription>Visualize, filtre e exporte todas as movimentações.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportToPDF} className="w-full sm:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar PDF
              </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow p-0 sm:p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 relative">
                  <TabsTrigger value="withdrawals" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner relative">
                    <span className="relative">Saídas{activeTab==='withdrawals' && <span className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 w-8 rounded-full bg-primary" />}</span>
                  </TabsTrigger>
                  <TabsTrigger value="entries" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner relative">
                    <span className="relative">Entradas{activeTab==='entries' && <span className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 w-8 rounded-full bg-primary" />}</span>
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner relative">
                    <span className="relative">Ferramentas{activeTab==='tools' && <span className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 w-8 rounded-full bg-primary" />}</span>
                  </TabsTrigger>
              </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row gap-2 my-4 px-4 sm:px-0">
              <div className="relative flex-grow">
                  <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter ? format(dateFilter, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus locale={ptBR} /></PopoverContent>
                </Popover>
                { (dateFilter || searchTerm) &&
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Limpar Filtros</span>
                  </Button>
                }
              </div>
          </div>
          <ScrollArea className="flex-grow">
            <div className="px-4 sm:px-0 space-y-4">
              {renderHistoryList()}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-6 bg-card">
          <div className="flex items-center justify-end w-full">
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                      Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                      Próxima
                  </Button>
              </div>
          </div>
        </CardFooter>
      </Card>
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
                        <Undo2 className="h-4 w-4 text-blue-500" />
                        <span className="sr-only">Devolver</span>
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                  <Trash className="h-4 w-4" />
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
                              <Trash className="h-4 w-4" />
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
                      <p>Retirado por: {record.checkedOutBy} para {record.usageLocation}</p>
                      <p>Data: {format(new Date(record.checkoutDate), 'dd/MM/yy HH:mm')}
                        {record.returnDate && ` - ${format(new Date(record.returnDate), 'dd/MM/yy HH:mm')}`}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 bg-card-footer flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}><Trash className="h-4 w-4" /></Button></AlertDialogTrigger>
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
    const resultado = await Filesystem.writeFile({
      path: nomeArquivo,
      data: base64string,
      directory: Directory.Cache,
    });

    console.log('Arquivo salvo temporariamente em:', resultado.uri);

    // 2. Usa o plugin Share para abrir o menu de compartilhamento nativo
    await Share.share({
      title: 'Salvar Relatório em PDF',
      text: `Aqui está o seu arquivo: ${nomeArquivo}`,
      url: resultado.uri,
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