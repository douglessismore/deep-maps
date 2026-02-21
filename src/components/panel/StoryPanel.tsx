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
  onBackToExplore: () => void;
  onRelatedStoryClick: (story: Story) => void;
  onTagClick?: (tag: string) => void;
  allStories: Story[];
}

export function StoryPanel({
  story,
  activeLocation,
  onLocationSelect,
  onBackToExplore,
  onRelatedStoryClick,
  onTagClick,
  allStories,
}: StoryPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const locationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollDriving = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StoryTab>('locations');
  const [wikiInitialSection, setWikiInitialSection] = useState<string | undefined>(undefined);
  const [headerExpanded, setHeaderExpanded] = useState(false);

  const cat = CATEGORIES[story.category];
  const hasWiki = !!story.wikipediaSlug;

  // Scroll-driven location navigation
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

      if (closestId && closestId !== scrollActiveId) {
        setScrollActiveId(closestId);
        const location = story.locations.find((l) => l.id === closestId);
        if (location) {
          onLocationSelect(location);
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [story, onLocationSelect, scrollActiveId]);

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

  // All connected stories for the rabbit trail strip
  const connectedStories = [...relatedStories, ...nearbyStories];

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile back link — prominent, within the panel */}
      <button
        onClick={onBackToExplore}
        className="lg:hidden shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors border-b border-[var(--border-subtle)]"
      >
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to all stories
      </button>

      {/* Story Header — always visible, compact on mobile */}
      <div className="shrink-0 p-4 border-b border-[var(--border-subtle)]">
        <div className="h-1 rounded-full mb-2 lg:mb-4" style={{ backgroundColor: cat.color }} />
        <h2 className="font-serif text-xl font-bold text-white">
          {story.name}
        </h2>
        {story.nickname && (
          <p className="text-sm text-[var(--text-muted)] font-mono italic mt-1">
            {story.nickname}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 lg:mt-3">
          <CategoryBadge category={story.category} />
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{story.years}</span>
        </div>

        {/* Content warning — hidden on mobile when collapsed */}
        {story.contentWarning && (
          <div className={`mt-3 ${!headerExpanded ? 'hidden lg:block' : ''}`}>
            <ContentWarning warning={story.contentWarning} />
          </div>
        )}

        <p className={`text-sm text-[var(--text-secondary)] leading-relaxed mt-2 lg:mt-4 ${
          !headerExpanded ? 'line-clamp-2 lg:line-clamp-none' : ''
        }`}>
          {story.description}
        </p>

        {/* Tags — hidden on mobile when collapsed, clickable to filter */}
        <div className={`flex-wrap gap-1 mt-3 ${
          !headerExpanded ? 'hidden lg:flex' : 'flex'
        }`}>
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

        {/* Mobile expand/collapse toggle */}
        <button
          onClick={() => setHeaderExpanded(!headerExpanded)}
          className="lg:hidden flex items-center gap-1 mt-2 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {headerExpanded ? 'Show less' : 'Show more'}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className={`transition-transform ${headerExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Connected Stories — rabbit trail strip */}
      {connectedStories.length > 0 && (
        <div className="shrink-0 border-b border-[var(--border-subtle)]">
          <div className="px-4 pt-2 pb-1">
            <h3 className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Rabbit Trails ({connectedStories.length})
            </h3>
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
            {connectedStories.map((s) => {
              const sCat = CATEGORIES[s.category];
              return (
                <button
                  key={s.id}
                  onClick={() => onRelatedStoryClick(s)}
                  className="shrink-0 flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-lg px-3 py-2 transition-all group max-w-[200px]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: sCat.color }}
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-serif font-semibold text-[var(--text-primary)] group-hover:text-white truncate transition-colors">
                      {s.name}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)]">
                      {s.locations.length} {s.locations.length === 1 ? 'location' : 'locations'} · {s.years}
                    </p>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab bar — Locations | Wiki */}
      {hasWiki && (
        <div className="shrink-0 flex border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
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
            📍 Locations ({story.locations.length})
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
      )}

      {/* Content: Locations tab */}
      {activeTab === 'locations' && (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h3 className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Locations ({story.locations.length})
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

      {/* Content: Wiki tab */}
      {activeTab === 'wiki' && (
        <WikiPanel
          story={story}
          activeLocation={activeLocation}
          onLocationSelect={onLocationSelect}
          initialSection={wikiInitialSection}
        />
      )}
    </div>
  );
}
