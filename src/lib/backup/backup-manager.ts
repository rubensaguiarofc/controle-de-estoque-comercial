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

  /**
   * Tenta abrir um file picker nativo (quando disponível no runtime) e retornar os dados do backup.
   * Esta função é defensiva: ela tenta suportar alguns plugins conhecidos e retorna os dados
   * do backup (parsed.data) ou lança um erro se não for possível obter o conteúdo.
   */
  static async pickExternalBackup(): Promise<BackupData['data']> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Picker nativo só disponível em dispositivos móveis');
    }

    // Tentativa 1: plugin exposto via Capacitor.Plugins.FilePicker
    const anyCap: any = (Capacitor as any);
    const plugins = anyCap.Plugins || (anyCap as any);

    const filePicker = plugins?.FilePicker || plugins?.filePicker || (globalThis as any).FilePicker || (globalThis as any).CapacitorFilePicker;

    // Suporte a plugins Cordova de file chooser (cordova-plugin-filechooser)
    const cordovaFileChooser = (globalThis as any).fileChooser || (globalThis as any).plugins?.fileChooser || (globalThis as any).cordovaFileChooser || (globalThis as any).plugins?.FileChooser;

    if (!filePicker && !cordovaFileChooser) {
      throw new Error('Plugin de seleção de arquivos não encontrado. Instale um plugin de file-picker nativo (ou cordova-plugin-filechooser) e rode `npx cap sync android`.');
    }

    // APIs dos plugins variam; tentamos algumas formas comuns de chamada
    let pickResult: any = null;

    if (filePicker) {
      if (typeof filePicker.pickFiles === 'function') {
        pickResult = await filePicker.pickFiles();
      } else if (typeof filePicker.pick === 'function') {
        pickResult = await filePicker.pick();
      } else if (typeof filePicker.open === 'function') {
        pickResult = await filePicker.open();
      } else {
        throw new Error('Plugin de file-picker encontrado, mas método de abertura não reconhecido.');
      }
    } else if (cordovaFileChooser) {
      // cordova-plugin-filechooser usa callback: fileChooser.open(success, error)
      pickResult = await new Promise((resolve, reject) => {
        try {
          const chooser = cordovaFileChooser;
          if (typeof chooser.open === 'function') {
            chooser.open((uri: string) => resolve({ uri }), (err: any) => reject(err));
          } else if (typeof chooser.choose === 'function') {
            chooser.choose((uri: string) => resolve({ uri }), (err: any) => reject(err));
          } else {
            reject(new Error('API do file chooser Cordova não reconhecida'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }

    // Normalizar resultado para um array de arquivos
    const files = pickResult?.files || pickResult?.file || (Array.isArray(pickResult) ? pickResult : null) || (pickResult?.results || null);

    const fileObj = Array.isArray(files) && files.length > 0 ? files[0] : (files || pickResult);

    // Possíveis formatos: { data: '<base64>' } ou { uri: 'content://...' } ou { webPath } etc.
    if (!fileObj) {
      throw new Error('Nenhum arquivo selecionado');
    }

    // Se o plugin já nos deu o conteúdo em base64 ou texto
    if (fileObj.data) {
      // Pode ser base64 ou texto JSON
      try {
        // Se for base64, tentar decodificar
        const maybeBase64 = String(fileObj.data);
        // heurística: se contém '{' ou '[' consideramos JSON direto
        if (maybeBase64.trim().startsWith('{') || maybeBase64.trim().startsWith('[')) {
          const parsed = JSON.parse(maybeBase64);
          return parsed.data;
        }
        // Caso contrário, tentar decodificar base64
        const decoded = atob(maybeBase64);
        const parsed = JSON.parse(decoded);
        return parsed.data;
      } catch (err) {
        throw new Error('Falha ao decodificar conteúdo do arquivo selecionado');
      }
    }

    // Se recebemos uma URI (content://) - tentar usar Filesystem.readFile pode não funcionar com content://
    if (fileObj.uri) {
      try {
        // Em muitos casos Cordova retornará uma URI content://; tentamos resolver via cordova-plugin-filepath
        const filePathPlugin = (globalThis as any).FilePath || (globalThis as any).cordovaFilePath || (globalThis as any).window?.FilePath || (globalThis as any).plugins?.FilePath;
        if (filePathPlugin && typeof filePathPlugin.resolveNativePath === 'function') {
          const nativePath = await new Promise<string>((resolve, reject) => {
            filePathPlugin.resolveNativePath(fileObj.uri, (p: string) => resolve(p), (err: any) => reject(err));
          });
          try {
            // Tentar ler via Filesystem com path nativo
            const content = await Filesystem.readFile({ path: nativePath, directory: Directory.External } as any);
            const parsed = JSON.parse(content.data as string);
            return parsed.data;
          } catch (err) {
            // fallback: tentar resolver via File API
          }
        }

        // fallback: tentar usar resolveLocalFileSystemURL (cordova-plugin-file)
        if ((globalThis as any).resolveLocalFileSystemURL) {
          const txt = await new Promise<string>((resolve, reject) => {
            try {
              (globalThis as any).resolveLocalFileSystemURL(fileObj.uri, (fileEntry: any) => {
                fileEntry.file((file: any) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = (e) => reject(e);
                  reader.readAsText(file);
                }, (err: any) => reject(err));
              }, (err: any) => reject(err));
            } catch (err) { reject(err); }
          });
          const parsed = JSON.parse(txt as string);
          return parsed.data;
        }

        throw new Error('Não foi possível ler o arquivo selecionado por URI. Dependendo do plugin, pode ser necessário instalar um plugin complementar (cordova-plugin-filepath e cordova-plugin-file).');
      } catch (err) {
        throw new Error('Não foi possível ler o arquivo selecionado por URI. Dependendo do plugin, pode ser necessário instalar um plugin complementar que retorne o conteúdo em base64.');
      }
    }

    // Se vier com webPath (alguns plugins retornam uma URL acessível no WebView)
    if (fileObj.webPath || fileObj.path) {
      try {
        const url = fileObj.webPath || fileObj.path;
        // fetch a URL local (apenas disponível em alguns webPaths)
        const res = await fetch(url);
        const txt = await res.text();
        const parsed = JSON.parse(txt);
        return parsed.data;
      } catch (err) {
        throw new Error('Falha ao buscar conteúdo via webPath');
      }
    }

    throw new Error('Formato de arquivo selecionado não suportado pelo picker atual');
  }
}
