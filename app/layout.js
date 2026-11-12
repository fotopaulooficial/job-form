import { Imbue, Albert_Sans } from 'next/font/google';
import './globals.css';

const display = Imbue({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const text = Albert_Sans({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
});

export const metadata = {
  title: 'Trabalhe conosco',
  description: 'Envie sua candidatura e seu currículo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
