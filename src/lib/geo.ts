import L from 'leaflet';
import type { LatLngBounds } from 'leaflet';
import type { LocationAccuracy, Moment, Story, ViewportLocation } from '../types';
import { resolveLocationsFromMap } from './storyHelpers';

/**
 * HTML snippet for an accuracy indicator shown inside map tooltips.
 * Returns an empty string for 'exact' (the common case — no visual clutter)
 * or when accuracy is missing. For 'approximate' and 'general-area', returns
 * a muted chip that warns users the pin isn't a precise location.
 */
export function accuracyTooltipHtml(accuracy: LocationAccuracy | undefined | null): string {
  if (!accuracy || accuracy === 'exact' || accuracy === 'pinpoint') return '';
  const label =
    accuracy === 'general-area' ? '\u25EF general area' : '\u25CE approximate location';
  return `<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:3px;font-family:'Space Grotesk','Courier New',monospace;letter-spacing:0.04em;font-style:italic;">${label}</div>`;
}

/** Haversine distance in kilometers */
export function distanceFromCenter(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): number {
  return haversine(lat, lng, centerLat, centerLng, 6371);
}

/** Haversine distance in miles */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return haversine(lat1, lng1, lat2, lng2, 3959);
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radius: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

export function getLocationsInBounds(
  stories: Story[],
  bounds: LatLngBounds,
  momentMap: Map<string, Moment>,
  allMoments?: Moment[],
): ViewportLocation[] {
  // Wrap bounds to handle antimeridian crossing (scrolling west past -180°)
  const sw = bounds.getSouthWest().wrap();
  const ne = bounds.getNorthEast().wrap();
  const wrappedBounds = L.latLngBounds(sw, ne);
  const center = bounds.getCenter();
  const results: ViewportLocation[] = [];
  const seenIds = new Set<string>();

  // Story-linked moments (primary source — deduplicate by moment ID)
  for (const story of stories) {
    for (const location of resolveLocationsFromMap(story, momentMap)) {
      if (!seenIds.has(location.id) && wrappedBounds.contains(L.latLng(location.lat, location.lng).wrap())) {
        seenIds.add(location.id);
        results.push({
          location,
          story,
          distance: distanceFromCenter(
            location.lat,
            location.lng,
            center.lat,
            center.lng
          ),
        });
      }
    }
  }

  // Story-less moments (e.g., cemetery burials that only connect via entity tags)
  if (allMoments) {
    for (const m of allMoments) {
      if (!seenIds.has(m.id) && wrappedBounds.contains(L.latLng(m.lat, m.lng).wrap())) {
        results.push({
          location: m,
          story: null,
          distance: distanceFromCenter(m.lat, m.lng, center.lat, center.lng),
        });
      }
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}

/** Expand bounds by a multiplier (e.g., 2 = 2x viewport diagonal for backfill) */
export function getExpandedBounds(bounds: LatLngBounds, multiplier: number): LatLngBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latSpan = ne.lat - sw.lat;
  const lngSpan = ne.lng - sw.lng;
  const latExpand = latSpan * (multiplier - 1) / 2;
  const lngExpand = lngSpan * (multiplier - 1) / 2;
  return L.latLngBounds(
    [sw.lat - latExpand, sw.lng - lngExpand],
    [ne.lat + latExpand, ne.lng + lngExpand],
  );
}

export function getStoriesInBounds(
  stories: Story[],
  bounds: LatLngBounds,
  momentMap: Map<string, Moment>,
): Story[] {
  return stories.filter((story) =>
    resolveLocationsFromMap(story, momentMap).some((loc) => bounds.contains([loc.lat, loc.lng]))
  );
}
