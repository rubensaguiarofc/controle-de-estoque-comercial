import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'controle-de-estoque',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
