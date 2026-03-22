import type { LatLngBounds } from 'leaflet';
import type { Moment, Story, ViewportLocation } from '../types';
import { resolveLocationsFromMap } from './storyHelpers';

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
  const center = bounds.getCenter();
  const results: ViewportLocation[] = [];
  const seenIds = new Set<string>();

  // Story-linked moments (primary source)
  for (const story of stories) {
    for (const location of resolveLocationsFromMap(story, momentMap)) {
      if (bounds.contains([location.lat, location.lng])) {
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
      if (!seenIds.has(m.id) && bounds.contains([m.lat, m.lng])) {
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

export function getStoriesInBounds(
  stories: Story[],
  bounds: LatLngBounds,
  momentMap: Map<string, Moment>,
): Story[] {
  return stories.filter((story) =>
    resolveLocationsFromMap(story, momentMap).some((loc) => bounds.contains([loc.lat, loc.lng]))
  );
}
