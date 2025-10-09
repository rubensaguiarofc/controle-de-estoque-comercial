
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

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
      <body className={"bg-black text-white antialiased"}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
