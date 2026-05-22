# Plan de Rendimiento — PC se congela al abrir la app

> Created: 2026-05-22 v3 | Investigación con 4 agentes paralelos + 3 skills
> Refinado: 2026-05-22 | Validación contra código + docs + 95 archivos de iconos

## Reglas de Ejecución

- **Una fase a la vez**: ejecutar, verificar, commitear, marcar completada, preguntar al usuario si sigue.
- **Commit por fase**: cada fase completada → commit con mensaje descriptivo.
- **Verificación obligatoria**: después de cada fase correr `pnpm build` + `mvn test` (si aplica) antes de commitear.
- **Máx 3 sub-agentes por tarea** para acelerar sin saturar.
- **Progreso**: marcar fase como ✅ en la tabla de abajo al completar.
- **Pausa post-fase**: al terminar una fase, preguntar al usuario si continuar.

---

## Progreso

| Fase | Estado | Commit |
|------|--------|--------|
| **P1** — Límites de memoria + fix kill -9 | ✅ Completado | `5951ac4` |
| **P2** — SW no recarga en dev | ✅ Completado | `f76dbbf` |
| **P3** — Fix config contradictoria | ⏳ Pendiente | — |
| **P4** — Reducir polling + unificar SSE | ✅ Completado | `5c7da2b` |
| **P5** — Estabilizar query keys | ⏳ Pendiente | — |
| **P6** — Config backend liviana | ✅ Completado | a9a333b |
| **P7** — Unificar iconos (@material-symbols-svg) | ⏳ Pendiente | — |
| **P8** — Limpiar caches | ⏳ Pendiente | — |
| **P9** — Arreglos Docker | ⏳ Pendiente | — |

---

## Resumen Ejecutivo

**Sistema actual:** 7.5 GB RAM total, **5.4 GB usados** antes de arrancar (72%), solo **156 MB libres**.

| Componente | RAM estimada al arrancar |
|------------|--------------------------|
| Línea base (OS + opencode + Firefox + Docker) | ~5.4 GB |
| JVM Spring Boot (sin `-Xmx`, heap por defecto ~1.8 GB) | +1.8 GB |
| Node.js webpack dev server (sin `--max-old-space-size`) | +1.5 GB |
| Terminales GUI (konsole/gnome-terminal × 2) | +200 MB |
| `@material-symbols-svg` 343 MB / 7732 iconos compilados | +343 MB |
| PostgreSQL Docker (ya corriendo) | +200 MB |
| **Total estimado** | **~9.4 GB** |

**Déficit: ~1.9 GB → swap masivo → kernel bloquea I/O → mouse congelado.**

---

## Problemas Identificados

### 🔴 CRÍTICO — Causan el freeze directamente

| # | Problema | Impacto | Ubicación | Tiempo fix |
|---|----------|---------|-----------|------------|
| C1 | **JVM sin `-Xmx`** → heap por defecto = 25% RAM (~1.8 GB) | +2 GB RAM, swap inmediato | `start-backend.sh:120` | 2 min |
| C2 | **Node.js sin `NODE_OPTIONS`** → V8 crece sin límite | +1.5 GB RAM | `start-dev.sh:187` | 1 min |
| C3 | **SW `activate` → `client.navigate(client.url)` recarga TODAS las tabs** | Cascada de recargas multiplica todo | `public/sw.js:47-68` | 5 min |
| C4 | **`scripts` usan `kill -9`** violando AGENTS.md | Matar procesos forzado puede corromper estado | `start-backend.sh:94`, `start-dev.sh:175` | 2 min |

### 🟠 ALTO — Amplifican el freeze

