# Plan: Cierre de Brechas Administrativas — Auditoría v2

> Created: 2026-05-28 | Basado en auditoría vs `docs/contracts/`, `docs/design/`, `docs/plans/`

## Reglas de Ejecución

> ⚠️ Estas reglas consolidan CLAUDE.md, AGENTS.md, copilot-instructions.md y la auditoría del codebase. Son vinculantes para toda implementación en este plan.

- **Una fase a la vez**: ejecutar → verificar → preguntar al usuario si continuar
- **Commit por fase**: cada fase termina con `git add . && git commit -m '<tipo>(<scope>): <mensaje>'` siguiendo conventional commits
- **Skills por fase**: cargar la skill indicada al inicio de cada fase antes de tocar código
- **Verificación obligatoria**: `pnpm build` (frontend, turbopack) + `mvn test -q` (backend)
- **Cada fase usa máximo 3 sub-agentes en paralelo para acelerar ejecución** (ver AGENTS.md)
- **UI**: Español (labels, tooltips, errores). **Código**: Inglés
- **Arquitectura hexagonal**: `domain/` → `application/` → `adapters/` (domain NO depende de Spring/DB)
- **Frontend hexagonal**: `core/` → `infrastructure/` → `presentation/` (core NO depende de React/HTTP)
- **Mobile-first**: Touch targets ≥44px, responsive. Verificar: nuevos componentes interactivos deben usar `min-h-11` (44px) en Tailwind para botones, inputs y enlaces clickeables.
- **Tooltips obligatorios**: Todo botón de acción, campo de formulario y configuración en Settings debe tener tooltip. Usar `<TooltipHint>` de `@/presentation/shared/components/ui/tooltip` (inline icon, ya existe) o `<Tooltip>` (wrapper). Texto ≤ 2 líneas, en español, explicando propósito. Obligatorio en: botones de acción, inputs, selects, settings keys, iconos solos. Íconos solos SIEMPRE necesitan tooltip. ✅ `TooltipHint` ya existe en `tooltip.tsx` (verificado).
- **Tooltips por fase (Opción A)**: Cada fase frontend agrega tooltips a sus propios componentes al crearlos. NO esperar a B1. B1 solo se ocupa de: iconos de sección + botón copiar + auditoría de tooltips faltantes en componentes legacy. Sin esta regla, los componentes nuevos de A1-A6 quedan sin tooltip hasta B1.
- **Regla online/offline**: Cuando hay conexión, **todo read/write va directo al backend**. IndexedDB es cache de lectura + outbox de escritura offline. Al reconectarse, `SyncService` drena el outbox antes de permitir nuevos writes. Nunca leer de IndexedDB si el backend está disponible (excepto catálogos precargados como productos/categorías).
- **Offline-first absoluto**: La app NO debe hacer llamadas HTTP a servicios externos en runtime (Google Maps API, Nominatim, Mapbox, etc.). Mapas, geocodificación y catálogos geográficos son datos locales servidos por el backend o generados en build-time. La única conexión externa permitida es tiles.osm.org (cacheable) — pero se priorizan PMTiles servidos localmente.
- **Sin `any`** sin justificación explícita
- **Reactivo**: Todos los endpoints usan `Mono<T>` / `Flux<T>` (WebFlux + R2DBC)
- **DTOs**: `record` en `adapters/web/dto/<entity>/` (response) y `application/<entity>/dto/` (request)
- **Mappers**: MapStruct en `adapters/web/mapper/` o `adapters/persistence/mapper/`
- **Sin deprecated APIs/librerías/patrones** — verificar versiones estables antes de usar dependencias
- ⚠️ **Next.js 16 tiene breaking changes** — leer `node_modules/next/dist/docs/` antes de escribir código frontend. Heed deprecation notices.
- **ArchUnit** en backend para enforce automático de layer boundaries
- **CQRS en lectura**: Queries complejas (reports, export) pueden usar `DatabaseClient` directo en `application/usecase/query/` como trade-off aceptado (read model), pero debe documentarse. Comandos siempre usan ports.
- **Inyección**: Solo constructor injection. **Prohibido `@Autowired`** en fields
- **Errores de dominio**: Extender `DomainException` en `domain/errors/`. HTTP responses usan `application/problem+json`
- **`@Service` en `application/`**: Convención existente (55+ archivos) — NO se cambia. `@Component` solo para utils transversales sin lógica de negocio
- **Repositorios Spring Data**: 32/37 repos extienden `ReactiveCrudRepository` (no `R2dbcRepository`). Seguir este patrón para nuevos repos
- **Flyway + JDBC** para migraciones (no R2DBC). Numeración fija
- **Estado frontend**: TanStack Query (datos servidor) + Zustand (UI) — **NO Redux**, **NO React state para server data**
- **Tipado genérico**: Usar `GenericTable<T extends { id: string }>` existente con `Column<T>`, `TableAction<T>`, `BulkAction<T>`. No crear tablas ad-hoc
- **Prohibido `console.log()`** en producción. Usar logger wrapper si es necesario para debugging
- **Prohibido `catch(e) {}`** sin tipar — siempre tipar el error capturado
- **Componentes** max ~100 líneas; hooks max ~150 líneas
- **Import order**: external → core → infrastructure → presentation (dentro de cada grupo: interfaces → entities → use-cases → repos → components)
- **JWT HS256** (Access 15min, Refresh UUID hasheado 7 días), **bcrypt cost 12**, **RBAC**: ADMIN, MANAGER, SELLER
- **Middleware obligatorio** para todo endpoint protegido. **Prohibido comitear secrets/keys**
- **Frontend**: Vitest + React Testing Library, tests co-located (`*.test.ts`)
- **Backend**: JUnit 5 + Reactor Test + Spring Boot Test, tests en `src/test/java`
- **Patrón**: AAA (Arrange, Act, Assert)

**Convención de nombres:**

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos Java | PascalCase | `AuditLogRepository.java` |
| Archivos TS (entities/utils) | kebab-case | `audit-log.ts`, `system-setting.ts` |
| Archivos TS (repos/hooks/ports) | PascalCase | `AuditLogRepository.ts`, `useAuditLogsController.ts` |
| Componentes React | PascalCase | `AuditLogsView.tsx`, `SystemSettingRow.tsx` |
| Ports frontend | Prefijo `I` | `IAuditLogRepository.ts` |
| Hooks frontend | Prefijo `use` | `useAuditLogsController.ts` |
| Directorios módulos | kebab-case | `system-settings/`, `audit/` |

## Migraciones Flyway — Numeración Fija

> Última migration existente: **V14**. Las migraciones nuevas usan números fijos (NO renombrar):

| Fase | Migration | Propósito |
|------|-----------|-----------|
| **A1.7** | `V15__add_system_settings.sql` | Tabla `system_settings` (settings operativos) |
| **A3.1** | `V16__add_import_jobs.sql` | Tabla `import_jobs` (tracking de imports CSV) |
| **A1.6** | `V17__add_audit_log_archive.sql` | Tabla `audit_log_archive` (cold storage) |
| **A7.0** | `V18__add_device_cursors.sql` | Tabla `device_cursors` (tracking de sync cursors) |
| **A7.0** | `V19__add_sync_log_indices.sql` | Índices para sync_log (performance delta sync) |
| **B2.1** | `V20__add_permissions_icon.sql` | Columna `icon` en `permissions` (opcional — migrar a V20 si colisiona) |
| **B3.0** | `V21__add_geo_regions.sql` | Tabla `geo_regions` + seed Cuba (15 provincias, ~170 municipios) |
| **B3.1** | `V22__add_structured_address.sql` | Columnas de dirección estructurada en `suppliers` y `customers` |

**Regla de ejecución:** A1 siempre antes que A3 para mantener numeración estable. B1-B2 usan V20, B3 usa V21–V22 — no colisionan con A1–A7 (V15–V19). Verificar `SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1` (expected: 14) antes de crear V15.

---

## Auditoría — Brechas vs. Contratos

| Feature | Docs | Actual | Gap |
|---------|------|--------|-----|
| **Audit Logs** | `audit_log` en DB schema | **0 líneas código** | Sin controller, servicio, ni UI |
| **Reports** | Endpoints `/api/v1/reports/*` | **Backend no existe** | Frontend llama a 404 |
| **Import CSV** | Endpoints `/api/v1/imports/*` | **Backend no existe** | Frontend llama a 404 |
| **Export** | Endpoints `/api/v1/exports/*` | **Backend no existe** | Frontend llama a 404 |
| **POS CREDIT** | `CreditSaleUseCase` existe | **SaleController no lo llama** | Venta CREDIT no genera deuda |
| **POS RESERVE** | `ReserveSaleUseCase` existe | **SaleController no lo llama** | Venta RESERVE no reserva stock |
| **Debts listAll** | Filtro por status opcional | **Sin status → solo overdue** | Bug: no muestra todas las deudas |
| **Notif. Preferences UI** | Backend + API listos | **Sin componente UI** | Usuario no puede configurar |
| **Offline IndexedDB** | `db.ts`, `outbox.ts`, `SyncService` | **100% comentados** | Sin persistencia offline |
| **Service Worker** | Cache API + bg sync | **Solo assets estáticos** | Sin cache de datos |
| **`notifications.api.ts`** | — | **Código duplicado** | Código activo (12+ imports) — no eliminar, consolidar en A6.2 |

---

## Progreso

| Fase | Estado |
|------|--------|
| **A0** — Auditoría | ✅ Hecho |
| **A1** — Backend: Audit Logs (ver + escribir) | ✅ Hecho |
| **A2+A4** — Backend: Reports + Export (fusionadas) | ✅ Hecho |
| **A3** — Backend: Import CSV | ✅ Hecho |
| **A5** — Fix POS: CREDIT/RESERVE wiring + Debts bug | ✅ Hecho |
| **A6** — Frontend: Notification Preferences UI | ✅ Hecho |
| **A7** — Offline: IndexedDB + SW + Sync | ✅ Hecho |
| **A8** — Housekeeping | ✅ Hecho |
| **B1** — Tooltips: Iconos + Copiar + Auditoría | ✅ Hecho |
| **B2** — Permisos: Iconos por Sección + Validación en UI | ✅ Hecho |
|   **B2.1** — permission-categories.ts config file | ✅ Hecho |
|   **B2.2** — PermissionGroupSelector rewrite con iconos | ✅ Hecho |
|   **B2.3** — usePermission() hook + `<Can>` component | ✅ Hecho |
|   **B2.4** — Route guards (permission-routes.ts + DashboardLayout) | ✅ Hecho |
|   **B2.5** — Sidebar filtering (navigation.config.ts + DashboardLayout) | ✅ Hecho |
|   **B2.6** — Backend: V20 migration + seed + @PreAuthorize granular | ✅ Hecho |
| **B3** — Dirección Estructurada (Provincia/Municipio/Calle) | ✅ Hecho |
|   **B3.0** — V21 geo_regions + V22 structured address SQL | ✅ Hecho |
|   **B3.1** — Backend: GeoRegion domain + port + useCase + controller | ✅ Hecho |
|   **B3.2** — Backend: Supplier/Customer DTOs + entities + mappers | ✅ Hecho |
|   **B3.3** — Frontend: GeoRegion entity + port + repository + hooks | ✅ Hecho |
|   **B3.4** — Frontend: Supplier/Customer structured address forms | ✅ Hecho |
| **B4** — UX Formularios: Pre-llenado + Crear y Continuar | ✅ Hecho |
|   **B4.1** — Auto-select-all al focus (useAutoSelect hook + Input.autoSelect prop) | ✅ Hecho |
|   **B4.2** — Pre-llenado inteligente (ProductCreateView ?prefillFrom=, PurchaseFormFields ?supplierId=) | ✅ Hecho |
|   **B4.3** — Botón "Crear y Continuar" (Product, Supplier, Customer, Category, Purchase, User) | ✅ Hecho |
| **B5** — Gráficos + Estadísticas + Métricas Dashboard | ⏳ Parcial |
|   **B5.1** — Backend: DTOs + Use Cases + Controller (5 endpoints: sales-timeline, top-products, top-customers, profit-summary, inventory-value) | ✅ Hecho |
|   **B5.2** — Frontend: Core entities + IDashboardMetricsRepository + DashboardMetricsRepository + useDashboardMetrics hook | ✅ Hecho |
|   **B5.3** — Frontend: Chart components (SalesTimelineChart, TopProductsChart, TopCustomersChart, ProfitSummaryCards) | ✅ Hecho |
|   **B5.4** — Dashboard redesign: TanStack Query + chart integration + fix DashboardRepository | ⏳ Pendiente |
|   **B5.5** — Custom chart builder (ChartBuilderModal, CustomChartWidget, useDashboardLayout) | ⏳ Pendiente |
| **B6** — Imagen de Perfil de Usuario | ⏳ Pendiente |
| **B7** — Resolución Conflictos Offline (Outbox Collapsing) | ⏳ Pendiente |
| **B8** — Mapas Offline (Leaflet + PMTiles + FlexSearch) | ⏳ Pendiente |
| **B9** — Compartir Ubicación (Deep Links sin API externa) | ⏳ Pendiente |

---

## Fase A1 — Audit Logs (Backend + Frontend)

> ⚠️ **Prerrequisito — Caffeine + Cache**: `SystemSettingsService` (A1.7) y `AuditLogRetentionService` (A1.6) requieren `spring-boot-starter-cache` + `caffeine` en `pom.xml` y `@EnableCaching` + `@EnableScheduling` en `bootstrap/InventoryApplication.java`. **No ejecutar A1 sin estos prerrequisitos** — los servicios fallarán silenciosamente al arrancar:
> ```xml
> <dependency>
>     <groupId>org.springframework.boot</groupId>
>     <artifactId>spring-boot-starter-cache</artifactId>
> </dependency>
> <dependency>
>     <groupId>com.github.ben-manes.caffeine</groupId>
>     <artifactId>caffeine</artifactId>
> </dependency>
> ```
> Ambos se agregan en el **primer commit de A1**, antes de cualquier migration o servicio.

> ⚠️ **Corrección de path**: `InventoryApplication.java` está en `com.inventory.bootstrap.InventoryApplication` (NO `com.inventory.InventoryApplication`). Todas las referencias en este plan deben usar `bootstrap/InventoryApplication.java`.

> **Skills**: `domain-driven-design`, `hexagonal-architecture`, `spring-data-jpa`, `senior-fullstack`
> **Objetivo**: Implementar sistema de auditoría completo — ver y registrar cambios en operaciones clave.
> **Estado actual**: Tabla `audit_log` existe en V1 (`id, actor_id, actor_name, entity_type, entity_id, action, before_data, after_data, ip_address, created_at`). `audit_log_details` existe en V4. **0 líneas de código** Java/TypeScript. No hay entidad de dominio, ni port, ni use case, ni controller, ni frontend.
> **Ya existe**: Tablas DB (V1+V4). Resto por crear.

### A1.1 — Domain Entity + Port

> ⚠️ **Patrón existente en el codebase**: Los 32 ports en `domain/ports/out/` incluyen TANTO lectura como escritura. La recomendación de "port solo save(), queries van al adapter directo" NO es el patrón de este proyecto. Ver: `ProductRepository.java` tiene `findAll()`, `findByCategory()`, `search()` (reads) y `save()`, `deleteById()` (writes). **`AuditLogRepository` sigue el mismo patrón: expone búsqueda paginada además de escritura.**

**Files to Create:**
- `backend/inventory-app/src/main/java/com/inventory/domain/model/audit/AuditLog.java`
- `backend/inventory-app/src/main/java/com/inventory/domain/ports/out/AuditLogRepository.java`

```java
// backend/.../domain/model/audit/AuditLog.java
// ⚠️ actorName NO está en el domain model. Se resuelve en la capa de consulta
// (adapters/web/dto/audit/AuditLogResponse.java) mediante JOIN con users(actor_id → display_name).
// Esto evita inyectar UserQueryPort en 6 use cases de escritura.
public class AuditLog {
    private final UUID id;
    private final UUID actorId;      // FK a users(id) — el name se resuelve en DTO via JOIN
    private final String entityType;
    private final UUID entityId;
    private final String action;
    private final String beforeData;  // JSON
    private final String afterData;   // JSON
    private final String ipAddress;
    private final Instant createdAt;

    public static AuditLog create(UUID actorId, String entityType,  // sin actorName
        UUID entityId, String action, String beforeData, String afterData, String ipAddress) { ... }
}

// ⚠️ **Read model para queries**: `AuditLog` (domain) no tiene `actorName` porque escribirlo
// requeriría inyectar UserQueryPort en 6 use cases. Para LEER, el adapter resuelve
// `actorName` via JOIN con users.display_name. El port expone `AuditLogSearchItem`
// (read model con actorName) para las queries, y `AuditLog` (domain) para save().
// Este dual-type es necesario porque el codebase no tiene un patrón de enriquecimiento
// post-query (verificado: ProductRepository.search() retorna Product directamente).
// Como la auditoría necesita cross-table JOIN, el read model es la solución idiomática.

// backend/.../domain/ports/out/AuditLogSearchItem.java
// Read model con actorName resuelto — SOLO para queries de lectura.
// Definido en domain/ports/out/ porque es contrato del port, no implementación.
public record AuditLogSearchItem(
    UUID id,
    UUID actorId,
    String actorName,      // resuelto via JOIN con users.display_name
    String entityType,
    UUID entityId,
    String action,
    String beforeData,
    String afterData,
    String ipAddress,
    Instant createdAt
) {}

// backend/.../domain/ports/out/AuditLogRepository.java
// ⚠️ Incluye BOTH read y write (patrón del codebase, ver ProductRepository).
// Write usa `AuditLog` (domain). Read usa `AuditLogSearchItem` (read model con actorName).
public interface AuditLogRepository {
    // Write — usa AuditLog (domain model, sin actorName)
    Mono<Void> save(AuditLog log);

    // Read — retorna AuditLogSearchItem (incluye actorName del JOIN)
    Flux<AuditLogSearchItem> search(AuditLogSearchCriteria criteria);
    Mono<Long> countSearch(AuditLogSearchCriteria criteria);
    Mono<AuditLogSearchItem> findById(UUID id);

    // Read — by entity (detail views)
    Flux<AuditLogSearchItem> findByEntity(String entityType, UUID entityId);
}
```

### A1.2 — Persistence Layer

> ⚠️ **`audit_log` tiene columna `actor_name` (TEXT, agregada en V4 via ALTER TABLE), pero el domain `AuditLog` NO la incluye**. Es una columna legacy que queda siempre NULL. Los N+1 use cases de escritura (A1.4) no necesitan el nombre del actor — solo el `actor_id`. El `actorName` se resuelve en **lectura** mediante JOIN con `users(display_name)`. **No modificar la tabla V1/V4** — la columna se ignora.

**Files to Create:**
- `backend/.../adapters/persistence/entity/AuditLogEntity.java` — R2DBC `@Table("audit_log")`
- `backend/.../adapters/persistence/adapter/AuditLogRepositoryAdapter.java`
- `backend/.../adapters/persistence/mapper/AuditLogMapper.java` (MapStruct)
- `backend/.../adapters/persistence/spring/SpringDataAuditLogRepository.java`

**⚠️ `SpringDataAuditLogRepository` — @Query con JOIN para resolver actorName:**
> ⚠️ **Convención del codebase:** 32/37 repos existentes extienden `ReactiveCrudRepository` (no `R2dbcRepository`). Solo 5 usan `R2dbcRepository` (que agrega `ReactiveSortingRepository`). Para `audit_log`, usar `ReactiveCrudRepository` que es suficiente. Los `@Query` methods reemplazan sorting.
```java
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface SpringDataAuditLogRepository
    extends ReactiveCrudRepository<AuditLogEntity, UUID> {

    // ⚠️ Named params (:actorId, :entityType) funcionan en @Query R2DBC.
    // El JOIN con users(display_name) resuelve actorName sin tocar el domain model.
    @Query("""
        SELECT al.id, al.actor_id, u.display_name AS actor_name,
               al.entity_type, al.entity_id, al.action,
               al.before_data, al.after_data, al.ip_address, al.created_at
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE (:entityType IS NULL OR al.entity_type = :entityType)
          AND (:actorId IS NULL OR al.actor_id = CAST(:actorId AS uuid))
          AND (:action IS NULL OR al.action = :action)
          AND (:fromDate IS NULL OR al.created_at >= :fromDate)
          AND (:toDate IS NULL OR al.created_at <= :toDate)
        ORDER BY al.created_at DESC
        LIMIT :size OFFSET :offset
        """)
    Flux<AuditLogEntity> search(
        String entityType, String actorId, String action,
        Instant fromDate, Instant toDate, int size, int offset);

    @Query("""
        SELECT COUNT(*) FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE (:entityType IS NULL OR al.entity_type = :entityType)
          AND (:actorId IS NULL OR al.actor_id = CAST(:actorId AS uuid))
          AND (:action IS NULL OR al.action = :action)
          AND (:fromDate IS NULL OR al.created_at >= :fromDate)
          AND (:toDate IS NULL OR al.created_at <= :toDate)
        """)
    Mono<Long> countSearch(
        String entityType, String actorId, String action,
        Instant fromDate, Instant toDate);

    @Query("""
        SELECT al.id, al.actor_id, u.display_name AS actor_name,
               al.entity_type, al.entity_id, al.action,
               al.before_data, al.after_data, al.ip_address, al.created_at
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE al.id = :id
        """)
    Mono<AuditLogEntity> findByIdWithActorName(UUID id);

    @Query("""
        SELECT al.id, al.actor_id, u.display_name AS actor_name,
               al.entity_type, al.entity_id, al.action,
               al.before_data, al.after_data, al.ip_address, al.created_at
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE al.entity_type = :entityType AND al.entity_id = :entityId
        ORDER BY al.created_at DESC
        """)
    Flux<AuditLogEntity> findByEntity(String entityType, UUID entityId);
}
```

**⚠️ `AuditLogMapper` — dos direcciones:**
- `AuditLogEntity → AuditLogSearchItem` (lectura: incluye `actorName` del JOIN)
- `AuditLog → AuditLogEntity` (escritura: `actorName` se settea como null)

`AuditLogEntity` DEBE incluir `actorName` (`@Column("actor_name")`) porque el JOIN lo puebla. MapStruct mapea `entity.actorName → searchItem.actorName` en lectura, y en escritura el campo queda null.

**⚠️ R2DBC null-binding para `@Query`:** En `search()` y `countSearch()`, parámetros opcionales pueden ser `null`. En R2DBC v1.0+, el bind de `null` para `UUID` puede fallar (driver no infiere tipo). **Solución aplicada en el código:** los parámetros `actorId` se declaran como `String` en `search(String actorId, ...)` y la query usa `CAST(:actorId AS uuid)`. El adapter convierte `UUID → String` antes de llamar:

```java
// En AuditLogRepositoryAdapter (implementa el port):
public Flux<AuditLogSearchItem> search(AuditLogSearchCriteria criteria) {
    return springRepo.search(
        criteria.entityType(),
        criteria.actorId() != null ? criteria.actorId().toString() : null, // String en vez de UUID
        criteria.action(),
        criteria.fromDate(),
        criteria.toDate(),
        criteria.size(),
        criteria.size() * criteria.page()
    ).map(mapper::toSearchItem); // mapper: AuditLogEntity → AuditLogSearchItem
}
```

El resto de parámetros (`UUID entityId` en `findByEntity`) no son nulos — siempre tienen valor en los endpoints de detalle.

### A1.3 — Query Use Case + Controller

> ⚠️ **Solo AuditLogQueryUseCase**. NO existe `AuditLogCommandUseCase`. La escritura de audit logs es inline via A1.4 (inyección directa de `AuditLogRepository` en los 6 command use cases). No hay un use case separado para "crear audit log" — sería una abstracción innecesaria.

> ⚠️ **`AuditLogSearchCriteria` en `domain/ports/out/` (mismo paquete que `AuditLogRepository`)**: El port `AuditLogRepository` (en `domain/ports/out/`) recibe `AuditLogSearchCriteria` como parámetro en `search()` y `countSearch()`. Si el criteria estuviera en `application/`, `domain/` dependería de `application/` — violación hexagonal directa. Si estuviera en `domain/ports/in/`, violaría la convención: `ports/in/` es para interfaces de entrada (use cases), `ports/out/` para interfaces de salida (repositorios). `AuditLogSearchCriteria` es un parámetro de un port de salida — debe cohabitar con él en `domain/ports/out/`. `AuditLogSearchItem` (read model del mismo port) ya está ahí.

**Files to Create:**
- `backend/.../domain/ports/out/AuditLogSearchCriteria.java` — DTO de búsqueda en dominio (mismo paquete que `AuditLogRepository` que lo recibe)
- `backend/.../application/usecase/query/audit/AuditLogQueryUseCase.java`
- `backend/.../adapters/web/controller/audit/AuditLogController.java`
- `backend/.../adapters/web/dto/audit/AuditLogResponse.java`

```java
// domain/ports/out/AuditLogSearchCriteria.java
// ⚠️ Ubicado en domain/ports/out/ porque AuditLogRepository (en el mismo paquete)
// lo recibe como parámetro en search() y countSearch(). Si estuviera en application/,
// domain/ dependería de application/ — violación hexagonal.
// Co-location con el port que lo recibe: mismo patrón que AuditLogSearchItem (ya en domain/ports/out/).
public record AuditLogSearchCriteria(
    String entityType,
    UUID actorId,
    String action,
    Instant fromDate,
    Instant toDate,
    int page,
    int size
) {}
```

> ⚠️ **actorName enrichment chain** (verificada contra codebase — ProductRepository no hace cross-table JOIN, así que este patrón es nuevo pero necesario):
> ```
> SpringDataRepo.@Query JOIN (audit_log + users)
>   → AuditLogEntity (con actorName del LEFT JOIN)
>     → AuditLogMapper.toSearchItem()
>       → AuditLogSearchItem (read model del port, con actorName)
>         → AuditLogQueryUseCase lo recibe del port
>           → Controller lo mapea a AuditLogResponse
> ```
> El domain `AuditLog` NO tiene `actorName`. El read model `AuditLogSearchItem` SÍ lo tiene. Esto evita inyectar `UserQueryPort` en los 6 use cases de escritura.

> **TODO — ipAddress real**: Actualmente los use cases pasan `null` para `ipAddress`. Para auditoría de seguridad real, el controller debe extraer la IP real del request HTTP:
> ```java
> String ip = request.getRemoteAddress() != null
>     ? request.getRemoteAddress().getAddress().getHostAddress()
>     : null;
> ```
> Y pasarla al use case. Es YAGNI ahora — agregar cuando se requiera auditoría de acceso.

Endpoints:
```
GET /api/v1/audit-logs?entityType=&actorId=&action=&fromDate=&toDate=&page=&size=
GET /api/v1/audit-logs/{id}
GET /api/v1/audit-logs/entity/{entityType}/{entityId}
```

### A1.4 — Inyectar AuditLogRepository en 6 use cases existentes

> ⚠️ **`AuditLogCommandUseCase` NO existe ni se crea.** La escritura de audit logs se hace por inyección directa de `AuditLogRepository` en los 6 use cases command existentes (ver abajo). No hay un use case separado para "crear audit log" — sería una abstracción innecesaria (cada CREATE/UPDATE/DELETE escribe su propio log inline). Si en el futuro se requiere escritura batch o cross-entity, se puede crear entonces. Por ahora, KISS.

**Estado actual de cada use case (constructores):**

| Use Case | Path actual | Constructor actual | Nuevo constructor |
|----------|-------------|-------------------|-------------------|
| `ProductCommandUseCase` | `application/usecase/command/product/ProductCommandUseCase.java` | `(ProductRepository, CategoryRepository)` | `(..., AuditLogRepository)` |
| `SaleCommandUseCase` | `application/usecase/command/sale/SaleCommandUseCase.java` | `(SaleRepository, StockRepository, MovementRepository)` | `(..., AuditLogRepository)` |
| `PurchaseCommandUseCase` | `application/usecase/command/purchase/PurchaseCommandUseCase.java` | `(PurchaseRepository, StockRepository, MovementRepository)` | `(..., AuditLogRepository)` |
| `CategoryCommandUseCase` | `application/usecase/command/category/CategoryCommandUseCase.java` | `(CategoryRepository)` | `(..., AuditLogRepository)` |
| `CustomerCommandUseCase` | `application/usecase/command/customer/CustomerCommandUseCase.java` | `(CustomerRepository)` | `(..., AuditLogRepository)` |
| `SupplierCommandUseCase` | `application/usecase/command/supplier/SupplierCommandUseCase.java` | `(SupplierRepository)` | `(..., AuditLogRepository)` |

**Patrón de escritura (ejemplo en ProductCommandUseCase):**
```java
public Mono<Product> create(CreateProductCommand cmd, UUID userId) {
    return productRepository.save(product)
        .flatMap(saved -> auditLogRepository.save(AuditLog.create(
            userId,
            "PRODUCT",
            saved.getId(),
            "CREATE",
            null,                                  // beforeData: CREATE no tiene
            auditSerializer.toJsonTruncated(saved), // afterData truncado a 8KB
            null
        )).thenReturn(saved));
}

public Mono<Product> update(UpdateProductCommand cmd, UUID userId) {
    return productRepository.findById(cmd.id())
        .flatMap(existing -> productRepository.update(cmd)
            .flatMap(updated -> auditLogRepository.save(AuditLog.create(
                userId,
                "PRODUCT",
                updated.getId(),
                "UPDATE",
                auditSerializer.toJsonTruncated(existing),  // beforeData truncado
                auditSerializer.toJsonTruncated(updated),   // afterData truncado
                null
            )).thenReturn(updated)));
}
```

> **Ambos campos JSON se truncan**: `beforeData` y `afterData` usan `toJsonTruncated()`. En un UPDATE, serializar dos objetos puede duplicar el tamaño del registro. El truncado en ambos fields mantiene cada fila ≤16KB total.

**DELETE también captura beforeData** — debe leerse la entidad ANTES de borrar:
```java
public Mono<Void> delete(UUID id, UUID userId) {
    return productRepository.findById(id)
        .flatMap(existing -> productRepository.delete(id)
            .then(auditLogRepository.save(AuditLog.create(
                userId, "PRODUCT", id, "DELETE",
                auditSerializer.toJsonTruncated(existing),  // beforeData: estado previo a borrar
                null,                                        // afterData: DELETE no tiene
                null
            ))).then());
}
```

> 🔴 **Decisión explícita sobre fallo de auditoría**: Si `auditLogRepository.save(...)` falla (BD down, constraint), **la operación de negocio también falla**. Esto es intencional — la auditoría es un requisito legal, no opcional. Si en el futuro se requiere tolerancia, migrar a:
> ```java
> .flatMap(saved -> auditLogRepository.save(...)
>     .onErrorResume(e -> {
>         log.warn("Audit log falló para {}", saved.getId(), e);
>         return Mono.empty();
>     })
>     .thenReturn(saved));
> ```
> Por ahora, el `.flatMap` encadenado propaga el error automáticamente: si auditLogRepository.save() falla, el Mono completo falla, y el controller retorna 500. Esto es el comportamiento deseado (fail-fast en auditoría). **No cambiar sin discusión del equipo.**
> 
> **⚠️ Confirmación de `extractUserId()`**: Los 6 use cases reciben `UUID userId` del controller. En `SaleController.java` ya existe `extractUserId(UserDetails user)` (line 131). Los demás controllers (Product, Purchase, Category, Customer, Supplier) deben implementar este mismo patrón si no lo tienen:
> ```java
> private UUID extractUserId(UserDetails user) {
>     if (user instanceof com.inventory.adapters.auth.CustomUserDetails custom) {
>         return custom.getId();
>     }
>     throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
> }
> ```
> Verificar cada controller existente y agregar donde falte.

#### A1.5 — AuditSerializer (shared utility)

> ✅ **Decisión confirmada — interfaz en `application/`, impl en `adapters/`**:
> - `application/shared/AuditSerializer.java` — **INTERFAZ** (sin Spring, sin dependencias a infraestructura)
> - `adapters/web/shared/AuditSerializerImpl.java` — **IMPLEMENTACIÓN** con `@Component` + `ObjectMapper` (Spring Boot)
> 
> Los 6 use cases command (A1.4) **inyectan la interfaz** `AuditSerializer`, que está en la misma capa `application/`. Spring encuentra el bean `AuditSerializerImpl` (en `adapters/`) por type matching. Esto respeta la regla hexagonal: `application/` NO importa de `adapters/`. La única dirección de dependencia es `adapters/` → `application/` (implementa interfaz definida en application).

**Files to Create:**
- `backend/.../application/shared/AuditSerializer.java` — interfaz
- `backend/.../adapters/web/shared/AuditSerializerImpl.java` — implementación

```java
// backend/.../application/shared/AuditSerializer.java — INTERFAZ (sin Spring)
package com.inventory.application.shared;

public interface AuditSerializer {
    String toJson(Object obj);
    String toJsonTruncated(Object obj);
}
```

```java
// backend/.../adapters/web/shared/AuditSerializerImpl.java — IMPLEMENTACIÓN (con Spring)
package com.inventory.adapters.web.shared;

@Component
public class AuditSerializerImpl implements AuditSerializer {
    private final ObjectMapper objectMapper; // Spring Boot auto-provee
    private static final int MAX_BYTES = 8_192; // 8KB máx por field JSON

    public AuditSerializerImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    /**
     * Serializa con límite de tamaño. Venta con 50 líneas puede generar
     * 20-30KB JSON. Truncar el string JSON a mitad rompe la validez del JSON
     * y el frontend no podrá parsearlo (causa JSONException).
     *
     * ⚠️ Solución: truncar ANTES de serializar — limitar la cantidad de campos
     * del objeto original en vez de truncar el JSON resultante.
     * Usar Jackson's JsonGenerator.Feature.MAX_SIZE o limitar manualmente
     * los campos del DTO antes de serializar.
     *
     * Para entidades con listas (ej: Sale con 50+ líneas), serializar solo
     * los primeros N items de la colección y agregar "_truncated: true".
     * Así el frontend sabe que el JSON está incompleto y muestra un indicador
     * visual en el diff viewer.
     */
    @Override
    public String toJsonTruncated(Object obj) {
        // Truncar colecciones grandes antes de serializar
        Object truncated = truncateCollections(obj, MAX_BYTES / 1024);
        String json = toJson(truncated);
        // Verificación de seguridad: si aún excede (pocos objetos grandes),
        // serializar como {"_truncated":true,"_size":N}
        if (json.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            return "{\"_truncated\":true,\"_size\":" + json.length() + "}";
        }
        return json;
    }

    private Object truncateCollections(Object obj, int maxFields) {
        if (obj == null) return null;
        if (obj instanceof Collection<?> col) {
            return col.stream().limit(maxFields).toList();
        }
        // Para objetos con propiedades lista, truncar cada lista
        if (obj.getClass().getName().startsWith("com.inventory")) {
            try {
                var node = objectMapper.valueToTree(obj);
                node.fieldNames().forEachRemaining(f -> {
                    var v = node.get(f);
                    if (v != null && v.isArray() && v.size() > maxFields) {
                        var arr = objectMapper.createArrayNode();
                        for (int i = 0; i < maxFields; i++) arr.add(v.get(i));
                        node.set(f, arr);
                    }
                });
                return node;
            } catch (Exception e) {
                return obj;
            }
        }
        return obj;
    }
}
```

**Injectar `AuditSerializer` en los 6 use cases de A1.4** (además de `AuditLogRepository`). Reemplazar `toJson(saved)` inline (que asume un método estático o utilidad inexistente) por `auditSerializer.toJsonTruncated(saved)` para limitar tamaño JSON a 8KB:
```java
// En ProductCommandUseCase.create():
    .flatMap(saved -> auditLogRepository.save(AuditLog.create(
        userId, "PRODUCT", saved.getId(), "CREATE",
        null, auditSerializer.toJsonTruncated(saved), null
    )).thenReturn(saved));
```

