import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/providers';

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
        {/* Viewport & safe area */}
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        {/* Font (Be Vietnam Pro) para tipografia display conforme protótipo da tela de Saída */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Material Symbols (Outlined) - utilizada em ícones da nova tela */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        {/* Ajuste de altura mínima semelhante ao protótipo fornecido */}
        <style>{`body{min-block-size:max(884px,100dvh);font-family:'Be Vietnam Pro',var(--font-body),sans-serif}`}</style>
        <style>{`.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}.material-symbols-outlined.filled{font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24}`}</style>
      </head>
      <body className={`bg-background text-foreground antialiased flex min-h-screen flex-col`}>
        <Providers>
          <div className="flex-1 safe-area-wrapper">
            {/* Container centralizado em largura móvel, como no layout (max-w-md) */}
            <div className="safe-area mx-auto w-full max-w-md px-4">
              {children}
            </div>
          </div>
          {/* Oculta o rodapé em telas móveis para evitar sobreposição/"flutuar" com a barra inferior */}
          <footer className="hidden md:block border-t mt-8 text-center text-xs text-muted-foreground py-4 space-y-2">
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
