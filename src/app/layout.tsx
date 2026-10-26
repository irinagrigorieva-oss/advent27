import type { Metadata, Viewport } from 'next';
import { Comfortaa, Nunito } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

// Self-hosted at build time: no request to Google from the visitor's browser (it can be slow or blocked).
const display = Comfortaa({ subsets: ['cyrillic', 'latin'], weight: ['600', '700'], display: 'swap', variable: '--font-display' });
const body = Nunito({ subsets: ['cyrillic', 'latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-body' });

function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (!raw) return 'http://localhost:3000';
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try { return new URL(withProto).origin; } catch { return 'http://localhost:3000'; }
}
const site = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Адвент-календарь', template: '%s · Адвент-календарь' },
  description: 'Маленький сюрприз каждый день. Откройте задание и поделитесь результатом.',
  openGraph: { type: 'website', siteName: 'Адвент-календарь', images: ['/og'] },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#fff7f2', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-rose focus:px-3 focus:py-2 focus:text-cream">
          Перейти к содержимому
        </a>
        <Header />
        <div id="main" className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4">{children}</div>
        <footer className="px-4 pb-10 text-center text-xs text-muted">Сделано с ♥, какао и мандаринами</footer>
      </body>
    </html>
  );
}