> ⚠️ **@Scheduling + WebFlux**: Spring `@Scheduled` no soporta `Mono<Void>` nativamente. El `Mono` no se ejecuta. **Solución**: método retorna `void` y llama `.subscribe()` al final de la cadena reactiva. Ver [SPR-17167](https://github.com/spring-projects/spring-framework/issues/25098).
>
> ⚠️ **@EnableScheduling requerido**: Agregar a la clase principal de la aplicación (`bootstrap/InventoryApplication.java`):
> ```java
> @SpringBootApplication
> @EnableScheduling
> @ComponentScan(basePackages = "com.inventory")
> public class InventoryApplication { ... }
> ```
> Sin esta anotación, `@Scheduled` se ignora silenciosamente.

#### A1.6 — Retención de audit_log

> `audit_log` crece ~110k filas/año con `before_data`/`after_data` JSONB (~2-3KB c/u).

**Migration V17 — `audit_log_archive` (crear):**
```sql
CREATE TABLE audit_log_archive (LIKE audit_log INCLUDING ALL);
CREATE INDEX idx_audit_log_archive_created_at ON audit_log_archive(created_at);
CREATE INDEX idx_audit_log_archive_entity ON audit_log_archive(entity_type, entity_id);
```

**Regla configurable — defaults en `application.yml`, runtime en `system_settings` (A1.7):**
```yaml
audit:
  retention-days-hot: 90      # audit_log activo (queries rápidas)
  retention-days-archive: 365 # audit_log_archive (cold storage, solo auditoría legal)
```

**Estrategia de archivado:**
- **≤90 días**: datos en `audit_log` — tabla caliente, índices activos
- **90-365 días**: migrar a `audit_log_archive` (tabla fría)
- **>1 año**: exportar CSV y eliminar

**File to Create:**
- `application/service/AuditLogRetentionService.java`

```java
@Service
public class AuditLogRetentionService {
    private final SystemSettingsService settings; // lee de system_settings (A1.7), no de @Value
    private final DatabaseClient db;              // R2DBC — named params no soportados en raw SQL

    public AuditLogRetentionService(SystemSettingsService settings, DatabaseClient db) {
        this.settings = settings;
        this.db = db;
    }

    @Scheduled(cron = "0 3 * * 0") // Domingos 3am
    public void archiveOldLogs() {
        settings.getInt("audit.retention-days-hot", 90)
            .flatMap(days -> archiveInBatches(Instant.now().minus(days, ChronoUnit.DAYS)))
            .subscribe();
    }

    /**
     * Batch SQL con límite por lote (recomendada):
     * Procesa en lotes de 10,000 para evitar bloqueo prolongado de la tabla.
     * Se repite hasta que no queden filas por archivar.
     * ⚠️ R2DBC no soporta `:named` params en raw SQL. Usar DatabaseClient con $1 posicional.
     * ⚠️ Usar expand() en lugar de recursión flatMap para evitar assembly recursivo.
     * Con flatMap anidado, Reactor emite warnings con ciertos schedulers y puede
     * fallar con millones de filas (>100 iteraciones). expand() usa trampolín.
     */
    private Mono<Void> archiveInBatches(Instant cutoff) {
        return Mono.just(1L)
            .expand(__ -> archiveBatch(cutoff))
            .takeWhile(rows -> rows > 0L)
            .then();
    }

    /**
     * ⚠️ Eliminar de audit_log_archive registros >365 días (o configurado).
     * Ejecuta en lote para no bloquear la tabla fría por mucho tiempo.
     * Sin manejo de errores por lote, un único fallo detiene todo el archive chain.
     */
    @Scheduled(cron = "0 4 * * 0") // Domingos 4am (1h después de archive)
    public void deleteOldArchive() {
        settings.getInt("audit.retention-days-archive", 365)
            .flatMap(days -> deleteArchiveInBatches(Instant.now().minus(days, ChronoUnit.DAYS)))
            .subscribe();
    }

    /**
     * ⚠️ Manejo de errores por lote: cada archiveBatch tiene onErrorResume
     * que loggea el error y continúa con el siguiente lote en vez de abortar todo.
     * Sin esto, un timeout de BD a las 3:05am aborta el archive completo y
     * los logs se quedan en audit_log por una semana más.
     */
    private Mono<Long> archiveBatch(Instant cutoff) {
        return db.sql("""
            WITH deleted AS (
                DELETE FROM audit_log
                WHERE id IN (
                    SELECT id FROM audit_log
                    WHERE created_at < $1
                    LIMIT 10000
                )
                RETURNING *
            )
            INSERT INTO audit_log_archive SELECT * FROM deleted
            """)
            .bind(0, cutoff)
            .fetch()
            .rowsUpdated()
            .onErrorResume(e -> {
                log.error("Batch archive falló en cutoff={}", cutoff, e);
                return Mono.just(0L); // continuar con el siguiente lote
            });
    }

    private Mono<Void> deleteArchiveInBatches(Instant cutoff) {
        return Mono.just(1L)
            .expand(__ -> deleteArchiveBatch(cutoff))
            .takeWhile(rows -> rows > 0L)
            .then();
    }

    private Mono<Long> deleteArchiveBatch(Instant cutoff) {
        return db.sql("""
            DELETE FROM audit_log_archive
            WHERE id IN (
                SELECT id FROM audit_log_archive
                WHERE created_at < $1
                LIMIT 10000
            )
            """)
            .bind(0, cutoff)
            .fetch()
            .rowsUpdated()
            .onErrorResume(e -> {
                log.error("Batch delete archive falló en cutoff={}", cutoff, e);
                return Mono.just(0L);
            });
    }
}
```

#### A1.7 — System Settings (Configuración Operativa)

> Todo parámetro configurable debe ser visible y editable por el admin desde la UI (SettingsView), no solo en `application.yml`. El YAML solo contiene defaults de arranque. La tabla `system_settings` es la fuente de verdad en runtime.

**Migration — V15__add_system_settings.sql (se ejecuta PRIMERO, antes que import_jobs y audit_log_archive):**
```sql
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'string', -- 'integer' | 'boolean' | 'string' | 'cron'
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,         -- true → frontend puede leer sin auth
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores por defecto (sobrescribibles desde UI de Settings)
INSERT INTO system_settings (key, value, value_type, is_public, description) VALUES
  ('audit.retention-days-hot',     '90',   'integer', false, 'Días de retención en tabla caliente de auditoría'),
  ('audit.retention-days-archive', '365',  'integer', false, 'Días totales antes de eliminar logs de auditoría'),
  ('import.retention-days',        '7',    'integer', false, 'Días de retención de resultados de importación'),
  ('sync.outbox-limit',            '500',  'integer', false, 'Máximo de operaciones offline en cola'),
  ('sync.retention-days',          '30',   'integer', false, 'Días de retención del historial de sincronización'),
  ('sync.pull-interval-seconds',   '30',   'integer', true,  'Intervalo de pull de cambios en segundos');
```

**Files to Create:**
- `backend/.../application/service/SystemSettingsService.java`
- `backend/.../adapters/persistence/adapter/SystemSettingsRepositoryAdapter.java`
- `backend/.../adapters/web/controller/settings/SystemSettingsController.java`
- `backend/.../adapters/web/dto/settings/SystemSettingResponse.java`

**`SystemSettingResponse`:**
```java
import java.time.Instant;

public record SystemSettingResponse(
    String key,
    String value,
    String valueType,    // 'integer' | 'boolean' | 'string' | 'cron'
    String description,
    boolean isPublic,
    Instant updatedAt
) {}
```

```java
@Service
public class SystemSettingsService {
    private final CacheManager cacheManager;
    private final SystemSettingsRepository repository; // R2DBC adapter

    public SystemSettingsService(CacheManager cacheManager, SystemSettingsRepository repository) {
        this.cacheManager = cacheManager;
        this.repository = repository;
    }

    /**
     * ⚠️ Cache manual (NO @Cacheable). Spring @Cacheable cachea el Mono<> (wrapper),
     * no el valor Integer. Con R2DBC, el Mono se recrea en cada llamada — el cache
     * retorna un Mono ya completado pero sin el valor real.
     */
    public Mono<Integer> getInt(String key, int defaultValue) {
        Cache cache = cacheManager.getCache("system-settings");
        Integer cached = cache != null ? cache.get(key, Integer.class) : null;
        if (cached != null) return Mono.just(cached);
        return repository.findByKey(key)
            .map(s -> Integer.parseInt(s.value()))
            .defaultIfEmpty(defaultValue)
            .doOnNext(v -> { if (cache != null) cache.put(key, v); });
    }

    public Mono<Void> update(String key, String value, UUID updatedBy) { ... }
    /**
     * ⚠️ Flux<SystemSettingResponse> en lugar de Mono<Map<String, String>>.
     * El frontend necesita streaming con metadatos: key, value, value_type,
     * description, is_public, updated_at. Map<String,String> pierde tipo y descripción.
     */
    public Flux<SystemSettingResponse> getAll() {
        return repository.findAll()
            .map(s -> new SystemSettingResponse(
                s.key(), s.value(), s.valueType(),
                s.description(), s.isPublic(), s.updatedAt()));
    }
}
```

> ⚠️ **`@CacheEvict` + WebFlux**: NO usar `@CacheEvict` en métodos `Mono<>` — se ejecuta antes de que el `Mono` complete. Hacer evict manual en `update()` via `CacheManager`:
> ```java
> public Mono<Void> update(String key, String value, UUID updatedBy) {
>     return repository.update(key, value, updatedBy)
>         .doOnSuccess(_ -> {
>             Cache cache = cacheManager.getCache("system-settings");
>             if (cache != null) cache.clear();
>         });
> }
> ```
> Sin este fix, cambiar un valor desde la UI no tiene efecto hasta el TTL de 5 minutos.

**application.yml (defaults de arranque — se usan SOLO si la tabla no tiene el key):**
```yaml
audit:
  retention-days-hot: 90
  retention-days-archive: 365
```

**Endpoints:**
```
GET /api/v1/settings/system          → lista todos los settings (admin only)
PUT /api/v1/settings/system/{key}    → actualiza un setting (admin only)
GET /api/v1/settings/public          → lista solo settings con is_public=true (sin auth, para frontend)
```

> ⚠️ **`GET /api/v1/settings/public`** — Endpoint sin autenticación que expone solo settings marcados como `is_public=true`. Es consumido por:
> 1. **Service Worker** (A7) — corre en contexto separado sin cookies/session. Necesita `sync.pull-interval-seconds` para configurar el periodic sync sin depender del token del usuario.
> 2. **Frontend** al arrancar — para leer configuración de cliente antes de que el usuario se autologuee.
> 
> No exponer settings administrativos (retenciones, límites de importación, etc.) bajo ningún `is_public=true`. Si se agrega un setting público en el futuro, revisar que no filtre información interna.

**⚠️ `@EnableCaching` requerido**: Agregar a `bootstrap/InventoryApplication.java` junto con `@EnableScheduling`:
> ```java
> @SpringBootApplication
> @EnableScheduling
> @EnableCaching
> @ComponentScan(basePackages = "com.inventory")
> public class InventoryApplication { ... }
> ```

**⚠️ CacheManager bean explícito con Caffeine + TTL 5 min (sin esto, `cacheManager.getCache()` retorna null):**
```java
// En clase de configuración existente o nueva CacheConfig.java
@Configuration
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager("system-settings");
        mgr.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(100));
        return mgr;
    }
}
```
Sin este bean, `cacheManager.getCache("system-settings")` retorna `null` y el service falla silenciosamente.

**⚠️ Validación de `value_type` en PUT — sin esto, un admin puede guardar "abc" en un campo integer, rompiendo `Integer.parseInt()` en servicios downstream:**
```java
// application/service/SettingsValidator.java
@Component
public class SettingsValidator {
    public void validate(String key, String value, String valueType) {
        switch (valueType) {
            case "integer" -> { try { Integer.parseInt(value); } catch (NumberFormatException e) { throw new BadRequestException("Valor inválido para " + key + ": debe ser un número entero"); } }
            case "boolean" -> { if (!"true".equals(value) && !"false".equals(value)) throw new BadRequestException("Valor inválido para " + key + ": debe ser 'true' o 'false'"); }
            case "cron" -> { if (!CRON_PATTERN.matcher(value).matches()) throw new BadRequestException("Valor inválido para " + key + ": debe ser expresión cron válida"); }
            // "string" no necesita validación
        }
    }
}

> ⚠️ **`BadRequestException`** debe extender `DomainException` (definido en `domain/errors/DomainException.java`) y traducirse a HTTP 400 via `@ControllerAdvice` existente. Si no existe en el codebase, crear:
> ```java
> public class BadRequestException extends DomainException {
>     public BadRequestException(String message) { super(message); }
> }
> ```
> Verificar que `GlobalExceptionHandler` (o similar) ya maneja `DomainException` como `application/problem+json` con status 400. Si no, agregar el handler.
```
Inyectar `SettingsValidator` en `SystemSettingsController.update()` y llamar `validator.validate(key, value, setting.valueType())` antes de persistir.

> **🧪 Verificación — test de contexto que el CacheManager existe**:
> ```java
> @SpringBootTest
> class CacheConfigurationTest {
>     private final CacheManager cacheManager;
> 
>     CacheConfigurationTest(CacheManager cacheManager) {
>         this.cacheManager = cacheManager;
>     }
> 
>     @Test
>     void cacheManagerBeanExists() {
>         assertThat(cacheManager).isNotNull();
>         assertThat(cacheManager.getCacheNames()).contains("system-settings");
>     }
> }
> ```
> Sin `spring-boot-starter-cache` en classpath, Spring Boot no autoconfigura `CacheManager` y `cacheManager.getCache()` retorna null silenciosamente. Este test falla si falta.

---

#### A1.8 — Frontend: AuditLogView

> ⚠️ **Ruta protegida — admin only**: `Route: /audit-logs`. Verificar `user.role === 'ADMIN'`. Si no es admin, redirect a dashboard con toast "Acceso denegado".

**Files to Create:**
- `frontend/src/core/audit/ports/IAuditLogRepository.ts` — port interface
- `frontend/src/core/audit/entities/audit-log.ts` — entity types
- `frontend/src/infrastructure/repositories/audit/AuditLogRepository.ts` — HTTP via apiClient
- `frontend/src/presentation/modules/audit/hooks/useAuditLogsController.ts` — TanStack Query
- `frontend/src/presentation/modules/audit/views/AuditLogsView.tsx` — tabla paginada
- `frontend/src/presentation/modules/audit/components/AuditLogDetailModal.tsx` — modal con diff JSON

**Entity types** (`core/audit/entities/audit-log.ts`):
```typescript
export interface AuditLogEntry {
  id: string;
  actorName: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeData?: string;
  afterData?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogFilter {
  entityType?: string;
  actorId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  size: number;
}
```

**Port** (`core/audit/ports/IAuditLogRepository.ts`):
```typescript
export interface IAuditLogRepository {
  list(filter: AuditLogFilter): Promise<{ items: AuditLogEntry[]; total: number }>;
  getById(id: string): Promise<AuditLogEntry>;
  getByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
}
```

**View** — tabla con `GenericTable<AuditLogEntry>` + filtros (mismo patrón que `SuppliersListView`):
```tsx
const columns: Column<AuditLogEntry>[] = [
  { key: 'createdAt', label: 'Fecha', sortable: true,
    render: (_, row) => formatDate(row.createdAt) },
  { key: 'actorName', label: 'Actor', sortable: true },
  { key: 'entityType', label: 'Entidad', sortable: true },
  { key: 'action', label: 'Acción' },
];

const actions: TableAction<AuditLogEntry>[] = [
  { icon: 'eye', title: 'Ver detalle del cambio',
    onClick: (row) => openDetail(row) },
];

<GenericTable<AuditLogEntry>
  columns={columns}
  data={data}
  loading={isLoading}
  actions={actions}
  emptyMessage="No hay registros de auditoría"
/>
```
```
┌────────────────────────────────────────────────────┐
│ Auditoría                                          │
├─ Filtros ──────────────────────────────────────────┤
│ [Entidad] [Acción] [Desde] [Hasta] [Buscar]       │
├─ Tabla ────────────────────────────────────────────┤
│ Fecha        │ Actor   │ Entidad  │ Acción  │     │
│ 28/05 14:30  │ Admin   │ PRODUCT  │ UPDATE  │  👁  │
│ 28/05 14:25  │ Admin   │ SALE     │ CREATE  │  👁  │
├─ Paginación ───────────────────────────────────────┤
│ ← Anterior   1 · 2 · 3    Siguiente →             │
└────────────────────────────────────────────────────┘
```

**Modal de detalle** — `AuditLogDetailModal.tsx`:
- Metadata: actor, entidad, acción, IP, timestamp
- **Diff JSON before/after**: `<pre>` + `jsondiffpatch` (librería ligera, ~5KB gzip). Mostrar solo campos que cambiaron.
- Si solo `beforeData` (DELETE) o solo `afterData` (CREATE) → JSON formateado completo.

> ⚠️ `jsondiffpatch` se agrega via `pnpm add jsondiffpatch`. Sin CDN. Alternativa YAGNI: formateo manual con `JSON.stringify(obj, null, 2)` (sin librería).

**Tooltips**: Cada columna y filtro con `<TooltipHint>`. Ícono `👁` requiere tooltip "Ver detalle del cambio".

> ⚠️ **Offline fallback** (regla A1 específica): `AuditLogsView` es estrictamente online (los logs no se cachean en IndexedDB). Cuando el hook `useAuditLogsController` detecte `getNetworkMode() === 'offline'`, debe mostrar un banner informativo en lugar de la tabla:
> ```
> ┌──────────────────────────────────────┐
> │ ⚠️ Sin conexión                      │
> │ Los registros de auditoría solo      │
> │ están disponibles con conexión al    │
> │ servidor.                            │
> └──────────────────────────────────────┘
> ```
> Regla: no mostrar error Toast ni pantalla de error — solo el banner informativo. Los filtros deben permanecer visibles (pero deshabilitados) para que el usuario entienda qué hay cuando se reconecte.

**Files Summary A1.8:**

| Capa | Archivos | Acción |
|------|----------|--------|
| Core | `IAuditLogRepository.ts`, `audit-log.ts` | Crear |
| Infrastructure | `AuditLogRepository.ts` | Crear |
| Presentation | `AuditLogsView.tsx`, `useAuditLogsController.ts`, `AuditLogDetailModal.tsx` | Crear |

---

#### A1.9 — Frontend: SystemSettingsView

> **Ruta protegida — admin only**: `Route: /settings/system`. Misma protección que AuditLogsView.

**Archivos a crear:**
- `frontend/src/core/system-settings/ports/ISystemSettingsRepository.ts` — port interface
- `frontend/src/core/system-settings/entities/system-setting.ts` — entity types
- `frontend/src/infrastructure/repositories/system-settings/SystemSettingsRepository.ts` — HTTP via apiClient
- `frontend/src/presentation/modules/settings/hooks/useSystemSettingsController.ts` — TanStack Query
- `frontend/src/presentation/modules/settings/views/SystemSettingsView.tsx` — tabla editable con tooltips por key
- `frontend/src/presentation/modules/settings/components/SystemSettingRow.tsx` — fila individual con edit inline

**Entity types:**
```typescript
export interface SystemSetting {
  key: string;
  value: string;
  valueType: 'integer' | 'boolean' | 'string' | 'cron';
  description: string;
  isPublic: boolean;
  updatedAt: string;
}

export interface UpdateSystemSettingInput {
  value: string;
}
```

**Port:**
```typescript
export interface ISystemSettingsRepository {
  list(): Promise<SystemSetting[]>;
  update(key: string, input: UpdateSystemSettingInput): Promise<void>;
  getPublic(): Promise<SystemSetting[]>;  // is_public=true, sin auth
}
```

**View** — tabla con tooltips:
```
┌────────────────────────────────────────────────────────┐
│ Configuración del Sistema                               │
├────────────────────────────────────────────────────────┤
│ Clave                │ Valor        │ Tipo     │ ⚡     │
│ audit.retention...   │ 90 ⚙️        │ integer  │        │
│   └ Días retención caliente       ❓                    │
│ sync.pull-interval   │ 30 ⚙️        │ integer  │        │
│   └ Intervalo pull sync           ❓                    │
├────────────────────────────────────────────────────────┤
│                [ Guardar cambios ]                      │
└────────────────────────────────────────────────────────┘
```

**Reglas:**
- Cada fila tiene `description` en tooltip via `<TooltipHint>` usando el variant `info`
- `value` se edita inline (al hacer clic en el valor). Al guardar → `PUT /api/v1/settings/system/{key}`
- `is_public` se muestra con badge `🔓 Público` / `🔒 Privado`
- `value_type` determina el tipo de input: integer → `<input type="number">`, boolean → toggle, string → text, cron → text + ayuda
- Al editar, tooltip muestra el `description` del setting

**Service Worker (A7) consume `GET /api/v1/settings/public`** desde contexto separado (sin cookies). El SW necesita `sync.pull-interval-seconds` sin auth. Este endpoint ya está definido en backend A1.7.

**Files Summary A1.9:**

| Capa | Archivos | Acción |
|------|----------|--------|
| Core | `ISystemSettingsRepository.ts`, `system-setting.ts` | Crear |
| Infrastructure | `SystemSettingsRepository.ts` | Crear |
| Presentation | `SystemSettingsView.tsx`, `useSystemSettingsController.ts`, `SystemSettingRow.tsx` | Crear |

**Tooltips en A1.9:** Aplicar desde el primer commit — cada fila lleva `<TooltipHint>` con `description` del setting (cargado desde `GET /settings/system`). No esperar a B1.

### Checklist de correcciones — ANTES de ejecutar A1

- [ ] Verificar `SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1` = 14
- [ ] Agregar `spring-boot-starter-cache` + `caffeine` a `pom.xml`
- [ ] Agregar `@EnableScheduling` + `@EnableCaching` a `bootstrap/InventoryApplication.java`
- [ ] Crear `CacheConfig.java` con `CaffeineCacheManager` + TTL 5min (bean `CacheManager`)
- [ ] Mover `AuditLogSearchCriteria` a `domain/ports/out/` (co-located con `AuditLogRepository`)
- [ ] Crear interfaz `AuditSerializer` en `application/shared/`, impl en `adapters/web/shared/`
- [ ] Verificar que los 6 controllers target (Product, Sale, Purchase, Category, Customer, Supplier) tienen `extractUserId(UserDetails)` — implementar donde falte
- [ ] Confirmar: audit logs NO se cachean en IndexedDB (solo lectura online, ver banner offline en A1.8)

---

## Fase A2+A4 — Reports + Export Backend (fusionadas)

> **Skills**: `hexagonal-architecture`, `senior-backend`, `rest-api-conventions`
> **Objetivo**: Implementar endpoints `/api/v1/reports/*` y `/api/v1/exports/*`.
> **Estado actual**: Frontend COMPLETO (`IReportRepository.ts`, `ReportRepository.ts`, `useReportsController.ts`). Backend: **0 líneas**.
> **Frontend `DashboardReport` espera** (fuente de verdad para `SalesReportResponse`):
> ```typescript
> // frontend/src/core/report/ports/IReportRepository.ts
> export interface DashboardReport {
>   totalRevenue: number;
>   totalCost: number;
>   totalProfit: number;
>   salesCount: number;
>   period: string;           // ⚠️ OBLIGATORIO: label del rango (ej: "May 2026", "Q2 2026", "Semana 22")
> }
> export interface InventoryReport {
>   totalProducts: number;
>   totalValue: number;
>   lowStockCount: number;
>   outOfStockCount: number;
> }
> ```

### A2.1 — DTOs (alineados con frontend)

**Files to Create:**
- `adapters/web/dto/report/SalesReportResponse.java`
- `adapters/web/dto/report/InventoryReportResponse.java`

```java
// SalesReportResponse — debe coincidir EXACTAMENTE con DashboardReport del frontend
public record SalesReportResponse(
    BigDecimal totalRevenue,
    BigDecimal totalCost,
    BigDecimal totalProfit,
    long salesCount,
    String period       // ⚠️ CALCULAR en SQL: to_char(date_trunc('month', created_at), 'Mon YYYY')
) {}

// InventoryReportResponse — debe coincidir EXACTAMENTE con InventoryReport del frontend
public record InventoryReportResponse(
    long totalProducts,
    BigDecimal totalValue,
    long lowStockCount,
    long outOfStockCount
) {}
```

### A2.2 — Use Cases (CQRS read-model)

> ⚠️ **Trade-off hexagonal**: `SalesReportUseCase` y `InventoryReportUseCase` usan `DatabaseClient` directamente en la capa `application/`. Esto es aceptable como **read-model CQRS** — las queries de reporting son agregaciones SQL complejas que no tienen sentido pasar por ports (sería una capa de indirección sin beneficio). Este patrón ya existe en el codebase (ej: `AuditLogRetentionService` también usa `DatabaseClient` en `application/`). La regla de que `application/` no dependa de Spring/DB se relaja exclusivamente para queries de reporting. Los comandos (writes) siguen usando ports estrictamente.

**Files to Create:**
- `application/usecase/query/report/SalesReportUseCase.java`
- `application/usecase/query/report/InventoryReportUseCase.java`

```java
// SalesReportUseCase — SQL con period calculado
@Service
public class SalesReportUseCase {
    private final DatabaseClient db;

    public SalesReportUseCase(DatabaseClient db) { this.db = db; }

    public Mono<SalesReportResponse> execute(Instant fromDate, Instant toDate, UUID warehouseId) {
        return db.sql("""
            SELECT
                COALESCE(SUM(total), 0) AS total_revenue,
                COALESCE(SUM(total_cost), 0) AS total_cost,
                COALESCE(SUM(total - total_cost), 0) AS total_profit,
                COUNT(*) AS sales_count,
                COALESCE(to_char(date_trunc('month', created_at), 'Mon YYYY'), 'N/A') AS period
            FROM sales
            WHERE created_at BETWEEN $1 AND $2
              AND ($3::uuid IS NULL OR warehouse_id = $3)
            """)
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now())
            .bind(2, warehouseId)
            .fetch()
            .first()
            .map(row -> new SalesReportResponse(
                (BigDecimal) row.get("total_revenue"),
                (BigDecimal) row.get("total_cost"),
                (BigDecimal) row.get("total_profit"),
                ((Number) row.get("sales_count")).longValue(),
                (String) row.get("period")
            ));
    }
}
```

### A2.3 — Controller

**Files to Create:**
- `adapters/web/controller/report/ReportController.java`

Endpoints:
```
GET /api/v1/reports/sales?fromDate=&toDate=&warehouseId=&categoryId=&paymentMode=  → SalesReportResponse
GET /api/v1/reports/inventory?warehouseId=&categoryId=&lowStockThreshold=          → InventoryReportResponse
```

### A2.4 — Export Use Cases + DTOs (fusionado de A4)

**Files to Create:**
- `application/usecase/query/export/ExportSalesUseCase.java`
- `application/usecase/query/export/ExportInventoryUseCase.java`
- `application/dto/export/ExportFormat.java`
- `application/dto/export/ExportSalesRow.java`
- `application/dto/export/ExportInventoryRow.java`

**`ExportFormat` enum — rechazar formatos no soportados con 501:**
```java
public enum ExportFormat {
    CSV;  // Fase 1: solo CSV. XLSX, PDF → 501 Not Implemented
}
```

**ExportSalesRow — cada línea del CSV de ventas:**
```java
public record ExportSalesRow(
    String date, String invoiceNumber, String customerName,
    BigDecimal total, BigDecimal cost, BigDecimal profit,
    String paymentMode, String warehouseName
) {
    public String toCsvLine() {
        return String.join(",",
            date, invoiceNumber, "\"" + customerName + "\"",
            total.toString(), cost.toString(), profit.toString(),
            paymentMode, warehouseName);
    }
}
```

**Use cases inyectan repositorios de lectura existentes** (`SaleQueryPort`, `ProductQueryPort`, etc.) y transforman a `ExportSalesRow`/`ExportInventoryRow` con paginación (1000 registros por página) para evitar OOM.

> ⚠️ Exporta datos como CSV con streaming. Usar `Flux<String>` (una línea CSV por elemento), NO `Mono<String>`. Con WebFlux, `Flux<String>` con `produces = "text/csv"` streamea automáticamente.

### A2.5 — Export Controller

**Files to Create:**
- `adapters/web/controller/export/ExportController.java`

```java
@RestController
@RequestMapping("/api/v1/exports")
public class ExportController {
    private final ExportSalesUseCase salesUseCase;
    private final ExportInventoryUseCase inventoryUseCase;

    @GetMapping(value = "/sales", produces = "text/csv")
    public Flux<String> exportSales(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(defaultValue = "csv") String format,
        ServerHttpResponse response
    ) {
        if (!"csv".equalsIgnoreCase(format)) {
            return Flux.error(new ResponseStatusException(
                HttpStatus.NOT_IMPLEMENTED,
                "Formato '" + format + "' no soportado. Solo CSV disponible."));
        }
        response.getHeaders().set(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"sales.csv\"");
        return salesUseCase.execute(fromDate, toDate, warehouseId)
            .map(ExportSalesRow::toCsvLine)
            .map(line -> line + "\n")
            .startWith("fecha,factura,cliente,total,costo,ganancia,modo_pago,almacen\n");
    }

    @GetMapping(value = "/inventory", produces = "text/csv")
    public Flux<String> exportInventory(
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(required = false) UUID categoryId,
        ServerHttpResponse response
    ) {
        response.getHeaders().set(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"inventory.csv\"");
        return inventoryUseCase.execute(warehouseId, categoryId)
            .map(ExportInventoryRow::toCsvLine)
            .map(line -> line + "\n")
            .startWith("codigo,producto,categoria,almacen,stock,costo_unitario,valor_total\n");
    }
}
```

Endpoints:
```
GET /api/v1/exports/sales?fromDate=&toDate=&warehouseId=&format=csv
GET /api/v1/exports/inventory?warehouseId=&categoryId=
```

⚠️ **Fase 1 solo CSV.** Frontend admite `csv | xlsx | pdf` — retornar `501 Not Implemented` para formatos no-soportados.

### Files Summary A2+A4

| Capa | Archivos | Acción |
|------|----------|--------|
| Application | `SalesReportUseCase.java`, `InventoryReportUseCase.java` | Crear |
| Application | `ExportSalesUseCase.java`, `ExportInventoryUseCase.java` | Crear |
| DTOs | `ExportFormat.java`, `ExportSalesRow.java`, `ExportInventoryRow.java` | Crear |
| Web | `ReportController.java`, `SalesReportResponse.java`, `InventoryReportResponse.java` | Crear |
| Web | `ExportController.java` | Crear |

---

### 🧪 Contrato DTOs Frontend↔Backend

> **Recomendación**: Las fases A2 (Reports) y A3 (Import) dependen de que los DTOs backend coincidan exactamente con los tipos frontend. Sin un test que valide el contrato, una discrepancia de campo pasa desapercibida hasta QA.
>
> **Opción recomendada — `JsonSchemaValidator` simple en backend:**
> ```java
> // Test: SalesReportResponse debe coincidir con DashboardReport del frontend
> @Test
> void salesReportResponseMatchesFrontendContract() {
>     var json = objectMapper.writeValueAsString(new SalesReportResponse(
>         BigDecimal.valueOf(1000), BigDecimal.valueOf(600),
>         BigDecimal.valueOf(400), 10, "May 2026"));
>     // Validar que JSON parseable por frontend
>     assertThat(json).contains("totalRevenue", "totalCost", "totalProfit",
>         "salesCount", "period");
> }
> ```
>
> O, más robusto: schema compartido (`docs/contracts/schemas/`) en JSON Schema, validado por ambos lados:
> ```bash
> # Backend valida response contra schema
> mvn test -Dtest=*ContractTest
> # Frontend valida types contra schema
> pnpm vitest run --pathPattern=contract
> ```
> Esto es **nice-to-have**, no blocker. Agregar antes de A2 si hay tiempo.

---

## Fase A3 — Import CSV Backend

> **Skills**: `flyway-migrations`, `senior-backend`, `hexagonal-architecture`
> **Objetivo**: Implementar endpoints `/api/v1/imports/*`.
> **Estado actual**: Frontend COMPLETO (`ImportView.tsx`, `ImportRepository.ts`, `useImportController.ts`, `IImportRepository.ts`). Backend: **0 líneas**. Tabla `import_jobs`: **NO existe**. Última migration: V14.
> **Ya existe**: Frontend `ImportRepository.ts` en `frontend/src/infrastructure/repositories/import/ImportRepository.ts` con métodos: `uploadCsv(multipart)`, `dryRun(multipart)`, `getStatus(id)`, `getResult(id)`.

### A3.1 — DB Schema (CREAR — no existe)

**Última migration es V14.** Crear `V16__add_import_jobs.sql`:

- `backend/inventory-app/src/main/resources/db/migration/V16__add_import_jobs.sql`:
```sql
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    total_rows INT,
    processed_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | RUNNING | COMPLETED | FAILED | DRY_RUNNING | DRY_RUN_COMPLETE | DRY_RUN_FAILED
    error_log JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para limpieza
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at);
```
> ⚠️ **Limpieza**: Jobs completados/fallidos >7 días deben eliminarse. `error_log` JSONB puede ser masivo (MB por job con 50k filas). `ImportJobRetentionService` lee retención desde `SystemSettingsService` (A1.7):

**File to Create:** `backend/inventory-app/src/main/java/com/inventory/application/service/ImportJobRetentionService.java`
```java
@Service
public class ImportJobRetentionService {
    private final ImportJobRepository importJobRepository;
    private final SystemSettingsService settings; // A1.7

    public ImportJobRetentionService(ImportJobRepository importJobRepository,
                                     SystemSettingsService settings) {
        this.importJobRepository = importJobRepository;
        this.settings = settings;
    }

    @Scheduled(cron = "0 4 * * *") // 4am daily
    public void cleanupOldImportJobs() {
        settings.getInt("import.retention-days", 7)
            .flatMap(days -> importJobRepository.deleteCompletedOlderThan(
                Instant.now().minus(days, ChronoUnit.DAYS)))
            .subscribe();
    }
}
```

### A3.2 — Domain + Ports

**Files to Create:**
- `backend/.../domain/model/imports/ImportJob.java`
- `backend/.../domain/ports/out/ImportJobRepository.java`
- `backend/.../domain/ports/in/imports/ImportCommandPort.java`
- `backend/.../domain/ports/in/imports/ImportQueryPort.java`

```java
// backend/.../domain/model/imports/ImportJob.java
public class ImportJob {
    public enum Status {
        PENDING, RUNNING, COMPLETED, FAILED,
        DRY_RUNNING, DRY_RUN_COMPLETE, DRY_RUN_FAILED
    }

    private final UUID id;
    private final String entityType;
    private final String fileName;
    private final Long fileSize;
    private int totalRows;
    private int processedRows;
    private int errorRows;
    private Status status;
    private String errorLog;     // JSON
    private final UUID createdBy;
    private final Instant createdAt;
    private Instant updatedAt;

    public static ImportJob pending(String entityType) { ... }
    public static ImportJob dryRunning(String entityType) { ... }

    public void markDryRunComplete(String previewJson) { this.status = Status.DRY_RUN_COMPLETE; this.errorLog = previewJson; }
    public void markDryRunFailed(String errorJson) { this.status = Status.DRY_RUN_FAILED; this.errorLog = errorJson; }
    public void markRunning() { ... }
    public void markCompleted() { ... }
    public void markFailed(String errorJson) { ... }
}
```

> ⚠️ **El port `ImportJobRepository` debe incluir `deleteCompletedOlderThan(Instant)` para que `ImportJobRetentionService` compile:**

```java
public interface ImportJobRepository {
    Mono<ImportJob> save(ImportJob job);
    Mono<ImportJob> findById(UUID id);
    Flux<ImportJob> findByStatus(String status);
    Mono<Void> deleteCompletedOlderThan(Instant before); // necesario para ImportJobRetentionService (A3)
}
```

**File to Modify (incluir en el adapter de persistence):**
- `adapters/persistence/adapter/ImportJobRepositoryAdapter.java` — implementar `deleteCompletedOlderThan()` con `@Query("DELETE FROM import_jobs WHERE status IN ('COMPLETED','FAILED') AND created_at < :before")`

### A3.3 — Persistence

**Files to Create:**
- `backend/.../adapters/persistence/entity/ImportJobEntity.java`
- `backend/.../adapters/persistence/adapter/ImportJobRepositoryAdapter.java`
- `backend/.../adapters/persistence/mapper/ImportJobMapper.java`

### A3.4 — Use Cases

**Files to Create:**
- `backend/.../application/usecase/command/imports/ImportCsvUseCase.java` — dry run + import
- `backend/.../application/usecase/query/imports/ImportJobQueryUseCase.java`

Entidades importables (fase 1): Products, Categories, Customers, Suppliers.

> ⚠️ **dry-run también persiste**: El resultado del dry-run (preview + errores) necesita persistencia para que el frontend haga polling con `getStatus(id)`. Aunque el dry-run "valida sin persistir" los datos reales, el `ImportJob` sí se persiste con flujo:
> ```
> PENDING → DRY_RUNNING → DRY_RUN_COMPLETE (con error_log como preview) | DRY_RUN_FAILED
> ```
> El `status` permite distinguir dry-runs de imports reales. Los jobs dry-run también se limpian con `deleteCompletedOlderThan()` (A7.0.3).

**⚠️ Procesamiento async — evitar timeout y memory leak en requests WebFlux:**
`ImportCsvUseCase.execute()` y `ImportCsvUseCase.dryRun()` no deben bloquear el request del cliente. Con 50k filas, el parseo puede tomar minutos.

**Anti-pattern a evitar** — `doOnNext` + `.subscribe()` detached crea una subscription huérfana que puede leak si el job tarda y el cliente se desconecta. La subscription no está enlazada al ciclo de vida del request.

**Patrón correcto** — usar `@Async` con Spring `TaskExecutor` para procesamiento off-band. Así la tarea es gestionada por el contenedor Spring, no por una subscription reactiva detached:

```java
@Service
public class ImportCsvUseCase {
    private final ImportJobRepository importJobRepository;

    @Async("csvImportExecutor") // ver configuración abajo
    public CompletableFuture<Void> processCsvAsync(ImportJob job, FilePart file) {
        try {
            // Lectura síncrona del CSV (OpenCSV), fila por fila
            // Actualizar job.processedRows / job.errorRows periódicamente mediante importJobRepository.save(...)
            // job.status = COMPLETED o FAILED al terminar
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("csvImportExecutor")
    public CompletableFuture<Void> processDryRunAsync(ImportJob job, FilePart file) {
        // Mismo parseo pero sin persistir entidades
        // job.markDryRunComplete(previewJson) o job.markDryRunFailed(errorJson)
        return CompletableFuture.completedFuture(null);
    }
}

// En clase de configuración:
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("csvImportExecutor")
    public Executor csvImportExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("csv-import-");
        executor.setRejectedExecutionHandler(new CallerRunsPolicy()); // no perder tareas si cola llena
        executor.setWaitForTasksToCompleteOnShutdown(true); // graceful shutdown
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
```

**Controller** recibe 202 Accepted inmediatamente, frontend hace polling a `GET /imports/{id}/status`:
```java
@PostMapping
@ResponseStatus(HttpStatus.ACCEPTED) // 202 — proceso iniciado, no completado
public Mono<ImportJobResponse> uploadCsv(@RequestPart FilePart file,
    @AuthenticationPrincipal UserDetails user, @RequestParam EntityType entityType) {
    UUID userId = extractUserId(user); // método ya existe en SaleController (line 131)
    return importCsvUseCase.execute(file, userId, entityType)
        .map(mapper::toDto);
}
```

El endpoint POST retorna 202 con el `ImportJob` (status=PENDING). El frontend ya hace polling a `GET /imports/{id}/status`. No se necesita WebSocket ni SSE para este caso de uso.

> ⚠️ **Trade-off `@Async` + WebFlux**: `@Async` introduce threads bloqueantes en un entorno reactivo, arriesgando agotamiento del pool si muchas importaciones concurren. Sin embargo, la alternativa (`Schedulers.boundedElastic()` + `.subscribe()` detached) crea subscriptions que no se cancelan si el request HTTP muere, causando memory leaks. La decisión es `@Async` con pool acotado (core 2, max 4, cola 50) como **mal menor**:
> - `CallerRunsPolicy` evita perder tareas si la cola se llena
> - `setWaitForTasksToCompleteOnShutdown(true)` + `awaitTerminationSeconds(30)` garantiza graceful shutdown
> - El pool bloqueante está aislado en un executor dedicado (`csvImportExecutor`), no contamina el event loop de WebFlux
> - **Monitorear**: Si en producción se satura, migrar a `Schedulers.boundedElastic()` con `takeUntilOther` para cancelación segura:
>   ```java
>   return Mono.fromRunnable(() -> processCsvSync(job, file))
>       .subscribeOn(Schedulers.boundedElastic())
>       .doOnError(e -> job.markFailed(e.getMessage()))
>       .thenReturn(job);
>   ```
> - **Riesgo aceptado de `@Async`**: El `CompletableFuture` retornado por `@Async` no cancela automáticamente si el request HTTP muere. El thread del pool `csvImportExecutor` sigue ejecutando aunque el cliente se desconectó. Esto es aceptable porque: (1) importaciones CSV son infrecuentes (decenas/día), (2) pool es pequeño (max 4 threads), (3) el thread termina en segundos/minutos y se libera. Para operaciones más frecuentes, migrar a `Schedulers.boundedElastic()` con el patrón de arriba.

### A3.5 — Controller + DTO (alineados con frontend)

**Files to Create:**
- `backend/.../adapters/web/controller/imports/ImportController.java`
- `backend/.../adapters/web/dto/imports/ImportJobResponse.java`

**Frontend `IImportRepository.ts` espera:**
```typescript
interface IImportRepository {
  uploadCsv(file: File, mapping: Record<string, string>): Promise<ImportJob>;  // POST multipart
  dryRun(file: File, mapping: Record<string, string>): Promise<ImportJob>;      // POST multipart
  getStatus(id: string): Promise<ImportJob>;                                     // GET /{id}/status
  getResult(id: string): Promise<ImportJob>;                                     // GET /{id}/result
}
```

Endpoints (deben coincidir con frontend):
```
POST /api/v1/imports/csv              → consumes multipart/form-data (file + mapping como parte JSON o campo separado)
POST /api/v1/imports/dry-run          → consumes multipart/form-data, valida sin persistir, retorna preview + errores
GET  /api/v1/imports/{id}/status      → polling de progreso
GET  /api/v1/imports/{id}/result      → resultado detallado del job
```

**Frontend paths para verificar después:**
- `frontend/src/infrastructure/repositories/import/ImportRepository.ts`
- `frontend/src/presentation/modules/imports/hooks/useImportController.ts`

### Files Summary A3

| Capa | Archivos | Acción |
|------|----------|--------|
| DB | `V16__add_import_jobs.sql` | Crear si no existe |
| Domain | `ImportJob.java`, `ImportJobRepository.java` | Crear |
| Ports in | `ImportCommandPort.java`, `ImportQueryPort.java` | Crear |
| Persistence | `ImportJobEntity.java`, `ImportJobRepositoryAdapter.java`, `ImportJobMapper.java` | Crear |
| Application | `ImportCsvUseCase.java`, `ImportJobQueryUseCase.java` | Crear |
| Web | `ImportController.java`, `ImportJobResponse.java` | Crear |

> ⚠️ **Migraciones Flyway — números fijos (NO renombrar)**:
> ```
> V15 → system_settings       (A1.7)
> V16 → import_jobs           (A3.1)
> V17 → audit_log_archive     (A1.6)
> V18 → device_cursors        (A7.0, opcional)
> V19 → sync_log_indices      (A7.0, opcional)
> ```
> **Regla de ejecución: A1 siempre antes que A3.** Así los números se mantienen estables sin renombrar archivos.
> 
> **Antes de crear V15**, verificar que no existe colisión:
> ```bash
> # La migración más reciente debe ser V14 (confirmado por `ls db/migration/`)
> # Si existe V15 con otro contenido, renombrar o elegir V16
> SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;
> # Expected: 14
> ```
> 
> **⚠️ @EnableScheduling + @EnableCaching en UN solo commit**: A1.6 y A1.7 requieren estas anotaciones en `bootstrap/InventoryApplication.java`. Aplicar AMBAS en el primer commit de A1 para evitar estado intermedio donde `AuditLogRetentionService` o `SystemSettingsService` fallen al arrancar por falta de anotaciones.

---



## Fase A5 — Fix POS CREDIT/RESERVE + Debts Bug

> **Skills**: `layered-architecture`, `senior-backend`
> **Objetivo**: Wirear `CreditSaleUseCase` y `ReserveSaleUseCase` mediante `SaleCommandPort`, y fix de debts listAll.
> **Estado actual**: `CreditSaleUseCase` existe en `application/usecase/command/sale/CreditSaleUseCase.java` como `@Service` con método `execute(SaleCommandPort.CreateCommand, UUID) → Mono<CreditSaleResult>`, donde `CreditSaleResult` es `record Sale sale, CustomerDebt debt`. `ReserveSaleUseCase` existe en `application/usecase/command/sale/ReserveSaleUseCase.java` con `execute(SaleCommandPort.CreateCommand, UUID) → Mono<Sale>`.
> 
> **Ya existe en SaleController:**
> - Método `extractUserId(UserDetails)` (línea 131)
> - `SaleCommandPort.CreateCommand` inner record (ya se usa)
> - `SaleMapper` (ya inyectado)
> - `saleCommandPort` (ya inyectado) — la controladora usa el **port** hexagonal, NO use cases directamente
> 
> **NO existe**: Import ni referencia a `CreditSaleUseCase`/`ReserveSaleUseCase`.
>
> ⚠️ **Patrón hexagonal: el controller inyecta `SaleCommandPort`, no use cases concretos.** Para CREDIT/RESERVE se agregan métodos al port y al `SaleCommandUseCase` (que implementa el port). La controladora no cambia — solo el port + su implementación.

### A5.1 — Extender SaleCommandPort para CREDIT y RESERVE

**File to Modify:**
- `backend/.../domain/ports/in/sale/SaleCommandPort.java`
- `backend/.../application/usecase/command/sale/SaleCommandUseCase.java`

**Agregar al port (`SaleCommandPort`):**
```java
Mono<Sale> create(CreateCommand command, UUID createdBy);          // ya existe
Mono<Sale> createCredit(CreateCommand command, UUID createdBy);   // NUEVO
Mono<Sale> createReserve(CreateCommand command, UUID createdBy);  // NUEVO
Mono<Sale> confirm(UUID saleId);
Mono<Sale> deliver(UUID saleId);
Mono<Sale> cancel(UUID saleId);
Mono<Void> delete(UUID saleId);
Mono<Void> deleteAll(List<UUID> ids);
```

**⚠️ NO delegar a `CreditSaleUseCase`/`ReserveSaleUseCase`** — esas clases inyectan `SaleCommandPort`, lo que crearía recursión infinita si `SaleCommandUseCase.create()` redirige a ellas. En su lugar, implementar el pipeline completo inline en `SaleCommandUseCase`, usando los repositorios existentes + `CustomerDebtRepository` (ya existe en `domain/ports/out/CustomerDebtRepository.java`, con `CustomerDebtRepositoryAdapter` ya implementado en adapters). Solo se necesita inyectar el port existente — no crear nuevo archivo.

> ⚠️ **`confirm()` y `deliver()` son métodos privados existentes en `SaleCommandUseCase`** — ya implementan descuento de stock y cambio de estado. Si al abrir el archivo no existen, se crean como helpers privados inline:
> - `confirm(Sale)`: status→CONFIRMED, descuenta stock via `StockRepository.deduct()`
> - `deliver(Sale)`: status→DELIVERED (solo IMMEDIATE/CREDIT)
> 
> Para CREDIT: `confirm()` → `deliver()` → `createDebt()`. Para RESERVE: solo `confirm()` (reserva stock, sin deliver).

**Implementar en `SaleCommandUseCase`** (agregar `CustomerDebtRepository` al constructor):
```java
@Service
public class SaleCommandUseCase implements SaleCommandPort {
    private final SaleRepository saleRepository;
    private final StockRepository stockRepository;
    private final MovementRepository movementRepository;
    private final CustomerDebtRepository customerDebtRepository; // NUEVO

    public SaleCommandUseCase(
        SaleRepository saleRepository,
        StockRepository stockRepository,
        MovementRepository movementRepository,
        CustomerDebtRepository customerDebtRepository          // NUEVO
    ) {
        this.saleRepository = saleRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
        this.customerDebtRepository = customerDebtRepository;   // NUEVO
    }

    @Override
    public Mono<Sale> createCredit(CreateCommand command, UUID createdBy) {
        // Pipeline inline: create draft → confirm → deliver → create debt
        // NO llama a CreditSaleUseCase (evita recursión puente)
        if (command.customerId() == null) {
            return Mono.error(new BadRequestException("customerId is required for credit sales"));
        }
        return saleRepository.generateSaleNumber()
            .flatMap(saleNumber -> {
                Sale sale = Sale.createDraft(
                    saleNumber, command.warehouseId(), command.customerId(),
                    command.currencyCode(), command.notes(), command.saleDate(),
                    command.lines().stream()
                        .map(l -> SaleLine.create(l.productId(), l.quantity(),
                            l.unitPrice(), l.discount(), 0))
                        .toList(),
                    createdBy, Sale.PaymentMode.CREDIT
                );
                return saleRepository.save(sale);
            })
            .flatMap(this::confirm)
            .flatMap(this::deliver)
            .flatMap(delivered -> {
                CustomerDebt debt = CustomerDebt.create(
                    delivered.customerId(), delivered.id(),
                    delivered.total(), delivered.currencyCode()
                );
                return customerDebtRepository.save(debt)
                    .thenReturn(delivered);
            });
    }

    @Override
    public Mono<Sale> createReserve(CreateCommand command, UUID createdBy) {
        // Pipeline inline: create draft → confirm (reserva stock, sin deliver)
        // NO llama a ReserveSaleUseCase (evita recursión puente)
        if (command.customerId() == null) {
            return Mono.error(new BadRequestException("customerId is required for reserve sales"));
        }
        return saleRepository.generateSaleNumber()
            .flatMap(saleNumber -> {
                Sale sale = Sale.createDraft(
                    saleNumber, command.warehouseId(), command.customerId(),
                    command.currencyCode(), command.notes(), command.saleDate(),
                    command.lines().stream()
                        .map(l -> SaleLine.create(l.productId(), l.quantity(),
                            l.unitPrice(), l.discount(), 0))
                        .toList(),
                    createdBy, Sale.PaymentMode.RESERVE
                );
                return saleRepository.save(sale);
            })
            .flatMap(this::confirm); // reserva stock, NO deliver
    }
}
```

**No se modifica `SaleController.java`** — el método `create()` ya llama a `saleCommandPort.create(cmd, userId)`. Solo se agrega dispatch por `paymentMode` dentro del `SaleCommandUseCase.create()`:

```java
// En SaleCommandUseCase.create() — dispatch por paymentMode
// ⚠️ Esto ES seguro porque createCredit/createResolve ya no pasan por el port
@Override
public Mono<Sale> create(CreateCommand command, UUID createdBy) {
    return switch (command.paymentMode()) {
        case CREDIT -> createCredit(command, createdBy);
        case RESERVE -> createReserve(command, createdBy);
        default -> {
            // IMMEDIATE: mismo flujo existente (validar, generar número, crear borrador)
            if (command.warehouseId() == null)
                yield Mono.error(new BadRequestException("Warehouse is required"));
            if (command.lines() == null || command.lines().isEmpty())
                yield Mono.error(new BadRequestException("At least one line is required"));
            yield saleRepository.generateSaleNumber()
                .flatMap(saleNumber -> {
                    List<SaleLine> lines = /* mapear command.lines a SaleLine */;
                    Sale sale = Sale.createDraft(saleNumber, ..., command.paymentMode());
                    return saleRepository.save(sale);
                });
        }
    };
}
```

> **Ventaja de este enfoque**: La controladora no se modifica, sigue inyectando solo el port. El dispatch condicional se encapsula en la implementación del port. Se mantiene la separación hexagonal: controller → port → use case, no controller → use case directo.
>
> ⚠️ **Por qué NO se usan `CreditSaleUseCase`/`ReserveSaleUseCase`**: Esas clases existen como use cases autónomos que inyectan `SaleCommandPort`. Si `SaleCommandUseCase.create()` redirigiera a ellas, crearían recursión: `SaleCommandUseCase.create()` → `CreditSaleUseCase.execute()` → `saleCommandPort.create()` → `SaleCommandUseCase.create()` → ... Las clases existentes se mantienen para posibles endpoints dedicados de CREDIT/RESERVE en el futuro. El dispatch en `SaleCommandUseCase` usa el pipeline inline con los repositorios como peers del mismo `@Service`.

### A5.2 — Fix Debts listAll default filter

**File to Modify:** `adapters/web/controller/customer/CustomerDebtController.java`

Cambiar `listAll()` para que SIN `?status=` retorne TODAS las deudas, no solo overdue:

```java
@GetMapping
public Flux<CustomerDebtDto> listAll(
    @RequestParam(required = false) String status,
    Authentication authentication
) {
    if (status != null) {
        return queryPort.listByStatus(DebtStatus.valueOf(status.toUpperCase())).map(mapper::toDto);
    }
    return queryPort.findAll().map(mapper::toDto);  // ANTES: llamaba a listOverdue()
}
```

**File to Modify (frontend):** `DebtsListView.tsx` o `useDebts.ts` — verificar que no envíe `status` por defecto a menos que el usuario filtre explícitamente.

### A5.3 — Post-fix verification POS flow

> Nota: `extractUserId()` ya existe en SaleController. NO crear un método nuevo.

```bash
# Verificar CREDIT sale → genera CustomerDebt
curl -s -X POST http://localhost:8080/api/v1/sales \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"warehouseId":"...","paymentMode":"CREDIT","customerId":"...","lines":[...]}' | jq .debtId
# Expected: debtId no es null

# Verificar debts listAll sin filtro
curl -s http://localhost:8080/api/v1/debts | jq 'length'
# Expected: incluye PENDING, PARTIAL, PAID, CANCELLED, no solo OVERDUE
```

### Files Summary A5

| Capa | Acción |
|------|--------|
| `SaleCommandPort.java` | Agregar `createCredit()` + `createReserve()` métodos |
| `SaleCommandUseCase.java` | Inyectar `CustomerDebtRepository`, inline pipeline, dispatch por `paymentMode` |
| `CustomerDebtController.java` | Fix `listAll()` default filter |
| Frontend `useDebts.ts` | Verificar que no pasa `status` implícitamente |

---

## Fase A6 — Notification Preferences + System Settings UI

> **Skills**: `senior-frontend`, `shadcn`, `ui-ux-pro-max`
> **Objetivo**: Conectar el panel de preferencias/horarios de notificaciones y agregar la pestaña "Sistema" en SettingsView con los parámetros operativos de `system_settings` (A1.7).
> **Estado actual**: Backend COMPLETO — `NotificationController.java` tiene los 4 endpoints:
> - `GET /api/v1/notifications/preferences` (✅ existe, línea 102)
> - `PUT /api/v1/notifications/preferences` (✅ existe, línea 111)
> - `GET /api/v1/notifications/schedules` (✅ existe, línea 121)
> - `PUT /api/v1/notifications/schedules` (✅ existe, línea 130)
>
> Frontend: `notifications.api.ts` en `frontend/src/infrastructure/api/notifications.api.ts` (114 líneas, tiene funciones duplicadas). `useNotificationPreferences.ts` existe en shared hooks. Componentes `PreferencesPanel.tsx` y `ScheduleSelector.tsx` existen en shared.
> **Ya existe:** Todo el backend de notificaciones. Backend de system_settings se crea en A1.7.

### A6.1 — Convertir SettingsView a tabs + Conectar preferencias de Notificaciones

> **Estado actual**: `SettingsView.tsx` es un layout de card única con dos secciones embebidas. **NO tiene tabs.** `SystemSettingsFields.tsx` es un componente read-only de 2 líneas (muestra `updatedAt + version`). Se debe convertir a un layout con pestañas y crear la pestaña de Notificaciones.

**Files to Modify:**
- `frontend/src/presentation/modules/settings/views/SettingsView.tsx` — convertir de card única a tabs usando `Tabs` de shadcn: "General" (formulario existente `SettingsFormFields`), "Notificaciones", "Sistema" (A6.3)
- `frontend/src/presentation/shared/hooks/api/useNotificationPreferences.ts` — verificar que llama a `notification-api.ts` (no a `notifications.api.ts` que está duplicado)

**File to Create (si no existe):**
- `frontend/src/presentation/modules/notifications/views/NotificationPreferencesView.tsx` — wrappear `PreferencesPanel` + `ScheduleSelector`

### A6.2 — Consolidar `notifications.api.ts` (código duplicado) — NO ELIMINAR

> 🔴 **NO eliminar `notifications.api.ts`**: Verificado contra codebase — tiene **12+ imports activos** desde hooks (usePreferencesQuery, useNotificationMutations, useSystemNotifications, useUserNotifications, useNotificationStream, etc.). El archivo está VIVO (114 líneas, 13 funciones exportadas). `notification-api.ts` es una API object más antigua con funcionalidad solapada.

**Ejecutar en fase A6, antes de tocar SettingsView:**
```bash
# Mapear TODOS los imports activos
rg "from.*notifications.api" frontend/src/ --include "*.ts" --include "*.tsx"
# Verificar qué funciones son únicas de cada archivo (no compartidas)
rg "^export" frontend/src/infrastructure/api/notifications.api.ts
rg "^export" frontend/src/infrastructure/api/notification-api.ts
```

**Decisión por código:**
- Si `notifications.api.ts` tiene funciones que `notification-api.ts` NO tiene → **conservar ambos archivos**, no eliminar nada
- Si hay solapamiento exacto de funciones → migrar imports gradualmente, pero NO eliminar hasta que 0 imports apunten a él
- **Documentar en el archivo: "⚠️ Este archivo tiene un duplicado parcial en notification-api.ts — ver A6.2"**

### A6.3 — "Sistema" tab en SettingsView

> ⚠️ **No duplicar A1.9**: El frontend de SystemSettings (types, port, implementación, vista, panel) ya está definido en **A1.9** con todos los detalles. A6.3 solo necesita **conectar** ese componente dentro del nuevo layout de tabs.

**Cambio concreto en SettingsView.tsx:**
- Agregar `Tabs` de shadcn: "General" (formulario existente), "Notificaciones" (A6.1), "Sistema" (importar componentes de A1.9)
- ⚠️ **Solo visible para ROLE_ADMIN**: El tab "Sistema" debe filtrarse por rol. Si el usuario no es admin, ocultar la pestaña. Verificar rol desde `useAuth().user.role`.
- No crear nuevos archivos — A1.9 ya define: `ISystemSettingsRepository.ts`, `system-settings.ts`, `SystemSettingsRepository.ts`, `SystemSettingsView.tsx`, `SystemSettingsPanel.tsx`, `useSystemSettingsController.ts`

### Files Summary A6

| Capa | Acción |
|------|--------|
| `SettingsView.tsx` | Agregar tabs: General + Notificaciones + Sistema (importar A1.9) |
| `NotificationPreferencesView.tsx` | Wrapper de `PreferencesPanel` + `ScheduleSelector` |
| `notifications.api.ts` + `notification-api.ts` | Verificar solapamiento, NO eliminar (12+ imports activos). Documentar duplicación. |
| Hooks de preferencias | Verificar que apuntan al repo correcto |
| `tooltip.tsx` (ya existe) | Usar `<TooltipHint>` y `<Tooltip>` como componente genérico para tooltips en formularios de toda la app |

---

## Fase A7 — Offline-First: IndexedDB + SW + Sync

> **Skills**: `senior-frontend`, `senior-architect`, `web-performance-optimization`, `hexagonal-architecture`
> **Priority**: Alternativa — solo cuando A1-A6 estén completas.
> ⚠️ **sync_log growth si A7 no se ejecuta**: la tabla `sync_log` existe en el backend (con `R2dbcSyncLogRepository`, `SyncController`), pero **no tiene job de limpieza**. Las escrituras en `sync_log` ocurren desde el codebase existente (operaciones online). Sin A7, la tabla puede crecer indefinidamente (~900k filas/año). Si se decide posponer A7, agregar manualmente un job `@Scheduled` que limpie `sync_log` >30 días como dependencia independiente.
> **Tiempo estimado**: ~300-360 min (~5-6 horas) — incluye delta sync + checksums + dead letter
> ⚠️ **Feature Flag**: Toda la lógica offline debe estar envuelta en `NEXT_PUBLIC_OFFLINE_ENABLED` para desplegar gradualmente sin rollback:

```typescript
// frontend/.env.local
NEXT_PUBLIC_OFFLINE_ENABLED=true

// En repositorios:
const OFFLINE_ENABLED = process.env.NEXT_PUBLIC_OFFLINE_ENABLED === 'true';
if (!OFFLINE_ENABLED) { return apiClient.post(...); } // comportamiento actual
```

> **Arquitectura**: Ver `docs/design/offline-strategy.md` para visión completa.
> ⚠️ **Coordinación con A1**: A7.1.4 inyecta `SyncLogWriterPort` en los mismos 6 use cases que A1.4. Si A1 ya se ejecutó, los archivos ya tienen `AuditLogRepository` y se debe **agregar `SyncLogWriterPort` además**, no reemplazar. Ambas dependencias coexisten.

### Visión General

```
┌──────────────────────────────────────────────────────────────────┐
│ FLUJO OFFLINE-COMPLETA                                           │
│                                                                  │
│ Usuario crea venta offline:                                      │
│   1. React intenta POST /api/v1/sales → falla (sin red)          │
│   2. apiClient detecta offline → guarda en outbox IndexedDB      │
│   3. UI muestra badge: "1 pendiente"                             │
│   4. Stock se actualiza optimistamente en IndexedDB local         │
│                                                                  │
│ Reconexión:                                                      │
│   5. useNetworkHealth detecta online                             │
│   6. SyncService.pushOutbox() ejecuta:                           │
│      a. POST /api/v1/sync/push con batch de operaciones          │
│      b. Backend procesa, escribe sync_log, retorna accepted[]    │
│      c. Frontend marca accepted, presenta rejected como incident │
│   7. SyncService.pullDeltaSync() ejecuta:                        │
│      a. GET /api/v1/sync/pull?entityType=PRODUCT&cursor=X        │
│      b. GET /api/v1/sync/pull?entityType=SALE&cursor=Y           │
│      c. Aplica por store en batches paralelos (máx 3 concurrentes│
│         por batch, Promise.allSettled para tolerar fallos)       │
│   8. UI muestra barra de progreso real                           │
└──────────────────────────────────────────────────────────────────┘

> **COMPORTAMIENTO ONLINE (con `OFFLINE_ENABLED=true`):**
> - **Lectura Cache-first**: IndexedDB → respuesta inmediata (síncrono, ~1ms). Background refresh si stale.
> - **Lectura Network-first** (StockBalances): API directo → cachea resultado en IDB.
> - **Escritura**: API directo → cachea respuesta del servidor en IDB. NO pasa por outbox.
> - **SyncService.pullDeltaSync()**: Corre cada 30s en background. Mantiene IDB actualizado para que el cache offline funcione incluso en online.
> - **El backend sigue siendo la fuente de verdad única.** IndexedDB es siempre un cache derivado. En online, nunca se escribe a outbox — solo se lee de IDB para UI instantánea.
> - Usuario puede desconectarse en cualquier momento y tener datos frescos (≤30s de lag).
>
> ⚠️ **Regla online/offline estricta**: Cuando hay conexión, **todo read/write va al backend**. IndexedDB es cache de lectura + outbox de escritura offline. Al reconectarse, `SyncService` drena el outbox (push) ANTES de permitir nuevos writes. Nunca leer de IndexedDB si el backend está disponible (excepto catálogos precargados: productos, categorías, monedas — que son casi estáticos y benefician de cache-first).
```

### Estrategia Offline por Modelo

Cada entidad tiene comportamiento distinto en offline. La tabla define para cada una:

| Modelo | Store IDB | Lectura offline | Escritura offline | Sync push | Sync pull | Conflicto |
|--------|-----------|----------------|-------------------|-----------|-----------|-----------|
| **Products (catálogo)** | `products` | Cache-first (stale ≤5min → refresca bg) | Outbox: CREATE/UPDATE/DELETE/ARCHIVE | POST /sync/push (entityType=PRODUCT) | GET /sync/pull?entityType=PRODUCT | Idempotency key. Last-write-wins. Stock no se sobreescribe sin validación. |
| **Products (stock POS)** | `stockBalances` | **Network-first** (no cache-first) — el POS necesita stock en tiempo real para evitar overselling con 2 cajeros simultáneos. Cache offline para display read-only. | Outbox solo para ADJUSTMENT (no para ventas — la venta offline es aproximada) | POST /sync/push (STOCK_BALANCE/ADJUST) | Pull delta | **⚠️ Crítico**: stock offline es aproximado. Al sync, backend valida stock real. Si insuficiente → rechaza con incidente. |
| **Customers** | `customers` | Cache-first (stale ≤15min) | Outbox: CREATE/UPDATE/DEACTIVATE | POST /sync/push (CUSTOMER) | Pull delta | Last-write-wins. |
| **Suppliers** | `suppliers` | Cache-first (stale ≤15min) | Outbox: CREATE/UPDATE/DEACTIVATE | POST /sync/push (SUPPLIER) | Pull delta | Last-write-wins. |
| **Currencies** | `currencies` | Cache-first (cambia poco) | **No outbox** (read-only, admin online) | — | Pull delta | — |
| **ExchangeRates** | `exchangeRates` | Cache-first (stale ≤1h, refresco periódico) | **No outbox** | — | Pull delta | — |
| **Sales** | `sales` | Cache de ventas propias (stale ≤5min) | **Outbox CRÍTICO**: CREATE (con estimación stock). CONFIRM/DELIVER/CANCEL requieren stock real → offline no permite (throw toast "requiere conexión") | POST /sync/push (SALE/CREATE) | Pull delta | Si stock insuficiente al sync → venta rechazada, incidente. Se notifica al usuario. |
| **Purchases** | `purchases` | Cache (stale ≤5min) | Outbox: CREATE. CONFIRM/RECEIVE/CANCEL requieren conexión (stock real) | POST /sync/push (PURCHASE/CREATE) | Pull delta | Last-write-wins. |
| **Transfers** | `transfers` | Cache (stale ≤5min) | **No outbox** — requiere validación stock origen/destino actualizados | — | Pull delta | — |
| **Adjustments** | `adjustments` | Cache (stale ≤5min) | **No outbox** — requiere stock actualizado para ajuste preciso | POST /sync/push (ADJUSTMENT) solo si es ajuste manual sin validación | Pull delta | Last-write-wins. |
| **Returns** | `returns` | Cache (stale ≤5min) | **No outbox** — requiere stock actualizado | — | Pull delta | — |
| **CustomerDebts** | `customerDebts` | Cache (stale ≤5min) | **No outbox** — solo lectura + pago (pago requiere conexión por transacción financiera) | — | Pull delta | — |
| **Notifications** | `notifications` | Cache (stale ≤1min) | **No outbox** — solo lectura (server-generated) | — | Pull delta | — |
| **Users/Auth** | `syncMeta` (token) | Token en IndexedDB (syncMeta) para re-autenticación offline | No write offline. Si token expires → login required. | — | — | Token refresh requiere conexión. |
| **ImageCache** | `imageCache` | Cache-first LRU (50 MiB, stale ∞) | Cache automático en lectura, sin outbox | — | No sync (solo thumbnails locales) | LRU eviction cuando excede 50 MiB. |

**Leyenda de estrategias de lectura:**

| Estrategia | Comportamiento online | Comportamiento offline |
|-----------|----------------------|----------------------|
| **Cache-first** | Sirve de IndexedDB inmediatamente. En background, refresca si stale. IndexedDB es síncrono, UI instantánea. | Sirve de IndexedDB. Si no hay cache y offline → muestra "sin datos" con toast. |
| **Network-first** | Intenta fetch. Si ok → cachea en IndexedDB y sirve. Si fail y hay cache → sirve cache (stale). Si no hay cache → error. | Sin red (sabemos por `getNetworkMode()` antes de intentar) → sirve cache directo. Si no hay → error. |

> ⚠️ **Detección de red en repositorios**: No usar `navigator.onLine` directamente — es poco confiable con captive portals, WiFi sin internet o VPNs caídas. Los repositorios (TS puras, sin React) deben leer el estado desde el Zustand store compartido:
> ```typescript
> import { getNetworkMode } from '@/infrastructure/storage/networkStore';
> const mode = getNetworkMode(); // 'online-direct' | 'online-degraded' | 'offline'
> if (mode === 'offline') return getCachedProducts();
> ```
> `getNetworkMode()` se actualiza desde `useNetworkHealth.ts` que hace ping real al backend cada 10s. Ver A7.4.3.

**Leyenda de estrategias de escritura:**

| Estrategia | Comportamiento online | Comportamiento offline |
|-----------|----------------------|----------------------|
| **Outbox** | POST/PUT/DELETE directo al API. Si ok → cachea respuesta en IndexedDB. | Guarda en outbox con operationId (idempotency). Retorna objeto optimista con `id: "temp_{operationId}"`. UI funciona con id temporal. |
| **No outbox** | Operación solo online. Si offline → toast "Requiere conexión" y se deshabilita el botón. | Bloqueado. UI muestra indicador visual de "no disponible offline". |
| **Outbox CRÍTICO** | Como Outbox pero con validaciones extra al sync. Requiere atención del usuario si falla. | Como Outbox. UI muestra badge `⚠️ 1 pendiente` persistente. |

**Leyenda de resolución de conflictos:**
- **Idempotency key**: Cada operación offline lleva `operationId` (UUID v4). Backend checkea `idempotency_keys` antes de ejecutar. Si ya se procesó → retorna resultado cacheado. Esto protege contra duplicados en reconexión. Aplica a: PRODUCT/SALE/PURCHASE/CUSTOMER/SUPPLIER — todas las entidades con outbox.
- **Last-write-wins**: La última operación en llegar al servidor gana (por timestamp de sync_log, no por timestamp local). Simple y predecible. Aplica a: productos, clientes, proveedores (entidades sin restricciones de negocio al merge).
- **Rechazo con incidente**: Backend valida reglas de negocio (stock, unique constraints). Si falla → la operación se rechaza, se crea `sync_incident`, frontend muestra panel de "Operaciones fallidas". Aplica a: ventas (stock insuficiente), transfers (stock origen inválido), adjustments (stock real != estimado).

> **Decisión de diseño**: No hay merge manual. Las operaciones rechazadas van a dead letter con el error del servidor. El usuario decide si reintentar (tras corregir) o descartar. No hay resolución automática de conflictos — el backend es la única fuente de verdad.

### IndexedDB: Pre-cache Scope + Límites

> **Qué datos se precargan**: Solo catálogos de consulta frecuente. NO se cachean ventas históricas, audit_logs, ni transacciones.
>
> | Store IDB | Registros máx | Estrategia lectura | Notas |
> |-----------|---------------|-------------------|-------|
> | `products` | 5k | Cache-first (stale ≤5min) | POS usa cache para catálogo, network-first para stock |
> | `customers` | 10k | Cache-first (stale ≤15min) | Suficiente para PYMES |
> | `suppliers` | 2k | Cache-first (stale ≤15min) | |
> | `categories` | 500 | Cache-first (stale ≤30min) | |
> | `currencies` | 50 | Cache-first (casi estático) | Read-only |
> | `exchangeRates` | 365 | Cache-first (stale ≤1h) | |
> | `stockBalances` | — | Network-first | POS necesita stock real-time |
>
> **Límites por store**: Safari/Firefox tienen ~50MB por store. Producto típico ~2KB → ~25k caben. Pero queries se degradan >10k filas. Si un store excede el límite → log warn + no cachear más.
>
> **Cursor vs timestamp**: El delta sync usa `?since=cursor` (ID entero de `sync_log`), NO `?since=timestamp`. Los timestamps dependen del reloj del dispositivo — con relojes desincronizados se pierden operaciones. Cada dispositivo tiene su propio cursor en `device_cursors`.

### Estado Actual vs. Objetivo

| Componente | Estado | Objetivo |
|-----------|--------|----------|
| `db.ts` (IndexedDB) | 3 stores comentados, dummies no-op | 11 stores activos, exports reales |
| `outbox.ts` | Código comentado, throw Error | Cola FIFO con reintentos, límite 500 |
| `SyncService.ts` | Push/pull comentados, dummies 0 | Push batch a `/sync/push`, Pull cursor |
| `ProductCacheService.ts` | CRUD comentado, dummies null | CRUD real con timestamps |
| `sw.js` | Solo assets estáticos | Cache API + network-first |
| `useSyncStatus.ts` | Dummy: siempre "online" | Ciclo sync real con estados |
| `useCacheProgress.ts` | Dummy: siempre 100% | 6-step loading real |
| `useNetworkHealth.ts` | ✅ Ya funciona (ping health) | Sin cambios |
| `NetworkIcon` | ✅ Ya existe | Sin cambios |
| `SyncProgressBar` | ✅ Ya existe (sin datos reales) | Con datos reales |
| `CacheProgressBar` | ✅ Ya existe (sin datos reales) | Con datos reales |
| Backend `sync_log` | Tabla + GET /pull existe | También escritura desde push endpoint |
| Backend `idempotency_keys` | Tabla existe, 0 código | Servicio de idempotencia |
| Backend `POST /sync/push` | ❌ No existe | Generic operation router |

---

### A7.0 — Backend: Shared Infrastructure (Idempotency + SyncLogWriter)

> Crear servicios compartidos que usarán el push endpoint.

#### A7.0.1 — IdempotencyService

**Files to Create:**
- `domain/ports/out/IdempotencyRepository.java`
- `application/service/IdempotencyService.java` — check + store + cache response

```java
// domain/ports/out/IdempotencyRepository.java
public interface IdempotencyRepository {
    Mono<Boolean> existsByKey(String key);
    Mono<Void> store(String key, String requestHash, String responseJson);
    Mono<String> getCachedResponse(String key);
    Mono<Void> deleteOlderThan(Instant before); // limpieza TTL
}
```

> ⚠️ **Retención**: Tabla `idempotency_keys` crece ~180k filas/año. TTL 7 días — se limpia en `SyncLogRetentionService` (A7.0.3). Agregar índice si no existe: `CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at)`

**Files to Create:**
- `adapters/persistence/entity/IdempotencyKeyEntity.java` — R2DBC entity (`@Table("idempotency_keys")`)
- `adapters/persistence/adapter/IdempotencyRepositoryAdapter.java` — implementa el port
- `adapters/persistence/mapper/IdempotencyMapper.java`

#### A7.0.2 — SyncLogWriter

**Files to Create:**
- `domain/ports/out/SyncLogWriterPort.java`

```java
public interface SyncLogWriterPort {
    Mono<Void> log(String entityType, UUID entityId, String action, Object payload, UUID warehouseId);
}
```

**Files to Create:**
- `application/service/SyncLogWriterService.java` — implementa el port
- `adapters/persistence/adapter/SyncLogWriterAdapter.java` — persiste en sync_log

Nota: `R2dbcSyncLogRepository` (Spring Data R2DBC) ya existe. Solo falta el adapter que lo use.

#### A7.0.3 — SyncLogRetentionService + device_cursors (limpieza automática)

> `sync_log` crece ~900k filas/año con 10 dispositivos. Sin limpieza, `GET /sync/pull?cursor=X` se vuelve lento.
> `idempotency_keys` también crece ~180k filas/año sin TTL. Las claves de idempotencia solo son válidas 24-48h máximo — no necesitan retención mayor.

> ⚠️ **Retention crítica**: `sync_log` es la tabla de mayor riesgo de crecimiento — cada operación online (A7.1.4) escribe en ella. Requiere DELETE por fecha además del cursor-based: `DELETE FROM sync_log WHERE created_at < NOW() - INTERVAL '30 days'`. Las `idempotency_keys` solo necesitan 48h de retención (no 7 días como estaba antes).

**Migration V18 — `device_cursors` (necesaria para `findMinActiveCursor`):**

```sql
CREATE TABLE device_cursors (
    device_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    last_cursor BIGINT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_device_cursors_last_cursor ON device_cursors(last_cursor);
```

**Migration V19 — índices sync_log (necesarios para A7.8 delta sync performance):**
```sql
-- A7.8: delta sync filtra por entity_type + ordena por id. Sin este índice = seq scan.
CREATE INDEX IF NOT EXISTS idx_sync_log_entity_type_id ON sync_log(entity_type, id);

-- Para limpieza por created_at en SyncLogRetentionService
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log(created_at);

-- Para búsqueda por entity_id (incidentes, dead letters)
CREATE INDEX IF NOT EXISTS idx_sync_log_entity_id ON sync_log(entity_id);
```

**Flujo:** Cada `GET /api/v1/sync/pull` actualiza `device_cursors.last_cursor` para el `device_id` del request. `findMinActiveCursor()` usa `SELECT MIN(last_cursor) FROM device_cursors WHERE last_seen_at > NOW() - INTERVAL '7 days'` (ignora devices inactivos >7d).

**Files to Create:**
- `application/service/SyncLogRetentionService.java`

```java
@Service
public class SyncLogRetentionService {
    private final SystemSettingsService settings; // A1.7 — lee sync.retention-days

    public SyncLogRetentionService(SystemSettingsService settings) {
        this.settings = settings;
    }

    @Scheduled(cron = "0 2 * * *") // 2am daily
    public void cleanup() {
        settings.getInt("sync.retention-days", 30)
            .flatMap(days -> syncLogRepository.deleteOlderThanDate(
                Instant.now().minus(days, ChronoUnit.DAYS)))
            .subscribe();
    }

    @Scheduled(cron = "0 2 * * *")
    public void cleanupIdempotencyKeys() {
        // Idempotency keys solo son válidas 24-48h
        idempotencyRepository.deleteOlderThan(Instant.now().minus(2, ChronoUnit.DAYS))
            .subscribe();
    }
}
```

**File to Modify:**
- `R2dbcSyncLogRepository.java` — agregar `findMinActiveCursor()`, `deleteOlderThan(long cursor, Instant before)`, y `deleteOlderThanDate(Instant before)` (DELETE por created_at directo, sin cursor)

> ⚠️ **@EnableScheduling**: Ya requerido por `AuditLogRetentionService` (A1.6). Si esa fase ya se ejecutó, la anotación ya está en `InventoryApplication`. Si A7 se ejecuta primero, agregar igual (ver nota en A1.6).

---



### A7.1 — Backend: Generic Push Endpoint (POST /api/v1/sync/push)

> Endpoint único para recibir operaciones offline replayeadas.
> Cada operación se rutea al command port correspondiente.
>
> ⚠️ **Límite de batch**: El endpoint acepta hasta 100 operaciones por request. Un cliente malicioso o bug puede enviar 10,000 operaciones colapsando el pool R2DBC. Validar en el DTO:
> ```java
> public record PushBatchRequest(
>     @NotEmpty @Size(max = 100) List<PushOperationRequest> operations
> ) {}
> ```
> Y en el use case confirmar:
> ```java
> if (operations.size() > 100) {
>     return Mono.error(new ResponseStatusException(
>         HttpStatus.BAD_REQUEST, "Máximo 100 operaciones por batch"));
> }
> ```

#### A7.1.1 — Operation Router

**Files to Create:**
- `application/service/OperationRouter.java` — registry de entityType+action → handler

```java
@Service
public class OperationRouter {
    private final Map<String, OperationHandler> handlers = new HashMap<>();
    
    public OperationRouter(
        ProductCommandPort productCommands,
        SaleCommandPort saleCommands,
        PurchaseCommandPort purchaseCommands,
        CategoryCommandPort categoryCommands,
        CustomerCommandPort customerCommands,
        SupplierCommandPort supplierCommands,
        TransferCommandPort transferCommands,
        AdjustmentCommandPort adjustmentCommands,
        ReturnCommandPort returnCommands
    ) {
        // ⚠️ Los Command son inner records dentro de los ports:
        handlers.put("PRODUCT/CREATE", (payload, userId) ->
            productCommands.create(convert(payload, ProductCommandPort.CreateProductCommand.class), userId));
        handlers.put("PRODUCT/UPDATE", (payload, userId) ->
            productCommands.update(convert(payload, ProductCommandPort.UpdateProductCommand.class), userId));
        handlers.put("SALE/CREATE", (payload, userId) ->
            saleCommands.create(convert(payload, SaleCommandPort.CreateCommand.class), userId));
        // ... resto de entidades y acciones
    }

    private final ObjectMapper objectMapper; // Spring Boot auto-provee

    /**
     * ⚠️ convertValue lanza IllegalArgumentException si el payload no coincide
     * con el DTO esperado (ej: falta campo requerido, tipo incorrecto). Sin catch,
     * esto se traduce a error 500. Capturar y retornar 400 con mensaje descriptivo.
     */
    private <T> T convert(Object payload, Class<T> type) {
        try {
            return objectMapper.convertValue(payload, type);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                "Payload inválido para " + type.getSimpleName() + ": " + e.getMessage());
        }
    }

    @FunctionalInterface
    public interface OperationHandler {
        Mono<Object> execute(Object payload, UUID userId);
    }

    public Mono<PushResult> route(String entityType, String action, Object payload, UUID userId) {
        var key = entityType + "/" + action;
        var handler = handlers.get(key);
        if (handler == null) return Mono.error(new UnknownOperationException(key));
        return handler.execute(payload, userId)
            .map(result -> new PushResult(true, result))
            .onErrorResume(e -> {
                // Errores de validación (400) NO se tragan como PushResult(false)
                // Se relanzan para que el use case los maneje como rejected[]
                if (e instanceof BadRequestException || e instanceof DomainException) {
                    return Mono.error(e);
                }
                return Mono.just(new PushResult(false, e.getMessage()));
            });
    }

    public record PushResult(boolean success, Object data) {}
}
```

#### A7.1.2 — Push Use Case

**Files to Create:**
- `application/usecase/command/sync/SyncPushUseCase.java` — orchesta el batch

```java
@Service
public class SyncPushUseCase {
    // Inyecta: OperationRouter, IdempotencyService, SyncLogWriterPort
    
    public Mono<SyncPushResponse> execute(List<PushOperation> operations, UUID userId) {
        return Flux.fromIterable(operations)
            .flatMapSequential(op -> processOperation(op, userId))
            .collectList()
            .map(results -> new SyncPushResponse(results));
    }
    
    private Mono<OperationResult> processOperation(PushOperation op, UUID userId) {
        // 1. Check idempotency
        // 2. If cached → return cached result
        // 3. Route to OperationRouter
        // 4. If success → write sync_log → store idempotency → return accepted
        // 5. If fail → create SyncIncident → return rejected
    }
}

public record PushOperation(String operationId, String entityType, String action, Object payload) {}
public record SyncPushResponse(List<OperationResult> results) {}
public record OperationResult(String operationId, boolean accepted, Object data, String error) {}
```

#### A7.1.3 — Controller + DTO

**Files to Create:**
- `adapters/web/controller/sync/SyncPushController.java`
- `application/dto/sync/PushOperationRequest.java`
- `application/dto/sync/SyncPushResponseDto.java`

```java
@RestController
@RequestMapping("/api/v1/sync")
public class SyncPushController {
    private final SyncPushUseCase syncPushUseCase;
    
    @PostMapping("/push")
    public Mono<SyncPushResponseDto> push(
        @RequestBody @Valid PushBatchRequest request,
        @AuthenticationPrincipal UserDetails user
    ) {
        return syncPushUseCase.execute(request.operations(), extractUserId(user))
            .map(mapper::toDto);
    }
}
```

Endpoint:
```
POST /api/v1/sync/push
Body: { "operations": [{ "operationId": "uuid", "entityType": "SALE", "action": "CREATE", "payload": {...} }, ...] }
Response: { "results": [{ "operationId": "...", "accepted": true, "data": {...} }, ...] }
```

#### A7.1.4 — SyncLog writing on existing online operations

Para consistencia, las operaciones ONLINE también deben escribir a sync_log.
Esto asegura que el cursor de pull incluya TODOS los cambios, no solo los que vienen de offline.

**Files to Modify:** 9 use cases de comando (Product, Sale, Purchase, Category, Customer, Supplier, Transfer, Adjustment, Return) — inyectar `SyncLogWriterPort`:

> ⚠️ **Coordinación A1**: si la fase A1 ya se ejecutó, esos 6 use cases ya tienen `AuditLogRepository`. Agregar `SyncLogWriterPort` además sin reemplazar. Ambas dependencias coexisten.

```java
// En cada use case, después de operación exitosa:
return repository.save(entity)
    .flatMap(saved -> syncLogWriter.log("PRODUCT", saved.getId(), "CREATE", saved, null)
        .thenReturn(saved));
```

---

### Files Summary A7

| Sub-fase | Archivos | Acción |
|----------|----------|--------|
| A7.0.1 — IdempotencyService | `IdempotencyRepository.java`, `IdempotencyService.java`, `IdempotencyKeyEntity.java`, `IdempotencyRepositoryAdapter.java`, `IdempotencyMapper.java` | Crear |
| A7.0.2 — SyncLogWriter | `SyncLogWriterPort.java`, `SyncLogWriterService.java`, `SyncLogWriterAdapter.java` | Crear |
| A7.0.3 — Retention + device_cursors | `V18__add_device_cursors.sql`, `V19__add_sync_log_indices.sql`, `SyncLogRetentionService.java` | Crear |
| A7.1 — Push Endpoint | `OperationRouter.java`, `PushUseCase.java`, `SyncPushController.java`, `PushBatchRequest.java`, `PushOperationRequest.java`, `PushResult.java` | Crear |
| A7.1.4 — SyncLog writing | Modificar 6 use cases existentes (mismos de A1.4) | Modificar |
| A7.2 — IndexedDB Schema | `db.ts` (modificar), store types | Modificar |
| A7.3 — SyncService push | `SyncService.ts` (modificar) | Modificar |
| A7.4 — Repo integration | `ProductCacheService.ts`, repositorios varios | Modificar |
| A7.8 — Delta sync | `SyncController.java` (modificar), `R2dbcSyncLogRepository.java` (modificar) | Modificar |

---

### A7.2 — Frontend: IndexedDB Schema Completo

> Expandir db.ts de 3 stores a 11 stores, activar exports reales.
>
> **Presupuesto de almacenamiento IndexedDB**: Con todos los stores activos, el consumo estimado es ~15-20 MiB (sin imágenes):
> - Products: ~500 bytes × 5,000 items = 2.5 MiB
> - Customers: ~300 bytes × 10,000 = 3 MiB  
> - Sales cache: ~1 KB × 500 recent = 0.5 MiB
> - StockBalances: ~200 bytes × 50,000 = 10 MiB (store más grande)
> - Resto (categories, warehouses, etc.): ~1 MiB
> - ImageCache: hasta 50 MiB (LRU, límite explícito)
>
> En navegadores móviles, IndexedDB puede ser evictado si el dispositivo tiene poco espacio. Usar `navigator.storage.estimate()` (A7.6.3) para mostrar advertencia si hay <50 MiB disponibles. `requestPersistentStorage()` (abajo) reduce riesgo de evicción en iOS/Chrome.

#### A7.2.1 — Nuevo schema IndexedDB

**File to Rewrite:** `frontend/src/infrastructure/storage/db.ts`

**⚠️ Versiones de migración — `upgrade()` debe manejar cada versión intermedia:**

| DB_VERSION | Stores que se crean |
|-----------|---------------------|
| 1 (actual, comentado) | `outbox`, `syncMeta`, `products` |
| 2 (A7.2) | `categories`, `warehouses`, `stockBalances`, `customers`, `suppliers`, `currencies`, `exchangeRates`, `sales`, `purchases`, `transfers`, `adjustments`, `returns`, `customerDebts`, `notifications`, `deadLetter` |
| 3 (A7.7) | `imageCache` |

```typescript
import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from 'idb';

const MAX_OUTBOX_ENTRIES = 500;
const DB_NAME = 'inventory-offline';
const DB_VERSION = 3;
const DB_OPEN_TIMEOUT = 5_000;

function upgradeSchema(db: IDBPDatabase<InventoryDB>, oldVersion: number, _newVersion: number) {
  if (oldVersion < 1) {
    const outbox = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
    outbox.createIndex('by-status', 'status');
    outbox.createIndex('by-created', 'createdAt');
    db.createObjectStore('syncMeta', { keyPath: 'key' });
    const products = db.createObjectStore('products', { keyPath: 'id' });
    products.createIndex('by-sku', 'sku');
    products.createIndex('by-barcode', 'barcode');
    products.createIndex('by-category', 'categoryId');
  }
  if (oldVersion < 2) {
    db.createObjectStore('categories', { keyPath: 'id' });
    db.createObjectStore('warehouses', { keyPath: 'id' });
    const sb = db.createObjectStore('stockBalances', { keyPath: 'id' });
    sb.createIndex('by-warehouse', 'warehouseId');
    sb.createIndex('by-product', 'productId');
    const cust = db.createObjectStore('customers', { keyPath: 'id' });
    cust.createIndex('by-code', 'code');
    cust.createIndex('by-name', 'name');
    const supp = db.createObjectStore('suppliers', { keyPath: 'id' });
    supp.createIndex('by-code', 'code');
    supp.createIndex('by-name', 'name');
    db.createObjectStore('currencies', { keyPath: 'id' });
    db.createObjectStore('exchangeRates', { keyPath: 'id' });
    const sales = db.createObjectStore('sales', { keyPath: 'id' });
    sales.createIndex('by-number', 'saleNumber');
    sales.createIndex('by-date', 'cachedAt');
    sales.createIndex('by-customer', 'customerId');
    const purchases = db.createObjectStore('purchases', { keyPath: 'id' });
    purchases.createIndex('by-number', 'purchaseNumber');
    purchases.createIndex('by-date', 'cachedAt');
    purchases.createIndex('by-supplier', 'supplierId');
    const transfers = db.createObjectStore('transfers', { keyPath: 'id' });
    transfers.createIndex('by-number', 'transferNumber');
    transfers.createIndex('by-date', 'cachedAt');
    const adjustments = db.createObjectStore('adjustments', { keyPath: 'id' });
    adjustments.createIndex('by-number', 'adjustmentNumber');
    adjustments.createIndex('by-date', 'cachedAt');
    const returns = db.createObjectStore('returns', { keyPath: 'id' });
    returns.createIndex('by-number', 'returnNumber');
    returns.createIndex('by-date', 'cachedAt');
    const debts = db.createObjectStore('customerDebts', { keyPath: 'id' });
    debts.createIndex('by-customer', 'customerId');
    debts.createIndex('by-status', 'status');
    const notif = db.createObjectStore('notifications', { keyPath: 'id' });
    notif.createIndex('by-date', 'createdAt');
    notif.createIndex('by-read', 'read');
    const dl = db.createObjectStore('deadLetter', { keyPath: 'operationId' });
    dl.createIndex('by-rejectedAt', 'rejectedAt');
    dl.createIndex('by-userNotified', 'userNotified');
  }
  if (oldVersion < 3) {
    const img = db.createObjectStore('imageCache', { keyPath: 'relativePath' });
    img.createIndex('by-lastAccessed', 'lastAccessed');
  }
}

interface InventoryDB extends DBSchema {
  outbox: {
    key: number;
    value: OutboxEntry;
    indexes: { 'by-status': string; 'by-created': number };
  };
  syncMeta: {
    key: string;
    value: { key: string; value: unknown };
  };
  products: {
    key: string;
    value: CachedProduct;
    indexes: { 'by-sku': string; 'by-barcode': string; 'by-category': string };
  };
  categories: { key: string; value: CachedCategory };
  warehouses: { key: string; value: CachedWarehouse };
  stockBalances: {
    key: string;  // `${warehouseId}_${productId}`
    value: CachedStockBalance;
    indexes: { 'by-warehouse': string; 'by-product': string };
  };
  customers: {
    key: string;
    value: CachedCustomer;
    indexes: { 'by-code': string; 'by-name': string };
  };
  suppliers: {
    key: string;
    value: CachedSupplier;
    indexes: { 'by-code': string; 'by-name': string };
  };
  currencies: { key: string; value: CachedCurrency };
  exchangeRates: { key: string; value: CachedExchangeRate };
  sales: { key: string; value: CachedSale; indexes: { 'by-number': string; 'by-date': number; 'by-customer': string } };
  purchases: { key: string; value: CachedPurchase; indexes: { 'by-number': string; 'by-date': number; 'by-supplier': string } };
  transfers: { key: string; value: CachedTransfer; indexes: { 'by-number': string; 'by-date': number } };
  adjustments: { key: string; value: CachedAdjustment; indexes: { 'by-number': string; 'by-date': number } };
  returns: { key: string; value: CachedReturn; indexes: { 'by-number': string; 'by-date': number } };
  customerDebts: { key: string; value: CachedCustomerDebt; indexes: { 'by-customer': string; 'by-status': string } };
  notifications: { key: string; value: CachedNotification; indexes: { 'by-date': number; 'by-read': number } };
  deadLetter: {
    key: string;  // operationId
    value: DeadLetterEntry;
    indexes: { 'by-rejectedAt': number; 'by-userNotified': number };
  };
  imageCache: {
    key: string;  // relativePath
    value: { relativePath: string; blob: Blob; size: number; cachedAt: number; lastAccessed: number };
    indexes: { 'by-lastAccessed': number };
  };
}
```

Cada `Cached*` type incluye `cachedAt: number` para stale detection.
Stores adicionales (imageCache) se agregan en A7.6.

**Persistent Storage — evitar eviction en iOS/Chrome:**
```typescript
// Solicitar almacenamiento persistente en el primer login.
// iOS Safari purga IndexedDB sin aviso si el origen supera ~50 MiB.
export async function requestPersistentStorage(): Promise<void> {
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist();
    await setSyncMeta('persistentStorage', granted);
  }
}

// Chequeo de cuota antes de cachear — dispara cleanup si >80%
export async function checkStorageQuota(): Promise<void> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    const usedPercent = (usage! / quota!) * 100;
    if (usedPercent > 80) {
      console.warn(`[IDB] Storage at ${usedPercent.toFixed(0)}% — triggering cleanup`);
      await cleanupStaleData();
    }
  }
}
```
Llamar `requestPersistentStorage()` en `initPersistence()`. Llamar `checkStorageQuota()` periódicamente (cada 5 syncs).

#### A7.2.2 — Funciones de acceso por store

Patrón: cada store tiene `getAll`, `getById`, `saveMany`, `deleteAll`, `count`.

**Nuevas funciones en db.ts — upsert individual (NUNCA reemplazar store completo):**
```typescript
// ⚠️ Upsert individual por ID. Nunca usar put() con lista completa ni delete() + addAll()
// porque una llamada paginada/filtrada sobrescribiría datos de otras páginas.
// Cada entidad se guarda con su propio keyPath (id). put() hace upsert: si existe → update; si no → insert.
export async function cacheProducts(products: CachedProduct[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  for (const p of products) {
    p.cachedAt = Date.now();
    await tx.store.put(p); // upsert individual por id
  }
  await tx.done;
}
export async function getCachedProducts(): Promise<CachedProduct[]> { ... }
export async function getCachedProduct(id: string): Promise<CachedProduct | undefined> { ... }
// ... mismo patrón para categories, warehouses, stockBalances, customers, suppliers, currencies, exchangeRates
```

#### A7.2.3 — Activar outbox.ts

**File to Rewrite:** `frontend/src/infrastructure/storage/outbox.ts`

```typescript
import { getDB, canAddToOutbox, type OutboxEntry } from './db';

export async function addToOutbox(entry: Omit<OutboxEntry, 'id' | 'createdAt' | 'retryCount' | 'maxRetries'>): Promise<void> {
  const allowed = await canAddToOutbox();
  if (!allowed) throw new Error('Outbox limit reached. Sync pending changes before adding more.');
  const db = await getDB();
  await db.add('outbox', { ...entry, createdAt: Date.now(), retryCount: 0, maxRetries: 3 });
}

> ⚠️ **Consistencia de nombres**: El código comentado original en `db.ts`/`outbox.ts` usaba `retries: number`. La interfaz nueva migró a `retryCount: number` (con `maxRetries` explícito). **Al activar outbox.ts, asegurar que TODO el código use `retryCount` — no `retries`.** Esto incluye:
> - `db.ts` type `OutboxEntry.retryCount` (no `retries`)
> - `outbox.ts` `addToOutbox()` `Omit<..., 'retryCount' | 'maxRetries'>` (no `'retries'`)
> - `outbox.ts` `incrementRetry()` accede a `entry.retryCount` (no `entry.retries`)
> - `SyncService.ts` `pushOutbox()` compara `entry.retryCount >= 5` (no `entry.retries`)
> - `exponentialBackoff()` usa `retryCount` como parámetro (ya está correcto)

export async function getPendingOutbox(): Promise<OutboxEntry[]> {
  const db = await getDB();
  // ⚠️ Filtrar solo 'pending' (no syncing/rejected)
  return db.getAllFromIndex('outbox', 'by-status', IDBKeyRange.only('pending'));
}

export async function removeFromOutbox(id: number): Promise<void> { ... }
export async function incrementRetry(id: number): Promise<void> { ... }
export async function updateRetry(id: number, retryCount: number, nextRetryAt: number, lastError?: string): Promise<void> { ... }
export async function getOutboxCount(): Promise<number> { ... }
export async function markOutboxEntry(id: number, status: string): Promise<void> { ... }
export async function getDeadLetters(): Promise<DeadLetterEntry[]> { ... }
export async function retryDeadLetter(operationId: string): Promise<void> { ... }
export async function discardDeadLetter(operationId: string): Promise<void> { ... }

export async function moveToDeadLetter(entry: OutboxEntry): Promise<void> {
  const db = await getDB();
  await db.add('deadLetter', {
    operationId: entry.operationId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    payload: entry.payload,
    error: entry.lastError ?? 'Max retries exceeded',
    retryCount: entry.retryCount,
    rejectedAt: Date.now(),
    userNotified: false,
  });
  await removeFromOutbox(entry.id!);
}

export async function retryDeadLetter(operationId: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('deadLetter', operationId);
  if (!entry) return;
  await addToOutbox({
    operationId: entry.operationId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    payload: entry.payload,
  });
  await db.delete('deadLetter', operationId);
}

export async function discardDeadLetter(operationId: string): Promise<void> {
  const db = await getDB();
  await db.delete('deadLetter', operationId);
}
```

**OutboxEntry interface:**
```typescript
export interface OutboxEntry {
  id?: number;
  operationId: string;       // UUID v4 (idempotency key)
  entityType: string;        // PRODUCT, SALE, PURCHASE, etc.
  entityId: string;          // UUID of the entity
  action: string;            // CREATE, UPDATE, DELETE, CANCEL
  payload: unknown;          // Full request body
  expectedVersion?: number;  // For optimistic locking
  status: 'pending' | 'syncing' | 'accepted' | 'rejected';
  retryCount: number;
  maxRetries: number;        // default 3 — superado → pasa a deadLetter store
  nextRetryAt: number;       // epoch ms — no reintentar antes
  expiresAt: number;         // epoch ms — default: createdAt + 72h; expirada → dead automático
  lastError?: string;
  createdAt: number;
}

export interface DeadLetterEntry {
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  error: string;
  retryCount: number;
  rejectedAt: number;
  userNotified: boolean;
}

// Exponential backoff: 30s, 2m, 8m, 32m, 2h
function nextRetryDelay(retryCount: number): number {
  return Math.min(30_000 * Math.pow(4, retryCount), 7_200_000);
}
```

#### A7.2.4 — Activar ProductCacheService

**File to Rewrite:** `frontend/src/infrastructure/storage/ProductCacheService.ts`

Descomentar completamente. Las funciones `saveProducts`, `getAllProducts`, `getProduct`, `clearProducts`, `getProductsCount` deben estar vivas y funcionales.

Agregar un helper `isStale(cachedAt: number, maxAgeMs: number): boolean` para decidir cuándo refrescar del servidor.

#### A7.2.5 — Limpieza de datos stale en IndexedDB

> Sin limpieza, `sales`, `notifications`, etc. acumulan datos viejos indefinidamente.

**Política de retención por store:**

| Store | Retención | Criterio |
|-------|-----------|----------|
| `outbox` | Auto | Se elimina al aceptar. Dead letters: purgar tras 7d |
| `products` | Permanente | Solo se elimina por sync DELETE |
| `categories` | Permanente | Solo sync |
| `sales` | 30 días | `cachedAt < now - 30d` |
| `purchases` | 30 días | `cachedAt < now - 30d` |
| `customerDebts` | Permanente si activa | Eliminar cuando `status=PAID && updatedAt > 30d` |
| `notifications` | 7 días | `cachedAt < now - 7d` |
| `imageCache` | LRU 50 MiB | Ya definido en A7.7 |

**Agregar en `db.ts`:**
```typescript
export async function cleanupStaleData(): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  // ⚠️ Usar cursor IDB en lugar de getAll() para evitar OOM con 5000+ items
  // Requiere índice 'by-date' en sales/notifications que indexe cachedAt
  await deleteStaleByCursor(db, 'sales', now - THIRTY_DAYS);
  await deleteStaleByCursor(db, 'notifications', now - SEVEN_DAYS);
}

async function deleteStaleByCursor(db: IDBPDatabase<InventoryDB>, store: string, cutoff: number) {
  const tx = db.transaction(store as any, 'readwrite');
  const index = tx.objectStore(store as any).index('by-date');
  let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
```
> ⚠️ Requiere que los stores `sales` y `notifications` tengan un índice `'by-date'` que indexe `cachedAt` (no `saleDate`). Esto ya está definido en A7.2.1 en los tipos `InventoryDB.sales.indexes['by-date']` y `InventoryDB.notifications.indexes['by-date']`.

**Ejecutar 1 vez por semana en `DashboardLayout` al iniciar la app.**

---
#### A7.2.6 — Offline token management + auto-refresh on reconnect

> ⚠️ **Riesgo actual**: "Si token expires → login required" pierde las operaciones pendientes en outbox. El usuario podría tener 20 transacciones offline que se pierden si el token expira mientras está desconectado.

**Solución**: Almacenar BOTH access token + refresh token en IndexedDB (`syncMeta`). Al detectar reconexión, intentar refresh automático antes de cualquier push/pull. El login manual solo se requiere si el refresh falla.

```typescript
// frontend/src/infrastructure/storage/authStore.ts (o donde se maneje auth)
interface PersistedAuth {
  accessToken: string;
  refreshToken: string;     // UUID hasheado, mismo que se envía a /auth/refresh
  expiresAt: number;        // timestam del epoch cuando expira accessToken
  tokenType: string;
}

// Al reconectar (en useNetworkHealth o SyncService.init):
export async function tryRefreshTokenOnReconnect(): Promise<boolean> {
  const auth = await getSyncMeta<PersistedAuth>('auth_tokens');
  if (!auth) return false;

  // Si el token aún no expiró, no hacer nada
  if (Date.now() < auth.expiresAt) return true;

  // Intentar refresh silencioso
  try {
    const response = await apiClient.post('/api/v1/auth/refresh', {
      refreshToken: auth.refreshToken
    });
    const newAuth: PersistedAuth = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? auth.refreshToken,
      expiresAt: Date.now() + response.data.expiresIn * 1000,
      tokenType: response.data.tokenType ?? 'Bearer',
    };
    await setSyncMeta('auth_tokens', newAuth);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAuth.accessToken}`;
    return true;
  } catch {
    // Refresh falló (refresh token expiró o fue revocado) → login manual requerido
    // NO limpiar outbox — las operaciones pendientes se preservan en IndexedDB
    return false;
  }
}
```

**Flujo completo** (en `SyncService.init()` o `useNetworkHealth`):
```
1. Detectar reconexión (ping a /api/health)
2. tryRefreshTokenOnReconnect()
   → true: continuar con pushOutbox() → pullDeltaSync()
   → false: mostrar modal "Sesión expirada. Inicia sesión para continuar."
             → NO perder outbox entries (siguen en IndexedDB)
             → onSubmit login: llamar a /auth/login, guardar nuevos tokens, continuar sync
