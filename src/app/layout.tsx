import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';

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
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=Nunito:wght@400;600;700&display=swap" />
      </head>
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
