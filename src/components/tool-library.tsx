
"use client";

import { useState, useMemo } from 'react';
import type { Tool, ToolRecord } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Edit, Trash, Search, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { SignatureDisplayDialog } from './signature-display-dialog';
import { Badge } from './ui/badge';

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

  const handleCardClick = (tool: Tool) => {
    const lastRecord = toolHistory
      .filter(r => r.tool.id === tool.id)
      .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime())[0];
    
    if (lastRecord) {
      setViewingRecord(lastRecord);
    }
  };

  return (
    <>
      <Card className="shadow-lg h-full flex flex-col bg-transparent sm:bg-card border-none sm:border">
        <CardHeader className="bg-card rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                  <CardTitle>Biblioteca de Ferramentas</CardTitle>
                  <CardDescription>Gerencie todas as ferramentas cadastradas.</CardDescription>
              </div>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => { onSetEditingTool(null); onSetIsAddToolDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Ferramenta
              </Button>
          </div>
          <div className="relative pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Pesquisar por nome ou patrimônio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
            />
        </div>
        </CardHeader>
        <CardContent className="flex-grow p-0 sm:p-6 mt-4 sm:mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.length > 0 ? (
              filteredTools.map(tool => {
                const status = toolStatusMap.get(tool.id) || 'Disponível';
                const isAvailable = status === 'Disponível';

                return (
                  <Card key={tool.id} className="overflow-hidden hover:bg-muted/50 transition-colors flex flex-col">
                    <CardContent className="p-4 flex-grow cursor-pointer" onClick={() => handleCardClick(tool)}>
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-card-foreground leading-tight">{tool.name}</p>
                        <Badge variant={isAvailable ? "default" : "secondary"} className={`text-xs ${isAvailable ? 'bg-green-600' : ''}`}>
                          {status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono mt-1">{tool.assetId}</p>
                    </CardContent>
                    <div className="bg-card-footer p-2 flex items-center justify-end gap-1 border-t">
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
                  </Card>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-12 col-span-full">
                Nenhuma ferramenta encontrada.
              </div>
            )}
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
