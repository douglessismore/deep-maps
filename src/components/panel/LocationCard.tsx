import { forwardRef, useMemo, useState, useCallback } from 'react';
import type { Entity, Moment, Story, LocationAccuracy, VerificationLevel } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { entityMap, getEntityMomentStories, getEntityIcon } from '../../lib/entityHelpers';
import { isAdminMode } from '../../lib/admin';
import { useAuth } from '../../lib/auth';
import { MediaDisplay } from './MediaDisplay';
import { GoDeeperCard, GoDeeperSection } from './GoDeeperCard';
import { PinEditor } from '../ui/PinEditor';
import { LoginModal } from '../auth/LoginModal';
import { isV2 } from '../../lib/theme';

const ACCURACY_DISPLAY: Record<LocationAccuracy, { label: string; color: string; title: string }> = {
  pinpoint: { label: 'Pinpoint', color: '#10b981', title: 'GPS-verified to within 3 meters of the exact spot' },
  exact: { label: 'Exact', color: '#22c55e', title: 'Coordinates pinpoint the actual location' },
  approximate: { label: 'Approx', color: '#eab308', title: 'Coordinates are close but not exact' },
  'general-area': { label: 'Area', color: '#f97316', title: 'General area — exact location unknown' },
};

const VERIFICATION_DISPLAY: Record<VerificationLevel, { label: string; color: string; title: string }> = {
  verified: { label: 'Verified', color: '#22c55e', title: 'Corroborated by multiple independent historical sources' },
  documented: { label: 'Documented', color: '#eab308', title: 'Historical record exists but key details are disputed or uncertain' },
  traditional: { label: 'Traditional', color: '#60a5fa', title: 'Religious or cultural tradition — faith-based, not empirically testable' },
  legendary: { label: 'Legendary', color: '#a78bfa', title: 'Folklore, unverified claims, or paranormal — part of cultural record but not historically established' },
};

interface LocationCardProps {
  location: Moment;
  story?: Story;
  isActive: boolean;
  isExpanded: boolean;
  onClick: (location: Moment) => void;
  showStoryName?: boolean;
  index?: number;
  onWikiJump?: (section?: string) => void;
  narrativeGlue?: string;
  alsoInStories?: Story[];
  parentStories?: Story[];
  excludeEntityIds?: string[];
  showExpandChevron?: boolean;
  /** When true, don't filter entities whose canonicalStoryId === story.id.
   *  Use in ExplorePanel where "story" is just the parent story, not the active view. */
  skipCanonicalFilter?: boolean;
  onStoryClick?: (story: Story) => void;
  onEntityClick?: (entity: Entity, fromMoment?: Moment) => void;
  /** Compact mode — dense row for mobile bottom sheet (name + subtitle + year only) */
  compact?: boolean;
}

