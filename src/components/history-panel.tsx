
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Calendar as CalendarIcon, FileDown, Trash, X } from "lucide-react";

import type { WithdrawalRecord, ToolRecord, EntryRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// Using inline Card UI for return flow instead of Dialog modal
import { Check, CornerUpLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { SignatureDisplayDialog } from "./signature-display-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { WithdrawalRecordDetailsDialog } from "./withdrawal-record-details-dialog";

const ITEMS_PER_PAGE = 10;

interface HistoryPanelProps {
  itemHistory: WithdrawalRecord[];
  toolHistory: ToolRecord[];
  entryHistory: EntryRecord[];
  onDeleteItemRecord: (recordId: string) => void;
  onDeleteToolRecord: (recordId: string) => void;
  onDeleteEntryRecord: (recordId: string) => void;
  onReturnItemRecord?: (recordId: string, quantity: number, note?: string) => void;
}

// Extend the window interface for jspdf-autotable
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export function HistoryPanel({ itemHistory, toolHistory, entryHistory, onDeleteItemRecord, onDeleteToolRecord, onDeleteEntryRecord, onReturnItemRecord }: HistoryPanelProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("withdrawals");
  const [viewingToolRecord, setViewingToolRecord] = useState<ToolRecord | null>(null);
  const [viewingItemRecord, setViewingItemRecord] = useState<WithdrawalRecord | null>(null);

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
  

  const salvarECompartilharPdf = async (doc: jsPDF, filename: string) => {
    try {
      // jsPDF can output a data URI which contains base64 PDF data
      const dataUri = doc.output('datauristring') as string; // data:application/pdf;base64,....
      const base64 = dataUri.split(',')[1];

      // Write the file to the app cache directory
      await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });

      // Get a platform-specific URI that can be shared
      let uri = '';
      try {
        const uriRes = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
        uri = uriRes.uri;
      } catch (e) {
        // Some platforms may not support getUri; fall back to a file:// path
        uri = `${Directory.Cache}/${filename}`;
      }

      // Invoke native share sheet so user can save or send the PDF
      await Share.share({ title: filename, url: uri });
      toast({ title: "Exportação Concluída", description: "Use o compartilhamento nativo para salvar/enviar o arquivo." });
    } catch (err) {
      // Fallback for web or any failure: trigger browser download
      try {
        doc.save(filename);
        toast({ title: "Exportação Concluída", description: "Seu arquivo PDF foi baixado." });
      } catch (e) {
        toast({ variant: "destructive", title: "Erro ao exportar", description: "Não foi possível salvar o PDF." });
      }
    }
  };

  const handleExportToPDF = async () => {
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
            head: [['Data', 'Item', 'Specs', 'Qtd.', 'Quem Retirou', 'Destino']],
            body: (filteredHistory as WithdrawalRecord[]).map(record => [
              format(new Date(record.date), 'dd/MM/yy'), record.item.name, record.item.specifications,
              `${record.quantity} ${record.unit}`, record.requestedBy, record.requestedFor,
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
            head: [['Data', 'Item', 'Specs', 'Qtd.', 'Adicionado Por']],
            body: (filteredHistory as EntryRecord[]).map(record => [
              format(new Date(record.date), 'dd/MM/yy'), record.item.name, record.item.specifications,
              `${record.quantity} ${record.unit}`, record.addedBy,
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
    await salvarECompartilharPdf(doc, filename);
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

  return (
    <>
    <Card className="shadow-lg h-full flex flex-col">
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
      <CardContent className="flex flex-col flex-grow">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="withdrawals">Saídas</TabsTrigger>
                <TabsTrigger value="entries">Entradas</TabsTrigger>
                <TabsTrigger value="tools">Ferramentas</TabsTrigger>
            </TabsList>
        </Tabs>
        <div className="flex flex-col sm:flex-row gap-2 my-4">
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
  <ScrollArea className="flex-grow bg-card border border-border rounded-lg">
          {activeTab === 'withdrawals' ? (
            <ItemWithdrawalHistoryTab paginatedHistory={paginatedHistory as WithdrawalRecord[]} onDeleteRecord={onDeleteItemRecord} onViewDetails={setViewingItemRecord} onReturnItemRecord={onReturnItemRecord} />
          ) : activeTab === 'entries' ? (
            <ItemEntryHistoryTab paginatedHistory={paginatedHistory as EntryRecord[]} onDeleteRecord={onDeleteEntryRecord} />
          ) : (
            <ToolHistoryTab paginatedHistory={paginatedHistory as ToolRecord[]} onDeleteRecord={onDeleteToolRecord} onShowDetails={setViewingToolRecord} />
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-6">
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
    </>
  );
}

// Sub-component for Item Withdrawal History
function ItemWithdrawalHistoryTab({ paginatedHistory, onDeleteRecord, onViewDetails, onReturnItemRecord }: { paginatedHistory: WithdrawalRecord[], onDeleteRecord: (id: string) => void, onViewDetails: (record: WithdrawalRecord) => void, onReturnItemRecord?: (recordId: string, quantity: number, note?: string) => void }) {
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<WithdrawalRecord | null>(null);
  const [returnQty, setReturnQty] = useState<number>(0);
  const [returnNote, setReturnNote] = useState<string>('');

  const openReturnDialog = (record: WithdrawalRecord) => {
    setReturningRecord(record);
    setReturnQty(Math.min(record.quantity - (record.returnedQuantity || 0), record.quantity));
    setReturnNote('');
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!returningRecord) return;
    if (onReturnItemRecord) onReturnItemRecord(returningRecord.id, returnQty, returnNote || undefined);
    setReturnDialogOpen(false);
    setReturningRecord(null);
  };
    return (
      <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead className="hidden md:table-cell">Quem Retirou</TableHead>
            <TableHead className="hidden md:table-cell">Destino</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedHistory.length > 0 ? paginatedHistory.map((record) => (
            <TableRow key={record.id} onClick={() => onViewDetails(record)} className="cursor-pointer">
              <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="font-medium">{record.item.name}</TableCell>
              <TableCell>{record.quantity}{record.unit}</TableCell>
              <TableCell className="hidden md:table-cell">{record.requestedBy}</TableCell>
              <TableCell className="hidden md:table-cell">{record.requestedFor}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={(e) => { e.stopPropagation(); openReturnDialog(record); }} title="Registrar Devolução">
                    <CornerUpLeft className="h-4 w-4" />
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
                </div>
              </TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum registro de saída encontrado.</TableCell></TableRow>}
        </TableBody>
  </Table>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
            <DialogDescription>Informe a quantidade devolvida para o item selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Item</label>
              <div className="mt-1 text-sm">{returningRecord?.item.name} ({returningRecord?.item.id})</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Quantidade a devolver</label>
              <Input type="number" min={1} max={returningRecord ? Math.max(1, (returningRecord.quantity - (returningRecord.returnedQuantity || 0))) : undefined} value={returnQty} onChange={(e) => setReturnQty(Number(e.target.value || 0))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Nota (opcional)</label>
              <Input value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReturnDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmReturn}><Check className="mr-2 h-4 w-4"/>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
}

// Sub-component for Item Entry History
function ItemEntryHistoryTab({ paginatedHistory, onDeleteRecord }: { paginatedHistory: EntryRecord[], onDeleteRecord: (id: string) => void }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead>Adicionado Por</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedHistory.length > 0 ? paginatedHistory.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="font-medium">{record.item.name}</TableCell>
              <TableCell>{record.quantity} {record.unit}</TableCell>
              <TableCell>{record.addedBy}</TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
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
              </TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum registro de entrada encontrado.</TableCell></TableRow>}
        </TableBody>
      </Table>
    );
}


// Sub-component for Tool History
function ToolHistoryTab({ paginatedHistory, onDeleteRecord, onShowDetails }: { paginatedHistory: ToolRecord[], onDeleteRecord: (id: string) => void, onShowDetails: (record: ToolRecord) => void }) {
    return (
      <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Ferramenta</TableHead>
                <TableHead className="hidden md:table-cell">Retirado por</TableHead>
                <TableHead className="hidden md:table-cell">Data Retirada</TableHead>
                <TableHead className="hidden md:table-cell">Data Devolução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {paginatedHistory.length > 0 ? paginatedHistory.map(record => (
                <TableRow key={record.id} onClick={() => onShowDetails(record)} className="cursor-pointer">
                    <TableCell className="font-medium">{record.tool.name} <span className="text-xs text-muted-foreground md:hidden">({record.tool.assetId})</span></TableCell>
                    <TableCell className="hidden md:table-cell">{record.checkedOutBy}</TableCell>
                    <TableCell className="whitespace-nowrap hidden md:table-cell">{format(new Date(record.checkoutDate), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="whitespace-nowrap hidden md:table-cell">{record.returnDate ? format(new Date(record.returnDate), 'dd/MM/yy HH:mm') : '—'}</TableCell>
                    <TableCell>
                        {record.returnDate 
                            ? <Badge variant={record.isDamaged ? "destructive" : "secondary"}>{record.isDamaged ? "Com Avaria" : "Devolvido"}</Badge>
                            : <Badge>Em uso</Badge>
                        }
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Nenhum registro de movimentação de ferramentas encontrado.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    );
}