```

**Regla**: Las operaciones en outbox NUNCA se pierden por expiración de token. El outbox es persistente en IndexedDB. Al re-login exitoso, el sync continúa automáticamente.

---

### A7.3 — Frontend: Activar SyncService (solo pushOutbox)

> Push batch via `POST /api/v1/sync/push`.
> ⚠️ **No implementar `pullSync()` ni `applyPullEntries()` aquí.** La función global con multi-store transaction está obsoleta. Usar `pullDeltaSync()` (A7.8) exclusivamente — transacciones individuales por store, sin conflicto de tx en IndexedDB. `useSyncStatus` llama siempre a `pushOutbox()` → `pullDeltaSync()` (A7.8).

**File to Rewrite:** `frontend/src/infrastructure/storage/SyncService.ts`

```typescript
import { apiClient } from '@/infrastructure/api/client';
import { getDB } from './db';
import { getPendingOutbox, removeFromOutbox, markOutboxEntry, moveToDeadLetter, updateRetry } from './outbox';
import axios from 'axios';

const MAX_RETRIES = 3;
const MAX_BATCH_SIZE = 50;

export interface PushResult {
  pushed: number;
  failed: number;
  total: number;
  incidents: string[];
  conflicts: number;
}

export async function pushOutbox(): Promise<PushResult> {
  const db = await getDB();
  const pending = await db.getAllFromIndex('outbox', 'by-status', 'pending');
  
  const now = Date.now();
  const eligible = pending.filter(e =>
    e.retryCount < (e.maxRetries ?? 3) &&
    (e.nextRetryAt ?? 0) <= now
  );
  const dead = pending.filter(e => e.retryCount >= (e.maxRetries ?? 3));
  for (const entry of dead) {
    await moveToDeadLetter(entry);
  }
  
  let accepted = 0;
  let rejected = 0;
  let conflicts = 0;
  
  for (let i = 0; i < eligible.length; i += MAX_BATCH_SIZE) {
    const batch = eligible.slice(i, i + MAX_BATCH_SIZE);
    
    for (const entry of batch) {
      await markOutboxEntry(entry.id!, 'syncing');
    }
    
    try {
      const response = await apiClient.post('/api/v1/sync/push', {
        operations: batch.map(e => ({
          operationId: e.operationId,
          entityType: e.entityType,
          action: e.action,
          payload: e.payload,
        }))
      });
      
      for (const result of response.data.results) {
        const entry = batch.find(e => e.operationId === result.operationId);
        if (!entry) continue;
        
        if (result.accepted) {
          await markOutboxEntry(entry.id!, 'accepted');
          await removeFromOutbox(entry.id!);
          accepted++;
        } else {
          // 409/404: no recuperable → deadLetter inmediato
          if (result.status === 409 || result.status === 404) {
            await moveToDeadLetter({
              ...entry,
              lastError: result.error ?? 'Conflicto no recuperable',
              retryCount: entry.retryCount,
            });
            conflicts++;
          } else {
            const newRetryCount = entry.retryCount + 1;
            await markOutboxEntry(entry.id!, 'pending');
            await updateRetry(entry.id!, newRetryCount, Date.now() + nextRetryDelay(newRetryCount), result.error);
            rejected++;
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 409 || status === 404) {
          for (const entry of batch) {
            await moveToDeadLetter({
              ...entry,
              lastError: error.response?.data?.detail ?? `HTTP ${status}`,
              retryCount: entry.retryCount,
            });
          }
          conflicts += batch.length;
          continue;
        }
      }
      for (const entry of batch) {
        const newRetryCount = entry.retryCount + 1;
        await markOutboxEntry(entry.id!, 'pending');
        await updateRetry(entry.id!, newRetryCount, Date.now() + nextRetryDelay(newRetryCount), 'Network error');
      }
      rejected += batch.length;
    }
  }
  
  // ⚠️ Recuperar entries stuck en 'syncing' si la red falló a mitad del POST.
  // Un crash de pestaña o timeout puede dejar entries como 'syncing' para siempre.
  // Se resetean a 'pending' si nextRetryAt ya pasó (backoff vencido).
  const stuckSyncing = await db.getAllFromIndex('outbox', 'by-status', 'syncing');
  for (const entry of stuckSyncing) {
    if (entry.nextRetryAt != null && entry.nextRetryAt <= now) {
      await markOutboxEntry(entry.id!, 'pending');
    }
  }

  return { pushed: accepted, failed: rejected, total: accepted + rejected, conflicts };
}
```

#### A7.3.0 — Outbox: límite de cola y política de bloqueo

> Cuando el outbox alcanza `sync.outbox-limit` (default 500), se bloquean nuevas operaciones con un toast. Esto evita que un usuario genere 2000 operaciones offline y al reconectar colapse el batch push.

```typescript
// En outbox.ts — antes de agregar al outbox:
export async function enqueueOrBlock(operation: Omit<OutboxEntry, 'id' | 'createdAt' | 'retryCount' | 'maxRetries'>): Promise<void> {
  const allowed = await canAddToOutbox();
  if (!allowed) {
    throw new OfflineQueueFullError(
      'Cola offline llena (' + limit + ' operaciones). Conéctate para sincronizar antes de continuar.'
    );
  }
  await addToOutbox(operation);
}

// OfflineQueueFullError — error tipado para que el repositorio lo detecte y muestre toast
export class OfflineQueueFullError extends Error {
  name = 'OfflineQueueFullError';
}
```

> ⚠️ **Comportamiento UI**: El repositorio captura `OfflineQueueFullError` y mustra un toast: "Cola offline llena. Conectate para continuar." No se pierden datos — el usuario debe conectar para que `pushOutbox()` drene la cola.

#### A7.3.1 — pushOutbox: conflictos 409/404 van a deadLetter, no reintentan

**File to Rewrite:** `frontend/src/presentation/shared/hooks/storage/useSyncStatus.ts`

Reemplazar dummy con la lógica comentada que ya existe en el archivo:
- `sync()` llama a `pushOutbox()` → `pullSync()`
- Auto-sync cada 30s cuando online
- Estados: `online | offline | syncing | error`
- `pendingCount` = `getOutboxCount()`

#### A7.3.2 — Pull de catálogos con TTL (5 min)

> Los catálogos de lectura frecuente (productos, categorías, almacenes) se re-sincronizan automáticamente al reconectarse si tienen >5 min de antigüedad. Esto ocurre DESPUÉS de drenar el outbox, para que la UI tenga datos frescos.

> ⚠️ **Dos mecanismos distintos, no confundir**:
> - `catalog_last_sync` (timestamp): GUARDIÁN de TTL. Responde "¿es necesario revisar el servidor?" Se guarda en `syncMeta` con clave `'catalog_last_sync'`. Es un timestamp.
> - `getStoreCursor(store)` (cursor entero): MECANISMO de delta sync. Responde "¿qué cambios hubo desde mi último pull?" Se guarda en `syncMeta` con clave `'cursor_{store}'`. Es un ID de `sync_log`.
>
> El timestamp es el guardián (evita llamar al servidor si el cache está fresco). El cursor es el mecanismo (hace pull incremental). Ambos coexisten. Los nombres son diferentes para evitar ambigüedad.

```typescript
// En SyncService.ts — después de pushOutbox exitoso:
const CATALOG_TTL_MS = 5 * 60 * 1000;

export async function pullCatalogsIfStale(): Promise<void> {
  const lastSync = await getSyncMeta('catalog_last_sync');
  if (lastSync && Date.now() - (lastSync as number) < CATALOG_TTL_MS) return;

  const stores = ['products', 'categories', 'warehouses'];
  const results = await Promise.allSettled(stores.map(pullCatalog));
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      console.warn(`[Sync] catalog pull failed for ${stores[i]}:`, result.reason);
    }
  }
  await setSyncMeta('catalog_last_sync', Date.now());
}

