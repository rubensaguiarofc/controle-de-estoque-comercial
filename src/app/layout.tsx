
import type { Metadata } from 'next';
import './globals.css';
<<<<<<< HEAD
import Providers from '../providers';
import { Toaster } from '../components/ui/toaster';
import { FooterAd } from '../components/footer-ad';
=======
import { Toaster } from '@/components/ui/toaster';
>>>>>>> origin/main

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
<<<<<<< HEAD
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
        <Providers>
          {children}
          <Toaster />
          <FooterAd />
        </Providers>
=======
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={"bg-black text-white antialiased"}>
        {children}
        <Toaster />
>>>>>>> origin/main
      </body>
    </html>
  );
}
