
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar as CalendarIcon, FileDown, Trash, X, ChevronLeft, ChevronRight } from "lucide-react";

import type { WithdrawalRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 5;

interface HistoryPanelProps {
  history: WithdrawalRecord[];
  onDeleteRecord: (recordId: string) => void;
}

// Extend the window interface for jspdf-autotable
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export function HistoryPanel({ history, onDeleteRecord }: HistoryPanelProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [requesterFilter, setRequesterFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');

  const filteredHistory = useMemo(() => {
    setCurrentPage(1); // Reset page on filter change
    return history.filter(record => {
      const recordDate = new Date(record.date);
      const isDateMatch = !dateFilter || (
        recordDate.getFullYear() === dateFilter.getFullYear() &&
        recordDate.getMonth() === dateFilter.getMonth() &&
        recordDate.getDate() === dateFilter.getDate()
      );
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

  const clearFilters = () => {
    setDateFilter(undefined);
    setRequesterFilter('');
    setDestinationFilter('');
  };

  const handleExportToPDF = () => {
    if (history.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum dado para exportar",
        description: "O histórico de retiradas está vazio.",
      });
      return;
    }
  
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Histórico de Retiradas", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 30);
  
    (doc as any).autoTable({
      startY: 35,
      head: [['Data', 'Item', 'Specs', 'Qtd.', 'Quem Retirou', 'Destino']],
      body: history.map(record => [
        format(new Date(record.date), 'dd/MM/yy'),
        record.item.name,
        record.item.specifications,
        `${record.quantity} ${record.unit}`,
        record.requestedBy,
        record.requestedFor,
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.5,
      },
      headStyles: {
        fillColor: [22, 163, 74], // Cor verde para o cabeçalho
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [242, 242, 242],
      },
    });
  
    doc.save(`historico_retiradas_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  
    toast({ title: "Exportação Concluída", description: "Seu arquivo PDF foi baixado." });
  };

  return (
    <Card className="lg:col-span-2 shadow-lg">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Histórico de Retiradas</CardTitle>
          <CardDescription>Visualize e filtre as retiradas.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportToPDF}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
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
            <Input placeholder="Para quem (destino)..." value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)} />
            <Button variant="ghost" onClick={clearFilters} className="w-full">
                <X className="mr-2 h-4 w-4" /> Limpar Filtros
            </Button>
        </div>

        <Table>
          <TableHeader><TableRow><TableHead className="w-[100px]">Data</TableHead><TableHead>Item</TableHead><TableHead className="text-center">Qtd.</TableHead><TableHead>Quem</TableHead><TableHead>Para Quem</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedHistory.length > 0 ? (
              paginatedHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-muted-foreground">{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">{record.item.name}</TableCell>
                  <TableCell className="text-center">{record.quantity}{record.unit}</TableCell>
                  <TableCell>{record.requestedBy}</TableCell>
                  <TableCell>{record.requestedFor}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /><span className="sr-only">Excluir</span></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteRecord(record.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft />Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Próxima<ChevronRight /></Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
