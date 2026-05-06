# Plan Detallado: Sistema de Notificaciones Avanzado

## Resumen Ejecutivo

Expandir el sistema de notificaciones con:
- **2 Tabs principales:** Sistema + De Usuarios
- **23 Categorías granulares** por tipo de evento
- **Preferencias personalizables** con horarios silenciosos (quiet hours)
- **3 canales:** SSE (tiempo real), Toast (popup), PWA Push (opcional)
- **Reutilización máxima** del código existente (domain models, ports, adapters)

---

## FASE 1: Contratos y Base de Datos

### 1.1 Extensión de Domain Model

**Nuevo archivo:** `domain/model/NotificationSource.java`

```java
public enum NotificationSource {
    SYSTEM,            // Eventos automáticos del sistema
    USER,              // Acciones de otros usuarios
    INTEGRATION,       // Webhooks/integraciones (future)
    SCHEDULED_TASK     // Tareas programadas (future)
}
```

**Nuevo archivo:** `domain/model/NotificationPriority.java`

```java
public enum NotificationPriority {
    LOW,       // No urgente (LOW_STOCK informativo)
    MEDIUM,    // Normal (IMPORT_DONE, comentarios)
    HIGH,      // Urgente (@mention, SYNC_CONFLICT)
    CRITICAL   // Crítica (DEBT_OVERDUE, CREDIT_LIMIT_REACHED)
}
```

**Extensión a:** `domain/model/Notification.java`

Nuevos campos:
- `NotificationSource source` — reemplaza type: SYSTEM_AUTO → SYSTEM, USER_MANUAL → USER
- `NotificationPriority priority` — LOW/MEDIUM/HIGH/CRITICAL
- `String actionUrl` — clickeable: `/products/123`, `/purchase/456`, null si no aplica
- `List<String> tags` — filtrado: `["stock", "warehouse-1"]`, `["user-mention", "urgent"]`
- `String deliveryChannel` — SSE, TOAST, PUSH

---

### 1.2 Categorías Extendidas (23 Total)

**Archivo:** `domain/model/NotificationCategory.java`

| Grupo | Categoría | Descripción |
|-------|-----------|-------------|
| **INVENTORY** | LOW_STOCK | Existencias bajo mínimo |
| | EXPIRED_SOON | Producto cercano a expiración |
| | OVERSTOCK | Exceso de stock vs demanda |
| | PRODUCT_CREATED | Nuevo producto registrado |
| | PRODUCT_MODIFIED | Cambio en datos producto |
| **SYNC & OFFLINE** | SYNC_CONFLICT | Conflicto durante sincronización |
| | SYNC_COMPLETED | Sync finalizado exitosamente |
| | OFFLINE_AVAILABLE | App disponible offline |
| | ONLINE_RECONNECTED | Reconexión después offline |
| **OPERATIONS** | IMPORT_DONE | CSV/XLSX import completado |
| | EXPORT_DONE | Exportación lista para descargar |
| | BULK_UPDATE | Actualización masiva completada |
| | REPORT_GENERATED | Reporte listo |
| **CREDIT & DEBT** | DEBT_OVERDUE | Deuda vencida (supplier/customer) |
| | CREDIT_LIMIT_REACHED | Límite de crédito alcanzado |
| | PAYMENT_RECEIVED | Pago registrado |
| **USER ACTIONS** | MENTION | @usuario mencionó |
| | COMMENT | Comentario en documento/item |
| | APPROVAL_NEEDED | Requiere aprobación (compra, transferencia) |
| | TASK_ASSIGNED | Tarea asignada al usuario |
| **SYSTEM** | MAINTENANCE | Mantenimiento programado |
| | MANUAL | Notificación manual del admin |
| | ALERT | Alerta del sistema (sensores, API) |

---

### 1.3 Base de Datos: Flyway Migration

**Archivo:** `src/main/resources/db/migration/V3__enhance_notifications.sql`

