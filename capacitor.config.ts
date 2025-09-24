import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'saida-maris',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
