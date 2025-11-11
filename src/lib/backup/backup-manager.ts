import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { format } from 'date-fns';

export interface BackupData {
  schema: string;
  version: string;
  exportedAt: string;
  deviceId?: string;
  checksum?: string;
  data: {
    stockItems: any[];
    history: any[];
    entryHistory: any[];
    tools: any[];
    toolHistory: any[];
  };
}

export interface BackupMetadata {
  filename: string;
  path: string;
  size: number;
  created: Date;
  itemCount: number;
}

const BACKUP_DIR = 'Backups';
const BACKUP_SCHEMA = 'almoxarifado.backup.v2';

export class BackupManager {
  /**
   * Cria backup local em Documents/Backups/
   * Retorna o path completo do arquivo criado
   */
  static async createLocalBackup(data: BackupData['data']): Promise<string> {
    const timestamp = format(new Date(), 'dd-MM-yyyy_HH-mm');
    const filename = `Backup_Almoxarifado_${timestamp}.json`;
    
    const backup: BackupData = {
      schema: BACKUP_SCHEMA,
      version: '1.0.10',
      exportedAt: new Date().toISOString(),
      deviceId: await this.getDeviceId(),
      data,
    };

    // Gerar checksum para validação futura
    backup.checksum = await this.generateChecksum(JSON.stringify(backup.data));

    const json = JSON.stringify(backup, null, 2);

    if (Capacitor.isNativePlatform()) {
      // Garantir que a pasta existe
      await this.ensureBackupDirectory();

      // Salvar arquivo
      const result = await Filesystem.writeFile({
        path: `${BACKUP_DIR}/${filename}`,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      } as any);

      // Retornar path legível
      const uri = await Filesystem.getUri({
        path: `${BACKUP_DIR}/${filename}`,
        directory: Directory.Documents,
      } as any);

      console.log('[BACKUP] Arquivo salvo:', uri.uri);
      return uri.uri;
    } else {
      // Web: download tradicional
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return filename;
    }
  }

  /**
   * Lista todos os backups disponíveis em Documents/Backups/
   */
  static async listLocalBackups(): Promise<BackupMetadata[]> {
    if (!Capacitor.isNativePlatform()) {
      return []; // Web não suporta listagem
    }

    try {
      await this.ensureBackupDirectory();

      const result = await Filesystem.readdir({
        path: BACKUP_DIR,
        directory: Directory.Documents,
      } as any);

      const backups: BackupMetadata[] = [];

      for (const file of result.files) {
        if (!file.name.endsWith('.json')) continue;

        try {
          const stat = await Filesystem.stat({
            path: `${BACKUP_DIR}/${file.name}`,
            directory: Directory.Documents,
          } as any);

          // Tentar ler o arquivo para contar itens
          const content = await Filesystem.readFile({
            path: `${BACKUP_DIR}/${file.name}`,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          } as any);

          const parsed = JSON.parse(content.data as string) as BackupData;
          const itemCount = 
            (parsed.data?.stockItems?.length || 0) +
            (parsed.data?.history?.length || 0) +
            (parsed.data?.entryHistory?.length || 0) +
            (parsed.data?.tools?.length || 0) +
            (parsed.data?.toolHistory?.length || 0);

          backups.push({
            filename: file.name,
            path: `${BACKUP_DIR}/${file.name}`,
            size: stat.size,
            created: new Date(stat.mtime),
            itemCount,
          });
        } catch (err) {
          console.warn(`[BACKUP] Erro ao processar ${file.name}:`, err);
        }
      }

      // Ordenar por data (mais recente primeiro)
      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('[BACKUP] Erro ao listar backups:', error);
      return [];
    }
  }

  /**
   * Restaura backup de um arquivo local
   */
  static async restoreLocalBackup(path: string): Promise<BackupData['data']> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Restore local só funciona em dispositivos móveis');
    }

    const content = await Filesystem.readFile({
      path,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    } as any);

    const parsed = JSON.parse(content.data as string) as BackupData;

    // Validar checksum se existir
    if (parsed.checksum) {
      const computedChecksum = await this.generateChecksum(JSON.stringify(parsed.data));
      if (computedChecksum !== parsed.checksum) {
        throw new Error('Arquivo corrompido: checksum inválido');
      }
    }

    // Validar schema
    if (!parsed.schema || !parsed.schema.includes('almoxarifado.backup')) {
      throw new Error('Formato de backup inválido');
    }

    return parsed.data;
  }

  /**
   * Compartilha backup via Share sheet (para enviar por WhatsApp, Drive, etc)
   */
  static async shareBackup(path: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Share só funciona em dispositivos móveis');
    }

    const uri = await Filesystem.getUri({
      path,
      directory: Directory.Documents,
    } as any);

    await Share.share({
      title: 'Compartilhar Backup do Almoxarifado',
      text: 'Backup completo do sistema de controle de estoque',
      url: uri.uri,
      dialogTitle: 'Enviar Backup',
    });
  }

  /**
   * Deleta backup local
   */
  static async deleteBackup(path: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    await Filesystem.deleteFile({
      path,
      directory: Directory.Documents,
    } as any);
  }

  /**
   * Garante que a pasta Documents/Backups/ existe
   */
  private static async ensureBackupDirectory(): Promise<void> {
    try {
      await Filesystem.readdir({
        path: BACKUP_DIR,
        directory: Directory.Documents,
      } as any);
    } catch {
      // Pasta não existe, criar
      await Filesystem.mkdir({
        path: BACKUP_DIR,
        directory: Directory.Documents,
        recursive: true,
      } as any);
    }
  }

  /**
   * Gera checksum SHA-256 para validação de integridade
   */
  private static async generateChecksum(data: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback simples (não criptográfico)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Obtém ID único do dispositivo (para identificar backups)
   */
  private static async getDeviceId(): Promise<string> {
    if (typeof localStorage !== 'undefined') {
      let id = localStorage.getItem('deviceId');
      if (!id) {
        id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('deviceId', id);
      }
      return id;
    }
    return 'unknown';
  }

  /**
   * Formata tamanho de arquivo para exibição
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
