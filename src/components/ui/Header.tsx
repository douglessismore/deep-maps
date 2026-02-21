import type { Story, StoryCategory, InteractionMode } from '../../types';
import { CATEGORIES } from '../../lib/categories';

interface HeaderProps {
  mode: InteractionMode;
  activeStory: Story | null;
  onBackToExplore: () => void;
  onBackFromStory?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
}

export function Header({
  mode,
  activeStory,
  onBackToExplore,
  onBackFromStory,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilter,
  onSurpriseMe,
}: HeaderProps) {
  return (
    <header className="shrink-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
      {/* Main bar */}
      <div className="h-12 flex items-center px-4 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo — always visible, always clickable to go home */}
          <button
            onClick={onBackToExplore}
            className="flex items-center gap-2 shrink-0 group"
            title="Back to full map"
          >
            <div className="relative w-6 h-7 flex items-start justify-center">
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 5.25 7.2 13.2 7.5 13.5.15.15.35.23.5.23s.35-.08.5-.23C8.8 21.2 16 13.25 16 8c0-4.42-3.58-8-8-8z" fill="var(--accent-red)"/>
                <circle cx="8" cy="8" r="3" fill="var(--bg-primary)"/>
                <circle cx="8" cy="8" r="2.2" stroke="rgba(220,38,38,0.3)" strokeWidth="0.5" fill="none"/>
                <circle cx="8" cy="8" r="1.4" stroke="rgba(220,38,38,0.2)" strokeWidth="0.4" fill="none"/>
                <circle cx="8" cy="8" r="0.6" fill="rgba(220,38,38,0.4)"/>
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight leading-none">
                <span className="text-[var(--accent-red)]">Deep</span><span className="text-white group-hover:text-[var(--text-secondary)] transition-colors">Maps</span>
              </h1>
              {mode !== 'story' && (
                <p className="hidden sm:block text-[9px] font-mono text-[var(--text-muted)] tracking-widest uppercase leading-none mt-0.5">
                  Everything that ever happened happened somewhere
                </p>
              )}
            </div>
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
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Back to Explore — explicit button in story mode */}
          {mode === 'story' && (
            <button
              onClick={onBackFromStory || onBackToExplore}
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white px-3 py-1.5 min-h-[36px] rounded-md text-xs font-mono transition-colors flex items-center gap-1.5"
              title="Back"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back</span>
            </button>
          )}

          {/* Surprise Me — always visible for endless rabbit trail */}
          <button
            onClick={onSurpriseMe}
            className="bg-[var(--accent-red)] hover:bg-[#ef4444] text-white px-2.5 sm:px-3 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 shadow-sm"
            title="Go somewhere unexpected"
          >
            {/* Shuffle arrows icon — "take me somewhere random" */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 4h3.5c1.5 0 2.5 1 3.5 3s2 3 3.5 3H13m0 0l-2-2m2 2l-2 2M1 10h3.5c1 0 1.8-.5 2.5-1.2M13 4h-1.5c-1 0-1.8.5-2.5 1.2M13 4l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Surprise Me</span>
          </button>

          {mode !== 'story' && (
            <>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md px-3 py-1 text-sm w-32 sm:w-44 placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-red-dim)] font-mono text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M8 2L2 8M2 2L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category filter bar — only in explore mode */}
      {mode !== 'story' && (
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          <button
            onClick={() => onCategoryFilter(null)}
            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              categoryFilter === null
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            All
          </button>
          {(Object.entries(CATEGORIES) as [StoryCategory, { label: string; color: string }][]).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => onCategoryFilter(categoryFilter === key ? null : key)}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                categoryFilter === key
                  ? 'text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              style={{
                backgroundColor: categoryFilter === key ? cat.color : 'var(--bg-card)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
