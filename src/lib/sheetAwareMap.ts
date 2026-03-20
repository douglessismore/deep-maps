/**
 * Utilities for adjusting Leaflet map operations to account for the
 * bottom sheet overlay on mobile. When the sheet is at half position,
 * it covers ~55% of the viewport, so fitBounds/panTo need to target
 * the visible area above the sheet rather than the full map container.
 */
import L from 'leaflet';

export type SheetSnap = 'peek' | 'half' | 'full';

const PEEK_HEIGHT = 260;
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
    // On mobile split mode (isMobile + full snap), nudge the center slightly
    // north so the pin sits below geometric center — feels more visually
    // centered in the small 45% map strip.
    const splitNudgePx = isMobile && sheetSnap === 'full' ? map.getSize().y * 0.1 : 0;

    if (splitNudgePx > 0) {
      const z = zoom ?? map.getZoom();
      const centerPt = map.project(latlng, z);
      // Subtract from Y = shift center north → pin appears lower (more south)
      const nudgedPt = L.point(centerPt.x, centerPt.y - splitNudgePx);
      const nudgedLatLng = map.unproject(nudgedPt, z);
      if (zoom) {
        map.flyTo([nudgedLatLng.lat, latlng[1]], zoom, { animate: true, duration: 0.8, ...panOptions });
      } else if (panOptions.animate === false) {
        map.setView([nudgedLatLng.lat, latlng[1]], z, { animate: false });
      } else {
        map.panTo([nudgedLatLng.lat, latlng[1]], { animate: true, duration: 0.3, ...panOptions });
      }
    } else {
      if (zoom) {
        map.flyTo(latlng, zoom, { animate: true, duration: 0.8, ...panOptions });
      } else {
        map.panTo(latlng, { animate: true, duration: 0.3, ...panOptions });
      }
    }
    return;
  }

  // Mobile with sheet: offset the target upward so it lands in the visible area
  // above the sheet, not centered in the full container.
  const containerH = map.getSize().y;
  const sheetPx = getSheetPixels(sheetSnap, containerH);

  if (zoom) {
    // flyTo with latitude offset to account for sheet coverage.
    // The visible center is at (containerH - sheetPx) / 2 from the top,
    // but flyTo centers at containerH / 2. The difference in pixels is sheetPx / 2.
    // Convert that pixel offset to latitude offset at the target zoom level.
    const targetZoom = zoom;
    // At the target zoom, how many degrees per pixel?
    // Leaflet: at zoom z, the world is 256 * 2^z pixels tall (for Mercator).
    // But latitude isn't linear in Mercator, so use the map's projection.
    // Simpler approach: compute the offset using the map's current projection
    // at the target zoom level.
    const sheetOffsetPx = sheetPx / 2;
    // Use unproject to convert pixel offset to lat offset at the target zoom.
    // We need to center the map SOUTH of the target so the target appears in the
    // visible area ABOVE the sheet (top ~45% of container), not at container center.
    // Adding to Y in projected space = moving south. We fly to that southern point
    // so the target pin ends up above center.
    const centerPoint = map.project(latlng, targetZoom);
    const offsetPoint = L.point(centerPoint.x, centerPoint.y + sheetOffsetPx);
    const offsetLatLng = map.unproject(offsetPoint, targetZoom);

    // offsetLatLng is south of latlng — fly to it so target appears above center
    map.flyTo([offsetLatLng.lat, latlng[1]], targetZoom, { animate: true, duration: 0.8, ...panOptions });
  } else {
    // Pan only (no zoom change) — offset for sheet.
    // Use the same project/unproject approach as the zoom path for consistency.
    const currentZoom = map.getZoom();
    const sheetOffsetPx = sheetPx / 2;
    const centerPoint = map.project(latlng, currentZoom);
    const offsetPoint = L.point(centerPoint.x, centerPoint.y + sheetOffsetPx);
    const offsetLatLng = map.unproject(offsetPoint, currentZoom);

    if (panOptions.animate === false) {
      map.setView([offsetLatLng.lat, latlng[1]], currentZoom, { animate: false });
    } else {
      map.panTo([offsetLatLng.lat, latlng[1]], { animate: true, duration: 0.3, ...panOptions });
    }
  }
}
