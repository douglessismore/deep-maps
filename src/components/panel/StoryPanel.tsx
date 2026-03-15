import { useEffect, useMemo, useRef, useState } from 'react';
import type { Entity, Story, Moment } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { moments } from '../../data/moments';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getStoryEntities, canonicalStoryIds } from '../../lib/entityHelpers';

const momentMap = buildMomentMap(moments);
import { CategoryBadge } from '../ui/CategoryBadge';
import { ContentWarning } from '../ui/ContentWarning';
import { LocationCard } from './LocationCard';
import { WikiPanel } from './WikiPanel';
import { GoDeeperCard } from './GoDeeperCard';

type StoryTab = 'locations' | 'wiki';

interface StoryPanelProps {
  story: Story;
  activeLocation: Moment | null;
  onLocationSelect: (location: Moment) => void;
  onScrollLocationSelect: (location: Moment) => void;
  onScrollToTop?: () => void;
  onRelatedStoryClick: (story: Story) => void;
  onTagClick?: (tag: string) => void;
  allStories: Story[];
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  onEntityClick?: (entity: Entity, fromMoment?: Moment) => void;
}

export function StoryPanel({
  story,
  activeLocation,
  onLocationSelect,
  onScrollLocationSelect,
  onScrollToTop,
  onRelatedStoryClick,
  onTagClick,
  allStories,
  onBack,
  backLabel,
  onHome,
  onEntityClick,
}: StoryPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollDriving = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const isTapGuard = useRef(false); // Suppresses scroll handler after card tap to prevent jitter
  const manualSelectTime = useRef(0); // Timestamp of last manual card click — grace period for reading
  const scrollTimeout = useRef<number | null>(null);
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StoryTab>('locations');
  const [wikiInitialSection, setWikiInitialSection] = useState<string | undefined>(undefined);
  const [headerExpanded, setHeaderExpanded] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  const cat = CATEGORIES[story.category];
  const hasWiki = !!story.wikipediaSlug;

  const scrollRafId = useRef(0);

  // Scroll-driven location navigation + header auto-collapse
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      // Skip if this scroll was triggered by our own scrollIntoView correction, a card tap,
      // or the user is still reading a manually-expanded card (5s grace period)
      if (isProgrammaticScroll.current || isTapGuard.current) return;
      if (Date.now() - manualSelectTime.current < 5000) return;

      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        isScrollDriving.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = window.setTimeout(() => {
          isScrollDriving.current = false;
        }, 300);

        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;

        // If scrolled near bottom, activate the last card (it can't reach center)
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 30;

        let closestId: string | null = null;
        let closestDist = Infinity;

        // Check if all moment cards are below the center line (user scrolled to top/header)
        // Use card title area (top + 30px) instead of center — stable regardless of
        // expanded/collapsed state (center shifts ~150px when a card expands, title doesn't)
        let allBelowCenter = true;
        locationRefs.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const titleY = rect.top + 30;
          if (titleY <= centerY) allBelowCenter = false;
          let dist = Math.abs(titleY - centerY);
          // Hysteresis: the current active card gets a 60px bonus so it "sticks" —
          // a new card must be at least 60px closer to the center to steal activation.
          // This prevents ping-pong when expand/collapse layout shifts move cards.
          if (id === scrollActiveId) dist = Math.max(0, dist - 60);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        // Scrolled above all moments → reset to show full story on map
        if (allBelowCenter && locationRefs.current.size > 0) {
          if (scrollActiveId) {
            setScrollActiveId(null);
            onScrollToTop?.();
          }
          return;
        }

        // Near bottom of scroll: pick the last location
        const storyLocations = resolveLocationsFromMap(story, momentMap);
        if (isNearBottom && storyLocations.length > 0) {
          closestId = storyLocations[storyLocations.length - 1].id;
        }

        if (closestId && closestId !== scrollActiveId) {
          setScrollActiveId(closestId);
          // Suppress scroll handler during the card expand/collapse transition (~200ms)
          // to prevent the layout shift from flipping activation between adjacent cards
          isProgrammaticScroll.current = true;
          setTimeout(() => { isProgrammaticScroll.current = false; }, 300);
          const location = storyLocations.find((l) => l.id === closestId);
          if (location) {
            onScrollLocationSelect(location);
          }
        }
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollRafId.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [story, onScrollLocationSelect, scrollActiveId]);

  // Scroll correction: when the active card changes, the collapsing card above shifts content up.
  // If the newly active card's title gets pushed above the scroll container, nudge it back into view.
  // Uses 'instant' behavior + a guard ref to prevent feedback loops with the scroll handler.
  useEffect(() => {
    if (!scrollActiveId) return;
    const el = locationRefs.current.get(scrollActiveId);
    const container = scrollContainerRef.current;
    if (el && container) {
      requestAnimationFrame(() => {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (elRect.top < containerRect.top) {
          // isProgrammaticScroll may already be true from the scroll handler's 300ms guard.
          // Only set+clear if it wasn't already guarded, to avoid prematurely unblocking.
          const wasAlreadyGuarded = isProgrammaticScroll.current;
          isProgrammaticScroll.current = true;
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          if (!wasAlreadyGuarded) {
            requestAnimationFrame(() => {
              isProgrammaticScroll.current = false;
            });
          }
        }
      });
    }
  }, [scrollActiveId]);

  // Auto-scroll to activeLocation on mount (e.g. arriving from entity page with moment context)
  useEffect(() => {
    if (!activeLocation) return;
    requestAnimationFrame(() => {
      const el = locationRefs.current.get(activeLocation.id);
      if (el) {
        isProgrammaticScroll.current = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isProgrammaticScroll.current = false;
          });
        });
      }
    });
  }, [story.id]); // Only on story mount/change

  // Related stories (explicit cross-links)
  const relatedStories = useMemo(
    () => (story.relatedStoryIds || [])
      .map((id) => allStories.find((s) => s.id === id))
      .filter((s): s is Story => s !== undefined),
    [story.relatedStoryIds, allStories]
  );

  // Stories that share nearby locations (within ~50 miles), excluding already-related
  const nearbyStories = useMemo(() => {
    const relatedIds = new Set(relatedStories.map((s) => s.id));
    const storyLocs = resolveLocationsFromMap(story, momentMap);
    return allStories.filter((other) => {
      if (other.id === story.id || relatedIds.has(other.id)) return false;
      const otherLocs = resolveLocationsFromMap(other, momentMap);
      return storyLocs.some((storyLoc) =>
        otherLocs.some((otherLoc) => {
          const dlat = storyLoc.lat - otherLoc.lat;
          const dlng = storyLoc.lng - otherLoc.lng;
          return Math.sqrt(dlat * dlat + dlng * dlng) < 1; // ~70 miles
        })
      );
    });
  }, [story, allStories, relatedStories]);

  // All connected stories with reason labels for the navigation strip
  // Filter out canonical stories — their entity cards replace them in DIVE DEEPER
  const connectedEntries = useMemo(() => [
    ...relatedStories.filter(s => !canonicalStoryIds.has(s.id)).map(s => ({ story: s, reason: 'related' as const })),
    ...nearbyStories.filter(s => !canonicalStoryIds.has(s.id)).map(s => ({ story: s, reason: 'nearby' as const })),
  ], [relatedStories, nearbyStories]);

  // Story-level entities for DIVE DEEPER header section
  // Excludes the entity that "owns" this story to avoid self-links
  const storyEntities = useMemo(
    () => getStoryEntities(story.id).filter(({ entity }) => entity.canonicalStoryId !== story.id),
    [story.id]
  );

  // Cross-story moment map: for each momentId in this story, which OTHER stories also reference it?
  const momentStoryMap = useMemo(() => {
    const map = new Map<string, Story[]>();
    const storyMomentIds = new Set(story.moments.map((sm) => sm.momentId));
    for (const other of allStories) {
      if (other.id === story.id) continue;
      for (const sm of other.moments) {
        if (storyMomentIds.has(sm.momentId)) {
          const list = map.get(sm.momentId) || [];
          list.push(other);
          map.set(sm.momentId, list);
        }
      }
    }
    return map;
  }, [story, allStories]);

  const currentActiveId = activeLocation?.id || scrollActiveId;

  // Tap guard: when user taps a card, suppress the scroll handler briefly
  // to prevent the expand/collapse layout shift from causing a feedback loop
  const handleLocationClick = (location: Moment) => {
    isTapGuard.current = true;
    manualSelectTime.current = Date.now(); // 5s grace period — scroll won't auto-switch
    onLocationSelect(location);
    setTimeout(() => { isTapGuard.current = false; }, 400);
  };

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
        📍 Moments ({story.moments.length})
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
                    {story.storyType && story.storyType !== 'incident' && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize">
                        {story.storyType}
                      </span>
                    )}
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
                {story.storyType && story.storyType !== 'incident' && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize">
                    {story.storyType}
                  </span>
                )}
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

          {/* Dive Deeper — story-level entities + related stories */}
          {(storyEntities.length > 0 || connectedEntries.length > 0) && (
            <div className="border-b border-[var(--border-subtle)]">
              <div className="px-4 pt-2 pb-1">
                <h3 className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Dive Deeper
                </h3>
              </div>
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
                {storyEntities.map(({ entity, momentCount, storyCount }) => (
                  <GoDeeperCard
                    key={entity.id}
                    label={entity.name}
                    sublabel={`${momentCount} ${momentCount === 1 ? 'moment' : 'moments'} · ${storyCount} ${storyCount === 1 ? 'story' : 'stories'}`}
                    icon={<span className="text-sm opacity-60">{entity.type === 'person' ? '👤' : '📍'}</span>}
                    onClick={() => onEntityClick?.(entity)}
                  />
                ))}
                {connectedEntries.map(({ story: s, reason }) => {
                  const sCat = CATEGORIES[s.category];
                  return (
                    <GoDeeperCard
                      key={s.id}
                      label={s.name}
                      sublabel={`${s.moments.length} ${s.moments.length === 1 ? 'moment' : 'moments'} · ${s.years}`}
                      icon={<span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sCat.color }} />}
                      onClick={() => onRelatedStoryClick(s)}
                      badge={reason === 'related' ? { text: 'Related', color: 'blue' } : { text: 'Nearby', color: 'yellow' }}
                    />
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
              Moments ({story.moments.length})
            </h3>
            <div className="space-y-2">
              {resolveLocationsFromMap(story, momentMap).map((location, i) => {
                const storyMoment = story.moments.find((sm) => sm.momentId === location.id);
                return (
                  <LocationCard
                    key={location.id}
                    ref={(el) => {
                      if (el) locationRefs.current.set(location.id, el);
                      else locationRefs.current.delete(location.id);
                    }}
                    location={location}
                    story={story}
                    isActive={currentActiveId === location.id}
                    onClick={handleLocationClick}
                    index={i}
                    onWikiJump={hasWiki ? handleWikiJump : undefined}
                    narrativeGlue={storyMoment?.narrativeGlue}
                    alsoInStories={momentStoryMap.get(location.id)}
                    onStoryClick={onRelatedStoryClick}
                    onEntityClick={onEntityClick}
                  />
                );
              })}
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
