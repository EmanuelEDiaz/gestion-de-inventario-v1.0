# Fase F — Procedimientos de Verificación Manual

> **Origen**: Fase F del `task_plan.md` (F.1.b, F.3, F.4, F.5).
> **Propósito**: Documentar los procedimientos de prueba manual que NO pueden automatizarse
> fácilmente. F.2 (build checks automatizados) ya pasó durante la implementación.
>
> ⚠️ **Las pruebas aquí listadas deben ejecutarse antes de marcar Fase F como cerrada.**
> Cada item debe marcarse `[x]` con fecha + nombre de quien verificó.

## Pre-requisitos antes de empezar

```bash
# 1. Arrancar PostgreSQL (Docker compose o local)
docker compose up -d postgres

# 2. Arrancar backend
cd backend/inventory-app && mvn spring-boot:run

# 3. Arrancar frontend
cd frontend && pnpm dev

# 4. Verificar conectividad
curl -I http://localhost:8080/api/v1/auth/login  # debe responder 405 (POST only)
curl -I http://localhost:3000                      # debe responder 200
```

---

## F.3 — Pruebas Offline (procedimiento)

### F.3.1 — Arranque con internet → carga completa

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Abrir `http://localhost:3000` | Login screen visible | [ ] |
| 2 | Login con `admin / admin123` | Redirige a dashboard | [ ] |
| 3 | Esperar barra de progreso completa | Llega a `ready_complete` (banner "Todo listo") | [ ] |
| 4 | DevTools → Application → IndexedDB → `inventory-offline` | DB versión 5, 24 stores | [ ] |
| 5 | Verificar stores clave | `products > 0`, `warehouses > 0`, `stockBalances > 0`, `categories > 0` | [ ] |
| 6 | Verificar `appLogs` | Algunas entradas (info sobre boot) | [ ] |
| 7 | Verificar `corruptionQueue` | Vacía | [ ] |
| 8 | Verificar `downloadChunks` | Vacía (post-commit) | [ ] |

### F.3.2 — Desconexión → recarga → datos cacheados

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | DevTools → Network → Throttling → **Offline** | — | [ ] |
| 2 | F5 (recargar) | App carga SIN pedir login (sesión local) | [ ] |
| 3 | Esperar | App llega a `ready_partial` en < 2s con datos cacheados | [ ] |
| 4 | Verificar | Banner "Todo listo" o estado `ready_complete` | [ ] |
| 5 | Navegar a `/products` | Lista muestra productos desde IDB (no desde HTTP) | [ ] |
| 6 | Navegar a `/customers` | Lista muestra clientes desde IDB | [ ] |
| 7 | Navegar a `/warehouses` | Lista muestra almacenes desde IDB | [ ] |
| 8 | Navegar a `/stock` | Stock balances visibles | [ ] |
| 9 | DevTools → Network | Solo requests a assets locales (no API) | [ ] |

### F.3.3 — Mapa offline

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Con internet, ir a Settings → Storage → StoragePanel | Sección "Mapa" visible | [ ] |
| 2 | Si mapa no descargado, click "Descargar mapa" | Barra de progreso avanza (visible) | [ ] |
| 3 | Progreso 100% + checksum validado | Botón "Eliminar mapa" habilitado, metadata guardada | [ ] |
| 4 | Cancelar descarga a mitad de camino (botón "Cancelar") | Descarga se interrumpe limpiamente | [ ] |
| 5 | Re-descargar (debe pedir confirmación si ya existe) | Sobrescribe con nuevo checksum | [ ] |
| 6 | Desconectar red (Offline) | — | [ ] |
| 7 | Abrir vista con `MapPreview` o `MapViewer` | Mapa renderiza tiles desde OPFS | [ ] |
| 8 | Si mapa NO está descargado | "Mapa no disponible. Descargar desde Configuración" + enlace | [ ] |
| 9 | DevTools → Network | Sin requests a `/api/v1/maps/*` (todo desde OPFS) | [ ] |

