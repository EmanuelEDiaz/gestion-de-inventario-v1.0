# Plan de Desarrollo - Sistema de Inventario Offline-First

**Fecha Inicio**: 2026-04-17
**Última Actualización**: 2026-04-17
**Stack**: Spring Boot 3.4 WebFlux + Next.js 15 + PWA

---

## Estado Actual

### ✅ Completado
- [x] Gate A: Diseño base (arquitectura, glosario, estructura carpetas)
- [x] Gate B: Contratos (ERD, migraciones V1-V5, DTOs base)
- [x] Gate C: Scaffolding (backend compila, frontend arranca)
- [x] Autenticación (JWT + refresh tokens + RBAC)
- [x] Catálogo base: Products, Categories, Warehouses (CRUD completo)
- [x] Arquitectura hexagonal backend (ports/in, use cases, controllers)
- [x] Arquitectura hexagonal frontend (core/infrastructure/presentation)
- [x] **Gate D: Stock balances + Ledger de movimientos** ✅
- [x] **Fase 2A: Compras** (backend + frontend) ✅
- [x] **Fase 2B: Ventas/POS** (backend + frontend) ✅

### ⏳ En Progreso
- [ ] Fase 2C: Transferencias entre almacenes

### ❌ Pendiente
- [ ] Fase 2D: Ajustes de inventario
- [ ] Fase 2E: Devoluciones
- [ ] Fase 3: Usuarios & Terceros (suppliers, customers)
- [ ] Gate F: Dashboard + Export (CSV/XLSX/PDF)
- [ ] Gate G: Offline sync completo + PWA hardening
- [ ] Gate Final: Docker + README portafolio

---

## Fases de Implementación

### Fase 1: Stock & Balances (Gate D completo) ✅ COMPLETADA
**Commit**: `a693c07` - "feat(stock): Fase 1 - Stock & Balances module complete"

#### Backend ✅
- [x] 1.1 Modelos de dominio: StockBalance, InventoryMovement (inmutables)
- [x] 1.2 Ports: StockQueryPort, MovementQueryPort, StockRepository, MovementRepository
- [x] 1.3 Use Cases: StockQueryUseCase, MovementQueryUseCase
- [x] 1.4 Controllers: StockController, MovementController
- [x] 1.5 Persistence: Adapters R2DBC + entities + mappers

#### Frontend ✅
- [x] 1.6 Core: Entities (StockBalance, InventoryMovement)
- [x] 1.7 Infrastructure: StockRepository, MovementRepository
- [x] 1.8 Presentation: StockBalanceTable, StockBalanceCard, MovementTable, hooks

---

### Fase 2: Operaciones de Inventario (Gate E)
**Objetivo**: CRUD completo para todas las operaciones

#### 2A: Compras ✅ COMPLETADA
**Commit**: `feat(purchases): Add purchase management module`
- [x] Backend: Purchase, PurchaseLine domain models (inmutables)
- [x] Backend: PurchaseCommandPort, PurchaseQueryPort (ports)
- [x] Backend: PurchaseCommandUseCase, PurchaseQueryUseCase
- [x] Backend: PurchaseController + Persistence adapters
- [x] Frontend: Core entities + interfaces + use cases
- [x] Frontend: PurchaseRepository, usePurchases hook
- [x] Frontend: PurchaseTable, PurchaseDetail components

#### 2B: Ventas (POS) ✅ COMPLETADA
**Commit**: `feat(sales): Add sales/POS management module`
- [x] Backend: Sale, SaleLine domain models con workflow
- [x] Backend: SaleCommandPort, SaleQueryPort (ports)
- [x] Backend: SaleCommandUseCase (reserve/release stock)
- [x] Backend: SaleController + Persistence adapters
- [x] Frontend: Core entities + interfaces + use cases
- [x] Frontend: SaleRepository, useSales hook
- [x] Frontend: SaleTable component

#### 2C: Transferencias ⏳ EN PROGRESO
- [ ] 2.11 Backend: Transfer domain + use cases + controller
- [ ] 2.12 Frontend: Módulo transfers (origen → destino)
**Commit**: "feat(transfers): Add warehouse transfers"

#### 2D: Ajustes
- [ ] 2.13 Backend: Adjustment domain + use cases + controller
- [ ] 2.14 Frontend: Módulo adjustments (correcciones inventario)
**Commit**: "feat(adjustments): Add inventory adjustments"

#### 2E: Devoluciones
- [ ] 2.15 Backend: Return domain + use cases + controller
- [ ] 2.16 Frontend: Módulo returns (devoluciones clientes/proveedores)
**Commit**: "feat(returns): Add return management"