async function pullCatalog(store: string): Promise<void> {
  const cursor = await getStoreCursor(store);
  const url = store === 'warehouses' ? '/api/v1/warehouses' : '/api/v1/' + store;
  const response = await apiClient.get(url);
  await cacheStoreData(store, response.data.data);
}
```

> ⚠️ **TTL vs stale**: 5 min es suficiente para POS. Productos se crean/editan pocas veces al día. Si algún admin cambia un producto, el delta sync (A7.8) lo capturará en el próximo pull cíclico.

#### A7.3.3 — Dead Letter UI (Sync Incidents Panel)

El plan menciona "panel de Operaciones fallidas" pero no define archivos. Agregar:

**Files to Create:**
- `frontend/src/presentation/modules/sync/views/SyncIncidentsView.tsx`
- `frontend/src/presentation/modules/sync/components/DeadLetterList.tsx`
- `frontend/src/presentation/modules/sync/hooks/useDeadLetters.ts`
- `frontend/src/app/(admin)/sync/incidents/page.tsx`

**Comportamiento:**
- `useDeadLetters()` llama a `getDeadLetters()` de `db.ts` — retorna entries de la store `deadLetter` (separada de outbox)
- `DeadLetterList.tsx` muestra tabla con: entityType, action, error, rejectedAt
- Acciones por fila:
  - "Reintentar" (→ `retryDeadLetter(operationId)` → re-agrega a outbox como 'pending')
  - "Editar y reintentar" — abre modal con el payload JSON editable + campos tipados según entityType. El usuario modifica (ej: bajar cantidad de una venta con stock insuficiente) y al guardar se re-agrega al outbox con el payload modificado.
  - "Descartar" (→ `discardDeadLetter(operationId)` → elimina de deadLetter store)
  - "Ver payload" (JSON viewer modal sin edición)
- `SyncIncidentsView.tsx` wrappea `DeadLetterList` en page con layout responsive
- Ruta: `/sync/incidents` (app router)
- La entrada al panel desde el `NetworkIcon` o `SyncStatusBadge` cuando `pending > 0` o hay dead letters sin notificar

**Backend (SyncIncident entity, opcional v2):**
- Por ahora dead letters solo existen en IndexedDB (store `deadLetter` en db.ts)
- Para v2: `domain/model/sync/SyncIncident.java` + `domain/ports/out/SyncIncidentRepository.java` + migration para persistencia server-side

---

### A7.4 — Frontend: Integración con Repositorios

> Modificar repositorios para que usen IndexedDB como fallback.
>
> **⚠️ Patrón `useNetworkAware`**: Cada repositorio de infraestructura debe consultar el estado de red antes de escribir. No asumir que `navigator.onLine` es confiable (puede dar falsos positivos con captive portals o WiFi sin internet). Usar el Zustand store `networkStore` (A7.4.3) como única fuente de verdad:
>
> ```typescript
> // En cada repositorio de escritura:
> import { getNetworkMode } from '@/infrastructure/storage/networkStore';
>
> async create(data: CreateData): Promise<Sale> {
>   const mode = getNetworkMode(); // 'online-direct' | 'online-degraded' | 'offline'
>   if (mode === 'online-direct') {
>     return apiClient.post('/api/v1/sales', data).then(r => r.data);
>   }
>   if (mode === 'online-degraded') {
>     try { return await apiClient.post('/api/v1/sales', data).then(r => r.data); }
>     catch { /* fall through to outbox */ }
>   }
>   // offline → outbox
>   return enqueueAndReturnOptimistic(data);
> }
> ```
>
> Este patrón reemplaza el chequeo directo de `navigator.onLine` y aplica a TODOS los repos de escritura listados en A7.4.2.
>
> **⚠️ Fuente de verdad según modo:**
> | Estado | Fuente UI | IndexedDB |
> |--------|-----------|-----------|
> | **Online-direct** | TanStack Query → API (la única fuente de verdad). IDB es solo buffer para fallback offline. | Se actualiza en background al cachear respuestas API |
> | **Online-degraded** | IDB primero, API como refuerzo si responde | Fuente primaria |
> | **Offline** | IDB exclusivamente | Fuente única |
>
> Los repositorios **nunca** devuelven datos de IDB cuando están en `online-direct` — solo en fallback por error de red.
>
> **Comportamiento según feature flag + conectividad (contrato UX explícito):**
> | `OFFLINE_ENABLED` | `navigator.onLine` | GET | POST/PUT/DELETE |
> |-------------------|--------------------|-----|-----------------|
> | `false` (default) | — | Directo al backend. Sin IndexedDB. | Directo al backend. Sin outbox. |
> | `true` | `true` (online) | **Cache-first**: IndexedDB inmediato (UI instantánea) → background fetch → actualiza IDB con respuesta. TTL por store (ver estrategia por modelo). | **Directo al backend** → actualiza cache IDB con respuesta del servidor. Sin outbox (hay conexión). |
> | `true` | `false` (offline) | IndexedDB exclusivamente. Toast informativo. | **Outbox**: guarda en IndexedDB, retorna objeto optimista con `id: "temp_{id}"`. Badge "N pendientes". |
>
> En `OFFLINE_ENABLED=true` + online, el **GET usa cache-first** incluso con conexión. Esto da UI instantánea (IndexedDB es síncrono, lectura ~1ms vs API ~200ms). La actualización es transparente para TanStack Query (se invalida query en background).

#### A7.4.1 — Estrategia de Lectura (GET)

Para repositorios de lectura (ProductRepository, CategoryRepository, etc.):

```typescript
// ProductRepository.getAll() — nuevo flujo:
async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
  try {
    const response = await apiClient.get<PaginatedResponse<Product>>(url);
    // Cachear en IndexDB para offline — SOLO si es fetch sin filtros (lista completa).
    // Con filtros activos, NO cachear (los datos son parciales y sobrescribirían).
    // TanStack Query con staleTime apropiado ya evita refetches innecesarios.
    // ⚠️ cacheProducts hace upsert individual por ID — nunca reemplaza el store completo.
    const isFullList = !filters || Object.keys(filters).length === 0;
    if (isFullList) {
      await cacheProducts(response.data.data);
    }
    return response.data;
  } catch {
    // Fallback a IndexedDB si es offline (usar networkStore, no navigator.onLine)
    if (getNetworkMode() === 'offline') {
      const cached = await getCachedProductList();
      return { data: cached, total: cached.length };
    }
    throw; // Otro error (4xx, 5xx) no se traga
  }
}
```

**Files to Modify** (14 repos de lectura — exact paths):
- `frontend/src/infrastructure/repositories/product/ProductRepository.ts`
- `frontend/src/infrastructure/repositories/category/CategoryRepository.ts`
- `frontend/src/infrastructure/repositories/warehouse/WarehouseRepository.ts`
- `frontend/src/infrastructure/repositories/customer/CustomerRepository.ts`
- `frontend/src/infrastructure/repositories/supplier/SupplierRepository.ts`
- `frontend/src/infrastructure/repositories/currency/CurrencyRepository.ts`
- `frontend/src/infrastructure/repositories/exchange-rate/ExchangeRateRepository.ts`
- `frontend/src/infrastructure/repositories/stock/StockRepository.ts`
- `frontend/src/infrastructure/repositories/movement/MovementRepository.ts`
- `frontend/src/infrastructure/repositories/sale/SaleRepository.ts`
- `frontend/src/infrastructure/repositories/purchase/PurchaseRepository.ts`
- `frontend/src/infrastructure/repositories/transfer/TransferRepository.ts`
- `frontend/src/infrastructure/repositories/adjustment/AdjustmentRepository.ts`
- `frontend/src/infrastructure/repositories/return/ReturnRepository.ts`

Para cada uno: try API → cachear en IndexedDB → catch offline → fallback a cache local.

#### A7.4.2 — Estrategia de Escritura (POST/PUT/DELETE)

```typescript
// En el apiClient interceptor o en cada repositorio:
async create(data: CreateData): Promise<Product> {
  const mode = getNetworkMode();
  if (mode === 'online-direct') {
    const response = await apiClient.post(this.basePath, data);
    // ⚠️ CREDIT sale: la respuesta incluye CustomerDebt → cachearla también
    if (data.paymentMode === 'CREDIT' && response.data.debt) {
      await cacheCustomerDebt(response.data.debt);
    }
    return response.data;
  }
  // Offline → outbox con retorno optimista
  return enqueueAndReturnOptimistic<Product>(data, 'PRODUCT', 'CREATE');

// ⚠️ Helper inline definido en el mismo repositorio (o en shared util):
async function enqueueAndReturnOptimistic<T>(
  data: T, entityType: string, action: string
): Promise<T & { id: string }> {
  const operationId = crypto.randomUUID();
  await addToOutbox({
    operationId,
    entityType,
    entityId: '',
    action,
    payload: data,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
  });
  return { ...data, id: `temp_${operationId}` } as T & { id: string };
}
}

