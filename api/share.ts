// Crawler-only share cards.
//
// vercel.json routes /s/:id, /e/:id, /c/:id here ONLY when the user-agent
// matches a link-preview bot (facebookexternalhit, Twitterbot, Slackbot, …).
// Human traffic never reaches this function — it keeps the static
// index.html path — so a failure here can never break the app itself.
//
// Bots don't execute JS, so they get a minimal HTML document whose only
// job is to carry the story/entity/collection-specific Open Graph tags.

export const config = { runtime: 'edge' };

const SITE = 'https://deepmaps.app';
const DEFAULT_TITLE = 'DeepMaps';
const DEFAULT_DESC =
  'Explore history pinned to the exact coordinates where it happened. ' +
  '2,000+ moments across every continent.';
const DEFAULT_IMAGE = `${SITE}/og-default.png`;

// The anon key is public by design (it ships in the client JS bundle);
// env vars take precedence when Vercel provides them.
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const TABLES: Record<string, string> = {
  s: 'stories',
  e: 'entities',
  c: 'collections',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function card(opts: { title: string; desc: string; image: string; url: string }): Response {
  const title = escapeHtml(opts.title);
  const desc = escapeHtml(truncate(opts.desc, 200));
  const image = escapeHtml(opts.image);
  const url = escapeHtml(opts.url);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="DeepMaps" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${image}" />
</head>
<body><a href="${url}">${title}</a></body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);
  const type = reqUrl.searchParams.get('type') ?? '';
  const id = reqUrl.searchParams.get('id') ?? '';
  const table = TABLES[type];
  const pageUrl = table ? `${SITE}/${type}/${id}` : SITE;
  const fallback = () =>
    card({ title: DEFAULT_TITLE, desc: DEFAULT_DESC, image: DEFAULT_IMAGE, url: pageUrl });

  // Same shape as the app's own ids; anything else gets the default card.
  if (!table || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(id) || !SUPABASE_ANON_KEY) {
    return fallback();
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return fallback();
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const row = rows?.[0];
    if (!row || typeof row.name !== 'string') return fallback();

    const years = typeof row.years === 'string' ? ` (${row.years})` : '';
    const desc =
      (typeof row.description === 'string' && row.description) ||
      (typeof row.subtitle === 'string' && row.subtitle) ||
      DEFAULT_DESC;
    const image =
      (typeof row.image_url === 'string' && row.image_url) || DEFAULT_IMAGE;

    return card({
      title: `${row.name}${years} — DeepMaps`,
      desc,
      image,
      url: pageUrl,
    });
  } catch {
    return fallback();
  }
}
