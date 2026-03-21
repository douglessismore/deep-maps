import { useEffect, useRef, useState, useCallback } from 'react';
import type { Entity } from '../../types';
import {
  fetchWikiArticle,
  cleanWikiHtml,
  getContentSections,
  type WikiSection,
} from '../../lib/wikipedia';

interface EntityWikiPanelProps {
  entity: Entity;
}

/**
 * Slim Wikipedia panel for entities — renders the article with
 * collapsible sections. No geo-anchor logic (that's story-only).
 */
export function EntityWikiPanel({ entity }: EntityWikiPanelProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [sections, setSections] = useState<WikiSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch article
  useEffect(() => {
    if (!entity.wikipediaSlug) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtml(null);
    setSections([]);

    fetchWikiArticle(entity.wikipediaSlug)
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
  }, [entity.wikipediaSlug]);

  // Scroll to a section
  const scrollToSection = useCallback((anchor: string) => {
    if (!contentRef.current || !scrollContainerRef.current) return;

    let el: Element | null = null;
    try {
      el = contentRef.current.querySelector(`#wiki-${CSS.escape(anchor)}`);
    } catch {
      el = contentRef.current.querySelector(`[id="wiki-${anchor}"]`);
    }
    if (!el) return;

    setActiveAnchor(anchor);

    const container = scrollContainerRef.current;
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const offset = container.scrollTop + (elTop - containerTop) - 8;

    container.scrollTo({ top: offset, behavior: 'smooth' });

    el.classList.remove('wiki-section-highlight');
    void (el as HTMLElement).offsetWidth;
    el.classList.add('wiki-section-highlight');
  }, []);

  if (!entity.wikipediaSlug) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-[var(--text-muted)] italic">No Wikipedia article linked</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <div className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
          Loading article...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-red-400">Failed to load article: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TOC — collapsible section list */}
      {sections.length > 0 && (
        <div className="shrink-0 border-b border-[var(--border-subtle)] max-h-32 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 space-y-0.5">
            {sections.map((section) => (
              <button
                key={section.anchor}
                onClick={() => scrollToSection(section.anchor)}
                className={`block w-full text-left text-[11px] font-mono py-0.5 transition-colors truncate ${
                  activeAnchor === section.anchor
                    ? 'text-[var(--accent-red)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
                style={{ paddingLeft: `${(section.level - 1) * 12}px` }}
              >
                {section.heading}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Article content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div
          ref={contentRef}
          className="wiki-content px-4 py-3"
          dangerouslySetInnerHTML={{ __html: html || '' }}
        />
        <div className="h-24 lg:h-[40vh]" />
      </div>
    </div>
  );
}
