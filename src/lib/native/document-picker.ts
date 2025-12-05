import { registerPlugin } from '@capacitor/core';

export interface PickFileOptions {
  mimeTypes?: string[];
  // When true on Android, try to open SAF starting in the Downloads folder
  openDownloads?: boolean;
}

export interface PickFileResult {
  base64: string;
  name: string;
  mimeType?: string;
}

export interface DocumentPickerPlugin {
  pickFile(options: PickFileOptions): Promise<PickFileResult>;
}

export const DocumentPicker = registerPlugin<DocumentPickerPlugin>('DocumentPicker');
