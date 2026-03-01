import { useEffect, useMemo, useRef, useState } from 'react';
import type { Story, StoryLocation } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { CategoryBadge } from '../ui/CategoryBadge';
import { ContentWarning } from '../ui/ContentWarning';
import { LocationCard } from './LocationCard';
import { WikiPanel } from './WikiPanel';

type StoryTab = 'locations' | 'wiki';

interface StoryPanelProps {
  story: Story;
  activeLocation: StoryLocation | null;
  onLocationSelect: (location: StoryLocation) => void;
  onScrollLocationSelect: (location: StoryLocation) => void;
  onRelatedStoryClick: (story: Story) => void;
  onTagClick?: (tag: string) => void;
  allStories: Story[];
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
}

export function StoryPanel({
  story,
  activeLocation,
  onLocationSelect,
  onScrollLocationSelect,
  onRelatedStoryClick,
  onTagClick,
  allStories,
  onBack,
  backLabel,
  onHome,
}: StoryPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollDriving = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StoryTab>('locations');
  const [wikiInitialSection, setWikiInitialSection] = useState<string | undefined>(undefined);
  const [headerExpanded, setHeaderExpanded] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  const cat = CATEGORIES[story.category];
  const hasWiki = !!story.wikipediaSlug;

  // Scroll-driven location navigation + header auto-collapse
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      isScrollDriving.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        isScrollDriving.current = false;
      }, 600);

      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.4;

      // If scrolled near bottom, activate the last card (it can't reach center)
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 30;

      let closestId: string | null = null;
      let closestDist = Infinity;

      locationRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      });

      // Near bottom of scroll: pick the last location
      if (isNearBottom && story.locations.length > 0) {
        closestId = story.locations[story.locations.length - 1].id;
      }

      if (closestId && closestId !== scrollActiveId) {
        setScrollActiveId(closestId);
        const location = story.locations.find((l) => l.id === closestId);
        if (location) {
          onScrollLocationSelect(location);
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [story, onScrollLocationSelect, scrollActiveId]);

  // Scroll correction: when the active card changes, the collapsing card above shifts content up.
  // If the newly active card's title gets pushed above the scroll container, nudge it back into view.
  useEffect(() => {
    if (!scrollActiveId) return;
    const el = locationRefs.current.get(scrollActiveId);
    const container = scrollContainerRef.current;
    if (el && container) {
      requestAnimationFrame(() => {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (elRect.top < containerRect.top) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [scrollActiveId]);

  // Related stories (explicit cross-links)
  const relatedStories = (story.relatedStoryIds || [])
    .map((id) => allStories.find((s) => s.id === id))
    .filter((s): s is Story => s !== undefined);

  // Stories that share nearby locations (within ~50 miles), excluding already-related
  const relatedIds = new Set(relatedStories.map((s) => s.id));
  const nearbyStories = allStories.filter((other) => {
    if (other.id === story.id || relatedIds.has(other.id)) return false;
    return story.locations.some((storyLoc) =>
      other.locations.some((otherLoc) => {
        const dlat = storyLoc.lat - otherLoc.lat;
        const dlng = storyLoc.lng - otherLoc.lng;
        return Math.sqrt(dlat * dlat + dlng * dlng) < 1; // ~70 miles
      })
    );
  });

  // All connected stories with reason labels for the navigation strip
  const connectedEntries = [
    ...relatedStories.map(s => ({ story: s, reason: 'related' as const })),
    ...nearbyStories.map(s => ({ story: s, reason: 'nearby' as const })),
  ];

  // Location-level intersections: which other stories share a location with each of ours?
  const locationIntersections = useMemo(() => {
    const result = new Map<string, Array<{ story: Story; location: StoryLocation }>>();
    for (const loc of story.locations) {
      const matches: Array<{ story: Story; location: StoryLocation }> = [];
      for (const other of allStories) {
        if (other.id === story.id) continue;
        for (const otherLoc of other.locations) {
          const dlat = loc.lat - otherLoc.lat;
          const dlng = loc.lng - otherLoc.lng;
          if (Math.sqrt(dlat * dlat + dlng * dlng) < 0.01) {
            matches.push({ story: other, location: otherLoc });
            break;
          }
        }
      }
      if (matches.length > 0) result.set(loc.id, matches);
    }
    return result;
  }, [story, allStories]);

  const currentActiveId = activeLocation?.id || scrollActiveId;

  // Handler for "Read on Wikipedia" links in LocationCard
  const handleWikiJump = (section?: string) => {
    setWikiInitialSection(section);
    setActiveTab('wiki');
  };

  // Tab bar rendered as function to avoid TS control-flow narrowing issues
  // (inside `activeTab === 'locations'` block, TS knows activeTab can't be 'wiki')
  const renderTabBar = (sticky?: boolean) => (
    <div className={`flex border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] ${sticky ? 'sticky top-0 z-10' : ''}`}>
      <button
        onClick={() => setActiveTab('locations')}
        className={`flex-1 py-2 text-xs font-mono transition-colors ${
          activeTab === 'locations'
            ? 'text-white border-b-2'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        style={{
          borderBottomColor: activeTab === 'locations' ? cat.color : 'transparent',
        }}
      >
        📍 Moments ({story.locations.length})
      </button>
      <button
        onClick={() => { setWikiInitialSection(undefined); setActiveTab('wiki'); }}
        className={`flex-1 py-2 text-xs font-mono transition-colors ${
          activeTab === 'wiki'
            ? 'text-white border-b-2'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        style={{
          borderBottomColor: activeTab === 'wiki' ? cat.color : 'transparent',
        }}
      >
        📖 Wikipedia
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile breadcrumb — stays fixed outside scroll */}
      {onBack && (
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {backLabel || 'Stories'}
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="ml-auto text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L5 1.5L8.5 5M3 4v4h1.5V6.5h3V8H9V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </button>
          )}
        </div>
      )}

      {/* Locations tab: single scroll container — header, explore further, moments all scroll together */}
      {activeTab === 'locations' && (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Story Header — scrolls with content */}
          <div className="border-b border-[var(--border-subtle)]">
            {/* Mobile: compact toggle header */}
            <div className="lg:hidden">
              <button
                onClick={() => setHeaderExpanded(!headerExpanded)}
                className="w-full flex items-center gap-2 px-4 py-2.5"
              >
                <div className="h-1 w-6 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <h2 className="font-serif text-sm font-bold text-white truncate">
                  {story.name}
                </h2>
                <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">{story.years}</span>
                <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  headerExpanded
                    ? 'text-[var(--text-muted)]'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-card)]'
                }`}>
                  {headerExpanded ? 'Less' : 'More'}
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`inline ml-0.5 transition-transform ${headerExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>

              {/* Expanded content — flows naturally in scroll, no max-height constraint */}
              {headerExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {story.nickname && (
                    <p className="text-xs text-[var(--text-muted)] font-mono italic">{story.nickname}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={story.category} />
                  </div>
                  {story.contentWarning && (
                    <ContentWarning warning={story.contentWarning} />
                  )}
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {story.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {story.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: full header (always visible) */}
            <div className="hidden lg:block p-4">
              <div className="h-1 rounded-full mb-4" style={{ backgroundColor: cat.color }} />
              <h2 className="font-serif text-xl font-bold text-white">{story.name}</h2>
              {story.nickname && (
                <p className="text-sm text-[var(--text-muted)] font-mono italic mt-1">{story.nickname}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <CategoryBadge category={story.category} />
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{story.years}</span>
              </div>
              {story.contentWarning && (
                <div className="mt-3"><ContentWarning warning={story.contentWarning} /></div>
              )}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-4">{story.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {story.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Explore Further — scrolls with content */}
          {connectedEntries.length > 0 && (
            <div className="border-b border-[var(--border-subtle)]">
              <div className="px-4 pt-2 pb-1">
                <h3 className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Explore Further
                </h3>
              </div>
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
                {connectedEntries.map(({ story: s, reason }) => {
                  const sCat = CATEGORIES[s.category];
                  return (
                    <button
                      key={s.id}
                      onClick={() => onRelatedStoryClick(s)}
                      className="shrink-0 flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-lg px-3 py-2 transition-all group max-w-[220px]"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sCat.color }} />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-serif font-semibold text-[var(--text-primary)] group-hover:text-white truncate transition-colors">{s.name}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">
                          {s.locations.length} {s.locations.length === 1 ? 'moment' : 'moments'} · {s.years}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[8px] font-mono px-1.5 py-0.5 rounded-full ${
                        reason === 'related'
                          ? 'bg-[rgba(96,165,250,0.12)] text-blue-400'
                          : 'bg-[rgba(234,179,8,0.12)] text-yellow-500'
                      }`}>
                        {reason === 'related' ? 'Related' : 'Nearby'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab bar — sticky so it stays accessible while scrolling moments */}
          {hasWiki && renderTabBar(true)}

          {/* Moments */}
          <div className="p-4">
            <h3 className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Moments ({story.locations.length})
            </h3>
            <div className="space-y-2">
              {story.locations.map((location, i) => (
                <LocationCard
                  key={location.id}
                  ref={(el) => {
                    if (el) locationRefs.current.set(location.id, el);
                    else locationRefs.current.delete(location.id);
                  }}
                  location={location}
                  story={story}
                  isActive={currentActiveId === location.id}
                  onClick={onLocationSelect}
                  index={i}
                  onWikiJump={hasWiki ? handleWikiJump : undefined}
                  intersectingStories={locationIntersections.get(location.id)}
                  onStoryClick={onRelatedStoryClick}
                />
              ))}
            </div>
          </div>

          <div className="h-8" />
        </div>
      )}

      {/* Wiki tab: separate layout — header stays fixed, wiki panel handles own scroll */}
      {activeTab === 'wiki' && (
        <>
          <div className="shrink-0 border-b border-[var(--border-subtle)]">
            <div className="lg:hidden px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <h2 className="font-serif text-sm font-bold text-white truncate">{story.name}</h2>
              </div>
            </div>
            <div className="hidden lg:block px-4 py-3">
              <h2 className="font-serif text-lg font-bold text-white">{story.name}</h2>
            </div>
          </div>
          <div className="shrink-0">
            {renderTabBar()}
          </div>
          <WikiPanel
            story={story}
            activeLocation={activeLocation}
            onLocationSelect={onLocationSelect}
            initialSection={wikiInitialSection}
          />
        </>
      )}
    </div>
  );
}
