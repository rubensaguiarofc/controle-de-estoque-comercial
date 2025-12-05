"use client";

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { BackupManager, type BackupMetadata } from '@/lib/backup/backup-manager';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (data: any) => Promise<void>;
}

export function BackupListDialog({ open, onOpenChange, onRestore }: BackupListDialogProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadBackups();
    }
  }, [open]);

  useEffect(() => {
    console.log('[BACKUP] confirmOpen changed:', confirmOpen, 'selectedBackup:', selectedBackup?.filename);
  }, [confirmOpen, selectedBackup]);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const list = await BackupManager.listLocalBackups();
      setBackups(list);
      if (list.length === 0) {
        toast({
          title: 'Nenhum backup encontrado',
          description: 'Crie um backup primeiro usando o botão "Exportar Backup".',
        });
      }
    } catch (error) {
      console.error('[BACKUP] Erro ao listar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível listar os backups disponíveis.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) {
      console.log('[BACKUP] Nenhum backup selecionado');
      return;
    }

    console.log('[BACKUP] Iniciando restauração:', selectedBackup.filename);

    try {
      toast({
        title: 'Restaurando backup...',
        description: 'Aguarde enquanto importamos os dados.',
      });

      const data = await BackupManager.restoreLocalBackup(selectedBackup.path);
      console.log('[BACKUP] Dados carregados, chamando onRestore');
      
      await onRestore(data);

      toast({
        title: 'Backup restaurado!',
        description: `${selectedBackup.itemCount} itens importados com sucesso.`,
      });

      setConfirmOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('[BACKUP] Erro ao restaurar:', error);
      toast({
        variant: 'destructive',
        title: 'Falha na restauração',
        description: error.message || 'Não foi possível restaurar o backup.',
      });
    }
  };

  const handleShare = async (backup: BackupMetadata) => {
    try {
      await BackupManager.shareBackup(backup.path);
      toast({
        title: 'Compartilhamento iniciado',
        description: 'Escolha como deseja enviar o backup.',
      });
    } catch (error) {
      console.error('[BACKUP] Erro ao compartilhar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível compartilhar o backup.',
      });
    }
  };

  const handleDelete = async (backup: BackupMetadata) => {
    try {
      await BackupManager.deleteBackup(backup.path);
      toast({
        title: 'Backup deletado',
        description: `${backup.filename} foi removido.`,
      });
      loadBackups(); // Recarregar lista
    } catch (error) {
      console.error('[BACKUP] Erro ao deletar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível deletar o backup.',
      });
    }
  };

  // Handler para importar arquivo de qualquer pasta (input file)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    // Em plataformas nativas, tentamos usar o picker nativo
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          toast({ title: 'Abrindo seletor de arquivos...' });
          const data = await BackupManager.pickExternalBackup();
          toast({ title: 'Importando backup...', description: 'Aguarde enquanto aplicamos os dados.' });
          await onRestore(data);
          toast({ title: 'Backup importado', description: 'Backup importado com sucesso.' });
          onOpenChange(false);
        } catch (err: any) {
          console.error('[BACKUP] Erro no picker nativo:', err);
          // Se o erro indicar falta de permissão, abrir diálogo de instruções
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('permission') || msg.includes('manage') || msg.includes('perm') || msg.includes('acesso')) {
            setPermissionDialogOpen(true);
            return;
          }
          toast({ variant: 'destructive', title: 'Erro', description: err.message || 'Não foi possível selecionar o arquivo.' });
        }
      })();
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Basic validation of schema
      if (!parsed || !parsed.schema || !String(parsed.schema).includes('almoxarifado.backup')) {
        throw new Error('Arquivo não parece ser um backup válido do aplicativo.');
      }

      toast({ title: 'Importando backup...', description: 'Aguarde enquanto aplicamos os dados.' });
      await onRestore(parsed.data);
      toast({ title: 'Backup importado', description: `Backup '${file.name}' importado com sucesso.` });
      onOpenChange(false);
      setConfirmOpen(false);
    } catch (err: any) {
      console.error('[BACKUP] Erro ao importar arquivo:', err);
      toast({ variant: 'destructive', title: 'Falha ao importar', description: err.message || 'Arquivo inválido.' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Backups Disponíveis</DialogTitle>
            <DialogDescription>
              Selecione um backup para restaurar ou gerenciar
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-muted-foreground">Carregando backups...</div>
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  Nenhum backup encontrado
                </div>
                <div className="text-xs text-muted-foreground">
                  Crie um backup usando o botão "Exportar Backup"
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {backups.map((backup) => (
                  <div
                    key={backup.path}
                    className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {backup.filename}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(backup.created, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {backup.itemCount} itens • {BackupManager.formatFileSize(backup.size)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[BACKUP] Restaurar clicado:', backup.filename);
                          setSelectedBackup(backup);
                          setConfirmOpen(true);
                        }}
                        className="flex-1"
                      >
                        Restaurar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(backup);
                        }}
                        className="flex-1"
                      >
                        Compartilhar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(backup);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImportClick}>
                Importar arquivo...
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de restauração */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Restauração</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar este backup?
            </DialogDescription>
          </DialogHeader>
          {selectedBackup && (
            <div className="py-4">
              <div className="text-sm font-medium mb-2">{selectedBackup.filename}</div>
              <div className="text-xs text-muted-foreground">
                Criado em {format(selectedBackup.created, "dd/MM/yyyy 'às' HH:mm")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedBackup.itemCount} itens serão importados
              </div>
              <div className="mt-4 p-3 bg-muted rounded-md text-xs">
                ⚠️ Esta ação irá <strong>mesclar</strong> os dados do backup com os dados atuais.
                Itens duplicados serão atualizados.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRestore}>
              Confirmar Restauração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo de instruções quando falta permissão de arquivos */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissão necessária</DialogTitle>
            <DialogDescription>
              Para importar backups de pastas externas é necessário conceder acesso a arquivos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm mb-2">Siga os passos:</div>
            <ol className="text-xs list-decimal ml-5 space-y-1">
              <li>Abra as Configurações do aplicativo.</li>
              <li>Permissões → Arquivos e mídia (Allow manage all files).</li>
              <li>Ative o acesso para este aplicativo.</li>
            </ol>
            <div className="mt-4 text-xs text-muted-foreground">Após habilitar, volte e tente importar novamente.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>Fechar</Button>
            <Button onClick={() => { BackupManager.openAppSettings(); }}>Abrir configurações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hidden file input usado para importar backups de qualquer pasta */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.backup.json,application/json,text/json,text/plain"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
    </>
  );
}
