import { registerPlugin } from '@capacitor/core';

export interface SaveToDownloadsOptions {
  base64: string;
  filename: string;
  mimeType?: string;
}

export interface SaveResult {
  uri: string;
}

export interface MediaStoreSaverPlugin {
  saveToDownloads(options: SaveToDownloadsOptions): Promise<SaveResult>;
  savePdfToDownloads(options: { base64: string; filename: string }): Promise<SaveResult>;
}

export const MediaStoreSaver = registerPlugin<MediaStoreSaverPlugin>('MediaStoreSaver');