| # | Problema | Impacto | Ubicación | Tiempo fix |
|---|----------|---------|-----------|------------|
| A1 | **`useNetworkHealth`** polling cada **5s** con timeout **4s** → conexiones colgadas se acumulan si backend tarda | +12 conexiones/min colgadas, agotan connection pool | `useNetworkHealth.ts:10-12,44` | 5 min |
| A2 | **Dual EventSource/SSE** a `/stream` y `/sse` → auto-reconnect loop si fallan | Conexiones HTTP duplicadas, saturan Netty | `notifications.api.ts:305`, `useNotificationStream.ts:15` | 10 min |
| A3 | **`useInfiniteProducts`: query key usa `options` (objeto)** → TanStack Query v5 maneja hash estructural, pero es frágil si cambia versión o hay funciones en params | Riesgo potencial de loop en futuras versiones | `useInfiniteProducts.ts:37` | 5 min |
| A4 | **`next.config.ts` tiene bloque `turbopack: { root: __dirname }`** que CONFLICTA con `--webpack` flag. No causa freeze pero es configuración muerta/contradictoria | Config duplicada, posible error en build | `next.config.ts:5-7` | 2 min |
| A5 | **`next.config.ts` referencia directorio `node_modules/next/dist/docs/` que NO existe** | Documentación obsoleta, dificulta debugging | `frontend/AGENTS.md` | 2 min |
| A6 | **R2DBC pool `max-size: 20`** y `initial-size: 5` | 20 conexiones DB en dev local = RAM innecesaria | `application.yml:18-19` | 1 min |
| A7 | **DEBUG logging** en todo `com.inventory` | Logs 10× más pesados, I/O + CPU extra | `application.yml:61-63` | 1 min |
| A8 | **`lucide-react` + `@material-symbols-svg` AMBAS cargadas** → 2 bibliotecas de iconos, 98 archivos importan lucide, bundle duplicado | +150 KB bundle, node_modules inflado | 95 archivos `.tsx/.ts` + `package.json:27` | 45 min |

### 🟡 MEDIO — Contribuyen a presión general

| # | Problema | Impacto | Ubicación |
|---|----------|---------|-----------|
| M1 | Terminales GUI (konsole, kitty, gnome-terminal...) spawn en `start-dev.sh` | +50–200 MB c/u, 2 terminales = +100–400 MB | `start-dev.sh:73-89` |
| M2 | `.next/cache` = **789 MB** → disco I/O intenso en cada cambio | HMR lento, disco saturado | `.next/cache/` |
| M3 | `docker-compose.yml` sin `.env` → falla + crash loops de containers | Docker restart loop | `docker-compose.yml` |
| M4 | `mvnw` (Maven wrapper) no existe → Docker build falla | No se puede construir con Docker | `backend/Dockerfile:10` |
| M5 | Sin `max-lifetime` ni `max-acquire-time` en pool R2DBC | Conexiones hold perpetuas bajo carga | `application.yml:18-19` |

---

## Fase P1: Límites de Memoria + Fix kill -9 (5 archivos, ~10 min)

> **Objetivo:** Evitar que JVM y Node.js consuman toda la RAM del sistema. Reemplazar `kill -9` por `kill` sin flag (AGENTS.md).

| # | Archivo | Acción |
|---|---------|--------|
| P1.1 | `start-backend.sh` (línea 120) | Agregar `-Dspring-boot.run.jvmArguments="-Xmx512m -Xms256m"` a `mvn spring-boot:run` |
| P1.2 | `start-dev.sh` (línea 187) | Cambiar `pnpm dev` por `NODE_OPTIONS="--max-old-space-size=1024" pnpm dev` |
| P1.3 | `start-dev.sh` (línea 73-89) | Reemplazar terminales GUI por background processes con logs a archivo (`&> logs/backend.log &`) |
| P1.4 | `start-backend.sh` (línea 94) y `start-dev.sh` (línea 175) | Reemplazar `kill -9` por `kill` (sin flag) para cumplir AGENTS.md |
| P1.5 | `backend/Dockerfile` (línea 30) | `JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=50"` (bajar de 75%) |
| P1.6 | `docker-compose.yml` | Agregar `deploy.resources.limits.memory: 512M` a backend y frontend services |

✅ **Check:** `ps aux | grep java` muestra `-Xmx512m`. `ps aux | grep node` muestra `--max-old-space-size=1024`. `rg 'kill -9' start-*.sh` = 0 resultados.

---

## Fase P2: Fix SW Activate en Dev (1 archivo, ~5 min)

> **Objetivo:** Evitar que SW recargue todas las tabs al activarse en localhost

