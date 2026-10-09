import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Dynamic Open Graph image for pages without their own picture: /og?t=Title&s=Subtitle
export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const title = (sp.get('t') || 'Адвент-календарь').slice(0, 90);
  const sub = (sp.get('s') || 'Маленький сюрприз каждый день').slice(0, 140);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 80, background: 'linear-gradient(135deg,#ffe3ea,#e6dcff)', color: '#4a2c35',
        }}
      >
        <div style={{ fontSize: 40, color: '#cf3f65' }}>♥ Адвент-календарь</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 34, marginTop: 28, color: '#7d5a64' }}>{sub}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
