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
    <html lang="en" suppressHydrationWarning className="flex flex-col min-h-screen">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex-grow">
        <main className="flex-1">{children}</main>
        <Toaster />
        <footer className="w-full text-center p-4 mt-auto text-sm text-muted-foreground">
          Alternativa Solutions. Todos os direitos reservados
        </footer>
      </body>
    </html>
  );
}
