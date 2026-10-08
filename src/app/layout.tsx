import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

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
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const themeCookie = cookieStore.get('theme')?.value as 'light' | 'dark' | 'system' | undefined;
  const initialTheme = themeCookie || 'system';

  // Server-side decision for initial HTML class (if cookie is explicit)
  const isDarkInitial = initialTheme === 'dark';

  return (
    <html lang="id" className={`scroll-smooth ${isDarkInitial ? 'dark' : ''}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cookieTheme = document.cookie.split('; ').find(row => row.startsWith('theme='));
                  var theme = cookieTheme ? cookieTheme.split('=')[1] : '${initialTheme}';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased min-h-screen flex flex-col bg-brand-navy-50 dark:bg-slate-950 text-brand-navy-900 dark:text-slate-100 transition-colors duration-200`}
      >
        <ThemeProvider initialTheme={initialTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
