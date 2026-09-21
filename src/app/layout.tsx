import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FMAB RPG - Fullmetal Alchemist: Brotherhood',
  description: 'Un RPG narrativo de texto ambientado en la fantasía oscura militar de Fullmetal Alchemist: Brotherhood',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-fmab-dark text-fmab-parchment antialiased">
        {children}
      </body>
    </html>
  );
}