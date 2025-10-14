
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Controle de Almoxarifado',
  description: 'Uma ferramenta moderna para controle de estoque e ferramentas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={"bg-background text-foreground antialiased flex min-h-screen flex-col"}>
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t mt-8 text-center text-xs text-muted-foreground py-4 space-y-2">
          <p>© {new Date().getFullYear()} Controle de Almoxarifado</p>
          <p>
            <a href="https://docs.google.com/document/d/1o7_RCTS3Kexrzd2FVomTZ6__R8uaL9Y9bwhfBBHsefo" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Política de Privacidade</a>
            {' '}•{' '}
            <a href="mailto:suporte@exemplo.com" className="underline hover:text-foreground">Contato</a>
          </p>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
