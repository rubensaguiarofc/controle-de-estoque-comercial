
"use client";

import { useState, useMemo } from 'react';
import type { Tool } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, Trash, Search, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';

interface ToolLibraryProps {
  tools: Tool[];
  setTools: (tools: Tool[]) => void;
  onSetIsAddToolDialogOpen: (isOpen: boolean) => void;
  onSetEditingTool: (tool: Tool | null) => void;
}

export function ToolLibrary({
  tools,
  setTools,
  onSetIsAddToolDialogOpen,
  onSetEditingTool,
}: ToolLibraryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
            <div>
                <CardTitle>Biblioteca de Ferramentas</CardTitle>
                <CardDescription>Gerencie todas as ferramentas cadastradas.</CardDescription>
            </div>
            <Button onClick={() => { onSetEditingTool(null); onSetIsAddToolDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Nova Ferramenta
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar por nome ou patrimônio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Patrimônio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTools.length > 0 ? (
              filteredTools.map(tool => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell className="font-mono text-sm">{tool.assetId}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tool)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  Nenhuma ferramenta encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
    