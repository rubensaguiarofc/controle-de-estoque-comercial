import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rubensaguiarofc.controleestoque',
  appName: 'controle-de-estoque',
  webDir: 'out',
  server: {
    // Using local assets (no server.url) so the app will load files bundled in the native project
    androidScheme: 'https'
  }
};

export default config;
