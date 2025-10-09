
"use client";

import { useState } from 'react';
import type { Tool, ToolRecord } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { ReturnToolDialog } from './return-tool-dialog';
import { CheckoutToolDialog } from './checkout-tool-dialog';
import { SignatureDisplayDialog } from './signature-display-dialog';

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

  const [viewingRecord, setViewingRecord] = useState<ToolRecord | null>(null);

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
      <Card className="shadow-lg h-full flex flex-col">
          <CardHeader>
              <CardTitle>Movimentação de Ferramentas</CardTitle>
              <CardDescription>Registre retiradas e devoluções de ferramentas.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-6">
            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Registrar Nova Retirada</h3>
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="space-y-2 flex-grow w-full">
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
                    <Button onClick={handleOpenCheckout} className="w-full sm:w-auto">
                        Retirar Ferramenta
                    </Button>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Ferramentas em Uso</h3>
<<<<<<< HEAD
                <ScrollArea className="bg-card border border-border rounded-lg">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Ferramenta</TableHead>
                              <TableHead className="hidden md:table-cell">Retirado por</TableHead>
                              <TableHead className="hidden md:table-cell">Local</TableHead>
                              <TableHead className="hidden md:table-cell">Data Retirada</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-center">Ação</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {toolsOutRecords.length > 0 ? toolsOutRecords.map(record => (
                              <TableRow key={record.id} onClick={() => setViewingRecord(record)} className="cursor-pointer">
                                  <TableCell className="font-medium">{record.tool.name} <span className="text-muted-foreground text-xs md:hidden">({record.tool.assetId})</span></TableCell>
                                  <TableCell className="hidden md:table-cell">{record.checkedOutBy}</TableCell>
                                  <TableCell className="hidden md:table-cell">{record.usageLocation}</TableCell>
                                  <TableCell className="whitespace-nowrap hidden md:table-cell">{new Date(record.checkoutDate).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell>
                                      <Badge>Em uso</Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                      <Button size="sm" onClick={(e) => {e.stopPropagation(); handleOpenReturnDialog(record);}}>Devolver</Button>
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
=======
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {toolsOutRecords.length > 0 ? toolsOutRecords.map(record => (
                    <Card key={record.id} className="overflow-hidden hover:bg-muted/50 transition-colors flex flex-col">
                      <CardContent className="p-4 cursor-pointer flex-grow" onClick={() => setViewingRecord(record)}>
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-card-foreground leading-tight">{record.tool.name}</p>
                            <Badge>Em uso</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono mt-1">{record.tool.assetId}</p>
                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            <p><span className="font-medium text-foreground">Retirado por:</span> {record.checkedOutBy}</p>
                            <p><span className="font-medium text-foreground">Local:</span> {record.usageLocation}</p>
                            <p><span className="font-medium text-foreground">Data:</span> {new Date(record.checkoutDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </CardContent>
                      <div className="bg-card-footer p-2 flex items-center justify-end border-t">
                        <Button size="sm" className="w-full" onClick={() => handleOpenReturnDialog(record)}>Devolver</Button>
                      </div>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      Nenhuma ferramenta em uso no momento.
                    </div>
                  )}
                </div>
>>>>>>> origin/main
            </div>
          </CardContent>
      </Card>
      
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
        record={viewingRecord}
        isOpen={!!viewingRecord}
        onOpenChange={(isOpen) => !isOpen && setViewingRecord(null)}
      />
    </>
  );
}
