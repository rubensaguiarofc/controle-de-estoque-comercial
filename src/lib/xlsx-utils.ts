import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Directory } from '@capacitor/filesystem';
import { Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { format } from 'date-fns';

interface ExportConfig {
  filename: string;
  sheetName?: string;
  columns?: string[];
}

export class XLSXUtils {
  static async importFile(file: File): Promise<any[]> {
    if (!file.name.match(/\.(xlsx|csv)$/i)) {
      throw new Error('Formato inválido. Por favor selecione um arquivo XLSX ou CSV.');
    }

    try {
      const ab = await file.arrayBuffer();

      // If CSV, try decoding with UTF-8 first, then fall back to windows-1252/latin1 when we detect mojibake
      const isCsv = file.name.match(/\.csv$/i);
      if (isCsv) {
        // try utf-8
        let csvString: string | null = null;
        try {
          csvString = new TextDecoder('utf-8').decode(ab);
        } catch {}

        const looksMojibake = (s: string | null) => {
          if (!s) return false;
          // common mojibake patterns (Ã followed by other chars) or replacement char
          return /Ã|�/.test(s);
        };

        if (looksMojibake(csvString)) {
          // fallback to windows-1252 (common on CSV exported from Excel on Windows)
          try {
            csvString = new TextDecoder('windows-1252').decode(ab);
          } catch (e) {
            // last-resort: latin1 fallback by mapping bytes
            try {
              const bytes = new Uint8Array(ab as ArrayBuffer);
              csvString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
            } catch (e2) {
              csvString = csvString || '';
            }
          }
        }

        // strip BOM if present
        if (csvString && csvString.charCodeAt(0) === 0xFEFF) {
          csvString = csvString.slice(1);
        }

        // Detect common delimiter (comma vs semicolon) based on header line
        const readOpts: any = { type: 'string' };
        if (csvString) {
          const header = csvString.split(/\r?\n/, 1)[0] || '';
          const semis = (header.match(/;/g) || []).length;
          const commas = (header.match(/,/g) || []).length;
          if (semis > commas) readOpts.FS = ';';
        }

        // parse CSV string via XLSX.reader as string with detected delimiter
        const wb = XLSX.read(csvString || '', readOpts);
        if (!wb.SheetNames.length) {
          throw new Error('A planilha não contém nenhuma página.');
        }
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          throw new Error('Nenhuma linha encontrada na planilha.');
        }

        return rows;
      }

      // Non-CSV path (XLSX)
      const wb = XLSX.read(ab, { type: 'array' });

      if (!wb.SheetNames.length) {
        throw new Error('A planilha não contém nenhuma página.');
      }

      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        throw new Error('Nenhuma linha encontrada na planilha.');
      }

      return rows;
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      throw new Error('Erro ao processar arquivo. Verifique se o arquivo está corrompido ou em formato inválido.');
    }
  }

  /**
   * Import a spreadsheet from a base64-encoded string (useful for native Filesystem reads).
   */
  static async importFromBase64(base64: string): Promise<any[]> {
    try {
      // First attempt: treat as binary XLSX/CSV encoded as base64
      let wb: XLSX.WorkBook | null = null;
      try {
        wb = XLSX.read(base64, { type: 'base64' });
      } catch (inner) {
        console.debug('XLSX.read(base64) failed, will try string decode as fallback', inner);
      }

      if (wb && wb.SheetNames && wb.SheetNames.length) {
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rows && Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
      }

      // Fallback: decode base64 to bytes then try decoding to string using UTF-8, then windows-1252, then Latin1
      let bytes: Uint8Array;
      try {
        if (typeof atob !== 'undefined') {
          const bin = atob(base64);
          const len = bin.length;
          bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        } else if (typeof Buffer !== 'undefined') {
          bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
        } else {
          throw new Error('No base64 decoder available');
        }
      } catch (e) {
        console.debug('Failed to convert base64 to bytes:', e);
        throw new Error('Erro ao decodificar conteúdo do arquivo.');
      }

      const looksMojibake = (s: string | null) => {
        if (!s) return false;
        return /Ã|�/.test(s);
      };

      let csvString: string | null = null;
      try {
        // try utf-8
        try {
          csvString = new TextDecoder('utf-8').decode(bytes);
        } catch (e) {
          csvString = null;
        }

        if (looksMojibake(csvString)) {
          // try windows-1252
          try {
            csvString = new TextDecoder('windows-1252').decode(bytes);
          } catch (e) {
            csvString = null;
          }
        }

        if (csvString == null) {
          // last-resort latin1 mapping
          csvString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        }
      } catch (e) {
        console.debug('Failed to decode bytes to string:', e);
        throw new Error('Erro ao decodificar conteúdo do arquivo.');
      }

      try {
        // strip BOM if present
        if (csvString && csvString.charCodeAt(0) === 0xFEFF) {
          csvString = csvString.slice(1);
        }

        // Detect common delimiter (comma vs semicolon) based on header line
        const readOpts: any = { type: 'string' };
        if (csvString) {
          const header = csvString.split(/\r?\n/, 1)[0] || '';
          const semis = (header.match(/;/g) || []).length;
          const commas = (header.match(/,/g) || []).length;
          if (semis > commas) readOpts.FS = ';';
        }

        const wb2 = XLSX.read(csvString, readOpts);
        if (!wb2 || !wb2.SheetNames || wb2.SheetNames.length === 0) {
          throw new Error('A planilha não contém nenhuma página após tentativa como texto.');
        }
        const ws2 = wb2.Sheets[wb2.SheetNames[0]];
        const rows2 = XLSX.utils.sheet_to_json(ws2, { defval: '' });
        if (!rows2 || !Array.isArray(rows2) || rows2.length === 0) {
          throw new Error('Nenhuma linha encontrada na planilha (texto).');
        }
        return rows2;
      } catch (e) {
        console.error('Fallback parse as string failed:', e);
        throw new Error('Erro ao processar arquivo (base64/text fallback).');
      }
    } catch (err) {
      console.error('Erro ao ler planilha base64:', err);
      throw new Error('Erro ao processar arquivo (base64).');
    }
  }

  static async exportData(data: any[], config: ExportConfig) {
    try {
      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      let ws;

      if (Array.isArray(data[0])) {
        // Se data já é um array de arrays (AOA)
        ws = XLSX.utils.aoa_to_sheet(data);
      } else {
        // Se data é um array de objetos
        ws = XLSX.utils.json_to_sheet(data);
      }

      // Ajustar largura das colunas
      const maxWidth = 50;
      const minWidth = 5;
      const colWidths = config.columns?.reduce((acc, col) => {
        acc[col] = Math.min(Math.max(
          col.length,
          ...data.map(row => String(row[col] || '').length)
        ), maxWidth);
        return acc;
      }, {} as Record<string, number>);

      if (colWidths) {
        ws['!cols'] = Object.values(colWidths).map(width => ({ 
          wch: Math.min(Math.max(width, minWidth), maxWidth)
        }));
      }

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, config.sheetName || 'Sheet1');

      // Exportar baseado na plataforma
      if (Capacitor.isNativePlatform()) {
        await this.exportNative(wb, config.filename);
      } else {
        await this.exportWeb(wb, config.filename);
      }

      return true;
    } catch (err) {
      console.error('Erro ao exportar XLSX:', err);
      throw new Error('Falha ao gerar planilha');
    }
  }

  private static async exportNative(wb: XLSX.WorkBook, filename: string) {
    try {
      const base64Xlsx = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      
      await Filesystem.writeFile({
        path: filename,
        data: base64Xlsx,
        directory: Directory.Documents,
        recursive: true
      });

      const { uri } = await Filesystem.getUri({
        path: filename,
        directory: Directory.Documents
      });

      await Share.share({
        title: 'Exportar XLSX',
        text: 'Seu relatório em Excel.',
        url: uri,
        dialogTitle: 'Compartilhar Planilha'
      });
    } catch (err) {
      console.error('Erro ao exportar para dispositivo:', err);
      throw new Error('Falha ao salvar/compartilhar arquivo no dispositivo');
    }
  }

  private static async exportWeb(wb: XLSX.WorkBook, filename: string) {
    try {
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Erro ao exportar para web:', err);
      throw new Error('Falha ao baixar arquivo');
    }
  }
}