import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Configure Google Fonts for premium design aesthetics
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'NAWA-VOTE — Platform Pemungutan Suara Digital Pilketos',
  description: 'Aplikasi resmi pemungutan suara pemilihan ketua dan wakil ketua OSIS secara digital, transparan, aman, dan langsung.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