```sql
-- Alter notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'SYSTEM'
  CHECK (source IN ('SYSTEM', 'USER', 'INTEGRATION', 'SCHEDULED_TASK'));

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM'
  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_url TEXT;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(50) NOT NULL DEFAULT 'SSE'
  CHECK (delivery_channel IN ('SSE', 'TOAST', 'PUSH'));

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- New table: notification_preferences (per user)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Global toggles
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Per-category group toggles
    low_stock_enabled BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    operations_enabled BOOLEAN DEFAULT TRUE,
    debt_enabled BOOLEAN DEFAULT TRUE,
    user_actions_enabled BOOLEAN DEFAULT TRUE,
    system_enabled BOOLEAN DEFAULT TRUE,
    
    -- Delivery channels
    push_notifications_enabled BOOLEAN DEFAULT FALSE,
    toast_notifications_enabled BOOLEAN DEFAULT TRUE,
    sse_enabled BOOLEAN DEFAULT TRUE,
    
    -- Sound & visual
    sound_enabled BOOLEAN DEFAULT TRUE,
    desktop_notification_enabled BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
    ON notification_preferences(user_id);

-- New table: notification_schedules (quiet hours per user)
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Quiet hours (e.g., 22:00-08:00)
    quiet_hours_start TIME NOT NULL DEFAULT '22:00:00',
    quiet_hours_end TIME NOT NULL DEFAULT '08:00:00',
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    
    -- Quiet days (e.g., 'MON,TUE,WED' or empty)
    quiet_days VARCHAR(100) DEFAULT '',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_id 
    ON notification_schedules(user_id);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_notifications_source_created 
    ON notifications(source, target_user_id, created_at DESC)
    WHERE target_type = 'USER';

CREATE INDEX IF NOT EXISTS idx_notifications_category_created 
    ON notifications(category, target_user_id, created_at DESC)
    WHERE target_type = 'USER';

CREATE INDEX IF NOT EXISTS idx_notifications_priority_unread
    ON notifications(priority, target_user_id, created_at DESC)
    WHERE target_type = 'USER' AND id NOT IN (
        SELECT notification_id FROM notification_reads
    );
```

---

### 1.4 DTOs: Request/Response

**Archivo:** `application/dto/NotificationResponse.java`

```java
public record NotificationResponse(
    UUID id,
    String source,                    // SYSTEM, USER, INTEGRATION, SCHEDULED_TASK
    String category,                  // LOW_STOCK, MENTION, etc
    String priority,                  // LOW, MEDIUM, HIGH, CRITICAL
    String title,
    String body,
    String actionUrl,                 // nullable: /products/123, /purchase/456
    List<String> tags,                // ["stock", "warehouse-1"]
    boolean isRead,
    String targetType,                // USER, ALL
    UUID createdBy,                   // nullable if SYSTEM
    String entityType,                // PRODUCT, PURCHASE, WAREHOUSE
    UUID entityId,
    Instant createdAt,
    String deliveryChannel            // SSE, TOAST, PUSH
) {}
```

**Archivo:** `application/dto/NotificationPreferencesResponse.java`

```java
public record NotificationPreferencesResponse(
    UUID userId,
    boolean enabled,
    boolean lowStockEnabled,
    boolean syncEnabled,
    boolean operationsEnabled,
    boolean debtEnabled,
    boolean userActionsEnabled,
    boolean systemEnabled,
    boolean pushNotificationsEnabled,
    boolean toastNotificationsEnabled,
    boolean sseEnabled,
    boolean soundEnabled,
    boolean desktopNotificationEnabled,
    Instant updatedAt
) {}
```

**Archivo:** `application/dto/UpdateNotificationPreferencesRequest.java`

```java
public record UpdateNotificationPreferencesRequest(
    boolean enabled,
    boolean lowStockEnabled,
    boolean syncEnabled,
    boolean operationsEnabled,
    boolean debtEnabled,
    boolean userActionsEnabled,
    boolean systemEnabled,
    boolean pushNotificationsEnabled,
    boolean toastNotificationsEnabled,
    boolean sseEnabled,
    boolean soundEnabled,
    boolean desktopNotificationEnabled
) {}
```

