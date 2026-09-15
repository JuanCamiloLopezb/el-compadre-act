import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'El Compadre - Licorería Express',
  description: 'Tus licores favoritos con envío rápido a domicilio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${playfair.variable}`}>
      <body className="antialiased bg-[#fafaf8] text-[#1c1c1c]">
        {children}
      </body>
    </html>
  );
}