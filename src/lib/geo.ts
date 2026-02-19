import type { LatLngBounds } from 'leaflet';
import type { Story, ViewportLocation } from '../types';

export function distanceFromCenter(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): number {
  const R = 6371;
  const dLat = ((centerLat - lat) * Math.PI) / 180;
  const dLng = ((centerLng - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((centerLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getLocationsInBounds(
  stories: Story[],
  bounds: LatLngBounds
): ViewportLocation[] {
  const center = bounds.getCenter();
  const results: ViewportLocation[] = [];

  for (const story of stories) {
    for (const location of story.locations) {
      if (bounds.contains([location.lat, location.lng])) {
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

  return results.sort((a, b) => a.distance - b.distance);
}

export function getStoriesInBounds(
  stories: Story[],
  bounds: LatLngBounds
): Story[] {
  return stories.filter((story) =>
    story.locations.some((loc) => bounds.contains([loc.lat, loc.lng]))
  );
}
