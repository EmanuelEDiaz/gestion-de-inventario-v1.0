# Plan de Ejecución — Sistema de Inventario Offline-First

**Fecha:** Abril 2026  
**Stack:** Spring Boot 3.4 WebFlux + Next.js 16 PWA + PostgreSQL 17

---

## Estado actual verificado ✅

| Componente | Estado |
|-----------|--------|
| PostgreSQL 17 | ✅ Corriendo, DBs `inventory` e `inventory_dev` creadas |
| Backend Spring Boot | ✅ Compila y arranca en `:8080` con perfil `dev` |
| Flyway V1 migrado | ✅ 12 tablas creadas, roles/permisos/admin cargados |
| Frontend Next.js 16 | ✅ Arranca en `:3000` con Turbopack |
| RBAC dinámico | ✅ ADMIN (45 permisos), SELLER (13 permisos), admin/admin123 |

---

## Diseño del RBAC (implementado en DB)

```
permissions(code, name, category)    ← 45 permisos granulares
roles(code, name, is_system)         ← ADMIN, SELLER (sistema) + custom
role_permissions(role_id, perm_id)   ← asignación many-to-many
users.role_id                        ← FK a roles
```

- **ADMIN** (is_system=true, 45 perms): acceso total, no se puede eliminar
- **SELLER** (is_system=true, 13 perms): solo ventas, stock, clientes
- **Custom**: cualquier sub-conjunto de los 45 permisos
- **Usuario admin por defecto**: `admin` / `admin123` (bcrypt cost=12)

---

## FASE 1 — Base de Seguridad (Backend)

### 1.1 Dominio de autenticación
- `User`, `Role`, `Permission`, `RefreshToken` (value objects, sin anotaciones Spring)
- Puertos: `UserRepository`, `RoleRepository`, `RefreshTokenRepository`

### 1.2 Infraestructura de seguridad
- `JwtService`: generar/validar JWT HS256 (access 15min)
- `JwtAuthenticationFilter` (ReactiveSecurityContextHolder)
- `SecurityConfig` (WebFlux Security, stateless)
- `PasswordEncoder` bcrypt cost=12

### 1.3 Endpoints de auth
- `POST /api/v1/auth/login` → devuelve `{ access_token }` + cookie refresh
- `POST /api/v1/auth/refresh` → lee cookie, emite nuevo access
- `POST /api/v1/auth/logout` → revoca refresh token

### 1.4 Auth en frontend
- `POST /app/api/auth/login` (BFF → backend)
- Guardar access token en memoria, refresh en HttpOnly cookie
- Interceptor Axios para renovar token automáticamente
- Hook `useAuth` + store Zustand

### 1.5 Página de Login
- Pantalla `/login` limpia, validación con React Hook Form + Zod
- Redirige al dashboard si ya hay sesión

---

## FASE 2 — Gestión de Usuarios y Roles (Frontend + Backend)

### 2.1 Backend
- Adapters R2DBC: `UserR2dbcRepository`, `RoleR2dbcRepository`
- Use cases: `CreateUser`, `UpdateUser`, `DeactivateUser`, `ChangePassword`
- Use cases RBAC: `ListRoles`, `CreateRole`, `UpdateRolePermissions`
- Endpoints CRUD usuarios y roles (`/api/v1/users`, `/api/v1/roles`)
- Guard RBAC: `@HasPermission("users:create")` → verifica en token/DB

### 2.2 Frontend
- Módulo `/admin/users`: tabla paginada, crear, editar, desactivar usuario
- Módulo `/admin/roles`: crear rol, asignar permisos (checkbox por categoría)
- Formularios validados (React Hook Form + Zod)
- RBAC frontend: `usePermission("users:create")` → ocultar/mostrar acciones

---

## FASE 3 — Catálogo

### 3.1 Backend
- Migración V2: tablas `categories`, `products`, `product_images`
- Adapters R2DBC + FileStorageAdapter (disco local)
- Use cases: CRUD productos, CRUD categorías, upload/delete imágenes
- Thumbnails inline al subir (Java ImageIO, JPEG 85%)
- Seguridad de paths (path traversal prevention)

### 3.2 Frontend
- Módulo `/admin/products`: tabla, crear, editar, archivar, imágenes
- Módulo `/admin/categories`: árbol visualizado, CRUD
- Galería de imágenes drag-drop con preview
- Buscador en tiempo real (debounce 300ms)

---

## FASE 4 — Almacenes y Stock

### 4.1 Backend
- Migración V3: `warehouses`, `stock_balances`, `inventory_movements`
- Use cases: `CreateWarehouse`, `ListStock`, `ListMovements`
- `StockLedgerService`: actualizar balance atómicamente en cada movimiento

### 4.2 Frontend
- Módulo `/admin/warehouses`
- Módulo `/stock`: tabla con balance por almacén y producto
- Indicador "stock bajo" (< reorder_point)

---

## FASE 5 — Operaciones de Inventario

### 5.1 Migraciones V4-V6
- `purchases` + `purchase_lines`
- `sales` + `sale_lines`
- `transfers` + `transfer_lines`
- `adjustments` + `adjustment_lines`
- `returns` + `return_lines`
- `suppliers`, `customers`

### 5.2 Backend — por operación
Cada operación sigue el patrón:
1. Validar datos de entrada (dominio)
2. Comprobar idempotency key  
3. Abrir transacción reactiva
4. Actualizar stock_balances
5. Insertar inventory_movements
6. Guardar documento
7. Appendear sync_log
8. Retornar respuesta + ETag

