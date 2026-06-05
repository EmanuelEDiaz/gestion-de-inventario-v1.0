import type { StyleSpecification } from 'maplibre-gl';

type TileSource = 'opfs' | 'server';

export function getCubaMapStyle(source: TileSource): StyleSpecification {
  return {
    version: 8,
    glyphs: '/maps/fonts/{fontstack}/{range}.pbf',
    sprite: '/maps/sprites/sprite',
    sources: {
      'cuba-tiles': {
        type: 'vector',
        tiles: source === 'opfs'
          ? ['opfs-pmtiles://{z}/{x}/{y}']
          : ['pmtiles:///api/v1/maps/cuba.pmtiles/{z}/{x}/{y}'],
        minzoom: 0,
        maxzoom: 14,
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
      {
        id: 'landuse',
        type: 'fill',
        source: 'cuba-tiles',
        'source-layer': 'landuse',
        paint: { 'fill-color': '#e8e0d8' },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'cuba-tiles',
        'source-layer': 'water',
        paint: { 'fill-color': '#b0d0e0' },
      },
      {
        id: 'roads',
        type: 'line',
        source: 'cuba-tiles',
        'source-layer': 'roads',
        paint: { 'line-color': '#ffffff', 'line-width': 1 },
      },
      {
        id: 'buildings',
        type: 'fill',
        source: 'cuba-tiles',
        'source-layer': 'buildings',
        paint: { 'fill-color': '#d4c8b8' },
      },
      {
        id: 'places',
        type: 'symbol',
        source: 'cuba-tiles',
        'source-layer': 'places',
        layout: {
          'text-field': '{name}',
          'text-font': ['NotoSansRegular'],
          'text-size': 12,
        },
        paint: { 'text-color': '#333333' },
      },
    ],
  };
}