**Archivo:** `application/dto/UpdateNotificationScheduleRequest.java`

```java
public record UpdateNotificationScheduleRequest(
    String quietHoursStart,           // "22:00"
    String quietHoursEnd,             // "08:00"
    boolean quietHoursEnabled,
    List<String> quietDays            // ["MON", "TUE", "WED"] or []
) {}
```

---

## FASE 2: Backend - Domain, Ports, Use Cases

### 2.1 Domain Model Extensions

**Archivo:** `domain/model/NotificationPreference.java`

```java
public record NotificationPreference(
    UUID id,
    UUID userId,
    boolean enabled,
    boolean lowStockEnabled,
    boolean syncEnabled,
    boolean operationsEnabled,
    boolean debtEnabled,
    boolean userActionsEnabled,
    boolean systemEnabled,
    boolean pushNotificationsEnabled,
    boolean toastNotificationsEnabled,
    boolean sseEnabled,
    boolean soundEnabled,
    boolean desktopNotificationEnabled,
    Instant createdAt,
    Instant updatedAt
) {
    
    public NotificationPreference {
        if (userId == null) throw new IllegalArgumentException("userId required");
    }
    
    public static NotificationPreference createDefault(UUID userId) {
        return new NotificationPreference(
            UUID.randomUUID(),
            userId,
            true,              // enabled
            true,              // lowStockEnabled
            true,              // syncEnabled
            true,              // operationsEnabled
            true,              // debtEnabled
            true,              // userActionsEnabled
            true,              // systemEnabled
            false,             // pushNotificationsEnabled (opt-in)
            true,              // toastNotificationsEnabled
            true,              // sseEnabled
            true,              // soundEnabled
            false,             // desktopNotificationEnabled (opt-in)
            Instant.now(),
            Instant.now()
        );
    }
    
    public boolean isEnabledForCategory(String category) {
        if (!enabled) return false;
        
        return switch(category) {
            case "LOW_STOCK", "EXPIRED_SOON", "OVERSTOCK" -> lowStockEnabled;
            case "SYNC_CONFLICT", "SYNC_COMPLETED", "OFFLINE_AVAILABLE" -> syncEnabled;
            case "IMPORT_DONE", "EXPORT_DONE", "BULK_UPDATE" -> operationsEnabled;
            case "DEBT_OVERDUE", "CREDIT_LIMIT_REACHED", "PAYMENT_RECEIVED" -> debtEnabled;
            case "MENTION", "COMMENT", "APPROVAL_NEEDED", "TASK_ASSIGNED" -> userActionsEnabled;
            case "MAINTENANCE", "MANUAL", "ALERT" -> systemEnabled;
            default -> true;
        };
    }
}
```

**Archivo:** `domain/model/NotificationSchedule.java`

```java
public record NotificationSchedule(
    UUID id,
    UUID userId,
    LocalTime quietHoursStart,
    LocalTime quietHoursEnd,
    boolean quietHoursEnabled,
    List<String> quietDays,            // MON, TUE, WED, THU, FRI, SAT, SUN
    Instant createdAt,
    Instant updatedAt
) {
    
    public boolean isInQuietHours() {
        if (!quietHoursEnabled) return false;
        
        LocalTime now = LocalTime.now();
        DayOfWeek todayDayOfWeek = LocalDate.now().getDayOfWeek();
        
        // Check if today is a quiet day
        String todayName = todayDayOfWeek.toString();
        if (quietDays.contains(todayName)) {
            return true;  // Entire day is quiet
        }
        
        // Check time range (handles wrap-around midnight)
        if (quietHoursStart.isBefore(quietHoursEnd)) {
            return !now.isBefore(quietHoursStart) && now.isBefore(quietHoursEnd);
        } else {
            // Wraps around midnight
            return !now.isBefore(quietHoursStart) || now.isBefore(quietHoursEnd);
        }
    }
}
```

### 2.2 Ports (Interfaces)

**Archivo:** `domain/ports/out/NotificationPreferenceRepository.java`

