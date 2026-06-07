# ADR: Leaflet → MapLibre GL JS

> Decisión arquitectónica sobre la migración del stack de mapas.
> Documenta criterios de retiro de Leaflet y justificación del cambio.

## Contexto

El stack de mapas original usaba Leaflet + react-leaflet + leaflet.vectorgrid + pmtiles v4.4.1. Este stack presentaba limitaciones para el objetivo offline-first:

- Leaflet no soporta nativamente tiles vectoriales (requiere plugin `leaflet.vectorgrid`)
- El soporte de PMTiles en Leaflet requiere plugins externos sin garantía de mantenimiento
- Leaflet no tiene un protocolo de tiles extensible como MapLibre
- Para el MVP de mapa offline con OPFS, MapLibre ofrece `addProtocol` que permite servir tiles desde OPFS sin SW intercept

## Decisión

Migrar a MapLibre GL JS con PMTiles nativo.

## Criterio de retiro de Leaflet

Eliminar componente Leaflet (`OfflineMap.tsx`, `CubaTileManager.ts`, `CubaGeoSearchAdapter.ts`) CUANDO:

- MapLibre renderice todos los casos de uso actuales (puntos, selección de ubicación, map view)
- GPS offline funcione en MapLibre
- Búsqueda offline funcione en geocoder MapLibre
- Edición/selección de ubicación funcione en MapLibre
- Compartir ubicación funcione en MapLibre
- Pruebas offline E2E con MapLibre pasen
- **MapLibre esté en producción validado ≥ 2 semanas sin regresiones reportadas**

## Fase de retiro

Fase E.cleanup — eliminar dependencias `react-leaflet`, `leaflet.vectorgrid` de `package.json` y archivos heredados.

## Estado actual

Fase E completada (commit `2ee5604`). Leaflet aún presente como fallback durante transición. No hay fecha definida para retiro.
