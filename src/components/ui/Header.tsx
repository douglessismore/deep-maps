import { useState, useRef, useCallback } from 'react';
import type { Entity, Story, Moment, StoryCategory, StoryCollection, InteractionMode } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { SearchOverlay } from './SearchOverlay';
import { isV2 } from '../../lib/theme';

interface HeaderProps {
  mode: InteractionMode;
  activeStory: Story | null;
  activeEntity?: Entity | null;
  onBackToExplore: () => void;
  onBack?: () => void;
  backLabel?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
  onNearMe?: () => void;
  geoLoading?: boolean;
  geoError?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  onStorySelect?: (story: Story) => void;
  onEntitySelect?: (entity: Entity) => void;
  onCollectionSelect?: (collection: StoryCollection) => void;
  onMomentSelect?: (moment: Moment) => void;
  hasNavHistory?: boolean;
  activeCollection?: StoryCollection | null;
  onClearCollection?: () => void;
}

export function Header({
  mode,
  activeStory,
  activeEntity,
  onBackToExplore,
  onBack,
  backLabel,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilter,
  onSurpriseMe,
  onNearMe,
  geoLoading,
  geoError,
  userLocation,
  onStorySelect,
  onEntitySelect,
  onCollectionSelect,
  onMomentSelect,
  hasNavHistory,
  activeCollection,
  onClearCollection,
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showOverlay = searchFocused && searchQuery.trim().length >= 2 &&
    onStorySelect && onEntitySelect && onCollectionSelect && onMomentSelect;

  const handleCloseOverlay = useCallback(() => {
    setSearchFocused(false);
    // Blur the input to dismiss keyboard on mobile
    inputRef.current?.blur();
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    onSearchChange(value);
    // Ensure overlay shows when typing
    if (!searchFocused) setSearchFocused(true);
  }, [onSearchChange, searchFocused]);

  const handleClear = useCallback(() => {
    onSearchChange('');
    setSearchFocused(false);
    inputRef.current?.blur();
  }, [onSearchChange]);

  const v2 = isV2();

  return (
    <header className={v2
      ? 'shrink-0 z-10 bg-gradient-to-b from-[var(--bg-primary)] to-transparent'
      : 'shrink-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]'
    }>
      {/* Main bar */}
      <div className={v2 ? 'h-14 flex items-center px-6 gap-4' : 'h-12 flex items-center px-4 gap-3'}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo — always visible, always clickable to go home */}
          <button
            onClick={onBackToExplore}
            className="flex items-center gap-2 shrink-0 group"
            title="Back to full map"
          >
            {/* Logo: same red "Deep" + white "Maps" in both themes */}
              <>
                <div className="relative w-6 h-7 flex items-start justify-center">
                  <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 5.25 7.2 13.2 7.5 13.5.15.15.35.23.5.23s.35-.08.5-.23C8.8 21.2 16 13.25 16 8c0-4.42-3.58-8-8-8z" fill="#dc2626"/>
                    <circle cx="8" cy="8" r="3" fill="var(--bg-primary)"/>
                    {!v2 && <>
                      <circle cx="8" cy="8" r="2.2" stroke="rgba(220,38,38,0.3)" strokeWidth="0.5" fill="none"/>
                      <circle cx="8" cy="8" r="1.4" stroke="rgba(220,38,38,0.2)" strokeWidth="0.4" fill="none"/>
                      <circle cx="8" cy="8" r="0.6" fill="rgba(220,38,38,0.4)"/>
                    </>}
                  </svg>
                </div>
                <div>
                  <h1 className="font-serif text-lg font-bold tracking-tight leading-none">
                    <span className="text-[#dc2626]">Deep</span><span className="text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] transition-colors">Maps</span>
                  </h1>
                  {mode !== 'story' && mode !== 'entity' && (
                    <p className="hidden sm:block text-[9px] font-mono text-[var(--text-muted)] tracking-widest uppercase leading-none mt-0.5">
                      Everything that ever happened happened somewhere
                    </p>
                  )}
                </div>
              </>
          </button>

          {/* Story breadcrumb — shown when in story mode */}
          {mode === 'story' && activeStory && (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)] opacity-40 shrink-0">
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="font-serif text-sm font-semibold truncate text-[var(--text-primary)]">
                {activeStory.name}
              </h2>
              {activeStory.nickname && (
                <span className="text-[var(--text-muted)] text-xs font-mono hidden sm:inline truncate">
                  {activeStory.nickname}
                </span>
              )}
            </>
          )}

          {/* Entity breadcrumb — shown when in entity mode */}
          {mode === 'entity' && activeEntity && (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)] opacity-40 shrink-0">
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="font-serif text-sm font-semibold truncate text-[var(--text-primary)]">
                {activeEntity.name}
              </h2>
              {activeEntity.years && (
                <span className="text-[var(--text-muted)] text-xs font-mono hidden sm:inline">
                  {activeEntity.years}
                </span>
              )}
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Back + Home — story/entity mode, active collection, or when there's nav history */}
          {(mode === 'story' || mode === 'entity' || hasNavHistory || activeCollection) && (
            <>
              <button
                onClick={activeCollection && !hasNavHistory ? (onClearCollection || onBackToExplore) : (onBack || onBackToExplore)}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 min-h-[36px] rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 max-w-[160px]"
                title={activeCollection ? 'Back to Collections' : (backLabel ? `Back to ${backLabel}` : 'Back')}
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="truncate">{activeCollection ? 'Collections' : (backLabel || 'Back')}</span>
              </button>
              <button
                onClick={onBackToExplore}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 min-h-[36px] rounded-md transition-colors flex items-center"
                title="Home — back to full map"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L7 2.5L11.5 7M4 5.5V11.5h2.5V9h3v2.5H12V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}

          {/* Near Me — geolocation, explore mode only */}
          {mode !== 'story' && mode !== 'entity' && onNearMe && (
            <button
              onClick={onNearMe}
              disabled={geoLoading}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 shadow-sm border ${
                userLocation
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                  : geoError
                  ? 'bg-[var(--bg-card)] text-red-400 border-red-400/30'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
              }`}
              title={geoError || (userLocation ? 'Showing stories near you' : 'Find stories near you')}
            >
              {geoLoading ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                  <path d="M12.5 7a5.5 5.5 0 00-5.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2"/>
                  <circle cx="7" cy="7" r="1" fill="currentColor"/>
                </svg>
              )}
              {geoError ? (
                <span className="text-red-400 text-[10px]">{geoError}</span>
              ) : (
                <span className="hidden sm:inline">
                  {geoLoading ? 'Locating...' : 'Near Me'}
                </span>
              )}
            </button>
          )}

          {/* Surprise Me — always a standalone button */}
          <button
            onClick={onSurpriseMe}
            className={v2
              ? 'bg-[var(--accent-red)]/15 text-[var(--accent-red)] border border-[var(--accent-red)]/30 px-2.5 py-1.5 rounded-full text-xs font-mono transition-all hover:bg-[var(--accent-red)]/25 flex items-center gap-1.5'
              : 'bg-[var(--accent-red)] hover:bg-[#ef4444] text-white px-2.5 sm:px-3 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 shadow-sm'
            }
            title="Go somewhere unexpected"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 4h3.5c1.5 0 2.5 1 3.5 3s2 3 3.5 3H13m0 0l-2-2m2 2l-2 2M1 10h3.5c1 0 1.8-.5 2.5-1.2M13 4h-1.5c-1 0-1.8.5-2.5 1.2M13 4l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Surprise Me</span>
          </button>

          {mode !== 'story' && mode !== 'entity' && (
            <>
              {/* Search — with real-time overlay */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="search"
                  enterKeyHint="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={v2 ? 'Search for secrets...' : 'Search...'}
                  className={v2
                    ? 'bg-[var(--bg-card-hover)] border-none rounded-full px-4 py-1.5 text-xs w-32 sm:w-44 placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-red-dim)] font-sans'
                    : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md px-3 py-1 text-sm w-32 sm:w-44 placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-red-dim)] font-mono text-xs'
                  }
                />
                {searchQuery && (
                  <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M8 2L2 8M2 2L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
                {showOverlay && (
                  <SearchOverlay
                    query={searchQuery}
                    onStorySelect={onStorySelect!}
                    onEntitySelect={onEntitySelect!}
                    onCollectionSelect={onCollectionSelect!}
                    onMomentSelect={onMomentSelect!}
                    onClose={handleCloseOverlay}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category filter bar — only in explore mode, hidden on mobile to save vertical space */}
      {mode !== 'story' && mode !== 'entity' && (
        <div className={v2
          ? 'hidden lg:flex items-center gap-3 px-6 pb-3 overflow-x-auto'
          : 'hidden lg:flex items-center gap-1 px-4 pb-2 overflow-x-auto'
        }>
          <button
            onClick={() => onCategoryFilter(null)}
            className={v2
              ? `shrink-0 px-4 py-2 rounded-full text-[10px] font-mono font-medium tracking-widest uppercase transition-all ${
                  categoryFilter === null
                    ? 'bg-[var(--accent-red)] text-white'
                    : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]/80'
                }`
              : `shrink-0 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  categoryFilter === null
                    ? 'bg-[var(--accent-red)] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`
            }
          >
            All
          </button>
          {(Object.entries(CATEGORIES) as [StoryCategory, { label: string; color: string }][]).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => onCategoryFilter(categoryFilter === key ? null : key)}
              className={v2
                ? `shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-mono font-medium tracking-widest uppercase transition-all border-l-2 ${
                    categoryFilter === key
                      ? 'text-white'
                      : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]/80'
                  }`
                : `shrink-0 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    categoryFilter === key
                      ? 'text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`
              }
              style={{
                backgroundColor: categoryFilter === key ? cat.color : (v2 ? undefined : 'var(--bg-card)'),
                borderLeftColor: v2 ? cat.color : undefined,
              }}
            >
              {v2 && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