```java
public interface NotificationPreferenceRepository {
    Mono<NotificationPreference> findByUserId(UUID userId);
    Mono<NotificationPreference> save(NotificationPreference prefs);
    Mono<Void> delete(UUID userId);
}
```

**Archivo:** `domain/ports/out/NotificationScheduleRepository.java`

```java
public interface NotificationScheduleRepository {
    Mono<NotificationSchedule> findByUserId(UUID userId);
    Mono<NotificationSchedule> save(NotificationSchedule schedule);
    Mono<Void> delete(UUID userId);
}
```

**Archivo:** `domain/ports/in/NotificationQueryPort.java` (extend existing)

```java
public interface NotificationQueryPort {
    // Existing methods...
    
    Flux<Notification> findSystemNotificationsByUser(
        UUID userId,
        String category,  // nullable
        int page,
        int pageSize
    );
    
    Flux<Notification> findUserNotificationsByUser(
        UUID userId,
        String category,  // nullable
        int page,
        int pageSize
    );
    
    Mono<Integer> countUnreadBySource(UUID userId, String source);
}
```

### 2.3 Use Cases

**Archivo:** `application/usecase/query/GetSystemNotificationsQuery.java`

```java
@Component
public class GetSystemNotificationsQuery {
    
    private final R2dbcNotificationRepository notificationRepo;
    private final NotificationPreferenceRepository preferenceRepo;
    private final NotificationScheduleRepository scheduleRepo;
    private final NotificationReadRepository readRepo;
    
    public Flux<NotificationDto> execute(
            UUID userId,
            String category,  // nullable
            int page,
            int pageSize) {
        
        return Mono.zip(
            preferenceRepo.findByUserId(userId)
                .defaultIfEmpty(NotificationPreference.createDefault(userId)),
            scheduleRepo.findByUserId(userId)
                .optional()
        )
        .flatMapMany(tuple -> {
            NotificationPreference prefs = tuple.getT1();
            Optional<NotificationSchedule> schedule = tuple.getT2();
            
            // Check if currently in quiet hours
            boolean isQuietHours = schedule
                .map(NotificationSchedule::isInQuietHours)
                .orElse(false);
            
            if (!prefs.enabled() || isQuietHours) {
                return Flux.empty();
            }
            
            return notificationRepo
                .findBySourceAndTargetUserId(
                    "SYSTEM",
                    userId,
                    category,
                    page,
                    pageSize
                )
                .filter(notif -> 
                    prefs.isEnabledForCategory(notif.getCategory())
                )
                .flatMap(entity -> {
                    UUID notifId = entity.getId();
                    return readRepo.existsByNotificationIdAndUserId(notifId, userId)
                        .map(isRead -> new NotificationDto(
                            entity.getId(),
                            entity.getSource(),
                            entity.getCategory(),
                            entity.getPriority(),
                            entity.getTitle(),
                            entity.getBody(),
                            entity.getActionUrl(),
                            entity.getTags(),
                            isRead,  // computed
                            entity.getTargetType(),
                            entity.getCreatedBy(),
                            entity.getEntityType(),
                            entity.getEntityId(),
                            entity.getCreatedAt(),
                            entity.getDeliveryChannel()
                        ));
                });
        });
    }
}
```

**Archivo:** `application/usecase/command/UpdateNotificationPreferencesCommand.java`

```java
@Component
public class UpdateNotificationPreferencesCommand {
    
    private final NotificationPreferenceRepository repository;
    
    public Mono<NotificationPreferenceResponse> execute(
            UUID userId,
            UpdateNotificationPreferencesRequest request) {
        
        return repository
            .findByUserId(userId)
            .defaultIfEmpty(NotificationPreference.createDefault(userId))
            .map(existing -> existing.withUpdates(request))
            .flatMap(repository::save)
            .map(this::toResponse);
    }
    
    private NotificationPreferenceResponse toResponse(NotificationPreference pref) {
        return new NotificationPreferenceResponse(
            pref.userId(),
            pref.enabled(),
            pref.lowStockEnabled(),
            pref.syncEnabled(),
            pref.operationsEnabled(),
            pref.debtEnabled(),
            pref.userActionsEnabled(),
            pref.systemEnabled(),
            pref.pushNotificationsEnabled(),
            pref.toastNotificationsEnabled(),
            pref.sseEnabled(),
            pref.soundEnabled(),
            pref.desktopNotificationEnabled(),
            pref.updatedAt()
        );
    }
}
```

