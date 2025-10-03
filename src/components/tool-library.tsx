
"use client";

import { useState, useMemo } from 'react';
import type { Tool, ToolRecord } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, Trash, Search, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { SignatureDisplayDialog } from './signature-display-dialog';

interface ToolLibraryProps {
  tools: Tool[];
  setTools: (tools: Tool[]) => void;
  toolHistory: ToolRecord[];
  onSetIsAddToolDialogOpen: (isOpen: boolean) => void;
  onSetEditingTool: (tool: Tool | null) => void;
}

export function ToolLibrary({
  tools,
  setTools,
  toolHistory,
  onSetIsAddToolDialogOpen,
  onSetEditingTool,
}: ToolLibraryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecord, setViewingRecord] = useState<ToolRecord | null>(null);

  const handleEdit = (tool: Tool) => {
    onSetEditingTool(tool);
    onSetIsAddToolDialogOpen(true);
  };

  const handleDelete = (toolId: string) => {
    const updatedTools = tools.filter(tool => tool.id !== toolId);
    setTools(updatedTools);
    toast({
        title: "Ferramenta Excluída",
        description: "A ferramenta foi removida da biblioteca.",
    })
  };

  const filteredTools = useMemo(() => {
    if (!searchQuery) {
      return tools;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return tools.filter(tool =>
      tool.name.toLowerCase().includes(lowercasedQuery) ||
      tool.assetId.toLowerCase().includes(lowercasedQuery)
    );
  }, [tools, searchQuery]);

  // Find the latest record for each tool to show its status
  const toolStatusMap = useMemo(() => {
    const statusMap = new Map<string, 'Em uso' | 'Disponível'>();
    const latestRecords = new Map<string, ToolRecord>();

    toolHistory.forEach(record => {
      if (!latestRecords.has(record.tool.id) || new Date(record.checkoutDate) > new Date(latestRecords.get(record.tool.id)!.checkoutDate)) {
        latestRecords.set(record.tool.id, record);
      }
    });

    latestRecords.forEach((record) => {
      statusMap.set(record.tool.id, record.returnDate ? 'Disponível' : 'Em uso');
    });

    tools.forEach(tool => {
        if (!statusMap.has(tool.id)) {
            statusMap.set(tool.id, 'Disponível');
        }
    });
    
    return statusMap;
  }, [tools, toolHistory]);

  const handleRowClick = (tool: Tool) => {
    const record = toolHistory.find(r => r.tool.id === tool.id);
    if (record) {
      setViewingRecord(record);
    } else {
      // Create a dummy record for display if no history exists for the tool
      const dummyRecord: ToolRecord = {
        id: `DUMMY-${tool.id}`,
        tool,
        checkoutDate: new Date().toISOString(),
        checkedOutBy: 'N/A',
        usageLocation: 'N/A',
        checkoutSignature: '',
      }
      setViewingRecord(dummyRecord);
    }
  };

  return (
    <>
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
              <div className="flex-1">
                  <CardTitle>Biblioteca de Ferramentas</CardTitle>
                  <CardDescription>Gerencie todas as ferramentas cadastradas.</CardDescription>
              </div>
              <Button onClick={() => { onSetEditingTool(null); onSetIsAddToolDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar
              </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Pesquisar por nome ou patrimônio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
              />
          </div>
          <div className="flex-grow rounded-md border overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Patrimônio</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTools.length > 0 ? (
                filteredTools.map(tool => (
                  <TableRow key={tool.id} onClick={() => handleRowClick(tool)} className="cursor-pointer">
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell className="font-mono text-sm hidden md:table-cell">{tool.assetId}</TableCell>
                    <TableCell className="hidden md:table-cell">{toolStatusMap.get(tool.id) || 'Disponível'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleEdit(tool);}}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá permanentemente a ferramenta.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(tool.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    Nenhuma ferramenta encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      <SignatureDisplayDialog
        record={viewingRecord}
        isOpen={!!viewingRecord}
        onOpenChange={(isOpen) => !isOpen && setViewingRecord(null)}
      />
    </>
  );
}
