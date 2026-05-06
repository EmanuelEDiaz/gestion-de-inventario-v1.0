# Notificaciones — Referencia Rápida

## Categorías (23 Total)

### INVENTORY (5)
| Categoría | Descripción | Fuente | Prioridad Típica |
|-----------|-------------|--------|------------------|
| LOW_STOCK | Existencias bajo mínimo | SYSTEM | MEDIUM |
| EXPIRED_SOON | Próximo a expiración (7 días) | SYSTEM | HIGH |
| OVERSTOCK | Stock excesivo vs demanda | SYSTEM | LOW |
| PRODUCT_CREATED | Nuevo producto registrado | USER | MEDIUM |
| PRODUCT_MODIFIED | Cambio en datos producto | USER | MEDIUM |

### SYNC & OFFLINE (4)
| Categoría | Descripción | Fuente | Prioridad Típica |
|-----------|-------------|--------|------------------|
| SYNC_CONFLICT | Conflicto durante sincronización | SYSTEM | HIGH |
| SYNC_COMPLETED | Sync finalizado exitosamente | SYSTEM | LOW |
| OFFLINE_AVAILABLE | App disponible sin conexión | SYSTEM | LOW |
| ONLINE_RECONNECTED | Conexión recuperada después offline | SYSTEM | MEDIUM |

### OPERATIONS (4)
| Categoría | Descripción | Fuente | Prioridad Típica |
|-----------|-------------|--------|------------------|
| IMPORT_DONE | CSV/XLSX import completado | SYSTEM | MEDIUM |
| EXPORT_DONE | Exportación lista para descargar | SYSTEM | MEDIUM |
| BULK_UPDATE | Actualización masiva completada | SYSTEM | MEDIUM |
| REPORT_GENERATED | Reporte listo para descarga | SYSTEM | LOW |

### CREDIT & DEBT (3)
| Categoría | Descripción | Fuente | Prioridad Típica |
|-----------|-------------|--------|------------------|
| DEBT_OVERDUE | Deuda vencida (supplier/customer) | SYSTEM | CRITICAL |
| CREDIT_LIMIT_REACHED | Límite de crédito alcanzado | SYSTEM | HIGH |
| PAYMENT_RECEIVED | Pago registrado | USER | MEDIUM |

### USER ACTIONS (4)
| Categoría | Descripción | Fuente | Prioridad Típica |
|-----------|-------------|--------|------------------|
| MENTION | @usuario mencionó | USER | HIGH |
| COMMENT | Nuevo comentario en documento | USER | MEDIUM |
| APPROVAL_NEEDED | Requiere aprobación (compra, transfer) | USER | HIGH |
| TASK_ASSIGNED | Tarea asignada al usuario | USER | MEDIUM |

### SYSTEM (3)
| Categoría | Descripción | Fuente | Prioridad Típica |
|-----------|-------------|--------|------------------|
| MAINTENANCE | Mantenimiento programado | SYSTEM | MEDIUM |
| MANUAL | Notificación manual del admin | USER | VARIABLE |
| ALERT | Alerta del sistema (sensores, API) | SYSTEM | HIGH |

---

## Flujos de Notificaciones

### 1. Stock Bajo — LOW_STOCK

```
Backend Event:
  StockMovement saved → stock < minimum_qty
  → PublishNotificationCommand (SYSTEM, LOW_STOCK, MEDIUM)
  → SSE stream to warehouse_manager role
  → Toast popup: "⚠️ Stock bajo: Producto X (3 unidades)"

Frontend:
  - Aparece en tab "Sistema"
  - Si usuario habilitó toast: popup adicional
  - Si habilitó push: notificación PWA (si app cerrada)
  - Clickeable: actionUrl="/products/{productId}" → detalle producto
```

### 2. Sincronización — SYNC_CONFLICT