##### Reconciliación de IDs temporales — Estrategia

> **⚠️ Opción A (recomendada) — invalidación global de TanStack Query**:
> Al completar `pullDeltaSync()`, el frontend ejecuta `queryClient.invalidateQueries()` sin argumentos, que invalida TODAS las queries activas. Esto fuerza un re-render de cada componente con los IDs reales del servidor. Sin reconciliación manual, sin tracking de mapeo `temp_* → UUID real`.
>
> **Ventaja**: Simple, 3 líneas de código, tolera cualquier número de operaciones offline sin lógica extra.
> **Desventaja**: La UI "parpadea" brevemente (componentes se re-renderizan con datos frescos). Aceptable para uso administrativo.
> **Implementación**: En `useSyncStatus.ts`, después del `pullDeltaSync()` exitoso:
> ```typescript
> await pushOutbox();
> await pullDeltaSync();
> queryClient.invalidateQueries(); // invalida TODAS las queries → refresca con IDs reales
> ```
>
> **Opción B (alternativa futura)**: Reconciliación manual mediante mapeo `Map<tempId, realId>` devuelto por el servidor en respuesta push. El frontend reemplazaría IDs en el store de IndexedDB antes de invalidar queries específicas. Requiere ~200 líneas extra con lógica de reemplazo por store. **YAGNI — implementar solo si el "parpadeo" resulta inaceptable en UX.**

**Enfoque**: Agregar el outbox pattern en cada repositorio de escritura, no en el apiClient interceptor. Esto da control granular por operación.

**Files to Modify** (8 repos de escritura con outbox — exact paths):
- `frontend/src/infrastructure/repositories/product/ProductRepository.ts`
- `frontend/src/infrastructure/repositories/sale/SaleRepository.ts`
- `frontend/src/infrastructure/repositories/purchase/PurchaseRepository.ts`
- `frontend/src/infrastructure/repositories/category/CategoryRepository.ts`
- `frontend/src/infrastructure/repositories/customer/CustomerRepository.ts`
- `frontend/src/infrastructure/repositories/supplier/SupplierRepository.ts`
- `frontend/src/infrastructure/repositories/stock/StockRepository.ts`
- `frontend/src/infrastructure/repositories/movement/MovementRepository.ts`

⚠️ **Transfers, Adjustments, Returns NO usan outbox** — requieren stock actualizado. UI muestra "Requiere conexión".

Por modelo, revisar la tabla "Estrategia Offline por Modelo" para determinar la estrategia exacta de cada uno.

#### A7.4.3 — NetworkModeService: 3 modos de operación

> Definir explícitamente qué pasa ONLINE para evitar double-write (API + outbox simultáneos).
> ⚠️ Los repositorios son clases TS puras sin acceso a hooks React. Usar Zustand store compartido.

**File to Create:** `frontend/src/infrastructure/storage/networkStore.ts`

```typescript
import { create } from 'zustand';

export type NetworkMode = 'online-direct' | 'online-degraded' | 'offline';

interface NetworkStore {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  mode: 'online-direct',
  setMode: (mode) => set({ mode }),
}));

// Getter síncrono para usar fuera de React (repositorios):
export function getNetworkMode(): NetworkMode {
  return useNetworkStore.getState().mode;
}
```

| Modo | Cuándo | Lectura | Escritura |
|------|--------|---------|-----------|
| **Online-direct** | `navigator.onLine && backendStatus === 'connected'` | API directo, cachear en IDB en background | API directo, **NO** outbox |
| **Online-degraded** | `navigator.onLine && backendStatus !== 'connected'` | IDB primero, intentar API como refuerzo | API con retry, si falla → outbox |
| **Offline** | `!navigator.onLine` | IDB exclusivamente | Outbox exclusivamente |

```typescript
// En cada repositorio, usar getNetworkMode() del store Zustand:
import { getNetworkMode } from '@/infrastructure/storage/networkStore';

async create(data: CreateData): Promise<Product> {
  const mode = getNetworkMode(); // ← síncrono, sin hooks
  if (mode === 'online-direct') {
    return apiClient.post(...);  // directo, outbox NO involucrado
  }
  if (mode === 'online-degraded') {
    try { return await apiClient.post(...); }
    catch { /* fall through to outbox */ }
  }
  return addToOutboxAndReturnOptimistic(data);
}
```

Esto elimina el escenario donde online=true pero backend caído escribía al outbox innecesariamente.

**Integración en `useNetworkHealth.ts` — actualizar el store cuando cambia backendStatus:**
```typescript
useEffect(() => {
  const mode = !navigator.onLine ? 'offline'
    : backendStatus === 'connected' ? 'online-direct'
    : 'online-degraded';
  useNetworkStore.getState().setMode(mode);
}, [backendStatus, navigator.onLine]);
```

#### A7.4.4 — Hook useNetworkHealth + useSyncStatus coordinados

El `useNetworkHealth` (que ya funciona con ping a `/actuator/health`) debe disparar `sync()` automáticamente cuando detecta transición disconnected → connected.

**File to Modify:** `frontend/src/presentation/shared/hooks/storage/useNetworkHealth.ts`

Agregar callback `onReconnect` que `useSyncStatus` registra:

```typescript
// En useNetworkHealth:
useEffect(() => {
  if (backendStatus === 'connected' && prevStatus === 'disconnected') {
    onReconnect?.(); // dispara sync automático
  }
}, [backendStatus]);
```

---

### A7.5 — Frontend: Service Worker Upgrade

> Estrategias de cache para soporte offline real.

#### A7.5.1 — Nuevo sw.js con caching de API

**File to Rewrite:** `frontend/public/sw.js`

**⚠️ Estrategia: SW cachea solo assets+imágenes, NO API data.** 
IndexedDB es la fuente de verdad para datos de catálogo. El SW no debe duplicar respuestas HTTP de API.

| Route Pattern | Strategy | Cache Name | TTL |
|---------------|----------|------------|-----|
| Navegación (HTML) | Network-first, cache fallback | `inventory-pages-v1` | — |
| Assets estáticos (JS/CSS/fonts) | Cache-first | `inventory-static-v2` | ∞ |
| API imágenes thumb (`*thumb256*`) | Cache-first, LRU | `inventory-thumbs-v1` | 50 MiB |
| API catálogo (`/api/v1/products`, etc.) | **Network-only** (lo maneja IndexedDB) | — | — |
| API stock (`/api/v1/stock/*`) | **Network-only** (lo maneja IndexedDB) | — | — |
| API reports (`/api/v1/reports/*`) | **Network-only** (datos críticos, siempre frescos) | — | — |
| API audit (`/api/v1/audit-logs`) | **Network-only** (auditoría, nunca cachear) | — | — |
| API sync/auth (`/api/v1/sync/*`, `/api/v1/auth/*`) | Network-only | — | — |
| API mutations (`POST/PUT/DELETE`) | Network-only | — | — |

```javascript
// Estrategia stale-while-revalidate para assets visuales:
function staleWhileRevalidate(event, cacheName) {
  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => cachedResponse);
      
      // ⚠️ Si cachedResponse y fetch fallan → 503 explícito, no undefined
      return cachedResponse ?? await fetchPromise ?? new Response('Offline', { status: 503 });
    })
  );
}
```

#### A7.5.2 — Background Sync (opcional, mejora)

Para mutations offline sin polling:
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(
      // Notificar a la app que debe ejecutar pushOutbox()
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_TRIGGERED' }));
      })
    );
  }
});
```

#### A7.5.3 — ServiceWorkerRegistration

**File to Modify:** `frontend/src/presentation/shared/components/layout/ServiceWorkerRegistration.tsx`

No cambiar registro. Solo asegurar que:
- En dev → unregister + clear caches (ya funciona)
- En prod → register + claim (ya funciona)

---

### A7.6 — Frontend: Initial Loading Screen (2 fases)

> Implementar la barra de carga en **2 fases** para no bloquear la UI.
> Los componentes `CacheProgressBar` y `useCacheProgress` ya existen como dummies.

**⚠️ Estrategia: 2 fases de carga**

```
FASE A (bloqueante, rápida ~2s):
  1. App shell + SW activo
  2. Auth token válido
  3. Warehouses (pocos, < 20)
  4. Categories (pocas, < 50)
  → App se muestra. Usuario puede navegar inmediatamente.

FASE B (background, no bloqueante):
  5. Products (paginado, 200 por request)
  6. Customers (paginado)
  7. Suppliers (paginado)
  8. StockBalances (paginado)
  → Badge "Descargando catálogo... 1,200/5,000"
  → Si usuario intenta usar antes de terminar → sirve lo que hay en cache
```

#### A7.6.1 — Activar useCacheProgress

**File to Rewrite:** `frontend/src/presentation/shared/hooks/storage/useCacheProgress.ts`

Reemplazar dummy con lógica real de 2 fases:

```typescript
// FASE A — bloqueante (starts on app launch)
const PHASE_A = [
  { name: 'App shell', weight: 10, check: async () => true },
  { name: 'Autenticación', weight: 10, check: hasValidToken },  // ← check JWT offline
  { name: 'Almacenes', weight: 5, check: async () => (await getCachedCount('warehouses')) > 0 },
  { name: 'Categorías', weight: 5, check: async () => (await getCachedCount('categories')) > 0 },
];

// Función de validación offline — decodifica JWT sin red:
// ⚠️ Verificado con codebase: token en localStorage key 'access_token' (NO httpOnly cookie)
export function hasValidToken(): boolean {
  // Intentar desde localStorage (fuente principal según AuthRepository)
  let token = localStorage.getItem('access_token');
  // Fallback a cookie (proxy middleware Next.js)
  if (!token) {
    token = document.cookie.split('; ').find(r => r.startsWith('access_token='))?.split('=')[1] ?? null;
  }
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const buffer = 5 * 60 * 1000; // 5 min buffer
    return Date.now() < expiresAt - buffer;
  } catch { return false; }
}
// Si FASE A falla en auth → mostrar "Sesión expirada — necesita conexión"
// Al completar Fase A → setAppReady(true), la UI se muestra

// FASE B — background (no bloquea UI)
const PHASE_B = [
  { name: 'Catálogo', weight: 25, check: async () => (await getCachedCount('products')) > 0 },
  { name: 'Clientes', weight: 15, check: async () => (await getCachedCount('customers')) > 0 },
  { name: 'Proveedores', weight: 15, check: async () => (await getCachedCount('suppliers')) > 0 },
  { name: 'Stock', weight: 15, check: async () => (await getCachedCount('stockBalances')) > 0 },
];
```

#### A7.6.2 — Wiring en DashboardLayout

**File to Modify:** `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

Agregar lógica:
- Al cargar la app, si `!isPersistenceReady()` → inicializar
- **Fase A** (bloqueante): ejecutar paso 1-2 (SW + auth → instantáneo), paso 3-4 (warehouses + categories → fetch rápido)
- Al completar Fase A → `setAppReady(true)` → mostrar app (usuario puede navegar)
- **Fase B** (background, sin await): ejecutar pasos 5-8 con paginación de 200 items por request
- Badge o mini barra en navbar: "Sincronizando catálogo... 45%"
- Si el usuario navega a una sección no cacheada aún → fetch normal con loading state
- En recargas: si Fase A ya está cacheada (warehouses + categories > 0), omitir pantalla de carga

```typescript
useEffect(() => {
  initPersistence();
  // Fase A: bloqueante
  await loadCriticalData(); // paso 1-4
  setAppReady(true);        // mostrar app
  // Fase B: background, sin await
  loadCatalogInBackground(); // paso 5-8
}, []);
```

#### A7.6.3 — Storage Usage Monitor (barra de almacenamiento)

> El `CacheProgressBar` debe incluir un indicador de uso de IndexedDB: cuánto espacio ocupa el cache local vs la cuota del navegador, y si es seguro desconectarse o faltan datos por descargar.

**File to Modify:** `frontend/src/presentation/shared/hooks/storage/useCacheProgress.ts`

Agregar `storageUsage` al hook:

```typescript
export interface StorageUsage {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  isLow: boolean;       // < 30% → "Suficiente espacio"
  isWarning: boolean;   // > 80% → "Almacenamiento casi lleno"
  isCritical: boolean;  // > 95% → "Liberar espacio pronto"
  isSupported: boolean; // navigator.storage.estimate() disponible
  readyForOffline: boolean; // Fase A cargada + storage OK
}

async function getStorageUsage(): Promise<StorageUsage> {
  const fallback: StorageUsage = {
    usageBytes: 0, quotaBytes: 0, percentUsed: 0,
    isLow: true, isWarning: false, isCritical: false,
    isSupported: false, readyForOffline: true,
  };
  if (typeof navigator === 'undefined' || !('storage' in navigator) || !('estimate' in navigator.storage)) {
    return fallback;
  }
  try {
    const { usage, quota } = await navigator.storage.estimate();
    const usageBytes = usage ?? 0;
    const quotaBytes = quota ?? 0;
    const percentUsed = quotaBytes > 0 ? usageBytes / quotaBytes : 0;
    return {
      usageBytes, quotaBytes, percentUsed,
      isLow: percentUsed < 0.3,
      isWarning: percentUsed >= 0.8,
      isCritical: percentUsed >= 0.95,
      isSupported: true,
      readyForOffline: percentUsed < 0.95, // aún hay espacio
    };
  } catch {
    return fallback;
  }
}
```

**File to Modify:** `frontend/src/presentation/shared/components/network-status/CacheProgressBar.tsx`

Agregar barra de almacenamiento debajo de los módulos:

