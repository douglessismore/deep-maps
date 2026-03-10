import { useState, useMemo, useRef, useEffect } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, ViewportLocation } from '../../types';
import { getViewportEntities, type EntityWithCounts, getEntityMomentStories } from '../../lib/entityHelpers';

interface EntityRibbonProps {
  viewportLocations: ViewportLocation[];
  searchQuery: string;
  onEntityClick: (entity: Entity) => void;
  mapInstance: LeafletMap | null;
}

type DirectoryFilter = 'all' | 'person' | 'place';

/** Get a single display initial from entity name — "O. Henry" → "H", "Texas State Cemetery" → "T" */
function getInitial(name: string): string {
  // Use last name for people-like names, first word otherwise
  const words = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  if (words.length >= 2) {
    // If first word is a single initial (e.g. "O."), use second word
    if (words[0].length <= 2) return words[1][0].toUpperCase();
    return words[0][0].toUpperCase();
  }
  return words[0][0].toUpperCase();
}

/** Group entities alphabetically by first letter */
function groupAlphabetically(entities: EntityWithCounts[]): Map<string, EntityWithCounts[]> {
  const groups = new Map<string, EntityWithCounts[]>();
  const sorted = [...entities].sort((a, b) => a.entity.name.localeCompare(b.entity.name));
  for (const item of sorted) {
    const letter = item.entity.name[0].toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(item);
  }
  return groups;
}