---

### Fase 3: Usuarios & Terceros
**Objetivo**: Gestión completa de usuarios, suppliers, customers

- [ ] 3.1 Backend: UserController completo (CRUD + avatar upload)
- [ ] 3.2 Backend: SupplierController (CRUD)
- [ ] 3.3 Backend: CustomerController (CRUD)
- [ ] 3.4 Frontend: Módulo users (admin panel)
- [ ] 3.5 Frontend: Módulo suppliers
- [ ] 3.6 Frontend: Módulo customers
**Commit**: "feat(users): Add user management and third parties"

---

### Fase 4: Dashboard & Reportes (Gate F)
**Objetivo**: Dashboard con métricas + exportación

- [ ] 4.1 Backend: DashboardController (métricas agregadas)
- [ ] 4.2 Backend: ExportController (CSV, XLSX, PDF)
- [ ] 4.3 Frontend: Dashboard principal con gráficos (Chart.js/Recharts)
- [ ] 4.4 Frontend: Funcionalidad export multi-formato
**Commit**: "feat(dashboard): Add dashboard and export functionality"

---

### Fase 5: Offline & Sync (Gate G)
**Objetivo**: PWA completo con sync offline

- [ ] 5.1 Frontend: IndexedDB para outbox local (Dexie.js)
- [ ] 5.2 Frontend: Service Worker mejorado (workbox)
- [ ] 5.3 Backend: SyncController (push/pull con cursor bigserial)
- [ ] 5.4 Frontend: UI estados (online/offline/syncing) con barra progreso
- [ ] 5.5 Frontend: Resolución de conflictos (last-write-wins + manual)
- [ ] 5.6 Frontend: QR/Link para acceso desde dispositivos móviles
**Commit**: "feat(offline): Add offline sync and PWA hardening"

---

### Fase 6: Polish & Portafolio (Gate Final)
**Objetivo**: Preparar para producción y portafolio

- [ ] 6.1 Tests: Unit tests backend (JUnit 5 + WebTestClient)
- [ ] 6.2 Tests: E2E frontend (Playwright)
- [ ] 6.3 Docker: Dockerfile multi-stage (backend + frontend)
- [ ] 6.4 Docker: docker-compose.yml (app + postgres + caddy)
- [ ] 6.5 README.md actualizado para portafolio
- [ ] 6.6 Documentación API (OpenAPI/Swagger)
- [ ] 6.7 Screenshots/GIFs demostrativos
- [ ] 6.8 Verificación final: build + docker + tests
**Commit**: "chore: Prepare for portfolio release"

---

## Decisiones Técnicas

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| Java | 21 LTS | Soporte hasta 2031, records, virtual threads |
| Spring Boot | 3.4.x | WebFlux nativo, R2DBC, última estable |
| Migraciones | Flyway JDBC | R2DBC no soporta DDL |
| Mappers | MapStruct | Compile-time, sin reflection |
| Costos | STANDARD default | WAC/FIFO como opcionales |
| Sync cursor | bigserial | Más eficiente que timestamps |
| PWA cache | NetworkFirst | Offline-first con fallback |
| pnpm | 9.x | Más rápido que npm/yarn |

---

## Errores Encontrados

| Error | Intento | Resolución | Fecha |
|-------|---------|------------|-------|
| Controllers llamaban repos directamente | 1 | Refactorizado a Use Cases | 2026-04-17 |
| Domain models mutables | 1 | Convertidos a inmutables | 2026-04-17 |
| Hooks >100 líneas | 1 | Refactorizado (usePurchases, useSales) | 2026-04-17 |
| Use cases recreados cada render | 1 | Singleton pattern fuera del hook | 2026-04-17 |

---

## Skills Aplicados

| Skill | Uso |
|-------|-----|
| hexagonal | Arquitectura frontend |
| clean-code | SRP, KISS, no over-engineering |
| react-best-practices | Hooks, performance |
| senior-backend | Patrones API (adaptado a Spring) |
| planning | Este plan |

---

## Verificación por Fase

Antes de marcar una fase como completada:
1. `mvn compile` (backend sin errores)
2. `pnpm build` (frontend sin errores)
3. Test manual funcionalidad
4. `git commit` con mensaje convencional
5. Actualizar este plan

---

## Próxima Acción

**Fase 2C: Transferencias entre almacenes**

Antes de implementar:
1. Cargar skills: hexagonal, clean-code, patterns, react-best-practices
2. Crear modelos de dominio Transfer, TransferLine
3. Auditar código antes de cada commit
4. Verificar que hooks < 100 líneas