| # | Archivo | Acción |
|---|---------|--------|
| P2.1 | `public/sw.js` (línea 52-62) | Envolver `client.navigate(client.url)` con `if (self.location.hostname !== 'localhost')` |

✅ **Check:** En localhost, SW se desregistra sin recargar la página.

---

## Fase P3: Fix Config Contradictoria (2 archivos, ~5 min)

> **Objetivo:** Eliminar configuración turbopack que conflictúa con `--webpack`. No se migra a Turbopack porque `next-pwa` es plugin webpack y rompería.

| # | Archivo | Acción |
|---|---------|--------|
| P3.1 | `next.config.ts` (línea 5-7) | **Eliminar bloque** `turbopack: { root: __dirname }` — es configuración muerta que conflictúa con `--webpack` |
| P3.2 | `frontend/AGENTS.md` | Reemplazar referencia a `node_modules/next/dist/docs/` (no existe) por documentación correcta o eliminar |

✅ **Check:** `rg 'turbopack' frontend/next.config.ts` = 0. `pnpm dev --webpack` sigue funcionando.

---

## Fase P4: Reducir Polling + Unificar SSE (4 archivos, ~15 min)

> **Objetivo:** Eliminar conexiones colgadas por health check agresivo y SSE duplicado. No se toca polling de notificaciones (es solo fallback SSE, no polling real).

| # | Archivo | Acción |
|---|---------|--------|
| P4.1 | `useNetworkHealth.ts:10-11` | Subir `PING_INTERVAL_OFFLINE` a `30_000` (de 5s) y `PING_INTERVAL_ONLINE` a `60_000` (de 15s). Reducir `PING_TIMEOUT` a `2_000` (de 4s) |
| P4.2 | `useNetworkHealth.ts` | Agregar backoff exponencial: pausar polling tras 3 errores consecutivos, reanudar tras 1 éxito |
| P4.3 | `notifications.api.ts:305` vs `useNotificationStream.ts:15` | **Unificar a UN solo endpoint SSE**. Elegir `/api/v1/notifications/stream` (el del hook directo) y eliminar `/sse` de `notifications.api.ts`. O viceversa — verificar cuál existe en backend |
| P4.4 | `useNotificationsShared.ts:58` | Reemplazar `filters` raw por parámetros serializados en `infiniteKey` (defensivo, mismo approach que P5) |

✅ **Check:** Network tab muestra ≤1 SSE conexión activa. Health check sin conexiones colgadas cuando backend no responde.

---

## Fase P5: Estabilizar Query Keys (2 archivos, ~5 min)

> **Objetivo:** Fix defensivo de query keys que usan objetos. TanStack Query v5 maneja hash estructural, pero es frágil si cambia versión o hay funciones/clases en params.

| # | Archivo | Acción |
|---|---------|--------|
| P5.1 | `useInfiniteProducts.ts:37` | Cambiar `queryKey: ['products', 'infinite', options]` por `queryKey: ['products', 'infinite', search, categoryId, status, maxPages]` (desestructurar params planos) |
| P5.2 | `useNotificationsShared.ts:58` | Reemplazar `filters` en infiniteKey por props planas serializables |

✅ **Check:** Query keys en React Query DevTools muestran valores planos, no `[Object]`.

---

## Fase P6: Config Backend para Dev Liviano (3 archivos, ~5 min)

> **Objetivo:** Reducir consumo de RAM y CPU del backend en desarrollo local.

| # | Archivo | Acción |
|---|---------|--------|
| P6.1 | `application.yml` | Cambiar pool: `initial-size: 1`, `max-size: 5` (de 5/20). Agregar `max-lifetime: 30m`, `max-acquire-time: 5s`, `max-create-connection-time: 5s` |
| P6.2 | `application.yml:61-63` | Cambiar `com.inventory: INFO` (de DEBUG) para desarrollo |
| P6.3 | `pom.xml:124-129` | Verificar que `spring-boot-devtools` tiene `<optional>true</optional>` (ya debería) |

✅ **Check:** Backend arranca con 1 conexión DB. Logs sin debug.

