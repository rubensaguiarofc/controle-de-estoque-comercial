
"use client";

import { useState } from 'react';
import { PenSquare } from 'lucide-react';
import type { Tool, ToolRecord } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ReturnToolDialog } from './return-tool-dialog';
import { CheckoutToolDialog } from './checkout-tool-dialog';
import { SignatureDisplayDialog } from './signature-display-dialog';
import { ScrollArea } from './ui/scroll-area';

interface ToolHistoryProps {
  tools: Tool[];
  history: ToolRecord[];
  onCheckout: (tool: Tool, checkedOutBy: string, usageLocation: string, checkoutSignature: string) => void;
  onReturn: (recordId: string, isDamaged: boolean, damageDescription?: string, damagePhoto?: string, signature?: string) => void;
}

export function ToolHistory({ tools, history, onCheckout, onReturn }: ToolHistoryProps) {
  const { toast } = useToast();
  const [selectedToolId, setSelectedToolId] = useState('');
  
  const [isReturnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<ToolRecord | null>(null);

  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkingOutTool, setCheckingOutTool] = useState<Tool | null>(null);

  const [signatureRecord, setSignatureRecord] = useState<ToolRecord | null>(null);

  const toolsOutRecords = history.filter(h => !h.returnDate);
  const toolsOutIds = toolsOutRecords.map(h => h.tool.id);
  const availableTools = tools.filter(t => !toolsOutIds.includes(t.id));

  const handleOpenCheckout = () => {
    if (!selectedToolId) {
      toast({ variant: 'destructive', title: 'Nenhuma ferramenta selecionada' });
      return;
    }
    const tool = availableTools.find(t => t.id === selectedToolId);
    if (tool) {
        setCheckingOutTool(tool);
        setCheckoutDialogOpen(true);
    }
  };

  const handleConfirmCheckout = (data: { checkedOutBy: string; usageLocation: string; signature: string }) => {
    if (checkingOutTool) {
        onCheckout(checkingOutTool, data.checkedOutBy, data.usageLocation, data.signature);
        toast({ title: 'Retirada Registrada', description: `${checkingOutTool.name} retirada por ${data.checkedOutBy}.`});
    }
    setCheckoutDialogOpen(false);
    setCheckingOutTool(null);
    setSelectedToolId('');
  }

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
            <CardDescription>Selecione a ferramenta disponível e clique em retirar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
              <div className="space-y-2">
                  <label className="text-sm font-medium">Ferramenta Disponível</label>
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
              <Button onClick={handleOpenCheckout}>
                Retirar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Ferramentas em Uso</CardTitle>
            <CardDescription>Ferramentas que foram retiradas e ainda não foram devolvidas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Ferramenta</TableHead>
                          <TableHead>Retirado por</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Data Retirada</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assinatura</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {toolsOutRecords.length > 0 ? toolsOutRecords.map(record => (
                          <TableRow key={record.id}>
                              <TableCell className="font-medium whitespace-nowrap">{record.tool.name} <span className="text-muted-foreground text-xs">({record.tool.assetId})</span></TableCell>
                              <TableCell>{record.checkedOutBy}</TableCell>
                              <TableCell>{record.usageLocation}</TableCell>
                              <TableCell>{new Date(record.checkoutDate).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>
                                  <Badge>Em uso</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => setSignatureRecord(record)}>
                                  <PenSquare className="h-4 w-4" />
                                  <span className="sr-only">Ver assinatura</span>
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button size="sm" onClick={() => handleOpenReturnDialog(record)}>Devolver</Button>
                              </TableCell>
                          </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                              Nenhuma ferramenta em uso no momento.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
            </ScrollArea>
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
      {checkingOutTool && (
        <CheckoutToolDialog
          isOpen={isCheckoutDialogOpen}
          onOpenChange={setCheckoutDialogOpen}
          tool={checkingOutTool}
          onConfirm={handleConfirmCheckout}
        />
      )}
      <SignatureDisplayDialog 
        record={signatureRecord}
        isOpen={!!signatureRecord}
        onOpenChange={(isOpen) => !isOpen && setSignatureRecord(null)}
      />
    </>
  );
}
