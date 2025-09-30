
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar as CalendarIcon, FileDown, Trash, X, ChevronLeft, ChevronRight } from "lucide-react";

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
    <Card className="shadow-lg">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Histórico Geral</CardTitle>
          <CardDescription>Visualize, filtre e exporte todas as movimentações.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportToPDF}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">Retirada de Itens</TabsTrigger>
                <TabsTrigger value="tools">Movimentação de Ferramentas</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4">
                <ItemHistoryTab history={itemHistory} onDeleteRecord={onDeleteItemRecord} />
            </TabsContent>
            <TabsContent value="tools" className="mt-4">
                <ToolHistoryTab history={toolHistory} onDeleteRecord={onDeleteToolRecord} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Sub-component for Item History
function ItemHistoryTab({ history, onDeleteRecord }: { history: WithdrawalRecord[], onDeleteRecord: (id: string) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFilter, setDateFilter] = useState<Date | undefined>();
    const [requesterFilter, setRequesterFilter] = useState('');
    const [destinationFilter, setDestinationFilter] = useState('');
  
    const filteredHistory = useMemo(() => {
      setCurrentPage(1);
      return history.filter(record => {
        const recordDate = new Date(record.date);
        const isDateMatch = !dateFilter || (recordDate.getFullYear() === dateFilter.getFullYear() && recordDate.getMonth() === dateFilter.getMonth() && recordDate.getDate() === dateFilter.getDate());
        const isRequesterMatch = !requesterFilter || record.requestedBy.toLowerCase().includes(requesterFilter.toLowerCase());
        const isDestinationMatch = !destinationFilter || record.requestedFor.toLowerCase().includes(destinationFilter.toLowerCase());
        return isDateMatch && isRequesterMatch && isDestinationMatch;
      });
    }, [history, dateFilter, requesterFilter, destinationFilter]);
  
    const paginatedHistory = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);
  
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  
    return (
      <div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus locale={ptBR} /></PopoverContent>
          </Popover>
          <Input placeholder="Quem retirou..." value={requesterFilter} onChange={(e) => setRequesterFilter(e.target.value)} />
          <Input placeholder="Destino..." value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)} />
          <Button variant="ghost" onClick={() => { setDateFilter(undefined); setRequesterFilter(''); setDestinationFilter(''); }}>
            <X className="mr-2 h-4 w-4" /> Limpar Filtros
          </Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Item</TableHead><TableHead>Qtd.</TableHead><TableHead>Quem</TableHead><TableHead>Destino</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedHistory.length > 0 ? paginatedHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="text-muted-foreground">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium">{record.item.name}</TableCell>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft />Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Próxima<ChevronRight /></Button>
            </div>
          </div>
        )}
      </div>
    );
}

// Sub-component for Tool History
function ToolHistoryTab({ history, onDeleteRecord }: { history: ToolRecord[], onDeleteRecord: (id: string) => void }) {
    // Similar filtering and pagination logic can be applied here if needed
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Retirado por</TableHead>
                    <TableHead>Data Retirada</TableHead>
                    <TableHead>Data Devolução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {history.length > 0 ? history.map(record => (
                    <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.tool.name} <span className="text-xs text-muted-foreground">({record.tool.assetId})</span></TableCell>
                        <TableCell>{record.checkedOutBy}</TableCell>
                        <TableCell>{format(new Date(record.checkoutDate), 'dd/MM/yy HH:mm')}</TableCell>
                        <TableCell>{record.returnDate ? format(new Date(record.returnDate), 'dd/MM/yy HH:mm') : '—'}</TableCell>
                        <TableCell>
                            {record.returnDate 
                                ? <Badge variant={record.isDamaged ? "destructive" : "secondary"}>{record.isDamaged ? "Com Avaria" : "Devolvido"}</Badge>
                                : <Badge>Em uso</Badge>
                            }
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
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        Nenhum registro de movimentação de ferramentas.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

    