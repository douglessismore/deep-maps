import type { Entity, Moment, Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { getEntityMomentStories } from '../../lib/entityHelpers';
import { useMemo } from 'react';

interface EntityPanelProps {
  entity: Entity;
  onMomentClick: (moment: Moment, story: Story) => void;
  onStoryClick: (story: Story) => void;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  allStories: Story[];
}

export function EntityPanel({
  entity,
  onMomentClick,
  onStoryClick,
  onBack,
  backLabel,
  onHome,
  allStories,
}: EntityPanelProps) {
  const momentEntries = useMemo(
    () => getEntityMomentStories(entity.id),
    [entity.id]
  );

  const canonicalStory = entity.canonicalStoryId
    ? allStories.find((s) => s.id === entity.canonicalStoryId)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile breadcrumb */}
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

      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Entity header */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          {/* Accent bar */}
          <div className="h-1 rounded-full mb-4" style={{ backgroundColor: 'var(--accent-red)' }} />

          {/* Name */}
          <h2 className="font-serif text-xl font-bold text-white">{entity.name}</h2>

          {/* Type badge + years */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              {entity.type}
            </span>
            {entity.years && (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {entity.years}
              </span>
            )}
          </div>

          {/* Description */}
          {entity.description && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">
              {entity.description}
            </p>
          )}

          {/* Main Story button */}
          {canonicalStory && (
            <button
              onClick={() => onStoryClick(canonicalStory)}
              className="w-full mt-3 flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-lg px-3 py-2.5 transition-all group"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORIES[canonicalStory.category].color }}
              />
              <div className="min-w-0 text-left flex-1">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Main Story
                </p>
                <p className="text-xs font-serif font-semibold text-[var(--text-primary)] group-hover:text-white truncate transition-colors">
                  {canonicalStory.name}
                </p>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Wikipedia link */}
          {entity.wikipediaSlug && (
            <a
              href={`https://en.wikipedia.org/wiki/${entity.wikipediaSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                <text x="6" y="8.5" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="serif" fontWeight="bold">W</text>
              </svg>
              Read on Wikipedia
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                <path d="M6 2L2 6M6 2H3M6 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
        </div>

        {/* Moments section */}
        <div className="p-4">
          <h3 className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Moments ({momentEntries.length})
          </h3>

          {momentEntries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic">No moments tagged yet</p>
          ) : (
            <div className="space-y-2">
              {momentEntries.map(({ moment, stories }) => {
                const primaryStory = stories[0];
                if (!primaryStory) return null;
                const cat = CATEGORIES[primaryStory.category];
                return (
                  <button
                    key={moment.id}
                    onClick={() => onMomentClick(moment, primaryStory)}
                    className="w-full text-left cursor-pointer transition-all duration-200 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-l-2 border-l-transparent hover:border-l-[var(--accent-red)] rounded-r-lg py-3 pl-3 pr-4"
                  >
                    <h4 className="font-serif text-sm font-semibold text-[var(--text-primary)]">
                      {moment.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed font-serif italic">
                      {moment.subtitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                      {moment.year && <span>{moment.year}</span>}
                      {moment.year && <span>·</span>}
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: cat.color }}
                        />
                        {primaryStory.name}
                      </span>
                      {stories.length > 1 && (
                        <>
                          <span>·</span>
                          <span>+{stories.length - 1} more</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
