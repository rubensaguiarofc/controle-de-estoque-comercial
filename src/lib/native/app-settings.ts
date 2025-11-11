import { registerPlugin } from '@capacitor/core';

export interface AppSettingsPlugin {
  openAppSettings(): Promise<void>;
}

export const AppSettings = registerPlugin<AppSettingsPlugin>('AppSettings');