### F.3.4 — Búsqueda geográfica offline

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Offline | — | [ ] |
| 2 | Abrir geocoder en mapa (input "Buscar ubicación") | — | [ ] |
| 3 | Escribir "La Habana" | Resultados de La Habana (provincia, municipios) | [ ] |
| 4 | Escribir "Santiago" | Resultados de Santiago de Cuba | [ ] |
| 5 | Click en resultado | Mapa hace flyTo a la ubicación | [ ] |
| 6 | Verificar tiempo de respuesta | < 100ms (latencia local) | [ ] |
| 7 | Si `geoIndex` falló | Mensaje "Búsqueda offline no disponible" | [ ] |

### F.3.5 — Compartir ubicación

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Online | — | [ ] |
| 2 | En mapa, click "Compartir ubicación" | Si `navigator.share` disponible → modal nativo | [ ] |
| 3 | Si no hay `navigator.share` | Copia link al portapapeles | [ ] |
| 4 | Pegar link en otra app | URL formato `https://www.google.com/maps?q=lat,lng` | [ ] |
| 5 | Click en link | Abre Google Maps con la coordenada | [ ] |

### F.3.6 — Logout y limpieza

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Con datos cargados, ir a Settings → Logout | — | [ ] |
| 2 | Confirmar logout | Vuelve a login | [ ] |
| 3 | Verificar stores sesión-scoped | `outbox`, `deadLetter`, `notifications`, `conflicts` → vacíos/limpio | [ ] |
| 4 | Verificar stores globales | `products`, `categories`, `warehouses`, `geoIndex` → conservados | [ ] |
| 5 | Login de nuevo con mismo usuario | Carga desde cache (sin re-descargar) | [ ] |
| 6 | Login con usuario diferente | Limpieza completa de caches SW auth-scoped | [ ] |
| 7 | DevTools → Application → Storage | Verificar caches `inventory-offline-{userId}` | [ ] |

### F.3.7 — Outbox persistence

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Online, crear venta nueva | Venta se guarda, sale al servidor (si online) | [ ] |
| 2 | Desconectar red | — | [ ] |
| 3 | Crear otra venta (no Tipo B) | Outbox la retiene con `clientVersion`, `payload`, `createdAt` | [ ] |
| 4 | DevTools → Application → IDB → `outbox` | Ver la entrada con campos completos | [ ] |
| 5 | F5 (recargar) | Venta sigue en outbox, sin pérdida | [ ] |
| 6 | Reconectar | Outbox se drena en orden Tipo B > Tipo A | [ ] |
| 7 | Verificar badge sync | Badge decrementa conforme drena | [ ] |

---

## F.4 — Prueba Multiusuario Conflicto

### F.4.1 — Conflicto de edición simultánea

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Login usuario A en Tab 1 | — | [ ] |
| 2 | Login usuario A en Tab 2 (mismo usuario, 2 tabs) | — | [ ] |
| 3 | Tab 1: ir a `/products/{id}` → editar nombre → guardar | Cambio se persiste (versión N) | [ ] |
| 4 | Tab 2: ver mismo producto | Carga versión N (invalidada por cache invalidation) | [ ] |
| 5 | Tab 2: editar nombre (con versión N) → guardar | Cambio se persiste (versión N+1) | [ ] |
| 6 | Tab 1: editar el MISMO campo (versión N) → guardar | Conflicto: `clientVersion !== serverVersion` | [ ] |
| 7 | Verificar SyncConflictResolver | Aparece con `FieldDiffTable` mostrando diff campo a campo | [ ] |
| 8 | Opciones de resolución: "Conservar local" / "Usar servidor" / "Cancelar" | Cada opción funciona, NUNCA merge silencioso | [ ] |
| 9 | Verificar `incidents` store en IDB | Entrada registrada para auditoría | [ ] |

### F.4.2 — Conflicto cross-tab (mismo usuario)

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Mismo usuario, 2 tabs | — | [ ] |
| 2 | Tab 1: editar y guardar (versión N+1) | Persiste | [ ] |
| 3 | Tab 2: editar y guardar (versión N, desactualizada) | Conflicto detectado | [ ] |
| 4 | SyncConflictResolver visible con diff | — | [ ] |
| 5 | Sincronización cross-tab tokens | Tab B recibe token refrescado sin refresh propio (BroadcastChannel) | [ ] |
| 6 | `navigator.locks.request('download-lock-products')` | Solo 1 tab descarga a la vez | [ ] |