```typescript
interface StorageBarProps {
  usage: StorageUsage;
}

function StorageBar({ usage }: StorageBarProps) {
  if (!usage.isSupported) return null;
  const color = usage.isCritical ? 'bg-red-500'
    : usage.isWarning ? 'bg-yellow-500'
    : 'bg-green-500';
  const text = usage.isCritical ? `${(usage.percentUsed * 100).toFixed(0)}% usado — Liberar espacio`
    : usage.isWarning ? `${(usage.percentUsed * 100).toFixed(0)}% usado — Almacenamiento casi lleno`
    : `${(usage.percentUsed * 100).toFixed(0)}% usado — Suficiente espacio`;

  return (
    <div className="space-y-1 pt-2 border-t">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Almacenamiento local</span>
        <span className="font-medium">{formatBytes(usage.usageBytes)} / {formatBytes(usage.quotaBytes)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(usage.percentUsed * 100, 100)}%` }} />
      </div>
      <p className={`text-xs ${usage.isCritical ? 'text-red-600' : usage.isWarning ? 'text-yellow-600' : 'text-gray-500'}`}>
        {text}
      </p>
      {usage.readyForOffline && (
        <p className="text-xs font-medium text-success">✅ Seguro desconectarse</p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
```

> ⚠️ **Compatibilidad**: `navigator.storage.estimate()` está disponible en Chrome 61+, Firefox 62+, Safari 15+. En navegadores antiguos (o en SSR de Next.js), el hook retorna `isSupported: false` y la barra simplemente no se renderiza. `localStorage` no tiene estimate — solo IndexedDB reporta cuota real.

async function loadCatalogInBackground() {
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const result = await fetchAndCacheProductPage(page++, 200);
    hasMore = result.hasMore;
    updateBackgroundProgress(result.cached, result.total);
  }
}
```

---

### A7.7 — Caché de Imágenes (ImageCache)

> Cache LRU de thumbnails en IndexedDB.

#### A7.7.1 — Store imageCache en db.ts

Agregar a `InventoryDB`:
```typescript
imageCache: {
  key: string;  // relativePath
  value: { relativePath: string; blob: Blob; size: number; cachedAt: number; lastAccessed: number };
  indexes: { 'by-lastAccessed': number };
}
```

#### A7.7.2 — Servicio de cache LRU

**File to Create:** `frontend/src/infrastructure/storage/ImageCacheService.ts`

- `getCachedImage(path)` → retorna blob o null
- `cacheImage(path, blob)` → guarda blob, verifica límite 50 MiB, LRU eviction
- `evictLRU()` → elimina las entradas con `lastAccessed` más antiguo hasta estar bajo 50 MiB

---

### A7.8 — Delta Sync por Entidad

> Reemplazar el cursor global único por cursores por store, permitiendo pulls paralelos en batches de 3.

> ⚠️ **Secuencial vs paralelo**: El `pullDeltaSync` usa batches de 3 stores en paralelo (`Promise.allSettled`), no todos a la vez. Esto evita 60+ requests concurrentes con catálogos grandes. Cada store tiene su propia transacción IndexedDB (evita conflictos de tx). Si un store falla (ej. timeout en stockBalances con 50k filas), los otros continúan — no hay fallo global.

**⚠️ Problema original:** `pullSync()` descarga TODOS los cambios desde un cursor global. Si hay 10,000 movimientos de stock pero 0 productos nuevos, igual descarga todo.

**Mejora: Pull por entidad + timestamp local**

#### A7.8.1 — syncMeta: cursores por store

En lugar de un cursor único, cada store tiene su propio cursor:

```typescript
// syncMeta stores:
const CURSOR_KEYS = {
  products: 'cursor_products',
  categories: 'cursor_categories',
  customers: 'cursor_customers',
  suppliers: 'cursor_suppliers',
  stockBalances: 'cursor_stock_balances',
  warehouses: 'cursor_warehouses',
};
```

**File to Modify:** `frontend/src/infrastructure/storage/db.ts`

Agregar helpers tipados por store:
```typescript
export async function getStoreCursor(store: string): Promise<number> {
  const meta = await getSyncMeta(CURSOR_KEYS[store]);
  return (meta as number) ?? 0;
}
export async function setStoreCursor(store: string, cursor: number): Promise<void> {
  await setSyncMeta(CURSOR_KEYS[store], cursor);
}
```

#### A7.8.2 — Backend: entityType filter en GET /sync/pull

Modificar `GET /api/v1/sync/pull` para aceptar `entityType` opcional:
```
GET /api/v1/sync/pull?cursor=1234&limit=100              → todos los cambios
GET /api/v1/sync/pull?entityType=PRODUCT&cursor=1234&limit=100 → solo productos
```

El controller ya tiene acceso a `R2dbcSyncLogRepository.findAfterCursor()` — agregar un método sobrecargado:

```java
// R2dbcSyncLogRepository — nuevo método
Flux<SyncLogEntry> findAfterCursor(long cursor, int limit, String entityType);
```

SQL: `SELECT * FROM sync_log WHERE id > $1 AND entity_type = $3 ORDER BY id LIMIT $2`

#### A7.8.3 — Frontend: pullSync paralelo por entidad

```typescript
export async function pullDeltaSync(): Promise<Map<string, PullResult>> {
  const stores = ['products', 'categories', 'customers', 'suppliers', 'stockBalances', 'warehouses'];
  const results = new Map<string, PullResult>();

  // ⚠️ Máximo 3 stores en paralelo — evitar 60+ requests concurrentes
  // con catálogos grandes. Usar Promise.allSettled para tolerar fallos parciales.
  const CONCURRENCY = 3;
  const pullStore = async (store: string) => { /* ... cuerpo del pull por store */ };

  for (let i = 0; i < stores.length; i += CONCURRENCY) {
    const batch = stores.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(pullStore));
    for (const [j, s] of settled.entries()) {
      if (s.status === 'rejected') {
        console.warn(`[Sync] pull failed for ${batch[j]}:`, s.reason);
      }
    }
  }
  return results;
}
```

**Cuerpo de `pullStore()` por store (transacción individual):**
```typescript
async function pullStore(store: string): Promise<void> {
  const cursor = await getStoreCursor(store);
  const entityType = store.replace(/([A-Z])/g, '_$1').toUpperCase();
  
  let total = 0;
  let currentCursor = cursor;
  let hasMore = true;
  let page = 0;
  
  while (hasMore && page < 50) {
    page++;
    const response = await apiClient.get<SyncPullResponse>(
      `/api/v1/sync/pull?entityType=${entityType}&cursor=${currentCursor}&limit=100`
    );
    const { nextCursor, hasMore: more, entries } = response.data;
    
    total += entries.length;
    if (!more || entries.length === 0) break;
    if (nextCursor === currentCursor) break;
    currentCursor = nextCursor;
    
    // Aplicar solo al store correspondiente — tx individual por store
    await applyPullEntriesForStore(store, entries);
  }
  
  if (currentCursor !== cursor) {
    await setStoreCursor(store, currentCursor);
  }
}

**`applyPullEntriesForStore` — upsert por entidad individual (nunca reemplaza lista completa):**
Cada `sync_log` entry contiene el estado completo de la entidad después del cambio. Se aplica con upsert: si la entidad ya existe en IDB → update; si no → insert; si el `sync_log.action === 'DELETE'` → delete de IDB.

```typescript
// ⚠️ Nunca guardar colecciones completas (ej: response.data.data) en IDB con clave fija.
// Cada entidad se guarda individualmente por su ID. Esto evita que una llamada
// paginada/filtrada sobrescriba datos de otras páginas.

async function applyPullEntriesForStore(store: string, entries: SyncLogEntry[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');

  for (const entry of entries) {
    if (entry.action === 'DELETE') {
      await tx.store.delete(entry.entityId);
      continue;
    }
    // entry.afterData contiene el JSON completo del estado post-cambio
    const entity = typeof entry.afterData === 'string'
      ? JSON.parse(entry.afterData)
      : entry.afterData;
    entity.cachedAt = Date.now();
    await tx.store.put(entity);
  }
  await tx.done;
}
```

> ⚠️ **SyncPullResponse DTO** (backend → frontend):
> ```typescript
> // Contrato entre GET /api/v1/sync/pull y el frontend
> interface SyncPullResponse {
>   nextCursor: number;     // nuevo cursor para próxima iteración
>   hasMore: boolean;       // true si hay más páginas
>   entries: SyncLogEntry[]; // los cambios a aplicar
> }
> 
> interface SyncLogEntry {
>   id: number;             // cursor value
>   entityType: string;     // PRODUCT, SALE, etc.
>   entityId: string;       // UUID de la entidad modificada
>   action: 'CREATE' | 'UPDATE' | 'DELETE';
>   afterData?: object;     // estado post-cambio (null para DELETE)
>   beforeData?: object;    // estado pre-cambio (null para CREATE)
>   occurredAt: string;     // ISO timestamp
> }
> ```
> 
> Backend `SyncController` retorna este DTO en `GET /api/v1/sync/pull`. El frontend tipa la respuesta como `SyncPullResponse` en `apiClient.get<SyncPullResponse>()`.

---

### A7.9 — Validación de Consistencia de Cache (Checksums)

> Detectar cache corrupta o desactualizada sin depender solo del cursor.

#### A7.9.1 — Backend: GET /api/v1/sync/checksums

**File to Create:** Agregar método en `SyncController.java` (ya existe en `adapters/web/controller/sync/SyncController.java`):

```
GET /api/v1/sync/checksums
Response:
{
  "products": { "count": 5234, "checksum": "abc123" },
  "categories": { "count": 48, "checksum": "def456" }
}
```

Los checksums se calculan como `COUNT(*) : MAX(EXTRACT(EPOCH FROM updated_at)*1000)` — pseudo-checksum, no SHA256. Suficiente para detectar drift:

```java
// SyncChecksumUseCase.java
public Mono<Map<String, StoreChecksum>> computeChecksums() {
    return Flux.concat(
        computeFor("products", productRepository),
        computeFor("categories", categoryRepository),
        computeFor("customers", customerRepository),
        computeFor("suppliers", supplierRepository),
        computeFor("warehouses", warehouseRepository),
        computeFor("stock_balances", stockBalanceRepository)
    ).collectMap(StoreChecksum::store);
}
```

#### A7.9.2 — Frontend: validateCache al reconectar

**File to Create:** `frontend/src/infrastructure/storage/CacheValidatorService.ts`

```typescript
// ⚠️ NO usar SHA256 real (demasiado costoso para 5000 items)
// Pseudo-checksum: COUNT + MAX(cachedAt) — suficiente para detectar drift
// ⚠️ Usar cursor en lugar de getAll() para evitar cargar todas las entidades en memoria
export async function computeLocalChecksum(store: string): Promise<string> {
  const db = await getDB();
  const tx = db.transaction(store as any, 'readonly');
  const storeObj = tx.objectStore(store as any);
  let count = 0;
  let latestCachedAt = 0;
  let cursor = await storeObj.openCursor();
  while (cursor) {
    count++;
    const cachedAt = (cursor.value as Record<string, unknown>).cachedAt as number ?? 0;
    if (cachedAt > latestCachedAt) latestCachedAt = cachedAt;
    cursor = await cursor.continue();
  }
  await tx.done;
  return `${count}:${latestCachedAt}`;
}

export async function validateCache(): Promise<Map<string, boolean>> {
  const serverChecksums = await apiClient.get<Map<string, StoreChecksum>>('/api/v1/sync/checksums');
  const results = new Map<string, boolean>();
  
  for (const [store, server] of Object.entries(serverChecksums)) {
    const localCount = await getCachedCount(store);
    const localChecksum = await computeLocalChecksum(store);
    
    const valid = localCount === server.count && localChecksum === server.checksum;
    results.set(store, valid);
    
    if (!valid) {
      // Invalidar y re-descargar este store en background
      await invalidateStore(store);
      scheduleStoreRefresh(store);
    }
  }
  return results;
}
```

**Cuándo ejecutar:**
- Al reconectar después de estar offline (en el `onReconnect` callback)
- Al iniciar la app si `lastSyncAt` > 1 hora (Fase B de la carga)

---

### Files Summary A7

#### Backend (16 archivos nuevos + 2 modificar)

| Archivo | Propósito |
|---------|-----------|
| `V18__add_device_cursors.sql` | A7.1.3: device_cursors table |
| `V19__add_sync_log_indices.sql` | A7.1.3: índices entity_type_id, created_at, entity_id para sync_log |
| `domain/ports/out/IdempotencyRepository.java` | Port de idempotencia |
| `adapters/persistence/entity/IdempotencyKeyEntity.java` | R2DBC entity idempotency_keys |
| `adapters/persistence/adapter/IdempotencyRepositoryAdapter.java` | Adapter |
| `adapters/persistence/mapper/IdempotencyMapper.java` | Mapper |
| `application/service/IdempotencyService.java` | Service: check + store + cache |
| `domain/ports/out/SyncLogWriterPort.java` | Port de escritura sync_log |
| `application/service/SyncLogWriterService.java` | Service: escribe sync_log |
| `adapters/persistence/adapter/SyncLogWriterAdapter.java` | Adapter |
| `application/service/OperationRouter.java` | Registry entityType+action → handler |
| `application/usecase/command/sync/SyncPushUseCase.java` | Orquesta batch push |
| `adapters/web/controller/sync/SyncPushController.java` | POST /api/v1/sync/push |
| `application/dto/sync/PushOperationRequest.java` | DTO request |
| `application/dto/sync/SyncPushResponseDto.java` | DTO response |
| `application/usecase/query/sync/SyncChecksumUseCase.java` | A7.9: Checksums por entidad |
| `adapters/web/controller/sync/SyncController.java` (modificar) | A7.8: entityType filter + GET /checksums |
| `adapters/persistence/adapter/repository/R2dbcSyncLogRepository.java` (modificar) | A7.8: `findAfterCursor(cursor, limit, entityType)` + A7.1.3: `findMinActiveCursor()`, `deleteOlderThan()` |
| `application/service/SyncLogRetentionService.java` | A7.1.3: Job @Scheduled nocturno — limpia sync_log >30d, idempotency_keys >2d, import_jobs >7d |
| `domain/ports/out/DeviceCursorRepository.java` | A7.1.3: Port para device_cursors |
| `adapters/persistence/entity/DeviceCursorEntity.java` | A7.1.3: R2DBC entity |
| `adapters/persistence/adapter/DeviceCursorRepositoryAdapter.java` | A7.1.3: Adapter device_cursors |
| `adapters/web/controller/sync/SyncController.java` (modificar) | A7.8 + A7.9: entityType filter en GET /pull + GET /checksums |

#### Backend (archivos a modificar)

| Archivo | Cambio |
|---------|--------|
| 9 use cases de comando (Product, Sale, Purchase, Category, Customer, Supplier, Transfer, Adjustment, Return) | Inyectar `SyncLogWriterPort` y escribir log post-operación ⚠️ si A1 ya inyectó AuditLogRepository, ahora tendrán 2 dependencias |

#### Frontend (archivos a reescribir)

| Archivo | Cambio |
|---------|--------|
| `db.ts` | 3→18 stores (ver estrategia offline por modelo), exports reales por store |
| `outbox.ts` | Descompletar, CRUD real + exponential backoff + dead letter |
| `ProductCacheService.ts` | Descompletar, CRUD real + stale detection |
| `SyncService.ts` | Push/pull real, applyPullEntries, delta sync por entidad |
| `useSyncStatus.ts` | Sync cycle real, pendingCount de outbox |
| `useCacheProgress.ts` | Carga 2 fases (Fase A bloqueante + Fase B background) + `getStorageUsage()` con `navigator.storage.estimate()` |
| `CacheProgressBar.tsx` | Agregar `StorageBar` sub-componente: barra de uso IDB con warning/critical thresholds, indicador "Seguro desconectarse" |
| `sw.js` | Cache solo assets+imágenes (IndexedDB fuente de verdad para API) |
| `useNetworkHealth.ts` | onReconnect callback |
| `CacheValidatorService.ts` | A7.9: Validación de checksums al reconectar (pseudo-checksum COUNT:MAX) |
| `networkStore.ts` | A7.4.3: Zustand store para NetworkMode (síncrono, sin hooks React) |
| `db.ts` | A7.2.5: `cleanupStaleData()` semanal con cursor IDB y política por store |
| `SyncIncidentsView.tsx` | A7.3.2: Panel de operaciones fallidas (dead letter) |
| `DeadLetterList.tsx` | A7.3.2: Lista de dead letters con acciones Reintentar/Descartar/Ver payload |
| `useDeadLetters.ts` | A7.3.2: Hook que consume `getDeadLetters()` de outbox |

#### Frontend (archivos a modificar)

| Archivo | Cambio |
|---------|--------|
| 14 repos de lectura (paths exactos en A7.4.1) | try API → cache IndexedDB → offline fallback |
| 11 repos de escritura (paths exactos en A7.4.2) | online → direct, offline → outbox (según estrategia por modelo) |
| `DashboardLayout.tsx` | Initial loading screen (2 fases) |
| `ImageCacheService.ts` | Nuevo: LRU image cache |
| `R2dbcSyncLogRepository.java` (ya existe) | A7.8: agregar `findAfterCursor(cursor, limit, entityType)` |

---

### Esquema de Datos IndexedDB (Diagrama)

```
IndexedDB: inventory-offline v3 (19 stores)
├── outbox (pending/syncing/accepted/rejected) — NOTA: superado maxRetries → deadLetter
│   ├── key: auto-increment id
│   ├── index: by-status
│   └── index: by-created
├── syncMeta (clave-valor)
│   ├── cursor_* (1 por store) → number
│   ├── deviceId → string
│   └── lastSyncAt → ISO timestamp
├── products
│   ├── key: product.id
│   ├── index: by-sku
│   ├── index: by-barcode
│   └── index: by-category
├── categories ── key: category.id
├── warehouses ── key: warehouse.id
├── stockBalances
│   ├── key: `${warehouseId}_${productId}`
│   ├── index: by-warehouse
│   └── index: by-product
├── customers
│   ├── key: customer.id
│   └── index: by-name
├── suppliers
│   ├── key: supplier.id
│   └── index: by-name
├── currencies ── key: currency.code
├── exchangeRates ── key: exchangeRate.id
├── sales ── key: sale.id
├── purchases ── key: purchase.id
├── transfers ── key: transfer.id
├── adjustments ── key: adjustment.id
├── returns ── key: return.id
├── customerDebts ── key: debt.id
├── notifications ── key: notification.id
├── deadLetter ── key: operationId
│   ├── index: by-rejectedAt
│   └── index: by-userNotified
└── imageCache ── key: relativePath
    └── index: by-lastAccessed (para LRU eviction)
```

---

### Pasos de Verificación A7

```bash
# 1. Backend: push endpoint existe
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/sync/push
# Expected: 400 (bad request) — no 404

# 2. Backend: idempotency service compile
cd backend/inventory-app && mvn compile -q 2>&1 | tail -3
# Expected: BUILD SUCCESS

# 3. Frontend: IndexedDB persistence init
# Abrir app → console: isPersistenceReady() === true
# Expected: true

# 4. Frontend: outbox count after offline operation
# Abrir app, desconectar, crear producto → console: getOutboxCount() === 1
# Expected: 1

# 5. Frontend: sync cycle
# Reconectar → useSyncStatus.status cambia a 'syncing' → luego 'online'
# Expected: pendingCount === 0 después de sync

# 6. Frontend: SW cachea API
# Recargar offline → productos visibles desde IndexedDB
# Expected: catálogo se renderiza sin red

# 7. Frontend: delta sync (A7.8) — store cursors independientes
# Abrir app, console: getStoreCursor('products') !== getStoreCursor('stockBalances')
# Expected: valores diferentes según última sync por entidad

# 8. Frontend: checksums (A7.9) — validación de consistencia
curl -s http://localhost:8080/api/v1/sync/checksums | jq '.products.count'
# Expected: count numérico > 0

# 9. Frontend: build + test
cd frontend && pnpm build 2>&1 | tail -5 && pnpm test:run 2>&1 | tail -5
# Expected: BUILD SUCCESS + tests pass
```

---

## Fase A8 — Housekeeping

> **Skills**: `clean-code`
> **Tiempo estimado**: ~40 min

### A8.0 — Limpieza de código comentado (TODO/FIXME)

- Buscar y limpiar `TODO`s introducidos en fases A1-A7 con `rg "TODO|FIXME|HACK|XXX" backend/ frontend/src/ --type-add 'java:*.java' --type-add 'ts:*.{ts,tsx}'`
- Remover `console.log` de depuración: `rg "console\.(log|warn|error)" frontend/src/ --include "*.ts" --include "*.tsx"`
- Descomentar stubs en `db.ts`, `outbox.ts`, `SyncService.ts`, `ProductCacheService.ts`, `useSyncStatus.ts` (verificar que A7 ya implementó la lógica real)

### A8.1 — Actualizar tests para constructores modificados (A1.4, A7.1.4)

> Los 6 use cases de A1.4 y los 9 de A7.1.4 cambiaron sus constructores (agregaron `AuditLogRepository` y/o `SyncLogWriterPort`). Los tests unitarios existentes que instancian estos use cases fallarán por falta de los nuevos parámetros.

**Files to Modify** (ver paths exactos en A1.4 y A7.1.4):
- Tests de `ProductCommandUseCase`, `SaleCommandUseCase`, `PurchaseCommandUseCase`, `CategoryCommandUseCase`, `CustomerCommandUseCase`, `SupplierCommandUseCase`, `TransferCommandUseCase`, `AdjustmentCommandUseCase`, `ReturnCommandUseCase`

**Patrón de fix (Mockito):**
```java
// Antes:
private final ProductCommandUseCase useCase = new ProductCommandUseCase(productRepo, categoryRepo);
// Después:
@Mock private AuditLogRepository auditLogRepo;
@Mock private SyncLogWriterPort syncLogWriter;
private final ProductCommandUseCase useCase = new ProductCommandUseCase(productRepo, categoryRepo, auditLogRepo, syncLogWriter);
```

### A8.2 — Renombrar DebtPaymentHistory

**File to Modify:** `frontend/src/presentation/modules/debts/components/DebtPaymentHistory.tsx`

Renombrar a `DebtActionForms` (contiene formularios de pago y edición, NO historial de pagos).

### A8.2 — Movimiento de código muerto

- Consolidar `notifications.api.ts` (A6.2) — verificar solapamiento con `notification-api.ts`, NO eliminar (12+ imports activos)
- Verificar que `useDebtPayment` invalida `['debts']` query key además de `['customer-debts']`
- Buscar y remover cualquier import huérfano a `AuditLogCommandUseCase` si algún archivo aún lo referencia. **Nota: `AuditLogCommandUseCase` nunca fue creado** — no existe como archivo ni es importado en ningún use case. Solo existe como referencia en planes/documentos. Esta tarea es precautoria.

### A8.3 — Documentación post-implementación

- **Documentar endpoints nuevos**: Agregar los 9+ endpoints nuevos (audit, reports, import, export, sync) a `docs/contracts/endpoints.md`. Incluir request/response shapes.
- **Actualizar CHANGELOG.md**: Resumir todas las fases ejecutadas con tipo de cambio (feat/fix/docs) y alcance por fase.
- **Actualizar README.md**: Listar nuevos endpoints y dependencias (OpenCSV, idb, etc.)

### A8.4 — Verificaciones de integridad post-fases

- **Índice `audit_log(entity_type, entity_id)`**: Verificar que existe en V1. Si no, agregar migration V19.
- **`@EnableScheduling` presente**: Verificar que `bootstrap/InventoryApplication.java` tiene la anotación (puede haberse perdido si A1.6 o A7.1.3 se ejecutó sin merge limpio).
- **Linting estricto**: `pnpm lint` sin errores. Buscar `any` residual con `rg "any" frontend/src/ --type ts --type tsx | grep -v "node_modules" | grep -v "\.test\."`.
- **Build + test clean final**: Ejecutar `pnpm build && cd backend/inventory-app && ./mvnw test -q` en rama limpia. Sin warnings.

### A8.5 — Tooltips (unificado en B1)

> ⚠️ **Eliminado de A8 — ver Regla #19 y Fase B1**: Los tooltips se agregan por fase (Opción A) según la regla de ejecución. No duplicar en A8.5. B1 se encarga de auditoría de legacy. El componente existente es `TooltipHint`/`TooltipWrapper` en `@/presentation/shared/components/ui/tooltip.tsx` (ver `@/presentation/shared/components/ui/Hint.tsx`). NO usar `@radix-ui/react-tooltip`.

**Dónde aplicar y qué texto usar:**

| Zona | Elemento | Tooltip sugerido |
|------|----------|-----------------|
| **POS** | Botón `CREDIT` | "La venta se registra como deuda del cliente. Genera una cuenta por cobrar automáticamente." |
| **POS** | Botón `RESERVE` | "Reserva el stock sin cobrarlo. El inventario se descuenta; el pago queda pendiente." |
| **Inventario** | Ícono stock mínimo | "Cuando el stock baje de este nivel, el sistema alertará al administrador." |
| **Audit Logs** | Columna `before/after` | "Muestra el estado del registro antes y después del cambio." |
| **Settings** | `audit.retention-days-hot` | "Días que los registros de auditoría permanecen activos para consultas rápidas. Después se archivan." |
| **Settings** | `audit.retention-days-archive` | "Días totales antes de eliminar definitivamente los registros archivados. Mínimo recomendado: 365 (requisito legal)." |
| **Settings** | `import.retention-days` | "Los resultados de importación CSV se eliminan automáticamente después de este tiempo para liberar espacio." |
| **Settings** | `sync.outbox-limit` | "Máximo de operaciones que se guardan localmente sin conexión. Si se supera, las más antiguas se descartan." |
| **Settings** | `sync.pull-interval-seconds` | "Cada cuántos segundos la app verifica cambios del servidor cuando hay conexión." |
| **Import CSV** | Botón `Dry Run` | "Valida el archivo sin importar datos. Muestra errores y una vista previa antes de confirmar." |
| **Export** | Selector `formato` | "CSV: compatible con Excel. XLSX: formato nativo Excel (próximamente). PDF: para impresión (próximamente)." |
| **Debts** | Badge `OVERDUE` | "El plazo de pago venció. El cliente debe ser contactado para regularizar." |
| **Notificaciones** | Toggle `Preferencia` | "Si está desactivado, no recibirás ninguna notificación de este tipo, aunque ocurran eventos." |

**Files to Modify (por cada zona):**
- POS: `SaleController.tsx`, `SaleForm.tsx` — tooltips en botones CREDIT/RESERVE
- Inventory: `ProductCard.tsx`, `StockBadge.tsx` — tooltip en stock mínimo
- Audit: `AuditLogTable.tsx` — tooltip en columnas before/after
- Settings: `SystemSettingsView.tsx` (A6.3) — `<TooltipHint>` en cada field label
- Import: `ImportView.tsx` — tooltip en botón Dry Run
- Export: `ExportForm.tsx` — tooltip en selector de formato
- Debts: `DebtBadge.tsx` — tooltip en badges OVERDUE
- Notifications: `NotificationPreferencesView.tsx` — tooltip en toggles

---

## Fase B1 — Sistema de Tooltips: Iconos por Sección + Botón Copiar

> **Skills**: `senior-frontend`, `tailwind-patterns`, `ui-ux-pro-max`
> **Objetivo**: Mejorar el componente `Tooltip` existente para incluir icono de la sección a la que pertenece y botón de copiar texto. Auditar y agregar tooltips faltantes en TODA la aplicación.

### B1.1 — Tooltip enrich: icono de sección + botón copiar

Modificar el componente `TooltipBody` en `frontend/src/presentation/shared/components/ui/tooltip.tsx` para aceptar:

```tsx
interface TooltipEnrichment {
  sectionIcon?: React.ReactNode;  // SVG del icono de sección (sidebar)
  sectionName?: string;           // "Inventario", "Comercial", etc.
  copyText?: string;              // Texto copiable (el mismo contenido)
}
```

**Icono de sección**: El tooltip muestra el icono de la sección del sidebar a la que pertenece el elemento (ej: tooltip en botón "Nuevo Producto" → icono de `products` de `SidebarIcons.tsx`). Agregar `sectionIcon` prop al `<Tooltip>`:

```tsx
<Tooltip content="Crear nuevo producto" sectionIcon={<Inventory2 />} sectionName="Inventario">
  <Button>Nuevo Producto</Button>
</Tooltip>
```

**Botón copiar**: Al hacer hover en el tooltip, mostrar un icono `📋` en la esquina superior derecha que copia el texto del tooltip al portapapeles (`navigator.clipboard.writeText()`). El botón debe ser un target táctil ≥44px. Al copiar, mostrar feedback visual "✅ Copiado" por 1.5s:

```tsx
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      })}
      className="ml-auto shrink-0 rounded p-1 hover:bg-white/10 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Copiar texto"
    >
      {copied ? <span className="text-green-400 text-xs">✅</span> : <span className="text-gray-400 text-xs">📋</span>}
    </button>
  );
}
```

### B1.2 — Auditoría completa de tooltips

Recorrer módulo por módulo y agregar `<Tooltip>` / `<TooltipWrapper>` / `<TooltipHint>` en todo elemento interactivo no obvio:

| Módulo | Elementos sin tooltip (detectados en auditoría) | Tooltip a agregar |
|--------|------------------------------------------------|-------------------|
| Dashboard | Botón "Ver todos" en LowStockList | "Mostrar todos los productos con stock bajo" |
| Products | Botones `Editar`, `Eliminar`, `Archivar`, `Duplicar` | "Editar producto", "Eliminar producto", "Archivar producto", "Duplicar producto" |
| Products | Toggle "Activo/Inactivo" en lista | "Activar/Desactivar producto" |
| Categories | Botones `Editar`, `Eliminar` | "Editar categoría", "Eliminar categoría" |
| Warehouses | Botones `Editar`, `Eliminar` | "Editar almacén", "Eliminar almacén" |
| Stock | Botón `Ajustar` | "Realizar ajuste de inventario manual" |
| Stock | Icono `⚠️` stock bajo | "Stock por debajo del mínimo configurado" |
| Movements | Botón `Filtrar` | "Filtrar movimientos por tipo, fecha o producto" |
| Sales | Botones `CREDIT`, `RESERVE`, `CONFIRMAR`, `CANCELAR`, `ENTREGAR` | "Venta a crédito - genera deuda", "Reservar stock sin cobrar", etc. |
| Purchases | Botones `CONFIRMAR`, `RECIBIR`, `CANCELAR` | "Confirmar orden de compra", "Recibir mercancía", "Cancelar orden" |
| Transfers | Botón `Crear Transferencia`, `CONFIRMAR`, `CANCELAR` | "Transferir stock entre almacenes", etc. |
| Adjustments | Botón `Nuevo Ajuste`, `Eliminar` | "Crear ajuste de inventario", etc. |
| Returns | Botón `Nueva Devolución` | "Registrar devolución de cliente o proveedor" |
| Suppliers | Botones `Editar`, `Eliminar`, `Activar/Desactivar` | "Editar proveedor", etc. |
| Customers | Botones `Editar`, `Eliminar`, `Activar/Desactivar` | "Editar cliente", etc. |
| Users | Botón `Nuevo Usuario`, `Editar`, `Cambiar Contraseña`, `Activar/Desactivar` | "Crear nuevo usuario", etc. |
| Roles | Botón `Nuevo Rol`, `Editar`, `Eliminar` | "Crear nuevo rol de usuario", etc. |
| Currencies | Botón `Agregar`, `Editar`, `Eliminar` | "Agregar moneda", etc. |
| Exchange Rates | Botón `Agregar`, `Editar`, `Eliminar` | "Agregar tasa de cambio", etc. |
| Import | Botón `Dry Run`, `Importar`, selector de entidad | "Validar CSV sin importar", "Iniciar importación", etc. |
| Export | Selector de formato, Botón `Exportar` | "CSV: compatible con Excel. XLSX/PDF próximamente." |
| Reports | Selector de fechas, Botón `Generar Reporte` | "Seleccionar rango de fechas", "Generar reporte con filtros actuales" |
| Debts | Badge `OVERDUE`, Botón `Pagar`, `Editar` | "Deuda vencida - contactar al cliente", "Registrar pago", etc. |
| Notifications | Toggle `Preferencia`, Botón `Guardar` | "Activar/Desactivar este tipo de notificación" |
| Settings | Todos los inputs numéricos de sistema | Usar `<TooltipHint>` en cada label (ver A6.3) |
| Sidebar | Iconos solos en modo colapsado | Todos los items ya tienen tooltip via `SidebarTooltip` ✅ |

**Agregar en `navigation.config.ts`**: Exportar `sectionIconsMap` que mapea cada `IconKey` a su icono SVG correspondiente para usar en tooltips.

### B1.3 — TooltipHint en formularios de creación/edición

En cada formulario del módulo, asegurar que los campos no obvios tengan `<TooltipHint>` al lado del label. Especialmente:

| Módulo | Campo | TooltipHint |
|--------|-------|-------------|
| Producto | `Costo` | "Precio de compra al proveedor" |
| Producto | `Precio` | "Precio de venta al público" |
| Producto | `Stock Mínimo` | "Cuando el stock baje de este nivel, el sistema alertará" |
| Producto | `Código de Barras` | "Código único para lector de barras (opcional)" |
| Producto | `Impuesto` | "Porcentaje de impuesto aplicado al producto" |
| Producto | `Unidad` | "Unidad de medida: pieza, kilo, litro, metro, etc." |
| Proveedor | `Código` | "Código interno del proveedor (PROV-001)" |
| Cliente | `Código` | "Código interno del cliente (CLI-001)" |
| Usuario | `Rol` | "Define los permisos del usuario en el sistema" |
| Usuario | `Contraseña` | "Mínimo 8 caracteres, incluir mayúscula y número" |

**Files to Modify:**
- `frontend/src/presentation/shared/components/ui/tooltip.tsx` — Agregar `sectionIcon`, `sectionName`, `copyButton` props
- Todos los módulos listados arriba (B1.2 + B1.3) — agregar tooltips faltantes

---

## Fase B2 — Permisos: Iconos por Sección + Validación en UI

> **Skills**: `senior-frontend`, `senior-architect`, `senior-security`, `ui-ux-pro-max`
> **Objetivo**: Los 46 permisos granulares existen en BD y JWT pero NO se validan en UI ni backend. Dividir permisos por sección con icono, crear componente `<Can>` para ocultar UI, agregar route guards y migrar backend de role-check a permission-check.

### B2.1 — Permission schema: categorías con iconos

Agregar columna `icon` a la tabla `permissions` (o mapeo estático en frontend):

**Migration V20 (no colisiona con B3 — usar si no existe otra V20, o renombrar a V23):**
```sql
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
```

O, más simple: mapeo estático en frontend `permission-categories.ts`:

```typescript
// frontend/src/presentation/modules/roles/config/permission-categories.ts
// Mapeo de categorías de permisos a iconos de sección (sidebar)
export const PERMISSION_CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard:  { label: 'Panel de Control', icon: <Icons.dashboard /> },
  users:      { label: 'Usuarios',         icon: <Icons.users /> },
  roles:      { label: 'Roles',            icon: <Icons.roles /> },
  products:   { label: 'Productos',        icon: <Icons.products /> },
  categories: { label: 'Categorías',       icon: <Icons.category /> },
  warehouses: { label: 'Almacenes',        icon: <Icons.warehouse /> },
  stock:      { label: 'Stock',            icon: <Icons.stock /> },
  sales:      { label: 'Ventas',           icon: <Icons.sale /> },
  purchases:  { label: 'Compras',          icon: <Icons.purchase /> },
  transfers:  { label: 'Transferencias',   icon: <Icons.transfer /> },
  adjustments:{ label: 'Ajustes',          icon: <Icons.adjustment /> },
  returns:    { label: 'Devoluciones',     icon: <Icons.returnDoc /> },
  suppliers:  { label: 'Proveedores',      icon: <Icons.supplier /> },
  customers:  { label: 'Clientes',         icon: <Icons.customer /> },
  finance:    { label: 'Finanzas',         icon: <Icons.currency /> },
  settings:   { label: 'Configuración',    icon: <Icons.settings /> },
  reports:    { label: 'Reportes',         icon: <Icons.report /> },
  imports:    { label: 'Importaciones',    icon: <Icons.importData /> },
  audit:      { label: 'Auditoría',        icon: <Icons.audit /> },
};
```

### B2.2 — PermissionGroupSelector con iconos por sección

Reescribir `PermissionGroupSelector.tsx` para mostrar iconos de sección en cada grupo (reemplazar texto uppercase por label con icono):

```
┌─────────────────────────────────┐
│ 📦 Productos                    │  ← icon + label
│ ☑ Ver productos                 │
│ ☑ Crear productos               │
│ ☑ Editar productos              │
│ ☑ Eliminar productos            │
├─────────────────────────────────┤
│ 👥 Usuarios                     │  ← icon + label
│ ☑ Ver usuarios                  │
│ ☑ Crear usuarios                │
│ ...                              │
└─────────────────────────────────┘
```

Agregar: checkbox "Seleccionar todos" por categoría, contador "3/5 seleccionados" y tooltip en cada permiso mostrando su `code`.

### B2.3 — Hook `usePermission()` + componente `<Can>`

Crear hook y componente para ocultar/mostrar UI según permisos del usuario:

```typescript
// frontend/src/presentation/shared/hooks/auth/usePermission.ts
import { useAuthStore } from '../storage/useAuthStore';

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = new Set(user?.role?.permissions ?? []);

  return {
    /** Verifica si el usuario tiene TODOS los permisos especificados */
    can: (...required: string[]) => required.every(p => permissions.has(p)),
    /** Verifica si el usuario tiene ALGUNO de los permisos especificados */
    canAny: (...required: string[]) => required.some(p => permissions.has(p)),
    /** Lista de permisos del usuario */
    permissions,
  };
}
```

```tsx
// frontend/src/presentation/shared/components/auth/Can.tsx
'use client';
import { usePermission } from '@/presentation/shared/hooks/auth/usePermission';

interface CanProps {
  /** Permisos requeridos (TODOS deben estar presentes) */
  permission?: string | string[];
  /** Modo: 'all' requiere todos, 'any' requiere al menos uno */
  mode?: 'all' | 'any';
  /** Rol mínimo requerido */
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode; // qué mostrar si no tiene permiso (default: null)
}

export function Can({ permission, mode = 'all', role, children, fallback = null }: CanProps) {
  const { can, canAny } = usePermission();
  const userRole = useAuthStore((s) => s.user?.role?.code);
  const hasRole = role ? userRole === role : true;
  const hasPermission = !permission
    ? true
    : (Array.isArray(permission) ? (mode === 'all' ? can(...permission) : canAny(...permission)) : can(permission));

  if (hasRole && hasPermission) return <>{children}</>;
  return <>{fallback}</>;
}
```

### B2.4 — Route guards por permiso

Modificar `DashboardLayout.tsx` para verificar permisos por ruta. Mapeo ruta → permiso requerido:

```typescript
// frontend/src/presentation/shared/config/permission-routes.ts
export const PERMISSION_ROUTES: Record<string, string | string[]> = {
  '/dashboard':        'dashboard:read',
  '/products':         'products:read',
  '/products/new':     'products:create',
  '/categories':       'categories:read',
  '/warehouses':       'warehouses:read',
  '/stock':            'stock:read',
  '/movements':        'stock:read',
  '/sales':            'sales:read',
  '/sales/new':        'sales:create',
  '/purchases':        'purchases:read',
  '/transfers':        'transfers:read',
  '/adjustments':      'adjustments:read',
  '/returns':          'returns:read',
  '/suppliers':        'suppliers:read',
  '/customers':        'customers:read',
  '/users':            'users:read',
  '/roles':            'roles:read',
  '/currencies':       'finance:read',
  '/exchange-rates':   'finance:read',
  '/settings':         'settings:read',
  '/reports':          'reports:read',
  '/audit-logs':       'audit:read',
  '/import':           'imports:create',
  '/export':           'reports:read',
  '/debts':            'finance:read',
  '/sync/incidents':   'settings:read',
};
```

En `DashboardLayout.tsx`, al navegar o al montar, verificar ruta actual contra `PERMISSION_ROUTES`. Si el usuario no tiene el permiso → redirect a dashboard con toast "No tienes permiso para acceder a esta sección":

```tsx
const pathname = usePathname();
const { can } = usePermission();
const requiredPermission = PERMISSION_ROUTES[pathname];

useEffect(() => {
  if (requiredPermission && !can(requiredPermission)) {
    router.push('/dashboard');
    toast.error('No tienes permiso para acceder a esta sección');
  }
}, [pathname]);
```

### B2.5 — Sidebar filtering por permisos

Modificar `navigation.config.ts` y `DashboardLayout.tsx` para filtrar items del sidebar según permisos del usuario:

```typescript
// navigation.config.ts — agregar requiredPermission a NavItemConfig
export interface NavItemConfig {
  label: string;
  path: string;
  icon: IconKey;
  requiredPermission?: string | string[]; // NUEVO
}
```

```typescript
// Ejemplo de items con permisos
{
  label: 'Productos',
  path: '/products',
  icon: 'products' as IconKey,
  requiredPermission: 'products:read',
},
```

En `DashboardLayout.tsx`, mapear `NAVIGATION_CONFIG` filtrando items que el usuario no tiene permiso de ver. Si una sección queda vacía (todos sus items filtrados), ocultar toda la sección.

### B2.6 — Backend: granular permission validation

Migrar `@PreAuthorize("hasRole('ADMIN')")` a `@PreAuthorize("hasAuthority('users:read')")` en los controllers. El JWT ya incluye permisos como authorities via `JwtAuthenticationFilter`. Modificar SecurityConfig para validar autoridades de permiso también:

```java
// SecurityConfig.java — mantener roles + agregar permisos
@Bean
public ReactiveAuthorizationManager<AuthorizationContext> authorizationManager() {
    return (auth, ctx) -> auth.map(a -> {
        // Check: USER tiene el permiso específico para esta ruta?
        // O tiene ROLE_ADMIN (back compat)?
        return a.getAuthorities().stream()
            .anyMatch(g -> g.getAuthority().equals("ROLE_ADMIN")
                || g.getAuthority().equals(getRequiredPermission(ctx)));
    });
}
```

> 🔴 **Migración de permisos para roles existentes — requerida ANTES de aplicar `@PreAuthorize` granular**:
> Sin este seed, los roles ADMIN/MANAGER/SELLER no tendrán los nuevos permisos, y nadie podrá acceder a nada.
> ```sql
> -- Seed: assign existing permissions to roles (parte de V20__add_permissions_icon.sql o script separado)
> -- Asignar TODOS los permisos existentes a ADMIN
> INSERT INTO role_permissions (role_id, permission_id)
> SELECT r.id, p.id FROM roles r, permissions p
> WHERE r.code = 'ADMIN'
> ON CONFLICT DO NOTHING;
> 
> -- MANAGER: permisos de lectura + escritura (sin admin/finanzas)
> INSERT INTO role_permissions (role_id, permission_id)
> SELECT r.id, p.id FROM roles r, permissions p
> WHERE r.code = 'MANAGER'
>   AND p.code NOT IN ('admin:full', 'finance:delete', 'settings:write')
> ON CONFLICT DO NOTHING;
> 
> -- SELLER: solo lectura + sales:create
> INSERT INTO role_permissions (role_id, permission_id)
> SELECT r.id, p.id FROM roles r, permissions p
> WHERE r.code = 'SELLER'
>   AND p.code IN ('products:read', 'customers:read', 'sales:create', 'sales:read', 'stock:read')
> ON CONFLICT DO NOTHING;
> ```

Para simplificar en fase 1, mantener role-check existente y agregar `@PreAuthorize` granular en endpoints críticos (CREATE/DELETE de productos, usuarios, etc.):
```java
@DeleteMapping("/{id}")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'products:delete')")
public Mono<Void> delete(@PathVariable UUID id) { ... }
```

**Files to Create:**
- `frontend/src/presentation/shared/hooks/auth/usePermission.ts`
- `frontend/src/presentation/shared/components/auth/Can.tsx`
- `frontend/src/presentation/shared/config/permission-routes.ts`
- `frontend/src/presentation/modules/roles/config/permission-categories.ts`

**Files to Modify:**
- `frontend/src/presentation/modules/roles/components/PermissionGroupSelector.tsx` — iconos por sección
- `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx` — route guard + sidebar filter
- `frontend/src/presentation/shared/config/navigation.config.ts` — agregar `requiredPermission`
- Backend controllers varios — agregar `@PreAuthorize` granular

---

## Fase B3 — Dirección Estructurada para Proveedores y Clientes

> **Skills**: `flyway-migrations`, `domain-driven-design`, `hexagonal-architecture`, `senior-fullstack`
> **Objetivo**: Reemplazar el campo `address?: string` único por dirección estructurada (provincia, municipio, calle, reparto, coordenadas) con datos geográficos locales (Cuba-first, expandible a multi-región). Mapas offline se integran en B8 pero B3 **no depende** de B8.

### B3.0 — V21: Tabla `geo_regions` + seed Cuba

Fuente de datos **local** — sin API externa. Tabla jerárquica que permite expandir a otros países desde Settings > "Gestión de Regiones".

```sql
CREATE TABLE geo_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL DEFAULT 'CU',
    level VARCHAR(20) NOT NULL,     -- 'country' | 'province' | 'municipality'
    name VARCHAR(200) NOT NULL,
    parent_id UUID REFERENCES geo_regions(id),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_geo_regions_country ON geo_regions(country_code);
CREATE INDEX idx_geo_regions_parent ON geo_regions(parent_id);
CREATE INDEX idx_geo_regions_level ON geo_regions(level);

-- Seed: Cuba — 15 provincias + municipio especial Isla de la Juventud
INSERT INTO geo_regions (country_code, level, name) VALUES ('CU', 'country', 'Cuba');
-- Provincias (parent_id = id de 'Cuba')
INSERT INTO geo_regions (country_code, level, name, parent_id) VALUES
  ('CU', 'province', 'Pinar del Río', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Artemisa', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'La Habana', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Mayabeque', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Matanzas', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Villa Clara', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Cienfuegos', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Sancti Spíritus', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Ciego de Ávila', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Camagüey', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Las Tunas', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Holguín', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Granma', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Santiago de Cuba', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Guantánamo', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba')),
  ('CU', 'province', 'Isla de la Juventud', (SELECT id FROM geo_regions WHERE level='country' AND name='Cuba'));

