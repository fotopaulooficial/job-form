import './globals.css';

export const metadata = {
  title: 'Trabalhe conosco',
  description: 'Envie sua candidatura e seu currículo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
