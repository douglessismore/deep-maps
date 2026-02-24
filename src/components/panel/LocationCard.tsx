import { forwardRef } from 'react';
import type { StoryLocation, Story, LocationAccuracy } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { MediaDisplay } from './MediaDisplay';

const ACCURACY_DISPLAY: Record<LocationAccuracy, { label: string; color: string; title: string }> = {
  exact: { label: 'Exact', color: '#22c55e', title: 'Coordinates pinpoint the actual location' },
  approximate: { label: 'Approx', color: '#eab308', title: 'Coordinates are close but not exact' },
  'general-area': { label: 'Area', color: '#f97316', title: 'General area — exact location unknown' },
};

interface LocationCardProps {
  location: StoryLocation;
  story: Story;
  isActive: boolean;
  onClick: (location: StoryLocation) => void;
  showStoryName?: boolean;
  index?: number;
  onWikiJump?: (section?: string) => void;
  intersectingStories?: Array<{ story: Story; location: StoryLocation }>;
  onStoryClick?: (story: Story) => void;
}

export const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  function LocationCard({ location, story, isActive, onClick, showStoryName = false, index, onWikiJump, intersectingStories, onStoryClick }, ref) {
    const cat = CATEGORIES[story.category];

    return (
      <div
        ref={ref}
        onClick={() => onClick(location)}
        className={`cursor-pointer transition-all duration-200 ${
          isActive
            ? 'bg-[var(--bg-card-hover)] border-l-2 pl-3'
            : 'bg-[var(--bg-card)] border-l-2 border-l-transparent pl-3 hover:bg-[var(--bg-card-hover)]'
        } rounded-r-lg py-3 pr-4`}
        style={{
          borderLeftColor: isActive ? cat.color : 'transparent',
        }}
      >
        {/* Number + Name */}
        <div className="flex items-start gap-2">
          {typeof index === 'number' && (
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mt-0.5"
              style={{ backgroundColor: cat.bgColor, color: cat.color }}
            >
              {index + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-sm font-semibold text-[var(--text-primary)]">
              {location.name}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed font-serif italic">
              {location.subtitle}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[var(--text-muted)]">
          {showStoryName && (
            <>
              <span style={{ color: cat.color }}>{story.name}</span>
              <span>·</span>
            </>
          )}
          {location.year && <span>{location.year}</span>}
          {location.year && location.type && <span>·</span>}
          {location.type && <span className="capitalize">{location.type.replace('_', ' ')}</span>}
          <span>·</span>
          <span className="capitalize">{location.importance}</span>
          {location.accuracy && (
            <>
              <span>·</span>
              <span
                className="flex items-center gap-1"
                title={ACCURACY_DISPLAY[location.accuracy].title}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: ACCURACY_DISPLAY[location.accuracy].color }}
                />
                {ACCURACY_DISPLAY[location.accuracy].label}
              </span>
            </>
          )}
        </div>

        {/* Description (collapsed when not active) */}
        {isActive && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {location.description}
            </p>
            {location.address && (
              <p className="text-[10px] font-mono text-[var(--text-muted)]">
                &#128205; {location.address}
              </p>
            )}
            {/* Google Maps link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1C3.79 1 2 2.79 2 5c0 3 4 6 4 6s4-3 4-6c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
              </svg>
              Open in Google Maps
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                <path d="M6 2L2 6M6 2H3M6 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            {/* Read on Wikipedia link */}
            {onWikiJump && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWikiJump(location.wikiSection);
                }}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                  <text x="6" y="8.5" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="serif" fontWeight="bold">W</text>
                </svg>
                {location.wikiSection ? 'Read this section on Wikipedia' : 'Read on Wikipedia'}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                  <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            {/* Location-level connected stories — other stories at this same place */}
            {intersectingStories && intersectingStories.length > 0 && onStoryClick && (
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Also Here
                </p>
                <div className="space-y-1">
                  {intersectingStories.map(({ story: otherStory }) => {
                    const otherCat = CATEGORIES[otherStory.category];
                    return (
                      <button
                        key={otherStory.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStoryClick(otherStory);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all group text-left"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: otherCat.color }}
                        />
                        <span className="text-xs font-serif font-semibold text-[var(--text-secondary)] group-hover:text-white transition-colors truncate">
                          {otherStory.name}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                          <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {location.media && location.media.length > 0 && (
              <MediaDisplay media={location.media} />
            )}
          </div>
        )}
      </div>
    );
  }
);
