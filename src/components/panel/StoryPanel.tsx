import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Entity, Story, Moment, StoryCollection } from '../../types';
import type L from 'leaflet';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getStoryEntities, getEntityIcon, getCollectionsForMoment } from '../../lib/entityHelpers';
import { useAppData } from '../../lib/data/provider';
import { queryClient } from '../../lib/data/provider';
import { useUIVariant } from '../../lib/uiVariant';
import { isAdminMode } from '../../lib/admin';
import { uploadStoryImage } from '../../lib/image-upload';
import { CategoryBadge } from '../ui/CategoryBadge';
import { ContentWarning } from '../ui/ContentWarning';
import { LocationCard } from './LocationCard';
import { WikiPanel } from './WikiPanel';
import { GoDeeperCard } from './GoDeeperCard';
import type { SheetSnap } from '../ui/BottomSheet';
import { SurpriseMeButton } from '../ui/SurpriseMeButton';
import { isV2 } from '../../lib/theme';

type StoryTab = 'locations' | 'wiki';

// ─── Admin image upload section ──────────────────────────────────────

function StoryImageSection({ story }: { story: Story }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const admin = isAdminMode();

  const displayUrl = localUrl || story.imageUrl;

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const result = await uploadStoryImage(story.id, file);
    setUploading(false);
    // Reset file input so re-selecting the same file triggers onChange
    if (fileRef.current) fileRef.current.value = '';

    if (result.error) {
      setError(result.error);
      return;
    }

    // Show image immediately — append cache-buster so browser doesn't serve stale version
    setLocalUrl(result.url! + '?t=' + Date.now());

    // Update TanStack Query cache so the image persists across navigation
    queryClient.setQueryData(['app-data', 'supabase'], (prev: unknown) => {
      if (!prev || typeof prev !== 'object') return prev;
      const data = prev as { stories: Story[]; [k: string]: unknown };
      return {
        ...data,
        stories: data.stories.map((s: Story) =>
          s.id === story.id ? { ...s, imageUrl: result.url } : s,
        ),
      };
    });
  }, [story.id]);

  return (
    <>
      {displayUrl && (
        <div className="mt-3 rounded overflow-hidden relative">
          <img src={displayUrl} alt="" className="w-full h-32 object-cover opacity-80" />
          {admin && !uploading && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-1 right-1 px-2 py-0.5 rounded text-[10px] bg-black/60 text-white/80 hover:bg-black/80 transition-colors cursor-pointer"
            >
              Change
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      {!displayUrl && admin && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-3 w-full py-2 rounded border border-dashed border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
        >
          {uploading ? 'Uploading...' : '+ Add photo'}
        </button>
      )}
      {error && (
        <p className="mt-1 text-[10px] text-red-400">{error}</p>
      )}
      {admin && (
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleUpload}
        />
      )}
    </>
  );
}

interface StoryPanelProps {
  story: Story;
  activeLocation: Moment | null;
  onLocationSelect: (location: Moment) => void;
  onScrollLocationSelect: (location: Moment) => void;
  onHighlightOnly?: (location: Moment) => void;
  onScrollToTop?: () => void;
  onRelatedStoryClick: (story: Story) => void;
  onTagClick?: (tag: string) => void;
  allStories: Story[];
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  onEntityClick?: (entity: Entity, fromMoment?: Moment) => void;
  onCollectionSelect?: (collection: StoryCollection) => void;
  sheetSnap?: SheetSnap;
  onExpandRequest?: () => void;
  suppressDetailPan?: React.RefObject<boolean>;
  onSurpriseMe?: () => void;
  mapInstance?: L.Map | null;
}

