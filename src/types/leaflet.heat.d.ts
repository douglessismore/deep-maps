import * as L from 'leaflet';

declare module 'leaflet' {
  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
    pane?: string;
  }

  interface HeatLayer extends L.Layer {
    setOptions(options: HeatMapOptions): this;
    addLatLng(latlng: L.LatLngExpression): this;
    setLatLngs(latlngs: Array<[number, number, number]>): this;
    redraw(): this;
    _canvas?: HTMLCanvasElement;
  }

  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatMapOptions,
  ): HeatLayer;
}
