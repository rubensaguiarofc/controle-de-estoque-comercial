
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar as CalendarIcon, FileDown, Trash, X } from "lucide-react";

import type { WithdrawalRecord, ToolRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  onDeleteItemRecord: (recordId: string) => void;
  onDeleteToolRecord: (recordId: string) => void;
}

// Extend the window interface for jspdf-autotable
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export function HistoryPanel({ itemHistory, toolHistory, onDeleteItemRecord, onDeleteToolRecord }: HistoryPanelProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("items");
  const [viewingToolRecord, setViewingToolRecord] = useState<ToolRecord | null>(null);
  const [viewingItemRecord, setViewingItemRecord] = useState<WithdrawalRecord | null>(null);

  const historyToDisplay = activeTab === 'items' ? itemHistory : toolHistory;

  const filteredHistory = useMemo(() => {
    let filtered = historyToDisplay;

    if (dateFilter) {
        filtered = filtered.filter(record => {
            const recordDate = new Date(activeTab === 'items' ? (record as WithdrawalRecord).date : (record as ToolRecord).checkoutDate);
            return recordDate.getFullYear() === dateFilter.getFullYear() &&
                   recordDate.getMonth() === dateFilter.getMonth() &&
                   recordDate.getDate() === dateFilter.getDate();
        });
    }

    if (searchTerm) {
        const lowercasedSearch = searchTerm.toLowerCase();
        if (activeTab === 'items') {
            filtered = (filtered as WithdrawalRecord[]).filter(record =>
                record.item.name.toLowerCase().includes(lowercasedSearch) ||
                record.requestedBy.toLowerCase().includes(lowercasedSearch) ||
                record.requestedFor.toLowerCase().includes(lowercasedSearch)
            );
        } else {
            filtered = (filtered as ToolRecord[]).filter(record =>
                record.tool.name.toLowerCase().includes(lowercasedSearch) ||
                record.tool.assetId.toLowerCase().includes(lowercasedSearch) ||
                record.checkedOutBy.toLowerCase().includes(lowercasedSearch) ||
                record.usageLocation.toLowerCase().includes(lowercasedSearch)
            );
        }
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(activeTab === 'items' ? (a as WithdrawalRecord).date : (a as ToolRecord).checkoutDate).getTime();
      const dateB = new Date(activeTab === 'items' ? (b as WithdrawalRecord).date : (b as ToolRecord).checkoutDate).getTime();
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
    const title = activeTab === 'items' ? "Histórico de Retirada de Itens" : "Histórico de Movimentação de Ferramentas";
    const filename = activeTab === 'items' ? `historico_itens_${format(new Date(), 'yyyy-MM-dd')}.pdf` : `historico_ferramentas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 30);
  
    if (activeTab === 'items') {
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
    } else {
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

    doc.save(filename);
    toast({ title: "Exportação Concluída", description: "Seu arquivo PDF foi baixado." });
  };

  const clearFilters = () => {
    setDateFilter(undefined);
    setSearchTerm('');
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">Itens</TabsTrigger>
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
        <ScrollArea className="flex-grow rounded-md border">
          {activeTab === 'items' ? (
            <ItemHistoryTab paginatedHistory={paginatedHistory as WithdrawalRecord[]} onDeleteRecord={onDeleteItemRecord} onViewDetails={setViewingItemRecord} />
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

// Sub-component for Item History
function ItemHistoryTab({ paginatedHistory, onDeleteRecord, onViewDetails }: { paginatedHistory: WithdrawalRecord[], onDeleteRecord: (id: string) => void, onViewDetails: (record: WithdrawalRecord) => void }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead className="hidden md:table-cell">Quem</TableHead>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>}
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