### 5.3 Frontend
- **POS (ventas)**: `/pos` — buscador de producto, ajuste de cantidad/precio, cálculo de totales, submit con idempotency key
- **Compras**: formulario con líneas, proveedor, moneda
- **Transferencias**: selector origen/destino almacén
- **Ajustes**: tipo (conteo/daño/corrección), líneas con qty delta
- **Devoluciones**: vinculada a venta o compra original

### 5.4 Terceros
- CRUD proveedores y clientes (módulos simples)

---

## FASE 6 — Monedas y Configuración

### 6.1 Backend
- Migración V7: `exchange_rates`
- Endpoints CRUD monedas, tasas, settings global
- Conversión de moneda en operaciones (multiplicar/dividir por tasa)

### 6.2 Frontend
- Módulo `/settings/currencies`
- Módulo `/settings/exchange-rates`
- Módulo `/settings/general` (empresa, método costeo default)

---

## FASE 7 — Dashboard y Reportes

### 7.1 Backend
- `GET /api/v1/reports/dashboard`: ventas del día, stock bajo, alertas, top productos
- `GET /api/v1/reports/sales`: ventas por rango de fechas
- `GET /api/v1/reports/inventory`: balances actuales

### 7.2 Frontend
- Dashboard con cards KPI + gráficos (Recharts, 100% local)
- Filtros por rango de fechas y almacén
- Tablas exportables

---

## FASE 8 — Export / Import

### 8.1 Export
- Backend: `StreamingExportService` → CSV/XLSX/PDF (Apache POI + iText)
- Endpoints: `GET /api/v1/exports/sales`, `/exports/inventory`
- Frontend: botones de descarga con filtros

### 8.2 Import CSV
- Backend: job-based con estado (PENDING → PROCESSING → DONE/FAILED)
- Dry-run obligatorio antes de aplicar
- Endpoint `POST /api/v1/imports/csv` (multipart) + polling estado
- Frontend: wizard 3 pasos (subir → mapear columnas → dry-run → confirmar)

---

## FASE 9 — Offline Sync

### 9.1 Outbox local (Frontend)
- IndexedDB: `outbox` store con operaciones pendientes
- Service Worker intercepta requests cuando offline → va a outbox
- Indicador UI: barra de estado (🟢 online / 🟡 syncing / 🔴 offline)
- Contador de cambios pendientes

### 9.2 Sync Push
- `POST /api/v1/sync/push`: batch de operaciones del outbox
- Backend verifica idempotency key por operación
- Conflictos (misma entity, versión diferente): política server-wins para stock, manual para catálogo

### 9.3 Sync Pull
- `GET /api/v1/sync/pull?cursor=<last>&warehouseId=<id>`: cambios desde cursor
- Frontend actualiza IndexedDB local → TanStack Query invalida caches afectados

### 9.4 Soporte HTTPS local (LAN/hotspot)
- Caddy como reverse proxy: `https://inventario.local`
- Script para generar CA y confiar en dispositivos iOS/Android

---

## FASE 10 — Auditoría y Hardening

### 10.1 Auditoría
- `AuditInterceptor` en use cases de escritura: before/after JSON
- Endpoint `GET /api/v1/audit?entity=...&page=...`
- Módulo `/admin/audit` frontend

### 10.2 Seguridad
- Rate limiting en login (max 5 intentos / 15 min)
- CORS configurado para origen exacto del frontend
- Content-Security-Policy header
- Validación de magic bytes en uploads de imagen
- Sanitización de inputs en todos los endpoints

### 10.3 Tests
- ArchUnit: dependencias de capas (ya activo)
- Backend: tests unitarios de use cases con Mockito
- Backend: tests de integración con Testcontainers
- Frontend: Playwright E2E (login, crear venta, verificar stock)

---

## FASE 11 — Docker y Despliegue

### 11.1 Docker
- `backend/Dockerfile`: multi-stage, JRE 21, no-root
- `frontend/Dockerfile`: multi-stage, next build, standalone
- `infra/docker/docker-compose.yml`: postgres + backend + frontend + caddy
- Volúmenes: `postgres_data`, `media_data`
- Health checks en todos los servicios

### 11.2 Caddy
- `infra/caddy/Caddyfile`: reverse proxy con TLS auto-firmado
- Script para distribuir CA a teléfonos en LAN

---

## Resumen de Fases y Prioridades

| Fase | Descripción | Prioridad | Estimado |
|------|-------------|-----------|---------|
| 1 | Auth JWT + Login | 🔴 Crítico | 1-2 días |
| 2 | Usuarios + Roles RBAC | 🔴 Crítico | 1-2 días |
| 3 | Catálogo productos | 🔴 Crítico | 2-3 días |
| 4 | Almacenes + Stock | 🔴 Crítico | 1-2 días |
| 5 | Operaciones (ventas/compras/etc) | 🔴 Crítico | 3-5 días |
| 6 | Monedas + Config | 🟡 Importante | 1 día |
| 7 | Dashboard + Reportes | 🟡 Importante | 2 días |
| 8 | Export/Import CSV | 🟡 Importante | 2 días |
| 9 | Offline Sync | 🔵 Avanzado | 3-4 días |
| 10 | Auditoría + Hardening | 🔵 Avanzado | 2 días |
| 11 | Docker | 🔵 Final | 1 día |

---

## Notas técnicas

- **Perfil dev**: `SPRING_PROFILES_ACTIVE=dev`, usa `inventory_dev`, no requiere vars de entorno extra
- **JWT secret dev**: ya hardcodeado en application.yml para dev (cambiar en prod)
- **Admin inicial**: usuario `admin`, contraseña `admin123`, rol ADMIN con todos los permisos
- **Comando backend**: `mvn spring-boot:run` en `backend/inventory-app/` con `SPRING_PROFILES_ACTIVE=dev`
- **Comando frontend**: `pnpm dev` en `frontend/`
