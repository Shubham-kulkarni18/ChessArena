import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChessArena',
  description: 'A modern chess platform experience',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