```
Frontend (offline):
  Create order offline → outbox

Online:
  Push outbox → server
  Conflict detected (version mismatch)
  → Backend: PublishNotificationCommand (SYSTEM, SYNC_CONFLICT, HIGH)
  → SSE + Toast priority

Frontend SSE handler:
  Receive SYNC_CONFLICT
  → Toast: "⚠️ Conflicto: tu cambio fue rechazado"
  → Panel: Click para revisar detalles
```

### 3. De Usuario — MENTION

```
Backend:
  @maria mentioned in comment on document_id=ABC
  → PublishNotificationCommand (USER, MENTION, HIGH, createdBy=maria_id)
  → Target: maria_user_id
  → Tags: ["mention", "urgent"]
  → ActionUrl: "/documents/ABC#comment-123"

Frontend (Maria's session):
  - Tab "De Usuarios" [1 nuevo]
  - "👤 María: te mencionó en 'Auditoría Q2'"
  - Clickeable: navega a documento + scroll a comentario
```

### 4. Importación — IMPORT_DONE

```
Backend Async Job:
  ImportCsv job completes
  → PublishNotificationCommand (SYSTEM, IMPORT_DONE, MEDIUM)
  → Broadcast to users with MANAGER+ role
  → ActionUrl: "/import-history/{jobId}"

Frontend:
  - Sistema tab: "📊 Importación completada: 150 productos"
  - Click: muestra resumen + download de errores (si existen)
```

---

## API Quick Reference

### Get System Notifications
```bash
GET /api/v1/notifications/system?category=LOW_STOCK&page=0&pageSize=20
Authorization: Bearer {token}

Response:
{
  "notifications": [
    {
      "id": "uuid",
      "source": "SYSTEM",
      "category": "LOW_STOCK",
      "priority": "MEDIUM",
      "title": "Stock bajo",
      "body": "Producto X tiene solo 3 unidades",
      "actionUrl": "/products/product-id",
      "tags": ["stock", "warehouse-1"],
      "isRead": false,
      "createdAt": "2026-05-05T10:30:00Z",
      "deliveryChannel": "SSE"
    }
  ]
}
```

### Get User Notifications
```bash
GET /api/v1/notifications/users?category=MENTION&page=0&pageSize=20
Authorization: Bearer {token}

Response: [array of NotificationResponse with source="USER"]
```

### Update Preferences
```bash
PUT /api/v1/user/notification-preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "lowStockEnabled": true,
  "syncEnabled": true,
  "operationsEnabled": true,
  "debtEnabled": true,
  "userActionsEnabled": true,
  "systemEnabled": true,
  "pushNotificationsEnabled": false,
  "toastNotificationsEnabled": true,
  "sseEnabled": true,
  "soundEnabled": true,
  "desktopNotificationEnabled": false
}

Response: { UpdatedAt, all preferences }
```

### Update Quiet Hours
```bash
PUT /api/v1/user/notification-schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "quietHoursEnabled": true,
  "quietDays": ["SAT", "SUN"]
}

Response: { UpdatedAt, schedule details }
```

### SSE Stream
```bash
GET /api/v1/notifications/stream
Authorization: Bearer {token}

# Server sends:
# data: {
#   "id": "uuid",
#   "source": "SYSTEM",
#   "category": "SYNC_CONFLICT",
#   ...
# }
```

---

## Frontend Panel Structure

```
NotificationPanel
├── Tabs
│   ├── Tab 1: "🤖 Sistema [5]"
│   │   └── NotificationTab
│   │       ├── FilterDropdown (category)
│   │       ├── NotificationList
│   │       │   └── NotificationItem (repeat)
│   │       │       ├── Priority icon (⚠️ HIGH, ℹ️ MEDIUM, etc)
│   │       │       ├── Title + Body
│   │       │       ├── Tags (optional)
│   │       │       ├── Timestamp
│   │       │       └── Click → actionUrl (if present)
│   │       └── LoadMore button
│   │
│   └── Tab 2: "👥 De Usuarios [2]"
│       └── NotificationTab (same structure)
│
└── Settings icon
    ├── NotificationPreferencesPanel (toggles per category)
    └── NotificationSchedulePanel (quiet hours)
```