---

## FASE 3: Frontend - Domain, Components, Hooks

### 3.1 Core Entities

**Archivo:** `src/core/entities/notification.ts`

```typescript
export interface Notification {
  id: string;
  source: 'SYSTEM' | 'USER' | 'INTEGRATION' | 'SCHEDULED_TASK';
  category: NotificationCategory;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  body: string;
  actionUrl?: string;
  tags: string[];
  isRead: boolean;
  createdBy?: string;
  entityType?: string;
  entityId?: string;
  createdAt: Date;
  deliveryChannel: 'SSE' | 'TOAST' | 'PUSH';
}

export type NotificationCategory =
  // Inventory
  | 'LOW_STOCK' | 'EXPIRED_SOON' | 'OVERSTOCK'
  | 'PRODUCT_CREATED' | 'PRODUCT_MODIFIED'
  // Sync & Offline
  | 'SYNC_CONFLICT' | 'SYNC_COMPLETED'
  | 'OFFLINE_AVAILABLE' | 'ONLINE_RECONNECTED'
  // Operations
  | 'IMPORT_DONE' | 'EXPORT_DONE' | 'BULK_UPDATE'
  | 'REPORT_GENERATED'
  // Credit & Debt
  | 'DEBT_OVERDUE' | 'CREDIT_LIMIT_REACHED'
  | 'PAYMENT_RECEIVED'
  // User Actions
  | 'MENTION' | 'COMMENT' | 'APPROVAL_NEEDED'
  | 'TASK_ASSIGNED'
  // System
  | 'MAINTENANCE' | 'MANUAL' | 'ALERT';

export interface NotificationPreferences {
  enabled: boolean;
  lowStockEnabled: boolean;
  syncEnabled: boolean;
  operationsEnabled: boolean;
  debtEnabled: boolean;
  userActionsEnabled: boolean;
  systemEnabled: boolean;
  pushNotificationsEnabled: boolean;
  toastNotificationsEnabled: boolean;
  sseEnabled: boolean;
  soundEnabled: boolean;
  desktopNotificationEnabled: boolean;
}

export interface NotificationSchedule {
  quietHoursStart: string;  // "22:00"
  quietHoursEnd: string;    // "08:00"
  quietHoursEnabled: boolean;
  quietDays: string[];      // ["MON", "TUE"]
}

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  LOW_STOCK: 'Stock bajo',
  EXPIRED_SOON: 'Próximo a expirar',
  OVERSTOCK: 'Exceso de stock',
  PRODUCT_CREATED: 'Producto creado',
  PRODUCT_MODIFIED: 'Producto modificado',
  SYNC_CONFLICT: 'Conflicto de sincronización',
  SYNC_COMPLETED: 'Sincronización completada',
  OFFLINE_AVAILABLE: 'App disponible sin conexión',
  ONLINE_RECONNECTED: 'Conexión recuperada',
  IMPORT_DONE: 'Importación completada',
  EXPORT_DONE: 'Exportación lista',
  BULK_UPDATE: 'Actualización masiva',
  REPORT_GENERATED: 'Reporte generado',
  DEBT_OVERDUE: 'Deuda vencida',
  CREDIT_LIMIT_REACHED: 'Límite de crédito alcanzado',
  PAYMENT_RECEIVED: 'Pago recibido',
  MENTION: 'Te mencionaron',
  COMMENT: 'Nuevo comentario',
  APPROVAL_NEEDED: 'Aprobación requerida',
  TASK_ASSIGNED: 'Tarea asignada',
  MAINTENANCE: 'Mantenimiento',
  MANUAL: 'Notificación manual',
  ALERT: 'Alerta del sistema',
};
```

### 3.2 Panel Component

