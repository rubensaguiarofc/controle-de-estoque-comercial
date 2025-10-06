
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Controle de Estoque',
  description: 'Gerenciado por Alternativa Solutions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background overflow-x-hidden">
        {children}
        <Toaster />
        <footer className="fixed bottom-0 left-0 right-0 z-10 w-full bg-muted/30 p-2 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-lg animate-pulse-slow cursor-pointer items-center justify-center rounded-lg border border-dashed bg-card/80 text-center text-muted-foreground transition-colors hover:border-primary hover:bg-muted/80">
            <span>Espaço para publicidade</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
