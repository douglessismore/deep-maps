/**
 * Wikipedia API utilities for fetching and parsing article content.
 * Uses the MediaWiki Action API (no auth needed, CORS-friendly with proper User-Agent).
 */

const API_BASE = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'DeepMaps/1.0 (geospatial storytelling app)';

export interface WikiSection {
  index: number;
  level: number;
  anchor: string;
  heading: string;
}

export interface WikiArticle {
  title: string;
  html: string;
  sections: WikiSection[];
  pageUrl: string;
}

// Simple in-memory cache to avoid refetching on tab switches
const cache = new Map<string, WikiArticle>();

/**
 * Fetch a Wikipedia article's parsed HTML and section data.
 */
export async function fetchWikiArticle(slug: string): Promise<WikiArticle> {
  if (cache.has(slug)) {
    return cache.get(slug)!;
  }

  const params = new URLSearchParams({
    action: 'parse',
    page: slug,
    prop: 'text|sections|displaytitle',
    format: 'json',
    origin: '*', // Enable CORS
  });

  const res = await fetch(`${API_BASE}?${params}`, {
    headers: { 'Api-User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Wikipedia API error: ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`Wikipedia error: ${data.error.info}`);
  }

  const parse = data.parse;

  const article: WikiArticle = {
    title: parse.title,
    html: parse.text['*'],
    sections: parse.sections.map((s: Record<string, string | number>) => ({
      index: Number(s.index),
      level: Number(s.level),
      anchor: s.anchor as string,
      heading: s.line as string,
    })),
    pageUrl: `https://en.wikipedia.org/wiki/${slug}`,
  };

  cache.set(slug, article);
  return article;
}

/**
 * Clean Wikipedia HTML for display in our app.
 * Strips unnecessary elements, rewrites links, removes edit buttons.
 */
export function cleanWikiHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove elements we don't want
  const removeSelectors = [
    '.mw-editsection',           // [edit] links
    '.noprint',                   // Print-only elements
    '.mw-empty-elt',             // Empty elements
    '.sistersitebox',            // Sister project boxes
    '.navbox',                    // Navigation boxes at bottom
    '.mw-authority-control',     // Authority control
    '.refbegin',                 // Reference beginnings
    '.reflist',                  // Reference lists
    '#toc',                      // Table of contents (we build our own)
    '.toc',                      // Alternate TOC
    '.mbox-small',               // Small message boxes
    'style',                     // Inline style tags
    '.metadata',                 // Metadata elements
    '.reference',                // Inline reference markers [1], [2] etc.
    'sup.reference',             // Superscript references
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Rewrite internal Wikipedia links to open in new tabs
  doc.querySelectorAll('a[href^="/wiki/"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      a.setAttribute('href', `https://en.wikipedia.org${href}`);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Remove all other internal links (action links, special pages, etc.)
  doc.querySelectorAll('a[href^="/w/"]').forEach(a => {
    const parent = a.parentNode;
    if (parent) {
      while (a.firstChild) parent.insertBefore(a.firstChild, a);
      parent.removeChild(a);
    }
  });

  // Add IDs to section headings for scroll targeting.
  // Modern Wikipedia (2024+): <div class="mw-heading"><h2 id="Crimes">Crimes</h2></div>
  // Legacy Wikipedia: <h2><span class="mw-headline" id="Crimes">Crimes</span></h2>
  doc.querySelectorAll('h2, h3, h4').forEach(heading => {
    // Modern format: heading itself has the ID
    if (heading.id && !heading.id.startsWith('wiki-')) {
      const originalId = heading.id;
      heading.setAttribute('id', `wiki-${originalId}`);
      return;
    }

    // Legacy format: ID on .mw-headline span inside heading
    const span = heading.querySelector('.mw-headline');
    if (span && span.id) {
      heading.setAttribute('id', `wiki-${span.id}`);
    }
  });

  return doc.body.innerHTML;
}

/**
 * Filter sections to only show content-relevant ones (not References, External links, etc.)
 */
export function getContentSections(sections: WikiSection[]): WikiSection[] {
  const skipAnchors = new Set([
    'See_also', 'Notes', 'References', 'Bibliography',
    'Further_reading', 'External_links', 'Sources',
  ]);
  return sections.filter(s => !skipAnchors.has(s.anchor));
}