**Archivo:** `src/presentation/modules/notifications/components/NotificationPanel.tsx`

```typescript
export function NotificationPanel() {
  const [activeTab, setActiveTab] = useState<'system' | 'users'>('system');
  const [filter, setFilter] = useState<NotificationCategory | null>(null);
  
  const systemNotifs = useSystemNotifications(filter);
  const userNotifs = useUserNotifications(filter);
  
  const systemUnread = systemNotifs.data?.filter(n => !n.isRead).length ?? 0;
  const userUnread = userNotifs.data?.filter(n => !n.isRead).length ?? 0;
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" title="Notificaciones del sistema">
            🤖 Sistema
            {systemUnread > 0 && (
              <Badge className="ml-2 bg-red-600">{systemUnread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" title="Notificaciones de otros usuarios">
            👥 De Usuarios
            {userUnread > 0 && (
              <Badge className="ml-2 bg-red-600">{userUnread}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="system">
          <NotificationTab
            notifications={systemNotifs.data}
            source="SYSTEM"
            isLoading={systemNotifs.isLoading}
            onFilter={setFilter}
            activeFilter={filter}
          />
        </TabsContent>
        
        <TabsContent value="users">
          <NotificationTab
            notifications={userNotifs.data}
            source="USER"
            isLoading={userNotifs.isLoading}
            onFilter={setFilter}
            activeFilter={filter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3.3 Hooks

**Archivo:** `src/presentation/shared/hooks/useSystemNotifications.ts`

```typescript
export function useSystemNotifications(category?: NotificationCategory) {
  const query = useQuery({
    queryKey: ['notifications', 'system', category],
    queryFn: () => 
      notificationApi.getSystemNotifications({
        category: category || undefined,
        page: 0,
        pageSize: 50
      }),
    refetchInterval: 30000,  // 30 seconds
    staleTime: 10000
  });
  
  return {
    data: query.data ?? [],
    unreadCount: query.data?.filter(n => !n.isRead).length ?? 0,
    isLoading: query.isLoading,
    error: query.error
  };
}

export function useUserNotifications(category?: NotificationCategory) {
  const query = useQuery({
    queryKey: ['notifications', 'users', category],
    queryFn: () =>
      notificationApi.getUserNotifications({
        category: category || undefined,
        page: 0,
        pageSize: 50
      }),
    refetchInterval: 30000
  });
  
  return {
    data: query.data ?? [],
    unreadCount: query.data?.filter(n => !n.isRead).length ?? 0,
    isLoading: query.isLoading,
    error: query.error
  };
}