---

## F.5 — Prueba de Corrupción

### F.5.1 — Corrupción de chunk en descarga

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | DevTools → Network → Block request URL: `/api/v1/products/paginated?page=0` | — | [ ] |
| 2 | O usar un MITM proxy (Charles/Proxyman) para inyectar JSON malformado | — | [ ] |
| 3 | Forzar recarga de la app con DB limpia | — | [ ] |
| 4 | Observar logs en `appLogger.error` | Mensaje claro de error de parsing/checksum | [ ] |
| 5 | Verificar `corruptionQueue` en IDB | Entrada con `rawPayload` (texto corrupto), `parseError`, `status: 'pending'` | [ ] |
| 6 | Verificar `CorruptionRepairCenter` en UI | Entrada visible con detalles del error | [ ] |
| 7 | Acción: "Reparar manualmente" o "Descartar" | Opción funciona, reintenta o purga | [ ] |
| 8 | Verificar log auditoría | "CorruptionEntry reparada" o "descartada" | [ ] |

### F.5.2 — Corrupción de imagen cacheada

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Con internet, abrir producto con imagen | Imagen se descarga y cachea (OPFS) | [ ] |
| 2 | DevTools → Application → OPFS → buscar el blob | Blob presente | [ ] |
| 3 | Sobrescribir el blob con bytes basura (vía DevTools) | — | [ ] |
| 4 | Recargar la imagen | `useImageCache` detecta SHA-256 inválido | [ ] |
| 5 | Comportamiento esperado | Re-descarga del servidor, sin crash, sin mostrar imagen corrupta | [ ] |

### F.5.3 — Corrupción de mapa (PMTiles)

| Paso | Acción | Resultado esperado | [x] |
|------|--------|--------------------|-----|
| 1 | Mapa descargado en OPFS con metadata conocida | — | [ ] |
| 2 | Modificar bytes del PMTiles en OPFS (vía DevTools) | — | [ ] |
| 3 | Esperar `map_verify` background task | Detecta checksum mismatch | [ ] |
| 4 | UI muestra "Mapa no disponible" | Banner degradado (NO bloquea app) | [ ] |
| 5 | Enlace a StoragePanel para re-descargar | — | [ ] |
| 6 | Click "Re-descargar mapa" | Sobrescribe PMTiles, metadata actualizada | [ ] |

---

## F.1.b — Checklist P1–P5 (automatizable vía scripts)

### P1 — Cero internet en runtime

```bash
# Script: p1-no-external-cdn.sh
cd /mnt/datos/emanuel/Programacion/Nextjs/gestion\ de\ inventario
echo "=== Buscando URLs externas en código frontend ==="
rg "https?://(?!localhost)" frontend/src/{core,presentation,app} \
  --type-add 'web:*.{ts,tsx,css,html}' -t web \
  --no-line-number | head -20
echo "=== Verificar que no hay CDNs en next.config ==="
grep -E "https?://(?!localhost)" frontend/next.config.ts frontend/next.config.js 2>/dev/null || echo "OK - sin URLs externas"
echo "=== Verificar precache SW no carga dominios externos ==="
grep -rE "https?://(?!localhost)" frontend/src/app/sw.ts || echo "OK - sw.ts no referencia externos"
```

| Check | Comando / Inspección | [x] |
|-------|----------------------|-----|
| Sin URLs externas en código de runtime | `rg "https?://" frontend/src/{core,presentation,app}` retorna solo API base | [ ] |
| Sin CDN en `next.config.ts` | Inspección visual + grep | [ ] |
| SW no fetch a hosts externos | `grep -rE "https?://" frontend/src/app/sw.ts` | [ ] |
| `pnpm depcheck` sin deps de internet | `cd frontend && pnpm depcheck` | [ ] |
| DevTools Network → Disable cache | Carga app, verificar 0 requests a CDNs | [ ] |

### P2 — Dispositivo ligero

