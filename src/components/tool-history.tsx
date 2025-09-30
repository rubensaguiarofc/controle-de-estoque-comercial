
"use client";

import { useState } from 'react';
import type { Tool, ToolRecord } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ReturnToolDialog } from './return-tool-dialog';

interface ToolHistoryProps {
  tools: Tool[];
  history: ToolRecord[];
  onCheckout: (tool: Tool, checkedOutBy: string, usageLocation: string) => void;
  onReturn: (recordId: string, isDamaged: boolean, damageDescription?: string, damagePhoto?: string, signature?: string) => void;
}

export function ToolHistory({ tools, history, onCheckout, onReturn }: ToolHistoryProps) {
  const { toast } = useToast();
  const [selectedToolId, setSelectedToolId] = useState('');
  const [checkedOutBy, setCheckedOutBy] = useState('');
  const [usageLocation, setUsageLocation] = useState('');

  const [isReturnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<ToolRecord | null>(null);

  const toolsOut = history.filter(h => !h.returnDate).map(h => h.tool.id);
  const availableTools = tools.filter(t => !toolsOut.includes(t.id));

  const handleCheckout = () => {
    if (!selectedToolId || !checkedOutBy || !usageLocation) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para registrar a retirada.",
      });
      return;
    }
    const tool = tools.find(t => t.id === selectedToolId);
    if (tool) {
      onCheckout(tool, checkedOutBy, usageLocation);
      toast({ title: "Retirada Registrada", description: `${tool.name} retirada por ${checkedOutBy}.`});
      setSelectedToolId('');
      setCheckedOutBy('');
      setUsageLocation('');
    }
  };

  const handleOpenReturnDialog = (record: ToolRecord) => {
    setReturningRecord(record);
    setReturnDialogOpen(true);
  };
  
  const handleConfirmReturn = (returnData: { isDamaged: boolean; damageDescription?: string; damagePhoto?: string; signature: string; }) => {
    if (returningRecord) {
      onReturn(
        returningRecord.id,
        returnData.isDamaged,
        returnData.damageDescription,
        returnData.damagePhoto,
        returnData.signature
      );
      toast({ title: 'Devolução Registrada', description: `A ferramenta ${returningRecord.tool.name} foi marcada como devolvida.` });
    }
    setReturnDialogOpen(false);
    setReturningRecord(null);
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Registrar Retirada de Ferramenta</CardTitle>
            <CardDescription>Selecione a ferramenta, o responsável e o local de uso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div className="space-y-2">
                  <label className="text-sm font-medium">Ferramenta</label>
                  <Select onValueChange={setSelectedToolId} value={selectedToolId}>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione uma ferramenta" />
                      </SelectTrigger>
                      <SelectContent>
                          {availableTools.length > 0 ? availableTools.map(tool => (
                              <SelectItem key={tool.id} value={tool.id}>
                                  {tool.name} ({tool.assetId})
                              </SelectItem>
                          )) : <div className="p-4 text-sm text-muted-foreground">Nenhuma ferramenta disponível.</div>}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">Retirado por</label>
                  <Input
                      placeholder="Nome do responsável"
                      value={checkedOutBy}
                      onChange={(e) => setCheckedOutBy(e.target.value)}
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">Local de Uso</label>
                  <Input
                      placeholder="Ex: OBRA-01, OFICINA"
                      value={usageLocation}
                      onChange={(e) => setUsageLocation(e.target.value)}
                  />
              </div>
              <Button size="icon" onClick={handleCheckout}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Adicionar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Histórico de Movimentação</CardTitle>
            <CardDescription>Visualize todas as retiradas e devoluções.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Ferramenta</TableHead>
                          <TableHead>Retirado por</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Data Retirada</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {history.length > 0 ? history.map(record => (
                          <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.tool.name} <span className="text-muted-foreground text-xs">({record.tool.assetId})</span></TableCell>
                              <TableCell>{record.checkedOutBy}</TableCell>
                              <TableCell>{record.usageLocation}</TableCell>
                              <TableCell>{new Date(record.checkoutDate).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>
                                  {record.returnDate
                                      ? <Badge variant="secondary">Devolvido</Badge>
                                      : <Badge>Em uso</Badge>
                                  }
                              </TableCell>
                              <TableCell className="text-right">
                                  {!record.returnDate && (
                                      <Button size="sm" onClick={() => handleOpenReturnDialog(record)}>Devolver</Button>
                                  )}
                              </TableCell>
                          </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                              Nenhum registro de movimentação encontrado.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
      {returningRecord && (
        <ReturnToolDialog
          isOpen={isReturnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          record={returningRecord}
          onConfirm={handleConfirmReturn}
        />
      )}
    </>
  );
}
