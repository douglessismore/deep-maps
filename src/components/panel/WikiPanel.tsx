import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Story, Moment } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { useAppData } from '../../lib/data/provider';
import {
  fetchWikiArticle,
  cleanWikiHtml,
  getContentSections,
  type WikiSection,
} from '../../lib/wikipedia';

interface WikiPanelProps {
  story: Story;
  activeLocation: Moment | null;
  onLocationSelect: (location: Moment) => void;
  initialSection?: string; // Section anchor to scroll to on mount
}

/** A geo-linked storypoint with its wiki section info */
interface GeoAnchor {
  location: Moment;
  sectionAnchor: string;
  sectionHeading: string;
}

export function WikiPanel({
  story,
  activeLocation,
  onLocationSelect,
  initialSection,
}: WikiPanelProps) {
  const { moments } = useAppData();
  const momentMap = useMemo(() => buildMomentMap(moments), [moments]);
  const [html, setHtml] = useState<string | null>(null);
  const [sections, setSections] = useState<WikiSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(initialSection || null);
  const [validatedAnchors, setValidatedAnchors] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<number | null>(null);
  const programmaticScroll = useRef(false);
  const initialScrollDone = useRef(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  const cat = CATEGORIES[story.category];

  // Build the geo-anchor map: locations that have wikiSection fields
  // Use both a ref (for callbacks) and a memo (for stable identity)
  const sectionToLocation = useRef(new Map<string, Moment>());
  const geoSectionAnchors = useRef(new Set<string>());

  useEffect(() => {
    const map = new Map<string, Moment>();
    const anchors = new Set<string>();
    resolveLocationsFromMap(story, momentMap).forEach(loc => {
      if (loc.wikiSection) {
        map.set(loc.wikiSection, loc);
        anchors.add(loc.wikiSection);
      }
    });
    sectionToLocation.current = map;
    geoSectionAnchors.current = anchors;
  }, [story]);

  // Build ordered list of geo-anchors (storypoints that map to wiki sections)
  const geoAnchors: GeoAnchor[] = resolveLocationsFromMap(story, momentMap)
    .filter(loc => loc.wikiSection)
    .map(loc => ({
      location: loc,
      sectionAnchor: loc.wikiSection!,
      sectionHeading: '', // filled after sections load
    }));

  // Once sections are loaded, fill in the heading names
  const geoAnchorsWithHeadings: GeoAnchor[] = geoAnchors.map(ga => {
    const section = sections.find(s => s.anchor === ga.sectionAnchor);
    return {
      ...ga,
      sectionHeading: section?.heading || ga.sectionAnchor.replace(/_/g, ' '),
    };
  });

  // Fetch article
  useEffect(() => {
    if (!story.wikipediaSlug) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWikiArticle(story.wikipediaSlug)
      .then(article => {
        if (cancelled) return;
        setHtml(cleanWikiHtml(article.html));
        setSections(getContentSections(article.sections));
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [story.wikipediaSlug]);

  // Scroll to target section (from initialSection or storypoint click)
  // Uses refs for callbacks to keep this function stable (no deps that change on render)
  const scrollToSection = useCallback((anchor: string) => {
    if (!contentRef.current || !scrollContainerRef.current) return;

    // Try CSS-escaped selector for IDs with special chars (e.g., apostrophes)
    let el: Element | null = null;
    try {
      el = contentRef.current.querySelector(`#wiki-${CSS.escape(anchor)}`);
    } catch {
      // Fallback: search by attribute
      el = contentRef.current.querySelector(`[id="wiki-${anchor}"]`);
    }
    if (!el) return;

    programmaticScroll.current = true;
    setActiveAnchor(anchor);

    // Calculate offset relative to scroll container
    const container = scrollContainerRef.current;
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const offset = container.scrollTop + (elTop - containerTop) - 8; // 8px padding

    container.scrollTo({ top: offset, behavior: 'smooth' });

    // Highlight the section heading with a flash animation
    el.classList.remove('wiki-section-highlight');
    // Force reflow so re-adding the class restarts the animation
    void (el as HTMLElement).offsetWidth;
    el.classList.add('wiki-section-highlight');

    // Also fly to the corresponding location on the map
    const loc = sectionToLocation.current.get(anchor);
    if (loc) {
      onLocationSelectRef.current(loc);
    }

    // Reset programmatic scroll flag after animation
    setTimeout(() => { programmaticScroll.current = false; }, 1000);
  }, []); // Stable — uses refs for mutable values

  // Reset the initial-scroll guard whenever a NEW initialSection arrives from parent
  const prevInitialSection = useRef(initialSection);
  useEffect(() => {
    if (initialSection && initialSection !== prevInitialSection.current) {
      initialScrollDone.current = false;
      prevInitialSection.current = initialSection;
    }
  }, [initialSection]);

  // On initial load (or when a new initialSection arrives), scroll to it once
  useEffect(() => {
    if (!html || !initialSection || initialScrollDone.current) return;
    initialScrollDone.current = true;
    const timer = setTimeout(() => scrollToSection(initialSection), 300);
    return () => clearTimeout(timer);
  }, [html, initialSection, scrollToSection]);

  // Scroll-driven section tracking: highlight the active geo-anchor as user scrolls
  // Uses a ref for activeAnchor comparison to avoid re-creating callback on every anchor change
  const activeAnchorRef = useRef(activeAnchor);
  activeAnchorRef.current = activeAnchor;

  const handleScroll = useCallback(() => {
    if (programmaticScroll.current) return;

    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const scanY = containerRect.top + 100;

      let closestAnchor: string | null = null;
      let closestDist = Infinity;

      // Only track headings that correspond to geo-linked storypoints
      content.querySelectorAll('h2[id^="wiki-"], h3[id^="wiki-"]').forEach(heading => {
        const anchor = heading.id.substring(5); // 'wiki-'.length === 5

        // Skip headings that aren't geo-linked storypoints
        if (!geoSectionAnchors.current.has(anchor)) return;

        const rect = heading.getBoundingClientRect();
        const dist = Math.abs(rect.top - scanY);

        if (rect.top <= scanY + 200 && dist < closestDist) {
          closestDist = dist;
          closestAnchor = anchor;
        }
      });

      if (closestAnchor && closestAnchor !== activeAnchorRef.current) {
        setActiveAnchor(closestAnchor);

        // Fly map to the corresponding location
        const loc = sectionToLocation.current.get(closestAnchor);
        if (loc) {
          onLocationSelectRef.current(loc);
        }
      }
    }, 150);
  }, []); // Stable — uses refs for mutable values

  // Inject geo markers into section headings AND validate which anchors exist
  useEffect(() => {
    if (!contentRef.current || !html) return;

    const found = new Set<string>();

    sectionToLocation.current.forEach((loc, sectionAnchor) => {
      let heading: Element | null = null;
      try {
        heading = contentRef.current?.querySelector(`#wiki-${CSS.escape(sectionAnchor)}`) || null;
      } catch {
        heading = contentRef.current?.querySelector(`[id="wiki-${sectionAnchor}"]`) || null;
      }
      if (heading) {
        found.add(sectionAnchor);
        if (!heading.querySelector('.wiki-geo-marker')) {
          heading.classList.add('wiki-geo-section');
          const marker = document.createElement('span');
          marker.className = 'wiki-geo-marker';
          marker.title = `Map: ${loc.name}`;
          marker.textContent = '📍 ';
          heading.insertBefore(marker, heading.firstChild);
        }
      }
    });

    setValidatedAnchors(found);
  }, [html]);

  // --- RENDER ---

  if (!story.wikipediaSlug) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-[var(--text-muted)] font-mono text-center">
          No Wikipedia article linked for this story.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Loading Wikipedia article...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--accent-red)]">Failed to load article</p>
          <p className="text-xs font-mono text-[var(--text-muted)]">{error}</p>
          <a
            href={`https://en.wikipedia.org/wiki/${story.wikipediaSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-mono text-[var(--text-secondary)] hover:text-white underline mt-2"
          >
            Open on Wikipedia →
          </a>
        </div>
      </div>
    );
  }

  // Only show pills for anchors that actually exist in the rendered article HTML
  const verifiedGeoAnchors = geoAnchorsWithHeadings.filter(
    ga => validatedAnchors.has(ga.sectionAnchor)
  );
  const hasGeoAnchors = verifiedGeoAnchors.length > 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ===== Storypoint Navigator ===== */}
      {hasGeoAnchors && (
        <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
              Story points in this article
            </span>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">
              {verifiedGeoAnchors.findIndex(g => g.sectionAnchor === activeAnchor) + 1} / {verifiedGeoAnchors.length}
            </span>
          </div>

          {/* Storypoint cards — horizontal scroll */}
          <div className="flex gap-2 px-3 pb-2.5 overflow-x-auto custom-scrollbar">
            {verifiedGeoAnchors.map((ga, i) => {
              const isActive = activeAnchor === ga.sectionAnchor;
              const isActiveLocation = activeLocation?.id === ga.location.id;

              return (
                <button
                  key={ga.location.id}
                  onClick={() => scrollToSection(ga.sectionAnchor)}
                  className={`shrink-0 text-left rounded-lg p-2 transition-all duration-200 border ${
                    isActive || isActiveLocation
                      ? 'border-opacity-60 shadow-md'
                      : 'border-transparent hover:border-[var(--border-hover)]'
                  }`}
                  style={{
                    width: '160px',
                    backgroundColor: isActive || isActiveLocation
                      ? `${cat.color}15`
                      : 'var(--bg-card)',
                    borderColor: isActive || isActiveLocation
                      ? cat.color
                      : undefined,
                  }}
                >
                  {/* Index dot + location name */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
                      style={{
                        backgroundColor: isActive || isActiveLocation ? cat.color : cat.bgColor,
                        color: isActive || isActiveLocation ? 'white' : cat.color,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-serif font-semibold text-[var(--text-primary)] truncate">
                      {ga.location.name}
                    </span>
                  </div>

                  {/* Wiki section label */}
                  <p className="text-[9px] font-mono text-[var(--text-muted)] truncate pl-5.5">
                    § {ga.sectionHeading}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Prev / Next navigation */}
          {verifiedGeoAnchors.length > 1 && (
            <div className="flex items-center justify-center gap-3 pb-2">
              <button
                onClick={() => {
                  const idx = verifiedGeoAnchors.findIndex(g => g.sectionAnchor === activeAnchor);
                  const prev = idx > 0 ? idx - 1 : verifiedGeoAnchors.length - 1;
                  scrollToSection(verifiedGeoAnchors[prev].sectionAnchor);
                }}
                className="text-[var(--text-muted)] hover:text-white transition-colors p-1"
                title="Previous storypoint"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8.5 3.5L5 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Progress dots */}
              <div className="flex items-center gap-1">
                {verifiedGeoAnchors.map((ga, i) => (
                  <button
                    key={ga.location.id}
                    onClick={() => scrollToSection(ga.sectionAnchor)}
                    className="transition-all duration-200"
                    style={{
                      width: activeAnchor === ga.sectionAnchor ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: activeAnchor === ga.sectionAnchor
                        ? cat.color
                        : 'rgba(255,255,255,0.15)',
                    }}
                    title={`${i + 1}. ${ga.location.name}`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  const idx = verifiedGeoAnchors.findIndex(g => g.sectionAnchor === activeAnchor);
                  const next = idx < verifiedGeoAnchors.length - 1 ? idx + 1 : 0;
                  scrollToSection(verifiedGeoAnchors[next].sectionAnchor);
                }}
                className="text-[var(--text-muted)] hover:text-white transition-colors p-1"
                title="Next storypoint"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3.5L9 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== Article content ===== */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {/* Attribution */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)] opacity-60">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1"/>
              <text x="7" y="10" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="serif" fontWeight="bold">W</text>
            </svg>
            <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60">
              Wikipedia · CC BY-SA 4.0
            </span>
          </div>
          <a
            href={`https://en.wikipedia.org/wiki/${story.wikipediaSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            Full article ↗
          </a>
        </div>

        {/* Wikipedia HTML */}
        <div
          ref={contentRef}
          className="wiki-content px-4 pb-8"
          dangerouslySetInnerHTML={{ __html: html || '' }}
        />
      </div>
    </div>
  );
}