```bash
# Script: p2-bundle-check.sh
cd /mnt/datos/emanuel/Programacion/Nextjs/gestion\ de\ inventario/frontend
echo "=== Bundle analysis (next build) ==="
pnpm build 2>&1 | grep -E "(maplibre|chunk|size|First Load JS)" | head -20
echo "=== Cold start benchmark ==="
# Manual: DevTools → Performance → medir startLoading() hasta ready_partial
```

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| MapLibre chunk separado | Build output muestra chunk `maplibre-*` distinto del main | [ ] |
| Cold start con cache local < 2s | DevTools Performance: startLoading() → ready_partial | [ ] |
| Sin ObjectURLs sin revoke | DevTools Memory: tomar heap snapshot antes/después de navegar | [ ] |
| Tab oculta pausa background tasks | DevTools sensors: visibility hidden → tasks suspenden | [ ] |

### P3 — Trabajo offline indefinido

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| Servidor apagado + F5 = `ready_partial` | `systemctl stop backend` o apagar container, recargar | [ ] |
| Outbox crece sin límite | Crear N ventas offline → `db.count('outbox') === N` | [ ] |
| Sesión local persiste offline | DevTools → Application → Local Storage → tiene `local-authenticated` | [ ] |
| Dejar app cerrada 24h+ | Cron: dejar app cerrada, abrir, datos intactos | [ ] |

### P4 — Servidor puede apagarse

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| Sesión local NO se invalida al apagar servidor | Apagar backend, usar app, sin logout forzado | [ ] |
| Banner "Sesión expiró" solo tras 401 | Sin refresh automático al detectar red caída | [ ] |
| Lectura funciona 100% sin servidor | Con servidor apagado, todas las vistas leen desde IDB | [ ] |
| NetworkMode 'offline' persiste | Toggle offline, F5, sigue en offline | [ ] |
| AbortSignal.timeout(5000) en fetches | DevTools: simular servidor colgado, request no cuelga > 5s | [ ] |

### P5 — Sync no destructivo

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| Outbox guarda clientVersion | Inspección de store `outbox` en IDB | [ ] |
| Outbox guarda payload completo | Inspección de `outbox[*].payload` | [ ] |
| Outbox guarda createdAt | Inspección de `outbox[*].createdAt` | [ ] |
| Outbox guarda priority | Inspección de `outbox[*].priority` | [ ] |
| Outbox guarda entityType + entityId | Inspección de `outbox[*].entityType`, `entityId` | [ ] |
| Sync drena Tipo B antes que Tipo A | Outbox con mix: 5 Tipo A + 5 Tipo B → sync procesa Tipo B primero | [ ] |
| Conflicto → FieldDiffTable | F.4.1 paso 6-7 | [ ] |
| Sync NO borra datos locales sin confirmación | Forzar error de sync, datos locales permanecen | [ ] |
| NetworkMode 'online' → drena automáticamente | Toggle online, ver badge sync decrementarse | [ ] |

---

## F.1.b — Checklist de features específicas (automatizable)

### Estado del loader

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| `rehydrate_local` detecta core dataset suficiente | `db.count('warehouses') > 0 && db.count('products') > 0 && db.count('stockBalances') > 0` | [ ] |
| `categories` no bloquea `ready_partial` | Vaciar categories, la app entra en `ready_partial` igual | [ ] |
| `ready_partial` antes de `map_verify` | Matar `map_verify`, app sigue usable | [ ] |
| `ready_complete` derivado | Inspección Zustand: `availability === 'ready_partial' && backgroundTasksStore.allTerminated()` | [ ] |
| `degraded` si map_verify falla | Simular checksum inválido, ver banner persistente amarillo | [ ] |

### Mapas

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| MapLibreInitializer registra protocolo pmtiles:// | Inspección código + DevTools Console | [ ] |
| OPFSTileSource protocolo opfs-pmtiles:// | Inspección código | [ ] |
| cuba-map-style.ts genera estilo con 'opfs' o 'server' source | Inspección código | [ ] |
| MapPreview expandible a MapViewer en Dialog | UI test | [ ] |
| MapViewer mode view/select, markers, GPS, zoom | UI test | [ ] |
| useGeoSearch debounce 300ms, top 5 | Inspección código + test funcional | [ ] |
| Botón "Mi ubicación" solicita permiso GPS → flyTo | UI test (mock geolocation) | [ ] |
| Descarga mapa con progreso + cancelable | UI test | [ ] |
| SHA-256 validación post-descarga | Inspección código + StoragePanel muestra checksum | [ ] |
| map_verify background task con AbortSignal.timeout(3000) | Inspección código | [ ] |
| MapController.java con Accept-Ranges + Range requests | `curl -I -H "Range: bytes=0-1023" http://localhost:8080/api/v1/maps/cuba.pmtiles` | [ ] |