---

## Fase P7: Unificar Iconos — Eliminar lucide-react, Usar Solo @material-symbols-svg (96 archivos, ~45 min)

> **Objetivo:** Eliminar dependencia duplicada `lucide-react`. Migrar sus **55 iconos únicos** (en 95 archivos, 185 usos) a `@material-symbols-svg/react`. Esto reduce bundle y node_modules.

### Mapa de equivalencias

| lucide-react (55 iconos) | material-symbols-svg | Usos |
|--------------------------|---------------------|------|
| `AlertCircle` | `<SvgIcon icon="error" />` | 2 |
| `AlertTriangle` | `<SvgIcon icon="warning" />` | 3 |
| `ArrowLeft` | `<SvgIcon icon="arrow-back" />` | 4 |
| `ArrowRight` | `<SvgIcon icon="arrow-forward" />` | 2 |
| `Ban` | `<SvgIcon icon="block" />` | 2 |
| `Bell` | `<SvgIcon icon="notifications" />` | 4 |
| `Check` | `<SvgIcon icon="check" />` | 3 |
| `CheckCheck` | `<SvgIcon icon="done-all" />` | 1 |
| `CheckCircle` | `<SvgIcon icon="check-circle" />` | 11 |
| `CheckCircle2` | `<SvgIcon icon="verified" />` | 11 |
| `ChevronDown` | `<SvgIcon icon="expand-more" />` | 4 |
| `ChevronLeft` | `<SvgIcon icon="chevron-left" />` | 2 |
| `ChevronRight` | `<SvgIcon icon="chevron-right" />` | 2 |
| `ChevronUp` | `<SvgIcon icon="expand-less" />` | 2 |
| `CircleOff` | `<SvgIcon icon="radio-button-unchecked" />` | 4 |
| `Clock` | `<SvgIcon icon="schedule" />` | 1 |
| `CloudOff` | `<SvgIcon icon="cloud-off" />` | 1 |
| `Copy` | `<SvgIcon icon="content-copy" />` | 1 |
| `CreditCard` | `<SvgIcon icon="credit-card" />` | 1 |
| `Download` | `<SvgIcon icon="download" />` | 1 |
| `ExternalLink` | `<SvgIcon icon="open-in-new" />` | 1 |
| `Eye` | `<SvgIcon icon="visibility" />` | 4 |
| `EyeOff` | `<SvgIcon icon="visibility-off" />` | 2 |
| `FileText` | `<SvgIcon icon="description" />` | 1 |
| `Filter` | `<SvgIcon icon="filter-list" />` | 1 |
| `Image` (as ImageIcon) | `<SvgIcon icon="image" />` | 4 |
| `ImagePlus` | `<SvgIcon icon="add-photo-alternate" />` | 2 |
| `KeyRound` | `<SvgIcon icon="vpn-key" />` | 2 |
| `Loader2` | `<SvgIcon icon="sync" />` o CSS spinner | 1 |
| `Package` | `<SvgIcon icon="inventory" />` | 1 |
| `PackageCheck` | `<SvgIcon icon="checklist" />` | 4 |
| `Pencil` | `<SvgIcon icon="edit" />` | 5 |
| `Plus` | `<SvgIcon icon="add" />` | 18 |
| `Power` | `<SvgIcon icon="power-settings-new" />` | 4 |
| `RefreshCw` | `<SvgIcon icon="refresh" />` | 2 |
| `Save` | `<SvgIcon icon="save" />` | 1 |
| `Search` | `<SvgIcon icon="search" />` | 3 |
| `Send` | `<SvgIcon icon="send" />` | 1 |
| `Settings` | `<SvgIcon icon="settings" />` | 1 |
| `ShoppingCart` | `<SvgIcon icon="shopping-cart" />` | 2 |
| `Signal` | `<SvgIcon icon="signal-cellular-alt" />` | 1 |
| `Sparkles` | ✋ **No hay equivalente en v0.6.0**. Crear SVG inline o usar `auto-awesome` con fallback | 2 |
| `Star` | `<SvgIcon icon="star" />` | 4 |
| `ToggleLeft` | `<SvgIcon icon="toggle-off" />` | 1 |
| `Trash2` | `<SvgIcon icon="delete" />` | 22 |
| `TrendingUp` | `<SvgIcon icon="trending-up" />` | 1 |
| `Truck` | `<SvgIcon icon="local-shipping" />` | 5 |
| `Upload` | `<SvgIcon icon="upload" />` | 1 |
| `Users` | `<SvgIcon icon="group" />` | 2 |
| `Warehouse` | `<SvgIcon icon="warehouse" />` | 1 |
| `Wifi` | `<SvgIcon icon="wifi" />` | 1 |
| `WifiOff` | `<SvgIcon icon="wifi-off" />` | 2 |
| `X` | `<SvgIcon icon="close" />` | 5 |
| `XCircle` | `<SvgIcon icon="cancel" />` | 11 |
| `LucideIcon` (type) | Crear type alias `type SvgIcon = typeof SvgIcon` | 3 |