---

## TypeScript/React Patterns

### Hook Usage
```typescript
// System notifications
const { data, unreadCount, isLoading } = useSystemNotifications(category);

// User notifications
const { data, unreadCount } = useUserNotifications();

// Preferences
const { preferences, updatePreferences, isUpdating } = useNotificationPreferences();

// Schedule
const { schedule, updateSchedule } = useNotificationSchedule();
```

### Component Props
```typescript
<NotificationPanel />

<NotificationTab
  notifications={notifications}
  source="SYSTEM" | "USER"
  isLoading={boolean}
  onFilter={(category) => void}
  activeFilter={NotificationCategory | null}
/>

<NotificationItem
  notification={Notification}
  onRead={(id) => void}
  onArchive={(id) => void}
/>
```

---

## Backend Publishing Examples

### In Domain Service
```java
// When stock becomes low
if (newQuantity < minimumQuantity) {
    Notification notif = Notification.createSystem(
        NotificationCategory.LOW_STOCK,
        "Stock bajo: " + product.name(),
        "Cantidad actual: " + newQuantity + " unidades",
        TargetType.USER,
        warehouseManager.id(),
        "PRODUCT",
        product.id()
    );
    notif = notif.withSource(NotificationSource.SYSTEM)
                  .withPriority(NotificationPriority.MEDIUM)
                  .withActionUrl("/products/" + product.id());
    
    notificationPublisher.publish(notif);
}
```

### In Use Case
```java
@Component
public class ImportCsvCommand implements ImportCommandPort {
    
    private final NotificationCommandPort notificationPort;
    
    public Mono<ImportResult> execute(File csv) {
        return doCsvImport(csv)
            .flatMap(result -> {
                Notification notif = Notification.createSystem(
                    NotificationCategory.IMPORT_DONE,
                    "Importación completada",
                    "Se importaron " + result.count() + " productos",
                    TargetType.ALL,
                    null,
                    "IMPORT_JOB",
                    job.id()
                );
                return notificationPort.publish(notif)
                    .thenReturn(result);
            });
    }
}
```

---

## Database Indices Strategy

```sql
-- Query pattern: "Get all system notifs for user, sorted by date"
CREATE INDEX idx_notifications_source_created 
    ON notifications(source, target_user_id, created_at DESC)
    WHERE target_type = 'USER';

-- Query pattern: "Count unread CRITICAL notifs"
CREATE INDEX idx_notifications_priority_unread 
    ON notifications(priority, target_user_id, created_at DESC)
    WHERE id NOT IN (SELECT notification_id FROM notification_reads);

-- Query pattern: "Get notifs by category"
CREATE INDEX idx_notifications_category_user
    ON notifications(category, target_user_id, created_at DESC);

-- Lookup unread status
CREATE INDEX idx_notification_reads_lookup
    ON notification_reads(notification_id, user_id);
```

---

## Performance Tips

1. **Pagination:** Always use `page` + `pageSize` (default 50)
2. **Caching:** SSE stream + 30-second refetch interval
3. **Quiet Hours:** Check in DB query or application layer before returning
4. **Badges:** Compute unread counts in React with `.filter(n => !n.isRead).length`
5. **Toast:** Fire separate from SSE (parallel listeners)
6. **Push:** Async, optional, don't block on Notification creation

---

## Testing Checklist

- [ ] Unit: Domain model validation (priority, source, category)
- [ ] Unit: Quiet hours logic (isInQuietHours())
- [ ] Integration: POST notification → DB saved
- [ ] Integration: GET /system filters by source correctly
- [ ] Integration: SSE respects quiet hours
- [ ] Component: Panel renders 2 tabs
- [ ] Component: Filter dropdown works
- [ ] Component: Action URL links work
- [ ] Hook: useSystemNotifications returns unread count
- [ ] E2E: Create notif → appears in panel → click navigates

---

*Última actualización: 2026-05-05*
*Versión: 1.0*