export const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  function LocationCard({
    location, story, isActive, isExpanded, onClick,
    showStoryName = false, index, onWikiJump, narrativeGlue,
    alsoInStories, parentStories, excludeEntityIds,
    showExpandChevron, skipCanonicalFilter, onStoryClick, onEntityClick,
    compact,
  }, ref) {
    const cat = story ? CATEGORIES[story.category] : undefined;
    const [pinEditorOpen, setPinEditorOpen] = useState(false);
    const [suggestEditorOpen, setSuggestEditorOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [adminSaved, setAdminSaved] = useState(false);
    const admin = useMemo(() => isAdminMode(), []);
    const { user } = useAuth();

    const handlePinSaved = useCallback((_lat: number, _lng: number, _address: string) => {
      setAdminSaved(true);
    }, []);

    // ── Compact mode: dense row for mobile bottom sheet ──
    // When expanded, fall through to full card rendering
    if (compact && !isExpanded) {
      return (
        <div
          ref={ref}
          onClick={() => onClick(location)}
          className={`cursor-pointer transition-all duration-200 ${
            isActive
              ? 'bg-[var(--bg-card-hover)] border-l-[3px]'
              : 'bg-[var(--bg-card)] border-l-[3px] border-l-transparent hover:bg-[var(--bg-card-hover)]'
          } rounded-lg py-2 pl-2.5 pr-3`}
          style={{ borderLeftColor: isActive ? cat?.color ?? 'var(--text-muted)' : 'transparent' }}
        >
          <div className="flex items-center gap-2">
            {typeof index === 'number' && cat && (
              <span
                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
                style={{ backgroundColor: cat.bgColor, color: cat.color }}
              >
                {index + 1}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h4 className="text-[13px] font-bold text-[var(--text-primary)] truncate leading-tight">
                  {location.name}
                </h4>
                {location.year && (
                  <span className="shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
                    {location.year}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate leading-tight mt-0.5 italic">
                {location.subtitle}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Resolve entities for "Dive Deeper" chips/cards — always computed for strottability
    // Excludes: entity whose canonicalStoryId === story.id (self-link in story view)
    //           + concept entities (abstract labels, not navigable — use person/place/org/work)
    //           + any explicitly excluded entities (e.g. the entity being viewed in EntityPanel)
    const resolvedEntities = useMemo(() => {
      if (!location.entityIds || location.entityIds.length === 0 || !onEntityClick) return [];
      const excludeSet = new Set(excludeEntityIds ?? []);
      return location.entityIds
        .map((eid) => {
          const entity = entityMap.get(eid);
          if (!entity) return null;
          if (!skipCanonicalFilter && story && entity.canonicalStoryId === story.id) return null;
          // Concept entities are abstract labels, not navigable destinations
          if (entity.type === 'concept') return null;
          if (excludeSet.has(eid)) return null;
          const entries = getEntityMomentStories(eid);
          const incidentStories = entries.flatMap(({ stories: s }) => s).filter(s => s.storyType === 'incident');
          const storyIds = new Set(incidentStories.map(s => s.id));
          return { entity, momentCount: entries.length, storyCount: storyIds.size };
        })
        .filter((e): e is NonNullable<typeof e> => e != null);
    }, [location.entityIds, story?.id, onEntityClick, excludeEntityIds, skipCanonicalFilter]);

    // Merge all navigable stories for Dive Deeper (deduplicated, incident-only whitelist)
    const navigableStories = useMemo(() => {
      const seen = new Set<string>();
      const result: Story[] = [];
      for (const s of [...(parentStories ?? []), ...(alsoInStories ?? [])]) {
        if (!seen.has(s.id) && s.storyType === 'incident') {
          seen.add(s.id);
          result.push(s);
        }
      }
      return result;
    }, [parentStories, alsoInStories]);

    // Story chips for collapsed state (non-story contexts only)
    // Whitelist: only incident stories are clickable navigation targets
    const storyChips = useMemo(() => {
      if (!parentStories || parentStories.length === 0 || !onStoryClick) return [];
      return parentStories.filter(s => s.storyType === 'incident');
    }, [parentStories, onStoryClick]);

    const v2 = isV2();

    return (
      <div
        ref={ref}
        onClick={() => onClick(location)}
        className={`cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isActive
            ? v2
              ? 'bg-[var(--bg-secondary)] border-l-4 pl-3 scale-[1.02]'
              : 'bg-[var(--bg-card-hover)] border-l-[3px] pl-3'
            : v2
              ? 'bg-[var(--bg-card)] border-l-4 border-l-transparent pl-3 hover:bg-[var(--bg-secondary)] scale-100'
              : 'bg-[var(--bg-card)] border-l-[3px] border-l-transparent pl-3 hover:bg-[var(--bg-card-hover)]'
        } ${v2 ? 'rounded-xl py-4 pr-5' : 'rounded-[12px] py-3 pr-4'}`}
        style={{
          borderLeftColor: isActive ? cat?.color ?? 'var(--text-muted)' : 'transparent',
          boxShadow: isActive && v2 ? `0 0 20px ${cat?.color ?? 'transparent'}1a` : undefined,
        }}
      >
        {/* Number + Name + optional chevron */}
        <div className="flex items-start gap-2">
          {typeof index === 'number' && cat && !v2 && (
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mt-0.5"
              style={{ backgroundColor: cat.bgColor, color: cat.color }}
            >
              {index + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className={v2
                ? 'font-serif text-base font-bold text-[var(--text-primary)] leading-tight'
                : 'font-serif text-[14px] font-bold text-[var(--text-primary)] leading-[1.3]'
              }>
                {location.name}
              </h4>
              {showExpandChevron && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {location.year && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {location.year}
                    </span>
                  )}
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed italic">
              {location.subtitle}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className={v2
          ? 'flex items-center gap-2 mt-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider'
          : 'flex items-center gap-2 mt-2 text-[10px] font-mono text-[var(--text-muted)]'
        }>
          {showStoryName && (
            <>
              <span style={{ color: cat?.color }}>{story?.name}</span>
              <span>·</span>
            </>
          )}
          {!showExpandChevron && location.year && <span>{location.year}</span>}
          {!showExpandChevron && location.year && location.type && <span>·</span>}
          {location.type && <span className="capitalize">{location.type.replace('_', ' ')}</span>}
          {location.type && <span>·</span>}
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
                {(location as any).geoVerified && (
                  <span title="Location verified" className="ml-0.5 text-green-500">✓</span>
                )}
              </span>
            </>
          )}
          {location.verificationLevel && location.verificationLevel !== 'verified' && (
            <>
              <span>·</span>
              <span
                className="flex items-center gap-1"
                title={VERIFICATION_DISPLAY[location.verificationLevel].title}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: VERIFICATION_DISPLAY[location.verificationLevel].color }}
                />
                {VERIFICATION_DISPLAY[location.verificationLevel].label}
              </span>
            </>
          )}
        </div>

        {/* Description preview — always visible when collapsed, 2-line truncation */}
        {!isExpanded && location.description && (
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mt-1.5 line-clamp-2">
            {location.description}
          </p>
        )}

        {/* Collapsed chips — story chips + entity chips for strottability */}
        {!isExpanded && (
          <>
            {storyChips.length > 0 && onStoryClick && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {storyChips.map((s) => {
                  const sCat = CATEGORIES[s.category];
                  return (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStoryClick(s);
                      }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all truncate max-w-[180px]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: sCat.color }}
                      />
                      <span className="truncate">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {resolvedEntities.length > 0 && onEntityClick && (
              <div className="flex flex-wrap gap-1 mt-1">
                {resolvedEntities.map(({ entity }) => (
                  <button
                    key={entity.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEntityClick(entity, location);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.15)] hover:bg-[rgba(220,38,38,0.2)] transition-all text-red-400 hover:text-red-300"
                  >
                    <span className="opacity-60 text-[9px]">
                      {getEntityIcon(entity)}
                    </span>
                    <span className="truncate max-w-[120px]">{entity.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {narrativeGlue && (
              <p className="text-sm italic text-[var(--text-secondary)] leading-relaxed mb-2">
                {narrativeGlue}
              </p>
            )}
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {location.description}
            </p>
            {/* Address as Google Maps link (consolidated) */}
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
              {location.address || 'View on map'}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                <path d="M6 2L2 6M6 2H3M6 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            {/* Admin: Edit Location button */}
            {admin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPinEditorOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border transition-colors bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
              >
                {adminSaved ? '\u2713' : '\ud83d\udccd'} {adminSaved ? 'Saved' : 'Edit Location'}
              </button>
            )}
            {/* Admin: PinEditor modal */}
            {pinEditorOpen && (
              <PinEditor
                momentId={location.id}
                lat={location.lat}
                lng={location.lng}
                address={location.address}
                accuracy={location.accuracy}
                geoVerified={location.geoVerified}
                geoSourceUrl={location.geoSourceUrl}
                momentName={location.name}
                onClose={() => setPinEditorOpen(false)}
                onSaved={handlePinSaved}
              />
            )}
            {/* Read on Wikipedia link — in-app wiki jump (story context) */}
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
            {/* External Wikipedia link — non-story contexts (entity panel, etc.) */}
            {!onWikiJump && (() => {
              const wikiStory = story?.wikipediaSlug ? story : parentStories?.find(s => s.wikipediaSlug);
              if (!wikiStory) return null;
              const url = `https://en.wikipedia.org/wiki/${wikiStory.wikipediaSlug}${location.wikiSection ? '#' + location.wikiSection : ''}`;
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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
              );
            })()}
            {/* Dive Deeper — unified entity + story navigation */}
            {(resolvedEntities.length > 0 || navigableStories.length > 0) && (
              <GoDeeperSection>
                {resolvedEntities.map(({ entity, momentCount, storyCount }) => (
                  <GoDeeperCard
                    key={entity.id}
                    label={entity.name}
                    sublabel={`${momentCount} ${momentCount === 1 ? 'moment' : 'moments'} · ${storyCount} ${storyCount === 1 ? 'story' : 'stories'}`}
                    icon={<span className="text-sm opacity-60">{getEntityIcon(entity)}</span>}
                    onClick={() => onEntityClick!(entity, location)}
                  />
                ))}
                {navigableStories.map((otherStory) => {
                  const otherCat = CATEGORIES[otherStory.category];
                  return (
                    <GoDeeperCard
                      key={otherStory.id}
                      label={otherStory.name}
                      sublabel={`${otherStory.moments.length} ${otherStory.moments.length === 1 ? 'moment' : 'moments'} · ${otherStory.years}`}
                      icon={<span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: otherCat.color }} />}
                      onClick={() => onStoryClick!(otherStory)}
                    />
                  );
                })}
              </GoDeeperSection>
            )}
            {location.media && location.media.length > 0 && (
              <MediaDisplay media={location.media} />
            )}
            {/* Community: suggest a better location */}
            {!admin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) { setShowLogin(true); return; }
                  setSuggestEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/>
                  <path d="M5 3v4M3 5h4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
                </svg>
                Suggest a more accurate location
              </button>
            )}
            {showLogin && (
              <LoginModal
                onClose={() => setShowLogin(false)}
                action="suggest a more accurate location"
              />
            )}
            {suggestEditorOpen && (
              <PinEditor
                momentId={location.id}
                lat={location.lat}
                lng={location.lng}
                address={location.address}
                accuracy={location.accuracy}
                geoVerified={location.geoVerified}
                geoSourceUrl={location.geoSourceUrl}
                momentName={location.name}
                mode="suggest"
                onClose={() => setSuggestEditorOpen(false)}
                onSaved={() => setSuggestEditorOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);