export function EntityRibbon({
  viewportLocations,
  searchQuery,
  onEntityClick,
  mapInstance,
}: EntityRibbonProps) {
  const [expanded, setExpanded] = useState(false);
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>('all');
  const directoryRef = useRef<HTMLDivElement>(null);

  // Compute viewport entities
  const viewportEntities: EntityWithCounts[] = useMemo(() => {
    if (viewportLocations.length === 0) return [];
    const ids = new Set(viewportLocations.map((vl) => vl.location.id));
    let result = getViewportEntities(ids);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        ({ entity }) =>
          entity.name.toLowerCase().includes(q) ||
          entity.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [viewportLocations, searchQuery]);

  // Counts
  const personCount = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'person').length,
    [viewportEntities]
  );
  const placeCount = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'place').length,
    [viewportEntities]
  );

  // Top entities for collapsed ribbon (max 15, sorted by moment density)
  const ribbonEntities = useMemo(
    () => viewportEntities.slice(0, 15),
    [viewportEntities]
  );

  // Directory filtered entities
  const directoryEntities = useMemo(() => {
    if (directoryFilter === 'all') return viewportEntities;
    return viewportEntities.filter((e) => e.entity.type === directoryFilter);
  }, [viewportEntities, directoryFilter]);

  const alphabeticalGroups = useMemo(
    () => groupAlphabetically(directoryEntities),
    [directoryEntities]
  );

  // Scroll-highlight: track which entity the user scrolls past in expanded directory
  const entityRowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);

  // Scroll handler for expanded directory — highlight entity pins on map
  useEffect(() => {
    if (!expanded || !mapInstance) return;
    const container = directoryRef.current;
    if (!container) return;

    const onScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.4;
      let closestId: string | null = null;
      let closestDist = Infinity;

      entityRowRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      });

      if (closestId && closestId !== highlightedEntityId) {
        setHighlightedEntityId(closestId);
        // Pan map to first moment of this entity
        const entries = getEntityMomentStories(closestId);
        if (entries.length > 0) {
          const firstMoment = entries[0].moment;
          mapInstance.panTo([firstMoment.lat, firstMoment.lng], {
            animate: true,
            duration: 0.6,
          });
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [expanded, mapInstance, highlightedEntityId]);

  // Don't render if no entities
  if (viewportEntities.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      {!expanded ? (
        /* ── Collapsed Ribbon ── */
        <div className="flex items-center gap-1 px-2 py-1.5">
          <div className="flex-1 overflow-x-auto flex gap-1.5 no-scrollbar">
            {ribbonEntities.map(({ entity }) => (
              <button
                key={entity.id}
                onClick={() => onEntityClick(entity)}
                className="shrink-0 flex flex-col items-center gap-0.5 group"
                title={entity.name}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    entity.type === 'person'
                      ? 'ring-1 ring-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.12)] group-hover:ring-[rgba(139,92,246,0.7)] group-hover:bg-[rgba(139,92,246,0.2)]'
                      : 'ring-1 ring-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.12)] group-hover:ring-[rgba(59,130,246,0.7)] group-hover:bg-[rgba(59,130,246,0.2)]'
                  }`}
                >
                  {entity.type === 'person' ? (
                    <span className="text-sm font-serif font-bold text-[rgba(139,92,246,0.85)]">
                      {getInitial(entity.name)}
                    </span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[rgba(59,130,246,0.8)]">
                      <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="currentColor"/>
                    </svg>
                  )}
                </div>
                <span className="text-[8px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors truncate max-w-[52px] text-center leading-tight">
                  {entity.name.split(' ').slice(-1)[0]}
                </span>
              </button>
            ))}
          </div>
          {/* Expand button */}
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M2 3l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {personCount > 0 && <span>{personCount} People</span>}
            {personCount > 0 && placeCount > 0 && <span>·</span>}
            {placeCount > 0 && <span>{placeCount} Places</span>}
          </button>
        </div>
      ) : (
        /* ── Expanded Directory ── */
        <div className="flex flex-col max-h-[60vh]">
          {/* Directory header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
            {/* Filter pills */}
            <div className="flex gap-1 flex-1">
              {(['all', 'person', 'place'] as DirectoryFilter[]).map((filter) => {
                const count = filter === 'all' ? viewportEntities.length
                  : filter === 'person' ? personCount : placeCount;
                if (count === 0 && filter !== 'all') return null;
                return (
                  <button
                    key={filter}
                    onClick={() => setDirectoryFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      directoryFilter === filter
                        ? 'bg-[var(--accent-red)] text-white'
                        : 'text-[var(--text-muted)] hover:text-white bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'person' ? 'People' : 'Places'}
                    <span className="ml-1 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
            {/* Collapse button */}
            <button
              onClick={() => setExpanded(false)}
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M2 5l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Collapse
            </button>
          </div>

          {/* Alphabetical list */}
          <div ref={directoryRef} className="overflow-y-auto custom-scrollbar">
            {Array.from(alphabeticalGroups.entries()).map(([letter, items]) => (
              <div key={letter}>
                {/* Sticky letter header */}
                <div className="sticky top-0 z-10 px-3 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                  {letter}
                </div>
                {items.map(({ entity, momentCount }) => (
                  <button
                    key={entity.id}
                    ref={(el) => {
                      if (el) entityRowRefs.current.set(entity.id, el);
                      else entityRowRefs.current.delete(entity.id);
                    }}
                    onClick={() => onEntityClick(entity)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors group ${
                      highlightedEntityId === entity.id
                        ? 'bg-[var(--bg-card-hover)]'
                        : 'hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      entity.type === 'person'
                        ? 'bg-[rgba(139,92,246,0.15)] ring-1 ring-[rgba(139,92,246,0.3)]'
                        : 'bg-[rgba(59,130,246,0.15)] ring-1 ring-[rgba(59,130,246,0.3)]'
                    }`}>
                      {entity.type === 'person' ? (
                        <span className="text-[9px] font-serif font-bold text-[rgba(139,92,246,0.8)]">
                          {getInitial(entity.name)}
                        </span>
                      ) : (
                        <svg width="9" height="9" viewBox="0 0 14 14" fill="none" className="text-[rgba(59,130,246,0.7)]">
                          <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="currentColor"/>
                        </svg>
                      )}
                    </span>
                    <span className="text-xs font-serif font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors truncate flex-1">
                      {entity.name}
                    </span>
                    {entity.years && (
                      <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">
                        {entity.years}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">
                      {momentCount}m
                    </span>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors opacity-50">
                      <path d="M3 1.5L5.5 4 3 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