### Pasos de ejecución

| # | Acción | Archivos afectados |
|---|--------|-------------------|
| P7.1 | Crear archivo `presentation/shared/components/ui/icon-mapping.ts` con wrapper que unifica `@material-symbols-svg` como `SvgIcon` + exportar `type SvgIcon` para reemplazar `LucideIcon` | 1 archivo nuevo |
| P7.2 | Migrar 95 archivos: `import { X } from 'lucide-react'` → `import { SvgIcon } from '@/presentation/shared/components/ui/icon-mapping'` y reemplazar `<X className="..." />` por `<SvgIcon icon="close" />` | 95 archivos |
| P7.3 | Manejar caso especial `Sparkles` (2 usos): crear SVG inline o mapear a icono similar disponible | 2 archivos |
| P7.4 | Reemplazar `type LucideIcon` por `type SvgIcon` en los 3 archivos que usan el tipo | 3 archivos |
| P7.5 | Eliminar `lucide-react` de `package.json` y ejecutar `pnpm install` | `package.json` |
| P7.6 | Verificar build: `pnpm build --webpack` | 1 comando |

✅ **Check:** `rg "from 'lucide-react'" frontend/src/` = 0 resultados (ningún archivo importa lucide-react). `pnpm build --webpack` exitoso.

---

## Fase P8: Limpiar Cachés (3 comandos, ~2 min)

> **Objetivo:** Recuperar espacio en disco y eliminar caches corruptos

| # | Comando | Acción |
|---|---------|--------|
| P8.1 | `rm -rf frontend/.next/cache` | Eliminar 789 MB de cache webpack |
| P8.2 | `pnpm store prune` | Limpiar store de pnpm |
| P8.3 | `mvn clean` en backend | Limpiar target/ |

✅ **Check:** `du -sh frontend/.next/cache` = 0.

---

## Fase P9: Arreglos Docker (2 archivos, ~5 min)

> **Objetivo:** Docker debe poder construir y correr sin errores que causen crash loops

| # | Archivo | Acción |
|---|---------|--------|
| P9.1 | `backend/Dockerfile:10` | Reemplazar `./mvnw` por `mvn` (no existe wrapper) |
| P9.2 | Crear `.env` a partir de `.env.example` o en `start-dev.sh` | |

✅ **Check:** `docker compose build` exitoso.

---

## Verificación Post-Fix

```bash
# 1. Límites de memoria
ps aux | grep -E "(java|node)" | grep -Eo "\-Xmx[0-9]+m|\-\-max-old-space-size=[0-9]+"

# 2. Sin kill -9
rg 'kill -9' start-*.sh

# 3. SW no recarga en localhost
rg 'client\.navigate' public/sw.js | grep localhost

# 4. Sin turbopack config
rg 'turbopack' frontend/next.config.ts

# 5. Health check interval reducido
rg 'PING_INTERVAL_OFFLINE|PING_INTERVAL_ONLINE' frontend/src/presentation/shared/hooks/storage/useNetworkHealth.ts

# 6. Pool reducido
rg 'max-size:|initial-size:' backend/inventory-app/src/main/resources/application.yml

# 7. Sin lucide-react imports
rg "from 'lucide-react'" frontend/src/ | wc -l

# 8. Build frontend
cd frontend && pnpm build --webpack 2>&1 | tail -5

# 9. Backend compile + test
cd backend/inventory-app && mvn compile -q && mvn test -q 2>&1 | tail -3

# 10. Frontend tests
cd frontend && pnpm test:run 2>&1 | tail -5

# 11. Cache limpio
du -sh frontend/.next/cache 2>/dev/null || echo "cache eliminado"
```

