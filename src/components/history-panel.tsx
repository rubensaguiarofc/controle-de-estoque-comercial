
"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar as CalendarIcon, FileDown, Trash, X, ChevronLeft, ChevronRight, PenSquare, Search } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("items");
  const [signatureRecord, setSignatureRecord] = useState<ToolRecord | null>(null);

  const handleExportToPDF = () => {
    if (activeTab === 'items' && itemHistory.length === 0) {
      toast({ variant: "destructive", title: "Nenhum dado para exportar" });
      return;
    }
    if (activeTab === 'tools' && toolHistory.length === 0) {
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
            body: itemHistory.map(record => [
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
            body: toolHistory.map(record => [
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

  return (
    <>
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Histórico Geral</CardTitle>
          <CardDescription>Visualize, filtre e exporte todas as movimentações.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportToPDF} className="shrink-0">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">Retirada de Itens</TabsTrigger>
                <TabsTrigger value="tools">Movimentação de Ferramentas</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4 flex flex-col flex-grow">
                <ItemHistoryTab history={itemHistory} onDeleteRecord={onDeleteItemRecord} />
            </TabsContent>
            <TabsContent value="tools" className="mt-4 flex flex-col flex-grow">
                <ToolHistoryTab history={toolHistory} onDeleteRecord={onDeleteToolRecord} onShowSignatures={setSignatureRecord} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
     <SignatureDisplayDialog 
        record={signatureRecord}
        isOpen={!!signatureRecord}
        onOpenChange={(isOpen) => !isOpen && setSignatureRecord(null)}
      />
    </>
  );
}

function Paginator({ currentPage, totalPages, onPageChange, className }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void, className?: string }) {
    if (totalPages <= 1) return null;
    return (
        <div className={cn("flex items-center justify-between pt-4", className)}>
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft className="mr-2" />
                    Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Próxima
                    <ChevronRight className="ml-2" />
                </Button>
            </div>
        </div>
    );
}

// Sub-component for Item History
function ItemHistoryTab({ history, onDeleteRecord }: { history: WithdrawalRecord[], onDeleteRecord: (id: string) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFilter, setDateFilter] = useState<Date | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
  
    const filteredHistory = useMemo(() => {
      let filtered = history;
  
      if (dateFilter) {
          filtered = filtered.filter(record => {
              const recordDate = new Date(record.date);
              return recordDate.getFullYear() === dateFilter.getFullYear() &&
                     recordDate.getMonth() === dateFilter.getMonth() &&
                     recordDate.getDate() === dateFilter.getDate();
          });
      }
  
      if (searchTerm) {
          const lowercasedSearch = searchTerm.toLowerCase();
          filtered = filtered.filter(record =>
              record.item.name.toLowerCase().includes(lowercasedSearch) ||
              record.requestedBy.toLowerCase().includes(lowercasedSearch) ||
              record.requestedFor.toLowerCase().includes(lowercasedSearch)
          );
      }
      
      return filtered;
    }, [history, dateFilter, searchTerm]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  
    const paginatedHistory = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);
    
    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter, searchTerm]);
  
    return (
      <div className="space-y-4 flex flex-col flex-grow">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-slate-50/50">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por item, quem retirou, destino..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus locale={ptBR} /></PopoverContent>
            </Popover>
            <Button variant="ghost" onClick={() => { setDateFilter(undefined); setSearchTerm(''); }}>
                <X className="mr-2 h-4 w-4" /> Limpar Filtros
            </Button>
        </div>
        <ScrollArea className="flex-grow">
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Item</TableHead><TableHead>Qtd.</TableHead><TableHead>Quem</TableHead><TableHead>Destino</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedHistory.length > 0 ? paginatedHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="text-muted-foreground">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{record.item.name}</TableCell>
                <TableCell>{record.quantity}{record.unit}</TableCell>
                <TableCell>{record.requestedBy}</TableCell>
                <TableCell>{record.requestedFor}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
        </ScrollArea>
        <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
}

// Sub-component for Tool History
function ToolHistoryTab({ history, onDeleteRecord, onShowSignatures }: { history: ToolRecord[], onDeleteRecord: (id: string) => void, onShowSignatures: (record: ToolRecord) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
  
    const filteredHistory = useMemo(() => {
        if (!searchTerm) return history;
        const lowercasedSearch = searchTerm.toLowerCase();
        return history.filter(record =>
            record.tool.name.toLowerCase().includes(lowercasedSearch) ||
            record.tool.assetId.toLowerCase().includes(lowercasedSearch) ||
            record.checkedOutBy.toLowerCase().includes(lowercasedSearch) ||
            record.usageLocation.toLowerCase().includes(lowercasedSearch)
        );
    }, [history, searchTerm]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-4 flex flex-col flex-grow">
            <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-slate-50/50">
                 <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por ferramenta, patrimônio, responsável..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button variant="ghost" onClick={() => setSearchTerm('')} className="sm:col-span-2">
                    <X className="mr-2 h-4 w-4" /> Limpar Filtro
                </Button>
            </div>
            <ScrollArea className="flex-grow">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ferramenta</TableHead>
                        <TableHead>Retirado por</TableHead>
                        <TableHead>Data Retirada</TableHead>
                        <TableHead>Data Devolução</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assinaturas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedHistory.length > 0 ? paginatedHistory.map(record => (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium whitespace-nowrap">{record.tool.name} <span className="text-xs text-muted-foreground">({record.tool.assetId})</span></TableCell>
                            <TableCell>{record.checkedOutBy}</TableCell>
                            <TableCell>{format(new Date(record.checkoutDate), 'dd/MM/yy HH:mm')}</TableCell>
                            <TableCell>{record.returnDate ? format(new Date(record.returnDate), 'dd/MM/yy HH:mm') : '—'}</TableCell>
                            <TableCell>
                                {record.returnDate 
                                    ? <Badge variant={record.isDamaged ? "destructive" : "secondary"}>{record.isDamaged ? "Com Avaria" : "Devolvido"}</Badge>
                                    : <Badge>Em uso</Badge>
                                }
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => onShowSignatures(record)}>
                                    <PenSquare className="h-4 w-4" />
                                    <span className="sr-only">Ver assinaturas</span>
                                </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e removerá este registro para sempre. Continue com cuidado.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
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
            </ScrollArea>
            <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}
