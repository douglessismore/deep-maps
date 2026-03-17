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
 * Calculate how many pixels the sheet covers from the bottom.
 */
export function getSheetPixels(snap: SheetSnap, containerHeight: number): number {
  switch (snap) {
    case 'half': return containerHeight * HALF_RATIO;
    case 'peek': return PEEK_HEIGHT;
    case 'full': return containerHeight - FULL_TOP;
  }
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
  options?: { animate?: boolean; duration?: number },
) {
  if (!isMobile || sheetSnap === 'full') {
    map.panTo(latlng, { animate: true, duration: 0.3, ...options });
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
    { animate: true, duration: 0.3, ...options },
  );
}