### Imágenes (parcial — Fase G completa)

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| Backend `/api/v1/images/**` con ETag + Accept-Ranges | `curl -I http://localhost:8080/api/v1/products/{id}/images` | [ ] |
| useImageUrl hook revoca ObjectURLs en cleanup | Inspección código (cleanup function en useEffect) | [ ] |
| (resto de Fase G cuando se implemente) | — | [ ] |

### Sync

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| `navigator.locks.request('download-lock-{entity}')` | Inspección código DownloadQueueService | [ ] |
| BroadcastChannel token-refresh cross-tab | DevTools: 2 tabs, refresh en una, otra lo recibe | [ ] |
| Tipo B requiere ConfirmDialog offline | UI test: confirmar venta offline con server caído | [ ] |
| PushResultDto con serverPayload, entityType, entityId, errorCode, versions | Inspección DTO | [ ] |
| FieldDiffTable con serverPayload + clientPayload | F.4.1 | [ ] |

### SW

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| SW SET_USER_CONTEXT postMessage | Inspección código | [ ] |
| SW limpia caches al recibir `null` | Logout + verificar caches eliminados | [ ] |

### Almacenamiento

| Check | Procedimiento | [x] |
|-------|--------------|-----|
| HealthPanel con `?debug=1` | UI test | [ ] |
| `appLogger` no escribe a IDB antes de `setIdbReady(true)` | Inspección código | [ ] |
| Repos local-first (sin HTTP en queryFn) | `rg "apiClient.get" frontend/src/infrastructure/repositories/` solo auth/user/audit | [ ] |

---

## Métricas de aceptación (Budgets)

| Métrica | Objetivo | Cómo medir | [x] |
|---------|----------|------------|-----|
| Cold start con cache local | < 2s | `performance.now()` desde startLoading() hasta ready_partial | [ ] |
| Warm start con cache local | < 1s | Ídem, segunda carga | [ ] |
| ready_partial en primer arranque | < 10s | Desde login hasta ready_partial | [ ] |
| Tiempo SHA-256 post-descarga mapa | < 3s para 200MB | `performance.now()` post-descarga | [ ] |
| Tiempo búsqueda local (geo-index) | < 100ms para top 5 | `console.time('geo-search')` | [ ] |
| Tamaño geo-index Cuba | < 500KB | `JSON.stringify(geoEntries).length` | [ ] |
| Tamaño logs IDB | < 5000 entradas | `db.count('appLogs')` | [ ] |
| Máximo operaciones outbox | 500 | `db.count('outbox')` | [ ] |
| Concurrencia descarga catálogos | 2-3 | Inspección DownloadQueueService | [ ] |
| Tiempo sync pull por entidad | < 5s | `console.time` | [ ] |

---

## Cierre de Fase F

Una vez que todos los items `[x]` están marcados:

1. Actualizar `task_plan.md`: cambiar línea 994 a "✅ Completado (F.1.a-c, F.2.a-d, F.3-F.5 documentados)"
2. Documentar en `docs_dev/fixes.md` cualquier issue encontrado durante las pruebas manuales
3. Commit:
   ```bash
   git add -A
   git commit -m "feat(phase-f): verificación end-to-end completa + F.2 build checks fix"
   ```
4. Listo para Fase G (Estrategia de Imágenes Offline)

---

## Notas

- Este documento es ejecutable **manualmente** por el developer/admin
- Si una prueba falla, **NO** se marca como `[x]` — se documenta en `docs_dev/fixes.md` y se corrige
- Las pruebas F.3-F.5 son las más críticas para validar P3 (offline indefinido) y P5 (sync no destructivo)
- Las pruebas automatizables (F.1.b + F.2) ya pasaron durante la implementación (ver reporte de subagentes)