-- Municipios: seed completo de ~170 registros.
-- Generado automáticamente desde source-of-truth CSV (ONEI Cuba):
--   scripts/seed-data/cuba-municipalities.csv
--   scripts/seed-data/generate-geo-seed.mjs → output V21__add_geo_regions.sql
-- Ejecutar: node scripts/seed-data/generate-geo-seed.mjs > backend/.../db/migration/V21__add_geo_regions.sql
-- Ejemplo para La Habana:
-- INSERT INTO geo_regions (country_code, level, name, parent_id) VALUES
--   ('CU', 'municipality', 'Playa', (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana')),
--   ('CU', 'municipality', 'Plaza de la Revolución', ...),
--   ...
```

**Settings adicionales** (agregar a V15 si aún no existe, o en V21 junto a geo_regions):
```sql
INSERT INTO system_settings (key, value, value_type, is_public, description) VALUES
  ('geo.default-country', 'CU', 'string', true, 'País predeterminado para direcciones')
ON CONFLICT (key) DO NOTHING;
```

### B3.1 — V22: Dirección estructurada en suppliers/customers

```sql
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS municipality VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS street VARCHAR(300);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS locality VARCHAR(100); -- reparto/comunidad
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS map_place_id VARCHAR(100); -- referencia OSM/Google

ALTER TABLE customers ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS municipality VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street VARCHAR(300);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS locality VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS map_place_id VARCHAR(100);

-- Mantener columna address original para compatibilidad (migrar datos)
UPDATE suppliers SET street = address WHERE street IS NULL AND address IS NOT NULL;
UPDATE customers SET street = address WHERE street IS NULL AND address IS NOT NULL;
```

### B3.2 — Backend: geo_regions entity + DTO + controller

**Files to Create:**
- `domain/model/geo/GeoRegion.java`
- `domain/ports/out/GeoRegionRepository.java`
- `application/usecase/query/geo/GeoRegionQueryUseCase.java` — list provinces, list municipalities by province
- `adapters/web/controller/geo/GeoRegionController.java`
- `adapters/web/dto/geo/GeoRegionResponse.java`

**Endpoints:**
```
GET /api/v1/geo/provinces?countryCode=CU    → lista provincias
GET /api/v1/geo/municipalities/{provinceId}  → lista municipios de una provincia
```

Los selects de provincia/municipio en el frontend cargan desde estos endpoints. No hay datos hardcodeados.

### B3.3 — Backend: entity + DTO updates

Actualizar `SupplierEntity`, `CustomerEntity`, domain models, y DTOs `CreateSupplierRequest`, `UpdateSupplierRequest`, `CreateCustomerRequest`, `UpdateCustomerRequest`, `SupplierResponse`, `CustomerResponse` para incluir los nuevos campos.

**DTO de request:**
```java
public record CreateSupplierRequest(
    String code, String name, String contactName, String phone, String email,
    String province, String municipality, String street, String locality, String zipCode,
    BigDecimal latitude, BigDecimal longitude,
    String notes, String website
) {}
```

**DTO de response:**
```java
public record SupplierResponse(
    UUID id, String code, String name, String contactName, String phone, String email,
    String province, String municipality, String street, String locality, String zipCode,
    BigDecimal latitude, BigDecimal longitude,
    boolean active, Instant createdAt, Instant updatedAt
) {}
```

### B3.4 — Frontend: geo-region hooks + entity + form updates

Actualizar tipos en `core/supplier/entities/supplier.ts` y `core/customer/entities/customer.ts`:

```typescript
export interface Supplier {
  id: string; code?: string; name: string; contactName?: string;
  phone?: string; email?: string;
  province?: string; municipality?: string; street?: string;
  locality?: string; zipCode?: string;
  latitude?: number; longitude?: number;
  notes?: string; active: boolean;
  createdAt: string; updatedAt: string;
}
```

**Form fields** — `SupplierAddressFields.tsx` y `CustomerFormFields.tsx` reemplazan campo único por campos estructurados:

```
┌──────────────────────────────────────────┐
│ Dirección                                │
├──────────────────────────────────────────┤
│ Provincia:    [___________]              │
│ Municipio:    [___________]              │
│ Calle:        [_____________________]    │
│ Reparto/Localidad: [________]            │
│ Código Postal: [_____]                   │
├──────────────────────────────────────────┤
│ Ubicación en Mapa ──────────────────────┤
│ [📍 Abrir Mapa]  ← B8: abre mapa para   │
│                    seleccionar ubicación  │
│ Lat: 23.1234567   Lng: -82.3456789       │
│ [🗺️ Compartir en Google Maps]             │
└──────────────────────────────────────────┘
```

**Files Summary B3:**
| Capa | Archivos | Acción |
|------|----------|--------|
| Build | `scripts/seed-data/cuba-municipalities.csv` | Crear (source-of-truth ONEI, ~170 rows) |
| Build | `scripts/seed-data/generate-geo-seed.mjs` | Crear (lee CSV → genera V21 SQL) |
| DB | `V21__add_geo_regions.sql` | Crear (regiones geográficas + seed Cuba, generado por script) |
| DB | `V22__add_structured_address.sql` | Crear (columnas dirección en suppliers/customers) |
| Domain | `GeoRegion.java` | Crear |
| Domain | `Supplier.java`, `Customer.java` | Modificar (agregar campos) |
| Domain/Ports | `GeoRegionRepository.java` | Crear |
| Application | `GeoRegionQueryUseCase.java` | Crear |
| Persistence | `GeoRegionEntity.java`, `GeoRegionRepositoryAdapter.java`, `BundleMapper.java` | Crear |
| Persistence | `SupplierEntity.java`, `CustomerEntity.java` | Modificar |
| Web | `GeoRegionController.java`, `GeoRegionResponse.java` | Crear |
| Web | `*Request.java`, `*Response.java` (4 DTOs) | Modificar |
| Frontend core | `geo-region.ts` (entity), `IGeoRegionRepository.ts` (port) | Crear |
| Frontend infra | `GeoRegionRepository.ts` (HTTP) | Crear |
| Frontend hooks | `useProvinces.ts`, `useMunicipalities.ts` | Crear |
| Frontend entities | `supplier.ts`, `customer.ts` | Modificar |
| Frontend forms | `SupplierAddressFields.tsx`, `SupplierContactFields.tsx`, `CustomerFormFields.tsx` | Reemplazar field único por estructurado |

---

## Fase B4 — UX de Formularios: Pre-llenado, Selección Total y "Crear y Continuar"

> **Skills**: `senior-frontend`, `ui-ux-pro-max`, `tailwind-patterns`
> **Objetivo**: Mejorar experiencia en todos los formularios de creación/edición.

### B4.1 — Auto-select-all al focus

En todos los `<Input>` de formularios, al hacer focus seleccionar todo el texto (`input.select()`). Crear un hook o wrapper:

```typescript
// frontend/src/presentation/shared/hooks/forms/useAutoSelect.ts
import { useCallback, useRef } from 'react';

export function useAutoSelect() {
  const ref = useRef<HTMLInputElement>(null);
  const onFocus = useCallback(() => {
    // requestAnimationFrame asegura que el focus ya ocurrió
    requestAnimationFrame(() => ref.current?.select());
  }, []);
  return { ref, onFocus };
}
```

Modificar `<Input>` en `frontend/src/presentation/shared/components/ui/Input.tsx` para aceptar `autoSelect?: boolean` (default: false o true en forms de creación/edición):

### B4.2 — Pre-llenado inteligente de formularios

Cuando el usuario crea un nuevo registro después de ver uno similar, pre-llenar campos comunes:

| Formulario | Datos disponibles para pre-llenado |
|------------|-----------------------------------|
| Producto (desde otro producto) | Última categoría usada, almacén por defecto |
| Producto (desde plantilla) | Campos rellenados desde otro producto similar |
| Compra (desde proveedor) | Proveedor pre-seleccionado si viene desde su perfil |
| Venta (desde cliente) | Cliente pre-seleccionado si viene desde su perfil |

Implementar: en las rutas de creación, aceptar query params `?prefillFrom=entityId&template=field1,field2`. El hook de creación lee los params y pre-llena el form:

```typescript
// Ejemplo: /products/new?prefillFrom=550e8400... → carga producto como template
const searchParams = useSearchParams();
const prefillId = searchParams.get('prefillFrom');
const { data: template } = useQuery({
  queryKey: ['product', prefillId],
  enabled: !!prefillId,
});
// Si template existe, pre-llenar formData con sus valores
useEffect(() => {
  if (template) {
    setFormData({
      name: template.name,
      categoryId: template.categoryId,
      // ... copiar campos relevantes (NO id, NO timestamps)
    });
  }
}, [template]);
```

### B4.3 — Botón "Crear y Continuar Creando"

En cada formulario de creación, agregar un botón adicional "Crear y Continuar" al lado de "Crear":

```tsx
<div className="flex gap-2">
  <Button type="submit" isLoading={isPending}>
    Crear
  </Button>
  <Button type="submit" variant="outline" isLoading={isPending}
    onClick={() => setShouldContinue(true)}>
    Crear y Continuar
  </Button>
</div>
```

La lógica: al crear exitosamente, si `shouldContinue` → resetear formulario a estado inicial (manteniendo algunos campos pre-llenados como categoría, almacén) y mostrar toast "Producto creado. Puedes seguir agregando.":

```typescript
const [shouldContinue, setShouldContinue] = useState(false);

const { mutateAsync: create } = useMutation({
  mutationFn: (data) => productRepository.create(data),
  onSuccess: (result) => {
    toast.success(`Producto "${result.name}" creado`);
    if (shouldContinue) {
      resetForm({ keep: ['categoryId', 'warehouseId'] }); // mantener selecciones
      setShouldContinue(false);
    } else {
      router.push('/products');
    }
  },
});
```

**Files to Modify (por módulo):**

| Módulo | Auto-select | Pre-llenado | Crear+Continuar |
|--------|-------------|-------------|-----------------|
| `ProductCreateView.tsx` | ✅ | ✅ (desde otro producto) | ✅ |
| `SupplierFormFields.tsx` | ✅ | ❌ (N/A) | ✅ |
| `CustomerFormFields.tsx` | ✅ | ❌ | ✅ |
| `CategoryForm.tsx` | ✅ | ❌ | ✅ |
| `PurchaseFormFields.tsx` | ✅ | ✅ (pre-seleccionar proveedor) | ✅ |
| `UserFormFields.tsx` | ✅ | ❌ | ✅ |
| `shared/components/ui/Input.tsx` | ✅ (nuevo prop `autoSelect`) | — | — |

---

## Fase B5 — Gráficos, Estadísticas y Métricas del Dashboard

> **Skills**: `senior-frontend`, `senior-backend`, `ui-ux-pro-max`, `rest-api-conventions`
> **Objetivo**: Agregar visualizaciones de ganancia/pérdida, ventas por período, top productos/clientes y constructor de gráficos personalizados.

### B5.1 — Dependencias de gráficos

```bash
cd frontend && pnpm add recharts
```

(recharts es ~130KB gzip, librería más usada con React para gráficos. Alternativa: billboard.js ~80KB. Decisión: recharts por integración nativa con React y componentes declarativos.)

### B5.2 — Backend: endpoints de métricas

Endpoints nuevos en `/api/v1/reports/*`:

```
GET /api/v1/reports/sales-timeline?fromDate=&toDate=&granularity=day|week|month
→ [{ date: "2026-05-01", revenue: 1500, cost: 900, profit: 600, count: 12 }, ...]

GET /api/v1/reports/top-products?fromDate=&toDate=&limit=10
→ [{ productId, productName, totalSold, totalRevenue, quantitySold }, ...]

GET /api/v1/reports/top-customers?fromDate=&toDate=&limit=10
→ [{ customerId, customerName, totalPurchases, totalRevenue, debtBalance }, ...]

GET /api/v1/reports/profit-summary?fromDate=&toDate=
→ { totalRevenue, totalCost, totalProfit, profitMargin, salesCount, avgSaleValue }

GET /api/v1/reports/inventory-value
→ { totalValue, totalCost, productCount, avgCost, lowStockCount }
```

**Files to Create (backend):**
- `application/usecase/query/report/SalesTimelineUseCase.java`
- `application/usecase/query/report/TopProductsUseCase.java`
- `application/usecase/query/report/TopCustomersUseCase.java`
- `application/usecase/query/report/ProfitSummaryUseCase.java`
- `adapters/web/dto/report/SalesTimelinePoint.java`
- `adapters/web/dto/report/TopProductEntry.java`
- `adapters/web/dto/report/TopCustomerEntry.java`
- `adapters/web/dto/report/ProfitSummaryResponse.java`
- Controller: agregar endpoints a `ReportController.java` existente

### B5.3 — Frontend: Dashboard charts

**Dashboard redesigned:**

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Resumen Financiero                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Ingresos │ │  Costos  │ │Ganancia  │ │  Margen   │         │
│ │$45,230   │ │$28,100   │ │$17,130   │ │  37.9%   │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                              │
│ ┌─ Ventas por Mes ──────────────────────────────────────┐    │
│ │                                                       │    │
│ │  ██▌      ███      ██▋      ████     ████▊    █████  │    │
│ │  Ene     Feb      Mar      Abr      May      Jun     │    │
│ └───────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌─ Top Productos ───────────┐ ┌─ Top Clientes ───────────┐   │
│ │ 1. Arroz (150uds)   $5k  │ │ 1. Mini Super A   $12k  │   │
│ │ 2. Frijoles (120)   $3k  │ │ 2. Bodega B        $8k  │   │
│ │ 3. Aceite (80)      $4k  │ │ 3. Cafetería C     $5k  │   │
│ └──────────────────────────┘ └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Chart components:**

```tsx
// frontend/src/presentation/modules/dashboard/components/SalesTimelineChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: SalesTimelinePoint[];
  period: 'day' | 'week' | 'month';
}

export function SalesTimelineChart({ data, period }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="#ef4444" name="Costos" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Files to Create (frontend):**
- `frontend/src/core/dashboard/entities/recharts-types.ts` — interfaces para datos de gráficos
- `frontend/src/core/dashboard/ports/IDashboardMetricsRepository.ts` — port para métricas
- `frontend/src/infrastructure/repositories/dashboard/DashboardMetricsRepository.ts` — HTTP adapter
- `frontend/src/presentation/modules/dashboard/components/SalesTimelineChart.tsx`
- `frontend/src/presentation/modules/dashboard/components/TopProductsChart.tsx`
- `frontend/src/presentation/modules/dashboard/components/TopCustomersChart.tsx`
- `frontend/src/presentation/modules/dashboard/components/ProfitSummaryCards.tsx`
- `frontend/src/presentation/modules/dashboard/hooks/useDashboardMetrics.ts` — TanStack Query

### B5.4 — Constructor de gráficos personalizados

> El usuario puede seleccionar qué métrica graficar y cómo agruparla, creando un "widget" de dashboard propio.

```typescript
// core/dashboard/entities/custom-chart.ts
export interface CustomChartConfig {
  id: string;
  title: string;
  metric: 'revenue' | 'cost' | 'profit' | 'salesCount' | 'profitMargin';
  groupBy: 'day' | 'week' | 'month' | 'product' | 'customer' | 'category';
  filters: { field: string; value: string }[];
  chartType: 'bar' | 'line' | 'pie' | 'area';
}

export interface CustomChartWidget {
  config: CustomChartConfig;
  position: { x: number; y: number; w: number; h: number };
}
```

**UI del constructor**: Modal tipo wizard con:
1. Seleccionar métrica (ingresos, costos, ganancia, etc.)
2. Seleccionar agrupación (por día/mes/producto/cliente)
3. Seleccionar tipo de gráfico (barra/línea/pastel/área)
4. Vista previa en vivo
5. Arrastrar widget al dashboard (usando `hello-pangea/dnd` o similar)

```tsx
// Botón "Agregar Gráfico" en dashboard
<Button variant="outline" onClick={() => setShowChartBuilder(true)}>
  <Plus className="h-4 w-4" /> Agregar Gráfico
</Button>

// Modal ChartBuilder
<Dialog open={showChartBuilder} onClose={() => setShowChartBuilder(false)}>
  <ChartBuilderWizard onSave={(config) => addWidget(config)} />
</Dialog>
```

**⚠️ Límite de 20 widgets**: Validar en `useDashboardLayout` que no se excedan 20 widgets. Un usuario malicioso o bug podría llenar localStorage con miles de widgets (5KB c/u × 1000 = 5MB):
```typescript
const MAX_WIDGETS = 20;
function addWidget(config: CustomChartConfig) {
  const widgets = get().widgets;
  if (widgets.length >= MAX_WIDGETS) {
    toast.warning(`Máximo ${MAX_WIDGETS} widgets permitidos`);
    return;
  }
  set({ widgets: [...widgets, { config, position: { x: 0, y: 0, w: 2, h: 2 } }] });
}
```

Los widgets se guardan en Zustand store (`useDashboardLayout`) y persisten en `localStorage`. NO en backend (cada usuario tiene su layout personal).

**Files to Create:**
- `frontend/src/core/dashboard/entities/custom-chart.ts`
- `frontend/src/presentation/modules/dashboard/components/ChartBuilderModal.tsx`
- `frontend/src/presentation/modules/dashboard/components/CustomChartWidget.tsx`
- `frontend/src/presentation/modules/dashboard/hooks/useDashboardLayout.ts` — Zustand store

---

## Fase B6 — Imagen de Perfil de Usuario

> **Skills**: `hexagonal-architecture`, `senior-backend`, `senior-frontend`
> **Objetivo**: Implementar subida/visualización de avatar de usuario. La tabla `user_images` ya existe en BD (V1). Falta backend completo.

### B6.1 — Backend: UserImageController

Seguir el patrón exacto de `ProductImageController`/`SupplierImageController` (multipart upload, set primary, delete, serve). Como `user_images` tiene UNIQUE por `user_id` (1:1), no hay "primary" — solo una imagen por usuario.

**Files to Create:**
- `domain/ports/out/UserImageRepository.java`
- `application/service/UserImageService.java` — upload, delete, getByUserId
- `adapters/persistence/adapter/entity/UserImageEntity.java` — @Table("user_images")
- `adapters/persistence/adapter/UserImageRepositoryAdapter.java` — implementa port
- `adapters/persistence/adapter/mapper/UserImageMapper.java`
- `adapters/web/controller/user/UserImageController.java` — basado en `SupplierImageController`
- `adapters/web/dto/user/UserImageResponse.java`
- `adapters/web/dto/user/UploadUserImageRequest.java`

**Endpoints:**
```
GET    /api/v1/users/{userId}/images          → lista imágenes (máx 1)
POST   /api/v1/users/{userId}/images           → multipart upload (solo ADMIN o propio usuario)
DELETE /api/v1/users/{userId}/images/{imageId} → eliminar
GET    /api/v1/users/{userId}/avatar           → redirect al archivo de imagen (para <img src>)
```

**Agregar `avatarUrl` a `UserResponse` y `AuthResponse.UserDto`:**
```java
// UserResponse.java
public record UserResponse(
    UUID id, String username, String email, String displayName,
    RoleResponse role, boolean isActive,
    String avatarUrl,   // NUEVO: /api/v1/users/{id}/avatar
    Instant createdAt, Instant updatedAt
) {}
```

### B6.2 — Frontend: avatar upload en UserForm

Modificar `UserFormFields.tsx` para incluir upload de imagen:

```tsx
<div className="flex items-center gap-4">
  <AvatarPreview url={avatarUrl} initials={getInitials(displayName)} size="lg" />
  <div>
    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
      Subir Foto
    </Button>
    <input ref={fileInputRef} type="file" accept="image/*" hidden
      onChange={handleFileSelect} />
    {avatarUrl && (
      <Button variant="ghost" onClick={handleRemoveImage}>
        Eliminar
      </Button>
    )}
    <p className="text-xs text-gray-500 mt-1">JPG, PNG o WebP. Máx 2MB.</p>
  </div>
</div>
```

### B6.3 — Header: avatar con iniciales

Modificar `Header.tsx` para mostrar la imagen del usuario o fallback a iniciales con color:

```tsx
function UserAvatar({ user }: { user: AuthUser }) {
  const [imageError, setImageError] = useState(false);
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.username[0].toUpperCase();

  const bgColor = stringToColor(user.username); // hash consistente del username

  if (user.avatarUrl && !imageError) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}

// Función hash para color consistente por username
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}
```

### B6.4 — Lista de usuarios: columna avatar

Modificar `UsersView.tsx` / `GenericTable` para mostrar avatar en la columna `displayName`:

```
┌─────────────────────────────────────┐
│ Usuarios                            │
├─────────────────────────────────────┤
│  👤 Admin R.        admin    ADMIN  │
│  🟢 Juan P.         juan     VENDEDOR│
│  🔵 María L.        maria    ADMIN  │
└─────────────────────────────────────┘
```

**Files to Modify:**
- `backend/.../UserResponse.java` — agregar `avatarUrl`
- `backend/.../AuthResponse.java` — agregar `avatarUrl` en `UserDto`
- `backend/.../UserRepositoryAdapter.java` — unir `user_images` en query
- `frontend/src/core/user/entities/user.ts` — `avatarUrl` ya existe ✅
- `frontend/src/presentation/modules/users/components/form/UserFormFields.tsx` — agregar upload
- `frontend/src/presentation/shared/components/layout/Header.tsx` — avatar + iniciales
- `frontend/src/presentation/modules/users/views/UsersView.tsx` — columna avatar

---

## Fase B7 — Resolución de Conflictos Offline (Outbox Collapsing)

> **Skills**: `senior-frontend`, `senior-architect`
> **Objetivo**: Manejar el caso donde un objeto se crea offline, luego se modifica o elimina antes de sincronizar. Sin esta lógica, el outbox enviaría operaciones con IDs temporales que el servidor no reconoce.

### B7.1 — Outbox collapsing: agrupar por entidad

Antes de enviar el batch al push endpoint, agrupar y colapsar operaciones del outbox para la misma entidad temporal:

```typescript
// En SyncService.ts — antes de pushOutbox()
function collapseOutboxEntries(entries: OutboxEntry[]): OutboxEntry[] {
  // Agrupar por ID temporal de entidad
  const groups = new Map<string, OutboxEntry[]>();
  for (const entry of entries) {
    const key = `${entry.entityType}:${entry.entityId}`;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const collapsed: OutboxEntry[] = [];
  for (const [key, group] of groups) {
    if (group.length === 1) {
      // Sin conflicto, mantener
      collapsed.push(group[0]);
    } else {
      // Múltiples operaciones para misma entidad
      collapsed.push(mergeOutboxGroup(group));
    }
  }
  return collapsed;
}

function mergeOutboxGroup(group: OutboxEntry[]): OutboxEntry {
  // Ordenar por createdAt ASC
  group.sort((a, b) => a.createdAt - b.createdAt);
  const first = group[0];
  const last = group[group.length - 1];

  const actions = group.map(e => e.action);
  const hasCreate = actions.includes('CREATE');
  const hasDelete = actions.includes('DELETE');

  if (hasCreate && hasDelete && group.length === 2) {
    // Creado y eliminado antes de sync → net no-op, eliminar ambas
    return { ...first, action: 'NOOP', skip: true };
  }

  if (hasDelete) {
    // Creado, modificado, luego eliminado → solo DELETE con ID original (que será real post-CREATE)
    return last;
  }

  if (hasCreate && group.length > 1) {
    // CREATE + UPDATE(s) → preservar último UPDATE, el servidor manejará la creación primero
    // El ID temporal se resolverá en el servidor con operationId mapping
    return { ...last, entityId: first.entityId, isTempId: true };
  }

  return last; // solo UPDATE(s) → preservar último
}
```

### B7.2 — Temp ID resolution en push endpoint

> ⚠️ **Almacenamiento del mapping**: El mapping `tempId → realId` se almacena en la tabla `idempotency_keys` existente, que ya tiene columnas `operation_id` (UUID v4 del cliente) y `response_data` (JSON con el resultado). Almacenar el mapping en `response_data` como `{"realId": "uuid-del-recurso"}`. Cuando una operación posterior referencia `temp_{operationId}`, el `IdempotencyService` busca en `idempotency_keys` por `operationId` y extrae el `realId` de `response_data`.
>
> No se necesita tabla nueva — `idempotency_keys.response_data` ya almacena el JSON de respuesta. Si en el futuro se requiere búsqueda por entityType + entityId, se puede migrar a tabla separada `temp_id_mappings`.

Cuando el servidor recibe un CREATE con `operationId`, retorna el mapping `tempId → realId` en la respuesta. Las operaciones subsiguientes (UPDATE/DELETE) que referencian el temp ID se re-escriben con el real ID antes de ejecutarse:

```java
// SyncPushUseCase.java
private Mono<OperationResult> processOperation(PushOperation op, UUID userId) {
    return idempotencyService.checkAndStore(op.operationId())
        .flatMap(cached -> {
            if (cached != null) return Mono.just(new OperationResult(op.operationId(), true, cached, null));
            
            // Resolver temp IDs antes de rutear
            return resolveTempIds(op)
                .flatMap(resolvedOp -> operationRouter.route(resolvedOp, userId))
                .flatMap(result -> {
                    if (result.success()) {
                        return syncLogWriter.log(op.entityType(), ...)
                            .then(idempotencyService.store(op.operationId(), result.data()))
                            .then(Mono.just(new OperationResult(op.operationId(), true, result.data(), null)));
                    }
                    return Mono.just(new OperationResult(op.operationId(), false, null, result.error()));
                });
        });
}

private Mono<PushOperation> resolveTempIds(PushOperation op) {
    // Si entityId empieza con "temp_", buscar en idempotency_cache
    // el mapping de operationId → realId para esta entidad
    if (op.entityId().startsWith("temp_")) {
        return idempotencyService.findRealId(op.entityType(), op.entityId())
            .map(realId -> new PushOperation(op.operationId(), op.entityType(), op.action(),
                replaceTempIdInPayload(op.payload(), op.entityId(), realId), realId));
    }
    return Mono.just(op);
}
```

### B7.3 — Mapa tempId → realId en frontend

Después de `pushOutbox()`, actualizar el cache local con los mappings recibidos del servidor:

```typescript
// SyncService.ts — después de pushOutbox exitoso
interface TempIdMapping {
  tempId: string;
  realId: string;
  entityType: string;
}

async function updateTempIdMappings(mappings: TempIdMapping[]): Promise<void> {
  for (const m of mappings) {
    // Actualizar en IndexedDB: renombrar key de tempId a realId
    const db = await getDB();
    const tx = db.transaction(m.entityType.toLowerCase() as any, 'readwrite');
    const store = tx.objectStore(m.entityType.toLowerCase() as any);
    const cached = await store.get(m.tempId);
    if (cached) {
      store.delete(m.tempId);
      store.put({ ...cached, id: m.realId });
    }
    await tx.done;
  }
}
```

**File to Modify:**
- `frontend/src/infrastructure/storage/SyncService.ts` — agregar `collapseOutboxEntries()` y `updateTempIdMappings()`
- `backend/.../SyncPushUseCase.java` — agregar `resolveTempIds()` + `TempIdMapping` en respuesta

---

## Fase B8 — Mapas Offline con Leaflet + PMTiles + FlexSearch

> **Skills**: `senior-frontend`, `ui-ux-pro-max`, `web-performance-optimization`, `senior-architect`
> **Objetivo**: Mapa offline con cobertura de Cuba, búsqueda por calle/lugar mediante índice precargado, integrado con formularios de dirección (B3). **Sin dependencia externa en runtime** — tiles y geocodificación son locales.

**Stack:**

| Componente | Librería | Rol |
|------------|----------|-----|
| Renderizado | Leaflet.js + react-leaflet | Visualización de mapas (~40KB gzip) |
| Tiles vectoriales | PMTiles + leaflet.vectorgrid | Tiles offline en un solo archivo (~80-120MB Cuba) |
| Búsqueda offline | FlexSearch | Índice ultra-rápido de calles/lugares (~2MB gzip) |
| Datos geográficos | OpenStreetMap extract Cuba | Fuente de datos (build-time) |

**Alternativas descartadas:**

| Stack | Razón |
|-------|-------|
| Maplibre GL JS + MBTiles | ~150KB gzip, más pesado que Leaflet |
| Nominatim API (OSM online) | ❌ Requiere internet. OpenCage es 100% online y de pago |
| OpenCrags | Proyecto de escalada en roca — **no es un módulo de mapas genérico** |
| Google Maps JS API | ❌ No offline. Requiere API key |

### B8.0 — Preparación de datos (build-time, CI/CD)

```bash
# 1. Descargar extracto Cuba de Geofabrik
curl -o cuba-latest.osm.pbf https://download.geofabrik.de/north-america/cuba-latest.osm.pbf

# 2. Generar PMTiles (vector tiles, archivo único)
# tilemaker requiere config-openmaptiles-lite.json
tilemaker --input cuba-latest.osm.pbf \
          --output frontend/public/tiles/cuba.pmtiles \
          --config config-openmaptiles-lite.json \
          --process process-openmaptiles-lite.lua

# 3. Generar índice de búsqueda (calles + lugares de Cuba)
node scripts/generate-geo-index.mjs \
  --input cuba-latest.osm.pbf \
  --output frontend/public/geo/geo-index-cuba.json

# 4. Archivos resultantes (commiteados en /public):
#    public/tiles/cuba.pmtiles       → ~100MB (vector tiles Cuba completo)
#    public/geo/geo-index-cuba.json  → ~8MB raw, ~2MB gzip (índice de búsqueda)
#    Ambos servidos como static assets por Caddy/backend

> ⚠️ **Diálogo de confirmación de descarga**: La primera descarga de `cuba.pmtiles` (~100MB) puede consumir datos móviles. `RegionDownloadService.downloadRegion()` debe mostrar un diálogo nativo `confirm()` o un modal personalizado con el tamaño estimado y opciones "Descargar ahora" / "Solo WiFi". El SW no debe precachear el PMTiles en `install` — solo cuando el usuario lo solicite explícitamente:
> ```typescript
> async function downloadRegion(region: RegionDownload): Promise<void> {
>   const sizeMB = (await getEstimatedSize(region)) / (1024 * 1024);
>   const confirmed = window.confirm(
>     `Descargar mapa offline de ${region.label} (${sizeMB.toFixed(0)} MB)?\n` +
>     `Se almacenará localmente y estará disponible sin conexión.\n` +
>     (navigator.connection?.downlink != null
>       ? `Velocidad estimada: ${(navigator.connection.downlink / 8 * sizeMB).toFixed(0)}s`
>       : '')
>   );
>   if (!confirmed) return;
>   // ... descargar
> }
> ```
```

**¿Por qué PMTiles sobre MBTiles/OSM tiles?**
- Un solo archivo `.pmtiles` — no necesita servidor de tiles dedicado
- Soporta HTTP Range Requests — cliente descarga solo los tiles necesarios
- Se sirve desde `/tiles/cuba.pmtiles` como static asset (Caddy, Nginx, Spring)
- SW lo cachea en IndexedDB al primer arranque (offline-first)

**Realidad de Cuba en OSM:**

| Zona | Cobertura |
|------|-----------|
| La Habana | ⭐⭐⭐⭐ Buena — calles, barrios, POIs |
| Capitales provinciales | ⭐⭐⭐ Moderada |
| Municipios rurales | ⭐⭐ Limitada |
| Zonas agrícolas | ⭐ Muy pobre |

El usuario debe saberlo: tooltip en el buscador: *"Resultados limitados en zonas rurales"*.

### B8.1 — Arquitectura del Componente Genérico

> ⚠️ **Diseño genérico, no atado a Cuba**: Todos los componentes de mapa aceptan `tilesUrl`, `geoIndexUrl` y `countryCode` como props con defaults a CU. El consumer (vista concreta) solo pasa props. El mismo `OfflineMap` se reusa en: picker de dirección (B3), página standalone `/maps`, y cualquier vista futura que necesite mapa.

```
┌──────────────────────────────────────────────────────────────┐
│                        MapContainer                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Loading (skeleton con spinner)                          ││
│  │  Error (tooltip + botón reintentar)                      ││
│  │  Empty ("No hay datos de mapa para esta región")         ││
│  │  Ready ────────────────────────────────────────────────  ││
│  │  ┌────────────────────────┐                              ││
│  │  │ GeoSearchInput         │  ← overlay superior          ││
│  │  └────────────────────────┘                              ││
│  │  ┌──────────────────────────────────────────────────┐    ││
│  │  │                                                  │    ││
│  │  │          OfflineMap (Leaflet)                    │    ││
│  │  │          PMTiles layer + OSM fallback            │    ││
│  │  │          markers, onLocationSelect               │    ││
│  │  │                                                  │    ││
│  │  └──────────────────────────────────────────────────┘    ││
│  │  ┌───────────────────────────────────────────┐            ││
│  │  │ MapControls (zoom +/-, locate, fullscreen)│ ← overlay  ││
│  │  │ Todos ≥44px, con tooltip                   │   esquina  ││
│  │  └───────────────────────────────────────────┘   inferior  ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘

   MapPickerModal (wrapper de MapContainer para formularios B3):
   ┌───────────────────────────────────────────┐
   │ Seleccionar Ubicación                     │
   │ ┌───────────────────────────────────────┐ │
   │ │ [Buscar calle o lugar...]             │ │
   │ ├───────────────────────────────────────┤ │
   │ │                                       │ │
   │ │         Mapa (mismos controles)       │ │
   │ │                                       │ │
   │ │         [+][-] [📍] [⛶]              │ │
   │ │    ┌──────────┐ ┌──────────┐          │ │
   │ │    │ Cancelar │ │ Seleccionar│         │ │
   │ │    └──────────┘ └──────────┘          │ │
   │ └───────────────────────────────────────┘ │
   └───────────────────────────────────────────┘
```

### B8.2 — Core: Entities + Ports (genéricos, sin Cuba coupling)

```typescript
// frontend/src/core/maps/entities/map-location.ts
export interface MapLocation {
  lat: number;
  lng: number;
  zoom?: number;
}

// Genérico — cualquier lugar del mundo, cualquier index
export interface GeoEntry {
  id: string;
  name: string;
  type: 'street' | 'place' | 'poi' | 'municipality' | 'province';
  countryCode: string;
  parentName?: string;    // municipio o provincia según nivel
  lat: number;
  lng: number;
  extra?: Record<string, string>; // datos adicionales por implementación
}

export interface MapTileConfig {
  tilesUrl: string;        // ruta al .pmtiles
  geoIndexUrl: string;     // ruta al .json de índice de búsqueda
  countryCode: string;     // 'CU', 'MX', etc.
  maxZoom: number;         // zoom máximo de tiles descargados
}
```

```typescript
// frontend/src/core/maps/ports/IGeoSearchAdapter.ts
// Port genérico — cualquier implementación concreta (Cuba, México, etc.)
import type { GeoEntry } from '../entities/map-location';

export interface IGeoSearchAdapter {
  load(config: { geoIndexUrl: string; countryCode: string }): Promise<void>;
  search(query: string, limit?: number, filters?: { province?: string; municipality?: string }): Promise<GeoEntry[]>;
  isLoaded(): boolean;
  getCountryCode(): string;
}
```

```typescript
// frontend/src/core/maps/ports/ITileManager.ts
export interface TileSetInfo {
  countryCode: string;
  tilesUrl: string;
  sizeBytes: number;
  downloadedAt: number;
  zoomMax: number;
}

export interface ITileManager {
  getInstalledTileSets(): Promise<TileSetInfo[]>;
  installTileSet(config: { tilesUrl: string; geoIndexUrl: string; countryCode: string }): Promise<void>;
  removeTileSet(countryCode: string): Promise<void>;
  updateTileSet(countryCode: string): Promise<void>;
  getEstimatedSize(config: { countryCode: string }): Promise<number>;
}
```

### B8.3 — Infrastructure: Cuba Adapters (implementaciones concretas)

```typescript
// frontend/src/infrastructure/maps/adapters/CubaGeoSearchAdapter.ts
// Implementación del port IGeoSearchAdapter para Cuba
// FlexSearch con índice precargado en build-time
import FlexSearch from 'flexsearch';
import type { IGeoSearchAdapter, GeoEntry } from '@/core/maps/ports/IGeoSearchAdapter';

export class CubaGeoSearchAdapter implements IGeoSearchAdapter {
  private index: FlexSearch.Index | null = null;
  private entries: GeoEntry[] = [];
  private loaded = false;
  private countryCode = 'CU';

  // Cadena offline-first: 1) IDB cache → 2) SW Cache API → 3) fetch (network) → cachea en ambos
  async load(config: { geoIndexUrl: string; countryCode: string }): Promise<void> {
    if (this.loaded) return;
    this.countryCode = config.countryCode;
    const data = await this.loadGeoIndex(config.geoIndexUrl);
    this.index = new FlexSearch.Index({ tokenize: 'forward' });
    data.forEach((entry, i) => this.index!.add(i, `${entry.name} ${entry.parentName ?? ''}`));
    this.entries = data;
    this.loaded = true;
  }

  // Offline-first retrieval: IDB → SW Cache → fetch → cache
  // Sin internet y sin cache → lanza error que MapContainer captura como estado 'empty'
  private async loadGeoIndex(url: string): Promise<GeoEntry[]> {
    // 1. Intentar desde IndexedDB (caché persistente de datos)
    const db = await getDB();
    const idbCached = await db.get('syncMeta', `geo_index_${this.countryCode}`);
    if (idbCached?.data) return idbCached.data;

    // 2. Intentar desde SW Cache API (precargado o de sesiones anteriores)
    const cache = await caches.open('map-tiles-v1');
    const cachedResponse = await cache.match(url);
    if (cachedResponse?.ok) {
      const data = await cachedResponse.json() as GeoEntry[];
      // Almacenar en IDB para persistencia offline-offline
      await db.put('syncMeta', { key: `geo_index_${this.countryCode}`, value: { data } });
      return data;
    }

    // 3. Último recurso: fetch desde red (SW intercepta con cache-first)
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Geo index no disponible: ${response.status}`);
    const data = await response.json() as GeoEntry[];
    // Cachear en SW Cache + IDB para próxima vez offline
    await cache.put(url, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
    await db.put('syncMeta', { key: `geo_index_${this.countryCode}`, value: { data } });
    return data;
  }

  async search(query: string, limit = 15,
    filters?: { province?: string; municipality?: string }): Promise<GeoEntry[]> {
    if (!this.index) return [];
    const ids = this.index.search(query, limit * 2) as number[];
    let results = ids.map(i => this.entries[i]);
    if (filters?.province) results = results.filter(e => e.parentName === filters.province || e.extra?.province === filters.province);
    if (filters?.municipality) results = results.filter(e => e.extra?.municipality === filters.municipality);
    return results.slice(0, limit);
  }

  isLoaded(): boolean { return this.loaded; }
  getCountryCode(): string { return this.countryCode; }
}

// frontend/src/infrastructure/maps/adapters/CubaTileManager.ts
// Implementación concreta del port ITileManager
// Gestiona descarga/eliminación de tilesets vía SW + IndexedDB
export class CubaTileManager implements ITileManager {
  async getInstalledTileSets(): Promise<TileSetInfo[]> {
    const db = await getDB();
    const meta = await db.getAll('syncMeta');
    return meta
      .filter(m => m.key.startsWith('tileset_'))
      .map(m => m.value as TileSetInfo);
  }
  async installTileSet(config: { tilesUrl: string; geoIndexUrl: string; countryCode: string }): Promise<void> {
    // Descarga PMTiles vía SW cache + guarda metadata en syncMeta
    const cache = await caches.open('map-tiles-v1');
    await cache.add(config.tilesUrl);
    await cache.add(config.geoIndexUrl);
    await setSyncMeta(`tileset_${config.countryCode}`, {
      countryCode: config.countryCode,
      tilesUrl: config.tilesUrl,
      downloadedAt: Date.now(),
      zoomMax: 16,
    });
  }
  async removeTileSet(countryCode: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('syncMeta', 'readwrite');
    tx.objectStore('syncMeta').delete(`tileset_${countryCode}`);
    await tx.done;
  }
  async updateTileSet(countryCode: string): Promise<void> { /* re-download */ }
  async getEstimatedSize(config: { countryCode: string }): Promise<number> { return 0; }
}
```

```typescript
// frontend/src/infrastructure/maps/adapters/RegionDownloadService.ts
// Servicio genérico para descargar regiones desde Settings
// Sin acoplamiento a Cuba — acepta cualquier regionCode + tilesUrl

