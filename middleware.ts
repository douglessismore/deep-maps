/**
 * Vercel Edge Middleware — OG meta tags for social sharing
 *
 * Intercepts crawler requests to deep link URLs (/c/:id, /s/:id, /e/:id)
 * and returns minimal HTML with Open Graph tags. Real users pass through
 * to the SPA as normal.
 *
 * Architecture:
 *   Crawler → middleware → Supabase REST → OG HTML response
 *   Real user → middleware (pass-through) → SPA
 */

// ── Bot Detection ──
const BOT_PATTERNS = [
  'twitterbot', 'facebookexternalhit', 'linkedinbot', 'slackbot',
  'discordbot', 'telegrambot', 'whatsapp', 'redditbot', 'embedly',
  'quora link preview', 'outbrain', 'pinterest', 'vkshare', 'tumblr',
  'bingbot', 'googlebot', 'yahoo', 'baiduspider', 'duckduckbot',
  'applebot', 'iframely', 'rogerbot', 'showyoubot',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((bot) => ua.includes(bot));
}

// ── Route Parsing ──
type DeepLink =
  | { type: 'collection'; id: string; table: 'collections' }
  | { type: 'story'; id: string; table: 'stories' }
  | { type: 'entity'; id: string; table: 'entities' }
  | null;

function parseDeepLink(pathname: string): DeepLink {
  const m = pathname.match(/^\/(c|s|e)\/([a-z0-9][a-z0-9-]*[a-z0-9])\/?$/);
  if (!m) return null;
  const map = { c: 'collection', s: 'story', e: 'entity' } as const;
  const tableMap = { c: 'collections', s: 'stories', e: 'entities' } as const;
  return { type: map[m[1] as 'c' | 's' | 'e'], id: m[2], table: tableMap[m[1] as 'c' | 's' | 'e'] };
}

// ── Supabase REST Fetch ──
const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoeHlhb2FhZXp0cnljZm9wcGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzYwNDIsImV4cCI6MjA4OTIxMjA0Mn0.mdFYWteB8Tdf3443otxSzOwCvwUvFNFFoaOLR3XY3fw';

interface OgData {
  title: string;
  description: string;
}

async function fetchOgData(link: DeepLink): Promise<OgData | null> {
  if (!link) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${link.table}?id=eq.${encodeURIComponent(link.id)}&select=name,description`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows?.[0]) return null;
    return { title: rows[0].name || 'DeepMaps', description: rows[0].description || '' };
  } catch {
    return null; // Timeout or network error → fallback
  }
}

// ── HTML Escaping ──
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── OG HTML ──
function buildOgHtml(data: OgData | null, url: string): string {
  const title = data ? `${data.title} — DeepMaps` : 'DeepMaps';
  const desc = data?.description || 'Everything that ever happened, happened somewhere. Explore history pinned to the exact coordinates where it happened.';
  // Truncate description to 200 chars for OG tags
  const shortDesc = desc.length > 200 ? desc.slice(0, 197) + '...' : desc;
  const origin = new URL(url).origin;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(shortDesc)}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(shortDesc)}"/>
<meta property="og:image" content="${origin}/og-default.png"/>
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="DeepMaps"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(shortDesc)}"/>
<meta name="twitter:image" content="${origin}/og-default.png"/>
</head>
<body></body>
</html>`;
}

// ── Middleware Entry Point ──
export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const deepLink = parseDeepLink(url.pathname);

  // Not a deep link → pass through to SPA
  if (!deepLink) return undefined;

  // Real user → pass through to SPA (wouter handles routing client-side)
  const userAgent = request.headers.get('user-agent') || '';
  if (!isBot(userAgent)) return undefined;

  // Bot on a deep link → return OG HTML
  const data = await fetchOgData(deepLink);
  const html = buildOgHtml(data, request.url);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

// Only run on deep link patterns
export const config = {
  matcher: ['/c/:path*', '/s/:path*', '/e/:path*'],
};
