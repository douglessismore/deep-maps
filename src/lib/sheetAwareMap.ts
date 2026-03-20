/**
 * Utilities for adjusting Leaflet map operations to account for the
 * bottom sheet overlay on mobile. When the sheet is at half position,
 * it covers ~55% of the viewport, so fitBounds/panTo need to target
 * the visible area above the sheet rather than the full map container.
 */
import type L from 'leaflet';

export type SheetSnap = 'peek' | 'half' | 'full';

const PEEK_HEIGHT = 140;
const HALF_RATIO = 0.55;
const FULL_TOP = 8;

/**
 * Calculate how many pixels the sheet covers from the bottom of the map container.
 * The sheet is position:fixed with height:100dvh, so its position is relative to
 * the viewport, not the map container. We use window.innerHeight for the sheet
 * position calculation, then offset by the map's top position in the viewport.
 */
export function getSheetPixels(snap: SheetSnap, containerHeight: number): number {
  if (snap === 'peek') return PEEK_HEIGHT;
  if (snap === 'full') return containerHeight - FULL_TOP;

  // Sheet at half: covers bottom HALF_RATIO of the VIEWPORT (not the map container).
  // The sheet top = window.innerHeight * (1 - HALF_RATIO) from viewport top.
  // The map container may start below a nav bar, so its top != 0.
  // sheetPx in map coordinates = containerHeight - (sheetTopInViewport - mapTopInViewport)
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : containerHeight;
  const sheetTopInViewport = viewportH * (1 - HALF_RATIO);
  // Map container starts at (viewportH - containerHeight) from viewport top (approximately)
  const mapTopInViewport = viewportH - containerHeight;
  const sheetPxInMap = containerHeight - (sheetTopInViewport - mapTopInViewport);
  return Math.max(0, sheetPxInMap);
}

/**
 * Get fitBounds options with asymmetric bottom padding to account for the sheet.
 */
export function getSheetAwarePadding(
  isMobile: boolean,
  sheetSnap: SheetSnap,
  containerHeight: number,
  basePadding: number = 40,
): L.FitBoundsOptions {
  if (!isMobile || sheetSnap === 'full') {
    return { padding: [basePadding, basePadding] as L.PointTuple };
  }
  const sheetPx = getSheetPixels(sheetSnap, containerHeight);
  return {
    paddingTopLeft: [basePadding, basePadding] as L.PointTuple,
    paddingBottomRight: [basePadding, sheetPx + 20] as L.PointTuple,
  };
}

/**
 * Pan the map so a target point appears centered in the visible area above the sheet.
 * Unlike panTo (which centers in the full container), this offsets for the sheet.
 */
export function panToAboveSheet(
  map: L.Map,
  latlng: [number, number],
  sheetSnap: SheetSnap,
  isMobile: boolean,
  options?: { animate?: boolean; duration?: number; zoom?: number },
) {
  const { zoom, ...panOptions } = options ?? {};

  if (!isMobile || sheetSnap === 'full') {
    if (zoom && zoom > map.getZoom()) {
      map.flyTo(latlng, zoom, { animate: true, duration: 0.3, ...panOptions });
    } else {
      map.panTo(latlng, { animate: true, duration: 0.3, ...panOptions });
    }
    return;
  }

  // If zoom change is needed, use flyTo first (which re-centers), then offset for sheet
  if (zoom && zoom > map.getZoom()) {
    const containerH = map.getSize().y;
    const sheetPx = getSheetPixels(sheetSnap, containerH);
    // Offset the target latitude upward to account for the sheet covering the bottom
    const visibleFraction = (containerH - sheetPx) / containerH;
    const offsetLat = map.containerPointToLatLng([0, sheetPx * visibleFraction / 2]);
    const origLat = map.containerPointToLatLng([0, 0]);
    const latOffset = (origLat.lat - offsetLat.lat) * 0.5;
    map.flyTo([latlng[0] + latOffset, latlng[1]], zoom, { animate: true, duration: 0.5, ...panOptions });
    return;
  }

  const containerH = map.getSize().y;
  const containerW = map.getSize().x;
  const sheetPx = getSheetPixels(sheetSnap, containerH);

  // Where we want the target: center of the visible area above the sheet
  const visibleCenterY = (containerH - sheetPx) / 2;
  const visibleCenterX = containerW / 2;

  // Where the target currently is in the container
  const targetPoint = map.latLngToContainerPoint(latlng);

  // Pan by the difference
  map.panBy(
    [targetPoint.x - visibleCenterX, targetPoint.y - visibleCenterY],
    { animate: true, duration: 0.3, ...panOptions },
  );
}