export function useNotificationPreferences() {
  const query = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationApi.getPreferences()
  });
  
  const updateMutation = useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      notificationApi.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences']
      });
    }
  });
  
  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
}
```

---

## FASE 4: Implementación Incremental (5 Semanas)

### Sprint 1 (Semana 1): Domain & Database
- [ ] Extender Notification domain (source, priority, actionUrl, tags)
- [ ] Crear enums NotificationSource, NotificationPriority, extender categoria
- [ ] Crear Flyway migration V3 con nuevas tablas + índices
- [ ] Crear DTOs (Response, Request, Schedule)
- **Testing:** Unit tests para domain models

### Sprint 1 (Semana 2): Backend Adapters & APIs
- [ ] Implementar R2dbcNotificationPreferenceRepository
- [ ] Implementar R2dbcNotificationScheduleRepository
- [ ] Extender NotificationController:
  - `GET /api/v1/notifications/system?category=LOW_STOCK&page=0`
  - `GET /api/v1/notifications/users?category=MENTION&page=0`
  - `GET /api/v1/user/notification-preferences`
  - `PUT /api/v1/user/notification-preferences`
  - `GET /api/v1/user/notification-schedule`
  - `PUT /api/v1/user/notification-schedule`
- [ ] Actualizar SSE stream (`/api/v1/notifications/stream`) para respetar preferencias
- **Testing:** Integration tests para endpoints

### Sprint 2 (Semana 3): Frontend Domain & UI Components
- [ ] Crear `core/entities/notification.ts` con tipos + labels
- [ ] Crear NotificationPanel.tsx con 2 tabs
- [ ] Crear NotificationItem.tsx (con actionUrl clickeable)
- [ ] Crear NotificationFilter.tsx (dropdown por categoría)
- [ ] Crear SkeletonNotificationList para loading state
- **Testing:** Component tests (React Testing Library)

### Sprint 2 (Semana 4): Frontend Hooks & Integration
- [ ] Crear `useSystemNotifications`, `useUserNotifications` hooks
- [ ] Crear `useNotificationPreferences` para CRUD
- [ ] Integrar SSE en hook (subscribe/unsubscribe)
- [ ] Crear NotificationPreferencesPanel.tsx
- [ ] Crear NotificationSchedulePanel.tsx
- **Testing:** Hook tests (MSW mocks)

### Sprint 3 (Semana 5): Canales Avanzados & Polish
- [ ] Implementar Toast notifications (Sonner)
- [ ] Agregar badge counter en campanita (icon con número)
- [ ] Implementar PWA push (opcional, Service Worker setup)
- [ ] Agregar sound notification (opcional)
- [ ] E2E tests (Playwright): crear notif → aparece en panel
- **Polish:** UX review, a11y, mobile responsiveness

---

## Reutilización de Código Existente

✅ **Domain Model:** Extend existente `Notification` (no rebuild)
✅ **Repositories:** Implementar nuevas interfaces en mismo adapter pattern
✅ **Controllers:** Extend `NotificationController` existente
✅ **SSE:** Reutilizar `NotificationSseController` con nuevo filtrado
✅ **DTOs:** New DTOs siguen mismo pattern (record-based)
✅ **Mappers:** Extend `SupplementaryPersistenceMapper`
✅ **Frontend API:** Reutilizar `notificationApi` client (extend con nuevos endpoints)
✅ **React Query:** Mismo patrón `useQuery`, `useMutation`
✅ **IndexedDB:** Reutilizar `idb` para caché offline

---

## Contratos OpenAPI 3.0

### GET `/api/v1/notifications/system`

```yaml
parameters:
  - name: category
    in: query
    schema:
      type: string
      enum: [LOW_STOCK, EXPIRED_SOON, SYNC_CONFLICT, IMPORT_DONE, ...]
  - name: page
    in: query
    schema: { type: integer, default: 0 }
  - name: pageSize
    in: query
    schema: { type: integer, default: 50, maximum: 100 }

responses:
  200:
    content:
      application/json:
        schema:
          type: array
          items: { $ref: '#/components/schemas/NotificationResponse' }
```

### PUT `/api/v1/user/notification-preferences`

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema: { $ref: '#/components/schemas/UpdateNotificationPreferencesRequest' }

responses:
  200:
    content:
      application/json:
        schema: { $ref: '#/components/schemas/NotificationPreferencesResponse' }
```

---

## Decisiones de Diseño

| Decisión | Razón |
|----------|-------|
| **2 Tabs (System + Users)** | Claridad, reducir ruido; puede expandirse en futuro |
| **23 Categorías** | Balance granularidad vs mantenibilidad |
| **Per-group toggles** | No explosión de 23 toggles; grupos coherentes |
| **Quiet hours + days** | Nocturno + fines de semana sin spam |
| **SSE + Toast + Push** | Gradual opt-in; SSE siempre, resto opcional |
| **Action URL nullable** | No todas las notif son clickeables |
| **Tags para filtrado** | Futuro: búsqueda avanzada, reglas custom |
| **Prefer `record` DTOs** | Immutability, conciseness, Java 21+ idiom |

---

## Testing Strategy

- **Unit:** Domain models, categorías, quiet hours logic
- **Integration:** Repositories, controller endpoints, SSE stream
- **Component:** NotificationPanel, tabs, filter
- **Hook:** useSystemNotifications with MSW mocks
- **E2E:** Create notif → appear in panel → click actionUrl

---

*Plan creado: 2026-05-05*
*Versión: 1.0*
*Status: Ready for implementation*