---

## Prioridad de Ejecución

| Orden | Fase | Tiempo | Dependencias | Impacto |
|-------|------|--------|-------------|---------|
| 1 | **P1** — Límites de memoria + fix kill -9 | 10 min | Ninguna | 🔴 +3.5 GB libres |
| 2 | **P2** — SW no recarga en dev | 5 min | Ninguna | 🔴 Evita cascada de recargas |
| 3 | **P4** — Reducir polling + unificar SSE | 15 min | Ninguna | 🟠 Elimina connection storms |
| 4 | **P6** — Config backend liviana | 5 min | Ninguna | 🟡 -200 MB + menos CPU |
| 5 | **P3** — Fix config contradictoria | 5 min | Ninguna | 🟢 Codigo muerto limpiado |
| 6 | **P5** — Estabilizar query keys | 5 min | Ninguna | 🟢 Defensivo |
| 7 | **P7** — Unificar iconos (solo @material-symbols-svg) | 45 min | Ninguna | 🟡 Elimina bundle duplicado |
| 8 | **P8** — Limpiar caches | 2 min | Ninguna | 🟡 +1 GB disco |
| 9 | **P9** — Arreglos Docker | 5 min | Ninguna | 🟢 Docker funcional |

---

## Commits Recomendados

```
P1-P2: fix(perf): memory limits, SW dev guard, remove kill -9

- Agrega -Xmx512m a JVM en start-backend.sh
- Agrega --max-old-space-size=1024 a Node.js en start-dev.sh
- Reemplaza terminales GUI por background processes
- Reemplaza kill -9 por kill (AGENTS.md compliance)
- Bloquea client.navigate() en SW si hostname=localhost

P3-P6: fix(perf): remove dead config, reduce polling, stabilize queries, dev config

- Elimina bloque turbopack conflictivo de next.config.ts
- Fix AGENTS.md ref a directorio inexistente
- Sube health check interval: offline 5s→30s, online 15s→60s
- Agrega backoff exponencial a useNetworkHealth
- Unifica SSE endpoints (/stream, elimina /sse)
- Serializa query keys planas en useInfiniteProducts
- Reduce pool R2DBC 20→5, agrega timeouts
- Cambia DEBUG→INFO en application.yml

P7: refactor(icons): remove lucide-react, use only @material-symbols-svg

- Migra 55 iconos (185 usos) de lucide-react a material-symbols-svg
- Crea wrapper SvgIcon unificado
- Elimina lucide-react de package.json
- 95 archivos migrados

P8-P9: chore: clean caches, fix Docker build

- Elimina .next/cache (789 MB)
- pnpm store prune
- Fix mvnw missing en Dockerfile
- Crea .env para docker-compose
```

---

## Notas

- 🟢 **P1 es el fix que evita el freeze inmediato.** Hacer primero.
- 🟡 **P2-P9 son optimizaciones** progresivas.
- ⚠️ **P4 requiere verificar cuál endpoint SSE existe en backend** (`/stream` vs `/sse`) antes de unificar.
- ⚠️ **P7 es la fase más riesgosa** (95 archivos, 55 iconos). Si un icono no tiene equivalente exacto, crear SVG inline en vez de forzar un mapeo incorrecto.
- ⚠️ **Sparkles** (en `ProductCreateView.tsx` y `EditViewHeader.tsx`) no existe en `@material-symbols-svg/react@0.6.0`. Usar SVG inline simple o icono `auto-awesome` con fallback.
- ⚠️ **`LucideIcon` type** se usa en 3 archivos para tipar props que reciben iconos. Reemplazar por un type wrapper propio.
