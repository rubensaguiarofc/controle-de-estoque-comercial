import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins } from 'next/font/google';
import { Providers } from '@/providers';

const poppins = Poppins({ subsets: ['latin'], weight: ['400','600'], display: 'swap' });

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
      <head>
        {/* Garante suporte a áreas seguras (notch) e permite aplicar padding interno */}
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        {/* Ajuste de altura mínima semelhante ao protótipo fornecido */}
        <style>{`body{min-block-size:max(884px,100dvh);}`}</style>
      </head>
      <body className={`${poppins.className} bg-background text-foreground antialiased flex min-h-screen flex-col`}>
        <Providers>
          <div className="flex-1 safe-area-wrapper">
            {/* Container centralizado em largura móvel, como no layout (max-w-md) */}
            <div className="safe-area mx-auto w-full max-w-md px-4">
              {children}
            </div>
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
        </Providers>
      </body>
    </html>
  );
}