export function StoryPanel({
  story,
  activeLocation,
  onLocationSelect,
  onScrollLocationSelect,
  onHighlightOnly,
  onScrollToTop,
  onRelatedStoryClick,
  onTagClick,
  allStories,
  onBack,
  backLabel,
  onHome,
  onEntityClick,
  onCollectionSelect,
  sheetSnap,
  onExpandRequest,
  suppressDetailPan,
  onSurpriseMe,
  mapInstance,
}: StoryPanelProps) {
  const { moments, collections } = useAppData();
  const momentMap = useMemo(() => buildMomentMap(moments), [moments]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollDriving = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const isTapGuard = useRef(false); // Suppresses scroll handler after card tap to prevent jitter
  const isUserScrolling = useRef(false); // Prevents external scroll-to during user scroll
  const scrollEndTimer = useRef<number | undefined>(undefined);
  const scrollTimeout = useRef<number | null>(null);
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StoryTab>('locations');
  const savedScrollTop = useRef<Record<string, number>>({});
  const [headerOutOfView, setHeaderOutOfView] = useState(false);
  // contextExpanded state removed — sticky bar now has fixed height with 1-line description
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const [wikiInitialSection, setWikiInitialSection] = useState<string | undefined>(undefined);
  const [headerExpanded] = useState(true);
  const [momentSort, setMomentSort] = useState<'narrative' | 'nearest' | 'timeline'>('narrative');
  // 'narrative' is the default (story order) but not exposed as a button — selecting nearest/timeline
  // overrides it, and there's no way to go back to narrative (which is fine, story order is initial state)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );
  const { variant } = useUIVariant();

  // Spotlight at peek = show only one rich card. Split = always rich cards (no compact).
  const isSpotlightPeek = variant === 'spotlight' && isMobile && sheetSnap === 'peek';
  const useCompactCards = variant === 'split' ? false : (variant === 'spotlight' ? (!isMobile || sheetSnap !== 'peek') && isMobile : isMobile);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const cat = CATEGORIES[story.category];
  const hasWiki = !!story.wikipediaSlug;

  const scrollRafId = useRef(0);

  // (expandedLocationIdRef removed — no expansion state)

  // Detect when story header scrolls out of view → show sticky context bar
  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderOutOfView(!entry.isIntersecting),
      { root: container, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab]);

  // Scroll-driven location navigation + header auto-collapse
  // Captured once at mount, before any effect can clear the global ref
  const disableScrollPanForSession = useRef(!!suppressDetailPan?.current);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      // Skip if this scroll was triggered by our own scrollIntoView correction, a card tap,
      // or the user is still reading a manually-expanded card (5s grace period)
      if (isProgrammaticScroll.current || isTapGuard.current) return;
      // Clear the global flag so other panels don't inherit it
      if (suppressDetailPan?.current) {
        suppressDetailPan.current = false;
      }
      // Mark user as actively scrolling — prevents external scroll-to from bouncing
      isUserScrolling.current = true;
      clearTimeout(scrollEndTimer.current);
      scrollEndTimer.current = window.setTimeout(() => { isUserScrolling.current = false; }, 500);

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
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;

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
          const location = storyLocations.find((l) => l.id === closestId);
          if (location) {
            if (disableScrollPanForSession.current) {
              onHighlightOnly?.(location);
            } else {
              onScrollLocationSelect(location);
            }
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

  // Initial activation: set the first location as active on story mount.
  // Also notifies parent so MapView can dim non-active pins immediately.
  // The boundsLockUntil guard in MapView prevents this from overriding
  // the story-level fitBounds zoom with a single-pin zoom.
  useEffect(() => {
    const storyLocations = resolveLocationsFromMap(story, momentMap);
    if (storyLocations.length > 0) {
      const initialId = activeLocation?.id ?? storyLocations[0].id;
      setScrollActiveId(initialId);
      // Skip the map pan if navigating from homepage (viewport is being preserved)
      if (!suppressDetailPan?.current) {
        const initialLocation = storyLocations.find(l => l.id === initialId) ?? storyLocations[0];
        onScrollLocationSelect(initialLocation);
      }
    }
  }, [story.id]); // Only on story mount/change

  // (Scroll correction and auto-expand effects removed — no expansion state to shift layout)

  // Auto-scroll to activeLocation on mount
  useEffect(() => {
    if (!activeLocation) return;
    requestAnimationFrame(() => {
      const el = locationRefs.current.get(activeLocation.id);
      if (el) {
        isProgrammaticScroll.current = true;
        // Use instant scroll when coming from homepage to avoid rapid fly-through
        const behavior = suppressDetailPan?.current ? 'instant' as const : 'smooth' as const;
        el.scrollIntoView({ behavior, block: 'center' });
        // Keep programmatic guard for longer during smooth scroll
        const guardMs = behavior === 'smooth' ? 600 : 50;
        setTimeout(() => { isProgrammaticScroll.current = false; }, guardMs);
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

  // All connected stories with reason labels for the navigation strip.
  // Whitelist: only incident stories are browseable (biography/place/era are hidden).
  const connectedEntries = useMemo(() => [
    ...relatedStories.filter(s => s.storyType === 'incident').map(s => ({ story: s, reason: 'related' as const })),
    ...nearbyStories.filter(s => s.storyType === 'incident').map(s => ({ story: s, reason: 'nearby' as const })),
  ], [relatedStories, nearbyStories]);

  // Story-level entities for DIVE DEEPER header section
  // Excludes: the entity that "owns" this story (self-link) + concept entities (abstract labels)
  const storyEntities = useMemo(
    () => getStoryEntities(story.id).filter(({ entity }) =>
      entity.canonicalStoryId !== story.id && entity.type !== 'concept'
    ),
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
    const isExpanding = expandedLocationKey !== location.id;
    setExpandedLocationKey(isExpanding ? location.id : null);
    onLocationSelect(location);
    // Scroll the card into view after expansion layout settles
    if (isExpanding) {
      isProgrammaticScroll.current = true;
      requestAnimationFrame(() => {
        const el = locationRefs.current.get(location.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { isProgrammaticScroll.current = false; }, 600);
      });
    }
    setTimeout(() => { isTapGuard.current = false; }, 800);
  };

  // Handler for "Read on Wikipedia" links in LocationCard
  const handleWikiJump = (section?: string) => {
    setWikiInitialSection(section);
    setActiveTab('wiki');
  };

  // Tab bar rendered as function to avoid TS control-flow narrowing issues
  // (inside `activeTab === 'locations'` block, TS knows activeTab can't be 'wiki')
  const contextBarRef = useRef<HTMLDivElement>(null);
  const [contextBarHeight, setContextBarHeight] = useState(0);

  // Measure context bar height for tab bar offset
  useEffect(() => {
    if (!headerOutOfView || !contextBarRef.current) { setContextBarHeight(0); return; }
    const h = contextBarRef.current.getBoundingClientRect().height;
    setContextBarHeight(h);
  }, [headerOutOfView]);

  const renderTabBar = (sticky?: boolean) => (
    <div
      className={`flex border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] ${sticky ? 'sticky z-[9]' : ''}`}
      style={sticky ? { top: contextBarHeight } : undefined}
    >
      <button
        onClick={() => {
          savedScrollTop.current[activeTab] = scrollContainerRef.current?.scrollTop ?? 0;
          setActiveTab('locations');
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = savedScrollTop.current['locations'] ?? 0;
          });
        }}
        className={`flex-1 py-2 text-xs font-mono transition-colors ${
          activeTab === 'locations'
            ? 'text-[var(--text-primary)] border-b-2'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        style={{
          borderBottomColor: activeTab === 'locations' ? cat.color : 'transparent',
        }}
      >
        📍 Moments ({story.moments.length})
      </button>
      <button
        onClick={() => {
          savedScrollTop.current[activeTab] = scrollContainerRef.current?.scrollTop ?? 0;
          setWikiInitialSection(undefined);
          setActiveTab('wiki');
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = savedScrollTop.current['wiki'] ?? 0;
          });
        }}
        className={`flex-1 py-2 text-xs font-mono transition-colors ${
          activeTab === 'wiki'
            ? 'text-[var(--text-primary)] border-b-2'
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
      {/* Mobile breadcrumb — stays fixed outside scroll (hidden in spotlight peek) */}
      {onBack && !isSpotlightPeek && (
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 py-1 px-2 -ml-2 rounded-md bg-[var(--bg-overlay-subtle)] hover:bg-[var(--bg-overlay-hover)]"
          >
            <svg width="14" height="14" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {backLabel || 'Home'}
          </button>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">·</span>
          <p className="text-[11px] font-mono text-[var(--text-primary)] truncate min-w-0">
            {story.name}
          </p>
          {onHome && (
            <button
              onClick={onHome}
              className="ml-auto text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 shrink-0"
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
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
          {/* Story Header — scrolls with content (hidden in spotlight peek) */}
          {!isSpotlightPeek && <div className="border-b border-[var(--border-subtle)]">
            {/* Mobile: hero bio header — always visible, collapsible description */}
            <div className="lg:hidden">
              {/* Identity row: category bar + name + years */}
              <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-lg font-bold text-[var(--text-primary)] leading-tight">{story.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-[var(--accent-red)] uppercase tracking-wider">{story.years}</span>
                    <CategoryBadge category={story.category} />
                  </div>
                </div>
              </div>

              {/* Content warning */}
              {story.contentWarning && (
                <div className="px-4 pb-2">
                  <ContentWarning warning={story.contentWarning} />
                </div>
              )}

              {/* Bio section — always expanded, prominent hero treatment */}
              {story.description && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3">
                    <div className="border-l-2 pl-3" style={{ borderColor: cat.color }}>
                      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                        {story.description}
                      </p>
                    </div>
                    <StoryImageSection story={story} />
                  </div>
                </div>
              )}

              {/* Tags + Wikipedia — visible when expanded */}
              {headerExpanded && (
                <div className="px-4 pb-3 pl-7">
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

            {/* Desktop: full header (always visible) — V2 gets editorial treatment */}
            <div className={isV2() ? 'hidden lg:block px-6 py-6' : 'hidden lg:block p-4'}>
              {isV2() ? (
                /* V2: category label above, large serif title, italic description */
                <>
                  <div className="inline-block px-3 py-1 rounded-sm mb-3" style={{ backgroundColor: cat.color }}>
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-white">
                      {cat.label}
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">{story.name}</h2>
                  {story.nickname && (
                    <p className="text-sm text-[var(--text-muted)] font-mono italic mt-1">{story.nickname}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                    <span>{story.years}</span>
                    {story.storyType && story.storyType !== 'incident' && (
                      <>
                        <span className="w-6 h-[1px] bg-[var(--border-subtle)]" />
                        <span className="capitalize">{story.storyType}</span>
                      </>
                    )}
                  </div>
                  {story.contentWarning && (
                    <div className="mt-3"><ContentWarning warning={story.contentWarning} /></div>
                  )}
                  <p className="font-serif text-lg italic text-[var(--text-secondary)] leading-relaxed mt-5">{story.description}</p>
                  <StoryImageSection story={story} />
                  <div className="flex flex-wrap gap-2 mt-4">
                    {story.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                        className="px-3 py-1 rounded-full text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer uppercase tracking-wider italic"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Default */
                <>
                  <div className="h-1 rounded-full mb-4" style={{ backgroundColor: cat.color }} />
                  <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">{story.name}</h2>
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
                  <StoryImageSection story={story} />
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
                </>
              )}
            </div>
            {/* Sentinel — triggers sticky context bar when header scrolls out */}
            <div ref={headerSentinelRef} className="h-0" />
          </div>}

          {/* Sticky context bar — appears when header scrolls out of view */}
          {headerOutOfView && !isSpotlightPeek && (
            <div
              ref={contextBarRef}
              className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)] cursor-pointer"
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="flex items-center gap-2.5 px-4 py-2">
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-serif font-bold text-[var(--text-primary)] leading-tight">{story.name}</h3>
                  {story.description && (
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5 line-clamp-1">{story.description}</p>
                  )}
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[var(--text-muted)]">
                  <path d="M6 8l-3-3h6z" fill="currentColor" opacity="0.5"/>
                </svg>
              </div>
            </div>
          )}

          {/* Dive Deeper — story-level entities + related stories (hidden in spotlight peek) */}
          {!isSpotlightPeek && (storyEntities.length > 0 || connectedEntries.length > 0) && (
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
                    icon={<span className="text-sm opacity-60">{getEntityIcon(entity)}</span>}
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

          {/* Tab bar — sticky so it stays accessible while scrolling moments (hidden in spotlight peek) */}
          {!isSpotlightPeek && hasWiki && renderTabBar(true)}

          {/* Moments */}
          <div className="p-4">
            {/* Sort toggle — only for multi-moment stories, hidden in spotlight peek */}
            {!isSpotlightPeek && resolveLocationsFromMap(story, momentMap).length >= 2 && (
              <div className="flex items-center gap-2 mb-3">
                {(['nearest', 'timeline'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setMomentSort(mode)}
                    className={`px-3 py-1.5 text-[13px] font-mono rounded-full transition-colors ${
                      momentSort === mode
                        ? 'bg-[var(--bg-overlay-active)] text-[var(--text-primary)] ring-1 ring-[var(--border-hover)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-overlay-subtle)]'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {(() => {
                const allLocations = resolveLocationsFromMap(story, momentMap);
                // Sort based on selected mode
                const sortedLocations = momentSort === 'narrative' ? allLocations : (() => {
                  const sorted = [...allLocations];
                  if (momentSort === 'timeline') {
                    sorted.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
                  } else if (momentSort === 'nearest' && mapInstance) {
                    const center = mapInstance.getCenter();
                    sorted.sort((a, b) =>
                      distanceMiles(center.lat, center.lng, a.lat, a.lng) -
                      distanceMiles(center.lat, center.lng, b.lat, b.lng)
                    );
                  }
                  return sorted;
                })();
                // Spotlight at peek: show only the active card as a rich "now playing" card
                const locationsToRender = isSpotlightPeek
                  ? (() => {
                      const activeId = currentActiveId;
                      const active = activeId ? sortedLocations.find(l => l.id === activeId) : sortedLocations[0];
                      return active ? [active] : sortedLocations.slice(0, 1);
                    })()
                  : sortedLocations;

                return locationsToRender.map((location) => {
                  const storyMoment = story.moments.find((sm) => sm.momentId === location.id);
                  const actualIndex = allLocations.indexOf(location);
                  return (
                    <div
                      key={location.id}
                      onClick={isSpotlightPeek ? () => onExpandRequest?.() : undefined}
                      className={isSpotlightPeek ? 'cursor-pointer' : undefined}
                    >
                      <LocationCard
                        ref={(el) => {
                          if (el) locationRefs.current.set(location.id, el);
                          else locationRefs.current.delete(location.id);
                        }}
                        location={location}
                        story={story}
                        isActive={currentActiveId === location.id}
                        isExpanded={expandedLocationKey === location.id}
                        compact={useCompactCards}
                        onClick={isSpotlightPeek ? () => onExpandRequest?.() : handleLocationClick}
                        index={actualIndex}
                        onWikiJump={hasWiki ? handleWikiJump : undefined}
                        narrativeGlue={storyMoment?.narrativeGlue}
                        alsoInStories={momentStoryMap.get(location.id)}
                        collections={getCollectionsForMoment(location.id, collections)}
                        onCollectionSelect={onCollectionSelect}
                        onStoryClick={onRelatedStoryClick}
                        onEntityClick={onEntityClick}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {!isSpotlightPeek && onSurpriseMe && <SurpriseMeButton onClick={onSurpriseMe} />}
          {!isSpotlightPeek && <div className="h-24 lg:h-[40vh]" />}
        </div>
      )}

      {/* Wiki tab: separate layout — header stays fixed, wiki panel handles own scroll */}
      {activeTab === 'wiki' && (
        <>
          <div className="shrink-0 border-b border-[var(--border-subtle)]">
            <div className="lg:hidden px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <h2 className="font-serif text-sm font-bold text-[var(--text-primary)] truncate">{story.name}</h2>
              </div>
            </div>
            <div className="hidden lg:block px-4 py-3">
              <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">{story.name}</h2>
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