export interface RegionDownload {
  regionCode: string;
  label: string;
  tilesUrl: string;
  geoIndexUrl: string;
}

// Lista precargada de regiones disponibles (expansible desde Settings)
// En el futuro: endpoint GET /api/v1/maps/available-regions
export const AVAILABLE_REGIONS: RegionDownload[] = [
  { regionCode: 'CU', label: 'Cuba', tilesUrl: '/tiles/cuba.pmtiles', geoIndexUrl: '/geo/geo-index-cuba.json' },
];

export async function downloadRegion(region: RegionDownload): Promise<void> {
  const cache = await caches.open('map-tiles-v1');
  await Promise.all([
    cache.add(region.tilesUrl),
    cache.add(region.geoIndexUrl),
  ]);
  await setSyncMeta(`tileset_${region.regionCode}`, {
    countryCode: region.regionCode,
    tilesUrl: region.tilesUrl,
    downloadedAt: Date.now(),
    zoomMax: 16,
  });
}
```

### B8.4 — Dependencias

```bash
cd frontend && pnpm add leaflet react-leaflet pmtiles leaflet.vectorgrid flexsearch
pnpm add -D @types/leaflet
```

### B8.5 — Componentes de Mapa Genéricos

#### MapContainer — Entry point genérico (loading → error → empty → ready)

```tsx
// frontend/src/presentation/shared/components/map/MapContainer.tsx
// Wrapper que maneja todo el ciclo de vida del mapa offline.
// Props definen qué tiles cargar, qué search adapter usar, y qué pasa al seleccionar.

interface MapContainerProps {
  // Configuración de tiles (defaults a Cuba)
  tilesConfig?: MapTileConfig;
  tilesConfigDefault?: Partial<MapTileConfig>;  // override parcial de defaults
  // Adaptador de búsqueda geográfica
  geoSearchAdapter?: IGeoSearchAdapter;
  // Comportamiento del mapa
  center?: MapLocation;
  zoom?: number;
  markers?: MapMarkerProps[];
  searchEnabled?: boolean;
  controlsEnabled?: boolean;     // mostrar zoom/locate/fullscreen
  readonly?: boolean;            // sin onLocationSelect
  onLocationSelect?: (location: MapLocation, geoEntry?: GeoEntry) => void;
  // Estados UI
  emptyMessage?: string;
  errorMessage?: string;
}

const DEFAULT_TILES_CONFIG: MapTileConfig = {
  tilesUrl: '/tiles/cuba.pmtiles',
  geoIndexUrl: '/geo/geo-index-cuba.json',
  countryCode: 'CU',
  maxZoom: 16,
};

export function MapContainer({
  tilesConfig,
  tilesConfigDefault,
  geoSearchAdapter,
  ...rest
}: MapContainerProps) {
  const config = { ...DEFAULT_TILES_CONFIG, ...tilesConfigDefault, ...tilesConfig };
  const [status, setStatus] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [tilesAvailable, setTilesAvailable] = useState(false);
  const [geoAvailable, setGeoAvailable] = useState(false);

  // Carga offline-first: SW Cache → fetch (sin internet = solo cache)
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setStatus('loading');
      const cache = await caches.open('map-tiles-v1');
      const tileCached = await cache.match(config.tilesUrl!);
      const geoRes = geoSearchAdapter ?? new CubaGeoSearchAdapter();
      try {
        // Cargar geo index (usa offline-first chain interna)
        await geoRes.load({ geoIndexUrl: config.geoIndexUrl!, countryCode: config.countryCode! });
        if (!cancelled) setGeoAvailable(true);
      } catch {
        // Geo index no disponible — mapa se muestra sin búsqueda
        if (!cancelled) setGeoAvailable(false);
      }

      if (tileCached?.ok) {
        if (!cancelled) setTilesAvailable(true);
      } else {
        // Intentar fetch (SW intercepta con cache-first). Si falla y no hay cache → empty
        try {
          const resp = await fetch(config.tilesUrl!, { method: 'HEAD' });
          if (!cancelled) setTilesAvailable(resp.ok);
        } catch {
          if (!cancelled) setTilesAvailable(false);
        }
      }

      if (!cancelled) {
        if (!tilesAvailable && !geoAvailable) {
          setStatus('empty');
        } else {
          setStatus('ready');
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [config.tilesUrl, config.geoIndexUrl]);

  if (status === 'loading') return <MapSkeleton />;
  if (status === 'error') return <MapError onRetry={() => setStatus('loading')} message={rest.errorMessage} />;
  if (status === 'empty') return <MapEmpty message={rest.emptyMessage} />;

  return <OfflineMap config={config} geoSearchAdapter={geoSearchAdapter} tilesAvailable={tilesAvailable} geoAvailable={geoAvailable} {...rest} />;
}
```

**Estados visuales (todos con tooltips):**

```
Loading:                           Error:
┌──────────────────────┐           ┌──────────────────────┐
│ ⏳ Cargando mapa...   │           │ ⚠️ Error al cargar   │
│ [████████░░░░] 60%   │           │ el mapa               │
│                      │           │                      │
│ Cargando tiles...    │           │ [🔄 Reintentar]       │
└──────────────────────┘           └──────────────────────┘

Empty:                             Ready:
┌──────────────────────┐           ┌──────────────────────┐
│ 🗺️ Sin datos de mapa │           │ [Buscar...]          │
│                      │           │                      │
│ No hay tiles         │           │    Mapa interactivo  │
│ descargados para     │           │    [+][-][📍][⛶]     │
│ esta región.         │           │                      │
│                      │           │                      │
│ [Descargar ahora]    │           └──────────────────────┘
└──────────────────────┘
```

#### OfflineMap — El mapa real (Leaflet + PMTiles)

```tsx
// frontend/src/presentation/shared/components/map/OfflineMap.tsx
// Núcleo del mapa: PMTiles layer + OSM fallback + marcadores + selección.
// No tiene Cuba hardcodeado — recibe tilesUrl por props desde MapContainer.

interface OfflineMapProps {
  config: MapTileConfig;           // tilesUrl, countryCode, maxZoom
  tilesAvailable: boolean;         // false → no muestra capa de tiles (muestra solo mapa base vacío)
  geoAvailable: boolean;           // false → deshabilita búsqueda
  geoSearchAdapter?: IGeoSearchAdapter;
  center?: MapLocation;
  zoom?: number;
  markers?: MapMarkerProps[];
  readonly?: boolean;
  onLocationSelect?: (latlng: MapLocation) => void;
}

// PMTiles layer se configura via protocol handler de leaflet.
// OSM fallback: si hay conexión y tilesUrl falla, intenta tiles.osm.org
// pero cacheado por SW. Sin internet → solo PMTiles (si tilesAvailable=false, no se muestra nada offline).
```

#### MapControls — Controles reutilizables (zoom + locate + fullscreen)

> ⚠️ **Geolocalización offline**: `navigator.geolocation.getCurrentPosition()` usa GPS/redes del dispositivo (WiFi scanning, triangulación de torres). NO requiere internet. El botón "Mi ubicación" funciona en avión. Leaflet's `map.locate()` delega en esta API. Sin GPS (ej: desktop sin chip GPS) puede fallar — el tooltip muestra "Ubicación no disponible".

```tsx
// frontend/src/presentation/shared/components/map/MapControls.tsx
// Overlay en esquina inferior derecha del mapa.
// TODOS los botones: min-h-11 min-w-11 (44px), con tooltip.

interface MapControlsProps {
  mapInstance: L.Map | null;
  showZoom?: boolean;      // default true
  showLocate?: boolean;    // default true
  showFullscreen?: boolean; // default true
}

export function MapControls({ mapInstance, showZoom = true, showLocate = true, showFullscreen = true }: MapControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
      {showZoom && (
        <>
          <TooltipWrapper content="Acercar">
            <button onClick={() => mapInstance?.zoomIn()} className="min-h-11 min-w-11 ...">
              <Plus />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Alejar">
            <button onClick={() => mapInstance?.zoomOut()} className="min-h-11 min-w-11 ...">
              <Minus />
            </button>
          </TooltipWrapper>
        </>
      )}
      {showLocate && (
        <TooltipWrapper content="Mi ubicación">
          <button onClick={() => mapInstance?.locate()} className="min-h-11 min-w-11 ...">
            <MyLocation />
          </button>
        </TooltipWrapper>
      )}
      {showFullscreen && (
        <TooltipWrapper content="Pantalla completa">
          <button onClick={() => toggleFullscreen()} className="min-h-11 min-w-11 ...">
            <Fullscreen />
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
}
```

#### GeoSearchInput — Búsqueda geográfica genérica

```tsx
// frontend/src/presentation/shared/components/map/GeoSearchInput.tsx
// Input de búsqueda con autocomplete, genérico (no atado a Cuba).
// Recibe el searchAdapter por props. Filtra resultados por province/municipality.

interface GeoSearchInputProps {
  searchAdapter: IGeoSearchAdapter;
  province?: string;
  municipality?: string;
  onSelect: (entry: GeoEntry) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

### B8.6 — Integración con Formularios B3

```tsx
// En SupplierAddressFields.tsx (y CustomerFormFields.tsx):
<Button variant="outline" onClick={() => setShowMapPicker(true)}>
  <MapPin className="h-4 w-4" /> Seleccionar en Mapa
</Button>

<MapPickerModal
  open={showMapPicker}
  initialLocation={{ lat: latitude ?? 23.1136, lng: latitude ? longitude : -82.3666 }}
  province={province}
  municipality={municipality}
  onSelect={(lat, lng, place) => {
    setLatitude(lat);
    setLongitude(lng);
    if (place) {
      setProvince(place.extra?.province ?? place.parentName);
      setMunicipality(place.extra?.municipality);
      setStreet(place.name);
    }
    setShowMapPicker(false);
  }}
/>

// MapPickerModal.tsx — wrapper genérico que usa MapContainer internamente
interface MapPickerModalProps {
  open: boolean;
  initialLocation?: MapLocation;
  province?: string;
  municipality?: string;
  onSelect: (lat: number, lng: number, entry?: GeoEntry) => void;
  onClose: () => void;
}
```

### B8.7 — Service Worker: Precarga + Cache de Tiles

```typescript
// sw/strategies/mapTilesStrategy.ts
// Genérico — cachea cualquier tileset registrado en syncMeta

// Al instalar SW: precachear tilesets activos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('map-tiles-v1').then(cache =>
      // tilesets activos se cachean desde syncMeta al arrancar
    )
  );
});

// Cache-First para todo /tiles/* y /geo/*
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/tiles/') || url.pathname.startsWith('/geo/')) {
    event.respondWith(cacheFirst(event.request));
  }
});
```

### B8.8 — Settings de Mapas Offline (genérico, expansible)

Agregar a `system_settings`:

```sql
INSERT INTO system_settings (key, value, value_type, is_public, description) VALUES
  ('maps.default-zoom-max',  '16',  'integer', true, 'Zoom máximo de tiles descargados'),
  ('maps.default-region',    'CU',  'string',  true, 'Región de tiles precargados por defecto'),
  ('maps.pmtiles-url',       '/tiles/cuba.pmtiles', 'string', true, 'URL del archivo PMTiles por defecto')
ON CONFLICT (key) DO NOTHING;
```

UI en Settings > "Mapas Offline":

```
┌──────────────────────────────────────────────┐
│ 🗺️ Mapas Offline                              │
│                                               │
│ Regiones instaladas:                          │
│   ✅ Cuba (123.4 MB)     [Actualizar] [🗑️]   │
│                                               │
│ [➕ Descargar nueva región]                   │
│   Seleccionar país ▼                          │
│                                               │
│ Almacenamiento: 123.4 MB / 500 MB             │
│ [██████████░░░░░░░░░░░░] 24.7%                │
└──────────────────────────────────────────────┘
```

- Botón "Descargar región": dropdown con regiones disponibles de `AVAILABLE_REGIONS` (listado extensible desde build config o endpoint futuro)
- Cada tileset se almacena en SW cache + metadata en IndexedDB `syncMeta`
- Tooltip en cada botón: "Actualizar mapa de Cuba", "Eliminar tiles de Cuba", "Descargar nueva región"
- **Todas las descargas son manuales** — nunca automáticas (el usuario elige cuándo descargar ~100MB)

### B8.9 — Script de generación de índice de búsqueda (build-time)

```typescript
// scripts/generate-geo-index.mjs
// Lee cuba-latest.osm.pbf → extrae calles + lugares + POIs
// Output: frontend/public/geo/geo-index-cuba.json (~8MB raw, ~2MB gzip)
// Calles La Habana: ~12,000 entradas | Todo Cuba: ~45,000-60,000 entradas
//
// Ejecutar en CI/CD o manualmente cuando se actualice el extracto OSM

interface GeoIndexEntry {
  id: string;
  name: string;
  type: 'street' | 'place' | 'poi' | 'municipality';
  province: string;
  municipality: string;
  lat: number;
  lng: number;
  osmId?: string;
}
```

**Files Summary B8:**

| Capa | Archivos | Acción |
|------|----------|--------|
| Core | `map-location.ts` (entity), `IGeoSearchAdapter.ts` (port), `ITileManager.ts` (port) | Crear (genéricos, 0 Cuba coupling) |
| Infrastructure | `CubaGeoSearchAdapter.ts` (impl IGeoSearchAdapter), `CubaTileManager.ts` (impl ITileManager), `RegionDownloadService.ts` | Crear (implementaciones concretas) |
| Presentation | `MapContainer.tsx` (loading→error→empty→ready), `OfflineMap.tsx` (Leaflet + PMTiles), `MapControls.tsx` (zoom/locate/fullscreen), `GeoSearchInput.tsx` (búsqueda genérica), `MapPreview.tsx` (thumbnail), `MapPickerModal.tsx` (modal para formularios), `MapSkeleton.tsx`, `MapError.tsx`, `MapEmpty.tsx` | Crear |
| Route | `/maps/page.tsx` | Crear (standalone maps page) |
| SW | `sw/strategies/mapTilesStrategy.ts` | Crear (cache tiles + geo index) |
| Settings | `MapSettingsPanel.tsx` | Crear (gestión de regiones) |
| Build | `scripts/generate-geo-index.mjs` | Crear (generate geo index from OSM PBF)
| Route | `/maps/page.tsx` | Crear |
| SW | `sw/strategies/mapTilesStrategy.ts` | Crear (cache PMTiles + geo index) |
| Settings | `system_settings` (maps.* entries) | Agregar en V15 o migration |
| B3 forms | `SupplierAddressFields.tsx`, `CustomerFormFields.tsx` | Agregar botón mapa |

---

## Fase B9 — Compartir Ubicación (Deep Links sin API externa)

> **Skills**: `senior-frontend`, `ui-ux-pro-max`
> **Objetivo**: Permitir compartir ubicación de proveedores/clientes/ubicaciones mediante deep links a Google Maps, Waze y WhatsApp. **La app NO llama a ninguna API externa** — solo genera URLs. La app usa Leaflet offline para mostrar el mapa internamente; los deep links son para que el usuario comparta fuera de la app.

### B9.1 — Utility: LocationShare

```typescript
// frontend/src/core/shared/utils/locationShare.ts
export interface ShareablePlace {
  name: string;
  lat: number;
  lng: number;
  address?: string;  // dirección completa formateada
}

export interface ShareLinks {
  googleMaps: string;
  waze: string;
  whatsapp: string;
  copyText: string;  // texto copiable: "Nombre — Dirección — https://maps.google.com/?q=lat,lng"
}

export function buildShareLinks(place: ShareablePlace): ShareLinks {
  const mapsUrl = `https://maps.google.com/?q=${place.lat},${place.lng}`;
  return {
    googleMaps: mapsUrl,
    waze: `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      `📍 ${place.name}${place.address ? ' — ' + place.address : ''}: ${mapsUrl}`
    )}`,
    copyText: `${place.name} — ${place.address ?? `${place.lat},${place.lng}`} — ${mapsUrl}`,
  };
}
```

### B9.2 — Componente compartido

```tsx
// frontend/src/presentation/shared/components/location/LocationShareButton.tsx
// Botón "Compartir ubicación" con dropdown de opciones
interface LocationShareButtonProps {
  place: ShareablePlace;
  variant?: 'icon' | 'button';
}

// Opciones del dropdown:
// 📍 Ver en mapa → abre el OfflineMap de B8 (modal o sección)
// 🗺️ Google Maps → abre deep link externo
// 🚗 Waze → abre deep link externo
// 💬 WhatsApp → abre deep link externo
// 📋 Copiar ubicación → copia texto al portapapeles
// Tooltip obligatorio en cada opción del dropdown
```

### B9.3 — Integración en entidades

Agregar botón de compartir en las vistas de detalle de:
- **Proveedor** (SupplierDetail) — cuando tiene coordenadas
- **Cliente** (CustomerDetail) — cuando tiene coordenadas
- **Ubicaciones guardadas** (SavedLocationsList de B8)

```tsx
// En SupplierDetail.tsx (en la sección de dirección):
{latitude && longitude && (
  <LocationShareButton
    place={{
      name: supplier.name,
      lat: latitude,
      lng: longitude,
      address: formatAddress(supplier), // from B3 structured address
    }}
  />
)}
```

**Files Summary B9:**

| Capa | Archivos | Acción |
|------|----------|--------|
| Core | `locationShare.ts` | Crear |
| Shared UI | `LocationShareButton.tsx` | Crear |
| Views | `SupplierDetail.tsx`, `CustomerDetail.tsx`, `SavedLocationsList.tsx` | Agregar botón compartir |

---

## Prioridad de Ejecución

| Orden | Fase | Tiempo est. | Dependencias | Prioridad |
|-------|------|-------------|--------------|-----------|
| 1 | **A5** — Fix POS CREDIT/RESERVE + Debts bug | ~20 min | Ninguna | 🔴 P0 |
| 2 | **A1** — Audit Logs (ver + escribir + system_settings) | ~80 min | Ninguna | 🔴 P0 |
| 3 | **A2+A4** — Reports + Export (fusionadas) | ~35 min | Ninguna | 🔴 P0 |
| 4 | **A3** — Import CSV Backend | ~40 min | Ninguna | 🔴 P0 |
| 5 | **A6** — Notification Preferences + System Settings UI | ~40 min | A1.7 | 🟡 P1 |
| 6 | **B2** — Permisos: Iconos + Validación en UI | ~90 min | A6 | 🟡 P1 |
| 7 | **B6** — Imagen de Perfil de Usuario | ~60 min | B2 (imagen requiere permiso) | 🟡 P1 |
| 8 | **B1** — Tooltips: Iconos + Copiar + Auditoría | ~60 min | B2 (tooltips en permisos) | 🟡 P1 |
| 9 | **B4** — UX Formularios: Pre-llenado + Crear y Continuar | ~50 min | B2 (forms requieren permisos) | 🟡 P1 |
| 10 | **B5** — Gráficos + Estadísticas + Métricas | ~120 min | A2+A4 (endpoints reports) | 🟡 P1 |
| 11 | **B3** — Dirección Estructurada (Cuba-first + geo_regions) | ~75 min | B2 | 🟢 P2 |
| 12 | **A8** — Housekeeping + Tooltips legacy | ~25 min | A1-A6, B1-B6 | 🟢 P2 |
| 13 | **B9** — Compartir Ubicación (Deep Links) | ~15 min | B3 (tiene coordenadas) | 🟢 P2 |
| 14 | **B7** — Resolución Conflictos Offline | ~40 min | A7 | ⚪ Alternativo |
| 15 | **A7** — Offline IndexedDB + SW + Sync | ~300-360 min | A1-A6, B7 | ⚪ Alternativo |
| 16 | **B8** — Mapas Offline (Leaflet + PMTiles) | ~180 min | B3 (direcciones) | 🔵 P3 |

**Total estimado (P0):** ~175 min (~3 horas)
**Total estimado (P0+P1):** ~595 min (~10 horas)
**Total (P0+P1+P2):** ~720 min (~12 horas)
**Total (con A7+B7+B8):** ~1260 min (~21 horas)

---

## Verificación Post-Fix

```bash
# 1. Audit logs endpoint existe
curl -s http://localhost:8080/api/v1/audit-logs | jq 'length'
# Expected: array con logs (al menos 0, sin error)

# 2. Reports endpoints existen
curl -s http://localhost:8080/api/v1/reports/sales | jq '.totalSales'
curl -s http://localhost:8080/api/v1/reports/inventory | jq '.totalProducts'
# Expected: valores numéricos, no 404

# 3. Import endpoints existen
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/imports/csv
# Expected: 400 (bad request sin CSV) — no 404

# 4. Export endpoints existen
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/exports/sales
# Expected: 200 o 400 — no 404

# 5. POS CREDIT wiring
# Verificar que CreditSaleUseCase está importado y usado:
rg 'creditSaleUseCase|reserveSaleUseCase' backend/inventory-app/src/main/java/com/inventory/adapters/web/controller/sale/SaleController.java
# Expected: ambas importadas y referenciadas

# 6. Backend compile + test
cd backend/inventory-app && mvn compile -q && mvn test -q 2>&1 | tail -3

# 7. Frontend build + test
cd frontend && pnpm build 2>&1 | tail -5 && pnpm test:run 2>&1 | tail -5

# 8. Debts bug fixed
rg 'listOverdue' backend/inventory-app/src/main/java/com/inventory/adapters/web/controller/customer/CustomerDebtController.java
# Expected: SOLO en el endpoint /overdue, NO en listAll()

# 9. Sin any sin justificación en código nuevo
rg '\bany\b' frontend/src/presentation/modules/audit/ | grep -v 'unknown' | grep -v '//'
```

---

## Esquema de Dependencias

```
A5 (POS Fix) ── independiente
│
A1 (Audit + System Settings) ── independiente
│
A2+A4 (Reports+Export) ── independiente (solo backend)
│
A3 (Import) ─── independiente (backend + posible DB)
│
A6 (Notif UI + Settings UI) ── depende de A1.7 backend system_settings
│
B2 (Permisos UI) ── depende de A6
│  ├── B1 (Tooltips) ── depende de B2 (tooltips en permisos)
│  ├── B4 (Forms UX) ── depende de B2 (forms requieren permisos)
│  └── B6 (User Images) ── depende de B2 + backend
│
B5 (Charts) ── depende de A2+A4 (endpoints reports)
│
B3 (Address + geo_regions) ── depende de B2
│  ├── B9 (Location Share) ── depende de B3 (tiene coordenadas)
│  └── B8 (Maps) ── depende de B3 (direcciones) (alternativo)
│
A8 (Housekeeping) ── depende de A1-A6 + B1-B6
│
B7 (Outbox Collapsing) ── depende de A7
│
A7 (Offline) ── depende de A1-A6 + B7 (alternativo)
```

Todas las fases P0 (A1-A5) son independientes entre sí y pueden ejecutarse en paralelo.
Fases P1 (B2, B6, B1, B4, B5) se ejecutan después de A6 en el orden listado.
Fases P2 (B3, A8, B9) son posteriores a P1.
Fases ⚪/🔵 (A7, B7, B8) son alternativas de largo plazo.

---

## Commits Recomendados

```
A1: feat(audit): implement audit log system with viewer and automatic logging
    feat(settings): add system_settings table, SystemSettingsService, and admin endpoints
A2+A4: feat(backend): add reports (sales/inventory) and CSV export endpoints
A3: feat(import): add CSV import endpoint with dry run and job tracking
A5: fix(pos): wire CreditSaleUseCase and ReserveSaleUseCase in SaleController
    fix(debts): listAll returns all debts by default instead of only overdue
A6: feat(settings): add Notifications preferences and System settings tabs in SettingsView
    feat(ui): integrate TooltipHint component for form field context help
    chore: consolidate notifications.api.ts with notification-api.ts
A7.0: feat(backend): add idempotency service and sync log writer
A7.1: feat(backend): add generic POST /sync/push endpoint with operation router
A7.2: feat(frontend): expand IndexedDB to 11 stores with full CRUD
A7.3: feat(frontend): activate push/pull sync cycle
A7.4: feat(frontend): integrate repositories with IndexedDB + outbox
A7.5: feat(frontend): upgrade SW with API caching strategies
A7.6: feat(frontend): add 6-step initial loading screen
A7.7: feat(frontend): add LRU image cache for thumbnails
A7.8: feat(backend+frontend): add delta sync per entity type with parallel pulls
A7.9: feat(backend+frontend): add cache consistency validation via checksums
A8: chore: rename DebtPaymentHistory to DebtActionForms
    chore: cleanup TODO/FIXME across A1-A7
    feat(ui): add tooltips system-wide using TooltipHint/TooltipWrapper
    docs: update README, CHANGELOG, and endpoint docs
    fix: remove dead code and residual console.log
B1: feat(ui): enrich Tooltip component with section icons and copy button
    feat(ui): audit and add tooltips across all 18 modules
B2: feat(auth): add granular permission-based UI guards (Can, usePermission, routes)
    feat(ui): add section icons to PermissionGroupSelector
    feat(ui): filter sidebar navigation by user permissions
    feat(backend): switch controllers to granular @PreAuthorize permission checks
B3: feat(db): add geo_regions table with Cuba seed (15 provinces, ~170 municipalities)
    feat(backend): add GeoRegion query endpoints and entities
    feat(db): migrate supplier/customer address to structured fields
    feat(backend): update entities and DTOs for structured address
    feat(frontend): add province/municipality cascading selects
    feat(frontend): update forms with structured address fields
B4: feat(ui): add auto-select-all on input focus
    feat(ui): add "Create and Continue" button pattern to all forms
    feat(ui): add prefilling forms from query params
B5: feat(backend): add sales timeline, top products, top customers, profit summary endpoints
    feat(dashboard): add recharts visualizations for sales, profits, trends
    feat(dashboard): add custom chart builder with drag-and-drop widgets
B6: feat(backend): add UserImageController and avatar endpoints
    feat(ui): add avatar upload in UserForm
    feat(ui): show user avatar in Header with initials fallback
    feat(ui): show avatar column in Users list
B7: feat(sync): add outbox collapsing for temp ID resolution
    feat(sync): add tempId → realId mapping in push sync response
B8: feat(maps): add PMTiles-based offline map with Cuba coverage
    feat(maps): add FlexSearch-based offline geo index (CubaGeoIndex)
    feat(maps): integrate map picker with address form fields
    feat(maps): add SW precache strategy for tiles and geo index
    feat(maps): add /maps subsection and MapSettings UI
B9: feat(ui): add location share utility (Google Maps, Waze, WhatsApp deep links)
    feat(ui): add "Compartir ubicación" button on supplier/customer detail
```

---

## Notas

- ⚠️ **A1 Audit Logs**: No crear sistema de eventos (Domain Events) para esta fase. Inyectar `AuditLogRepository` directamente en use cases existentes. YAGNI.
- ⚠️ **A1** `AuditLogSearchCriteria` en `domain/ports/out/` (mismo paquete que `AuditLogRepository`). Co-locación: el port lo recibe como parámetro. Def en A1.3.
- ⚠️ **A1.5 AuditSerializer**: Interfaz en `application/shared/AuditSerializer.java` (sin Spring). Implementación en `adapters/web/shared/AuditSerializerImpl.java` (con `@Component` + `ObjectMapper`). Los 6 use cases inyectan la interfaz. Hexagonal: application NO depende de adaptations, adaptations implementa interfaz definida en application.
- ⚠️ **A1.7 system_settings**: Migration V15 se ejecuta PRIMERO. Los servicios de retención usan `SystemSettingsService` en vez de `@Value`. Requiere `spring-boot-starter-cache` + `caffeine` en pom.xml y Caffeine config con TTL 5min en application.yml.
- ⚠️ **A1.7 @EnableCaching**: Requerido para `SystemSettingsService`. Se agrega a `bootstrap/InventoryApplication.java`.
- ⚠️ **A2.2 totalProfit**: Derivar en use case (`totalRevenue - totalCost`), no en SQL.
- ⚠️ **A2+A4 Export**: Fase 1 solo CSV. Usar `Flux<String>` con `produces = "text/csv"` para streaming. NO `Mono<String>` (OOM en catálogos grandes). Retornar `501 Not Implemented` para xlsx/pdf.
- ⚠️ **A3 Import**: Fase 1 solo Products, Categories, Customers, Suppliers. CSV parsing con OpenCSV. `ImportJobRetentionService` lee retención de `SystemSettingsService`.
- ⚠️ **A8.5 Tooltips**: Usar el componente existente `TooltipHint`/`TooltipWrapper` de `@/presentation/shared/components/ui/tooltip.tsx`. NO usar `@radix-ui/react-tooltip` — el proyecto ya tiene su propio tooltip basado en `@floating-ui/react`. Aplicar tooltip a todo elemento no-obvio, especialmente íconos solos.
- ⚠️ **A5 POS Fix**: `CreditSaleUseCase` y `ReserveSaleUseCase` ya existen. **NO delegar a ellos desde `SaleCommandUseCase.createCredit/createReserve`** — inyectan `SaleCommandPort`, creando recursión. En su lugar, implementar pipeline inline en `SaleCommandUseCase` con los repositorios directos (incluyendo `CustomerDebtRepository`). Controladora no se modifica (ya usa `SaleCommandPort`).
- ⚠️ **A6 Preferences**: Verificar endpoints `GET/PUT /preferences` en `NotificationController.java` con `rg` antes de codificar (A6.1).
- ⚠️ **A6.3 TooltipHint**: Usar `<TooltipHint>` de `@/presentation/shared/components/ui/tooltip.tsx` para tooltips en formularios (Settings, import mapping, etc.). Soporta variantes `info|help|tip|warning`. Mobile-first (touch ≥44px).
- ⚠️ **A7.1 OperationRouter**: Usar `ObjectMapper.convertValue(payload, Type.class)` para convertir payload genérico al tipo específico. Jackson ya disponible via Spring Boot.
- ⚠️ **A7.3 PushResult/PullResult**: Tipos definidos explícitamente en A7.3 — mantener sincronizados con frontend.
- ⚠️ **A7.4 IDs temporales**: Opción A — al completar `pullSync()`, llamar `queryClient.invalidateQueries()` para que TanStack Query refresque con IDs reales. Sin reconciliación manual.
- ⚠️ **A7 Offline**: Solo si el resto está completo. Es la fase más compleja y requiere verificación exhaustiva.
- ⚠️ **B3.0 geo_regions**: La tabla `geo_regions` usa `parent_id` jerárquico (no `lft`/`rgt` de nested sets) porque el árbol es poco profundo (3 niveles: país → provincia → municipio). Si en el futuro se requieren niveles más profundos (ej: país → estado → ciudad → distrito), evaluar usar `ltree` de PostgreSQL para queries jerárquicas eficientes.
- ⚠️ **B3.0 V21 seed**: Los municipios cubanos completos (~170) deben incluirse en el archivo `V21__add_geo_regions.sql`. No se listan aquí por brevedad pero deben generarse a partir de fuente oficial (ONEI) e incluirse en el migration script completo.
- ⚠️ **B8 Stack**: PMTiles + FlexSearch. **No usar Nominatim API** — es online y requiere internet. **No usar OpenCage** — es servicio de pago online. El índice de búsqueda se genera en build-time desde OSM PBF y se sirve como static asset. Los tiles vectoriales (cuba.pmtiles) también se sirven como static asset. El Service Worker cachea ambos para offline.
- ⚠️ **B8 Cobertura OSM Cuba**: La Habana y capitales provinciales tienen buena cobertura. Municipios rurales tienen datos limitados. Agregar tooltip en el buscador: *"Resultados limitados en zonas rurales"*. Esto no es un bug — es la realidad de los datos de OSM en Cuba.
- ⚠️ **B8 tilemaker**: Requiere Node.js + tilemaker instalado en el entorno de CI/CD. El binario `tilemaker` no es npm — es un binario C++ que debe instalarse por separado. Alternativa: generar los PMTiles manualmente y committearlos (gitanos, pero es un archivo binario de ~100MB).
- ⚠️ **B9 Sin API externa**: LocationShare **solo genera URLs**. No hace fetch a Google Maps API, Waze API ni WhatsApp API. La app nunca contacta servidores externos. El usuario decide si abrir las URLs en apps externas.
- ⚠️ **Comportamiento offline por fase**: No todas las fases son offline. La tabla define qué esperar:
  | Fase | ¿Offline? | Mecanismo |
  |------|-----------|-----------|
  | A1 Audit Logs | ❌ Solo online | Son logs de backend + view. Los logs no se escriben offline. |
  | A2+A4 Reports+Export | ❌ Solo online | Reportes requieren agregación SQL. Export es streaming. No aplica offline. |
  | A3 Import CSV | ❌ Solo online | Upload HTTP requiere conexión. |
  | A5 POS Fix | ⚠️ Aplica A7 | POS online siempre. Venta offline via outbox (A7). |
  | A6 Settings UI | ⚠️ Parcial | SystemSettings (A1.9) debe cachear settings públicos en IndexedDB para que SW lea `sync.pull-interval-seconds` sin auth. Ver A7. |
  | A7 Offline+Sync | ✅ Completo | IndexedDB 11 stores, SW cache API, SyncService push/pull, delta sync. |
  | B1 Tooltips | ✅ No requiere red | Solo UI, sin datos. |
  | B2 Permisos | ⚠️ Depende de A7 | Lista de permisos debe cachearse en IDB. Route guards offline usan cache. |
  | B3 Address + geo_regions | ✅ Local | `geo_regions` es datos locales (seed SQL). Address cache en IDB. |
  | B4 Forms UX | ✅ No requiere red | Pre-llenado, auto-select. Sin fetch. |
  | B5 Charts | ❌ Solo online | Datos de reports (A2). Sin cache offline de agregaciones. |
  | B6 User Images | ⚠️ Imagen cache | Avatar se cachea en `imageCache` LRU (A7.7). Upload requiere conexión. |
  | B7 Outbox Collapsing | ✅ Parte de A7 | Resuelve conflictos de IDs temporales. |
  | B8 Mapas Offline | ✅ PMTiles | PMTiles static asset + FlexSearch build-time. SW cachea ambos. |
  | B9 Location Share | ✅ Sin red | Solo genera URLs de deep links. |
- ⚠️ **`archiveInBatches` usa `.expand()` (1 versión)**: Se reemplazó la recursión `flatMap` por `Mono.just(1L).expand(__ -> archiveBatch(cutoff)).takeWhile(rows -> rows > 0L).then()`. No hay versiones duplicadas — solo este patrón.
- ⚠️ **`actor_name` legacy en `audit_log`**: Columna TEXT agregada en V4 (ALTER TABLE) que queda siempre NULL. El domain `AuditLog` NO la incluye. Se resuelve en lectura via `@Query JOIN users(display_name)`. No modificar la tabla.
- ✅ **Plan completo (verificado)**: A1 (líneas 85-761), A2+A4 (763-967), A3 (998-1316), A5 (1341-1462), A6 (1464-1656), A7 (1717-3316), A8 (3317-3527), B1-B9 (3528-5168). Todas las secciones tienen contenido detallado con código, migrations, paths y tooltips.
- ✅ **A1.8 AuditLogView existe** (líneas 610-687): entity types, port, view mockup, modal con diff JSON, tooltips, files summary.
- ✅ **A1.9 SystemSettingsView existe** (líneas 690-761): entity types, port, view mockup, edit inline, tooltips, files summary.
- ✅ **A1.7 SystemSettingResponse definido** (líneas 496-507): `record` con `key, value, valueType, description, isPublic, updatedAt`. También en `SystemSettingsService.getAll()` retorna `Flux<SystemSettingResponse>` (líneas 542-547).
- ✅ **B1-B9 con implementación**: B1 tooltips (3528-3600), B2 permisos (3601-3831), B3 dirección (3832-4016), B4 UX (4017-4123), B5 gráficos (4124-4287), B6 imágenes (4288-4418), B7 outbox (4419-4553), B8 mapas (4554-4837), B9 location (4838-5168). Todas con código, migrations y paths.
- ✅ **A1.2 @Query JOIN detallado**: 4 métodos (`search`, `countSearch`, `findByIdWithActorName`, `findByEntity`) con LEFT JOIN `users(display_name)` para resolver `actorName`.
- ⚠️ **R2DBC null-binding para UUID en @Query**: El adapter debe convertir `UUID actorId` a `String` antes del bind (o filtrar nulos) para evitar fallos del driver R2DBC con `null` en tipos `UUID`. Documentado en A1.2.
- ⚠️ **AuditLogView offline fallback**: Cuando `navigator.onLine === false`, mostrar banner informativo "Sin conexión — datos no disponibles" en lugar de error. Filtros visibles pero deshabilitados. Documentado en A1.8.
- ✅ **Backend compile + tests deben pasar después de cada fase**.
