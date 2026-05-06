/**
 * DOMAIN TYPES: Notification System
 *
 * Espejo exacto del backend Spring Boot (Java records)
 * Usado por hooks y componentes para type-safety en todo el frontend
 */

/**
 * Fuente de la notificación: sistema o usuario
 */
export enum NotificationSource {
  SYSTEM = 'SYSTEM',           // Notificaciones automáticas del sistema
  USER = 'USER',               // Notificaciones de otros usuarios/mencionados
  INTEGRATION = 'INTEGRATION', // Futuro: integraciones externas
  SCHEDULED_TASK = 'SCHEDULED_TASK' // Futuro: tareas programadas
}

/**
 * Prioridad de la notificación: afecta entrega durante quiet hours
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL' // Bypassa quiet hours si bypassOnCritical=true
}

/**
 * Categorías de notificaciones: 23 tipos organizados en 6 grupos
 *
 * INVENTORY: gestión de stock
 * SYNC: sincronización offline
 * OPERATIONS: transacciones (compras, ventas, etc)
 * CREDIT: gestión de crédito de clientes
 * USER_ACTIONS: acciones entre usuarios
 * SYSTEM: notificaciones del sistema
 */
export enum NotificationCategory {
  // INVENTORY GROUP (3)
  LOW_STOCK = 'LOW_STOCK',
  CRITICAL_STOCK = 'CRITICAL_STOCK',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',

  // SYNC GROUP (3)
  SYNC_STARTED = 'SYNC_STARTED',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
  SYNC_FAILED = 'SYNC_FAILED',

  // OPERATIONS GROUP (5)
  SALE_COMPLETED = 'SALE_COMPLETED',
  PURCHASE_COMPLETED = 'PURCHASE_COMPLETED',
  RETURN_PROCESSED = 'RETURN_PROCESSED',
  TRANSFER_INITIATED = 'TRANSFER_INITIATED',
  TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',

  // CREDIT GROUP (3)
  CREDIT_LIMIT_WARNING = 'CREDIT_LIMIT_WARNING',
  CREDIT_LIMIT_EXCEEDED = 'CREDIT_LIMIT_EXCEEDED',
  CREDIT_PAYMENT_DUE = 'CREDIT_PAYMENT_DUE',

  // USER_ACTIONS GROUP (4)
  USER_MENTIONED = 'USER_MENTIONED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  USER_INVITE = 'USER_INVITE',

  // SYSTEM GROUP (4)
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  VERSION_UPDATE = 'VERSION_UPDATE'
}

/**
 * Tipo de destino de la notificación
 */
export enum NotificationTargetType {
  ALL = 'ALL',              // Broadcast a todos
  SPECIFIC_USER = 'SPECIFIC_USER', // Solo a usuario específico
  ROLE_BASED = 'ROLE_BASED' // Por rol (ADMIN, MANAGER, SELLER)
}

/**
 * Canal de entrega de la notificación
 */
export enum DeliveryChannel {
  SSE = 'SSE',              // Server-Sent Events (tiempo real en browser)
  PUSH = 'PUSH',            // PWA Push Notification (offline-capable)
  TOAST = 'TOAST'           // Toast en la UI
}

/**
 * Notificación individual: dato base enviado por API
 */
export interface Notification {
  id: string;                    // UUID
  title: string;
  body: string;
  category: NotificationCategory;
  source: NotificationSource;
  priority: NotificationPriority;
  actionUrl?: string;            // URL para acción (ej: "/products/123")
  tags?: string[];               // Etiquetas libres (ej: ["urgent", "inventory"])
  deliveryChannel: DeliveryChannel;
  targetType: NotificationTargetType;
  targetUserId?: string;         // UUID del usuario si targetType=SPECIFIC_USER
  createdAt: string;            // ISO 8601 timestamp
  read: boolean;
}

/**
 * Response DTO de lista paginada de notificaciones
 */
export interface NotificationListResponse {
  items: Notification[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Preferencias de notificación del usuario
 */
export interface NotificationPreferences {
  userId: string;                          // UUID
  enabled: boolean;                        // Master toggle
  
  // Category group toggles (6)
  lowStockEnabled: boolean;                // INVENTORY group
  syncEnabled: boolean;                    // SYNC group
  operationsEnabled: boolean;              // OPERATIONS group
  debtEnabled: boolean;                    // CREDIT group
  userActionsEnabled: boolean;             // USER_ACTIONS group
  systemEnabled: boolean;                  // SYSTEM group
  
  // Delivery channel toggles (3)
  pushNotificationsEnabled: boolean;       // PWA Push
  toastNotificationsEnabled: boolean;      // Toast UI
  sseEnabled: boolean;                     // Server-Sent Events
  
  // Optional
  soundEnabled?: boolean;                  // Sonido al notificar
  desktopNotificationEnabled?: boolean;    // Desktop notifications
  
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Horario silencioso (quiet hours) del usuario
 */
export interface NotificationSchedule {
  userId: string;                    // UUID
  quietHoursStart: string;          // HH:mm (24h), ej: "22:00"
  quietHoursEnd: string;            // HH:mm (24h), ej: "08:00"
  quietHoursEnabled: boolean;       // Activar quiet hours
  quietDaysList: number[];          // Días: [0=Dom, 1=Lun, ..., 6=Sab]
  bypassOnCritical: boolean;        // Si true, CRITICAL ignora quiet hours
  
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request para crear notificación (solo ADMIN/MANAGER)
 */
export interface CreateNotificationRequest {
  title: string;
  body: string;
  category: NotificationCategory;
  targetType: NotificationTargetType;
  targetUserId?: string;            // Requerido si targetType=SPECIFIC_USER
  priority?: NotificationPriority;  // Default: MEDIUM
  actionUrl?: string;
  tags?: string[];
}

/**
 * Request para actualizar preferencias (partial update)
 */
export interface UpdateNotificationPreferencesRequest {
  enabled?: boolean;
  lowStockEnabled?: boolean;
  syncEnabled?: boolean;
  operationsEnabled?: boolean;
  debtEnabled?: boolean;
  userActionsEnabled?: boolean;
  systemEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  toastNotificationsEnabled?: boolean;
  sseEnabled?: boolean;
  soundEnabled?: boolean;
  desktopNotificationEnabled?: boolean;
}

/**
 * Request para actualizar quiet hours schedule
 */
export interface UpdateNotificationScheduleRequest {
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursEnabled?: boolean;
  quietDaysList?: number[];
  bypassOnCritical?: boolean;
}

/**
 * Estado interno del componente NotificationPanel
 */
export interface NotificationPanelState {
  activeTab: 'sistema' | 'usuarios';
  selectedNotificationId?: string;
  isPreferencesPanelOpen: boolean;
  isLoadingSystem: boolean;
  isLoadingUsers: boolean;
  errorSystem?: string;
  errorUsers?: string;
}

/**
 * Formato de evento SSE recibido en tiempo real
 */
export interface NotificationSSEEvent {
  event: 'notification' | 'notification-read' | 'notification-deleted';
  data: Notification;
  id: string;
}

/**
 * Utilidad: Mapear category a grupo (para preferencias)
 */
export function categoryToGroup(category: NotificationCategory): keyof Omit<NotificationPreferences, 'userId' | 'enabled' | 'pushNotificationsEnabled' | 'toastNotificationsEnabled' | 'sseEnabled' | 'soundEnabled' | 'desktopNotificationEnabled' | 'createdAt' | 'updatedAt'> {
  if ([
    NotificationCategory.LOW_STOCK,
    NotificationCategory.CRITICAL_STOCK,
    NotificationCategory.STOCK_ADJUSTMENT
  ].includes(category)) {
    return 'lowStockEnabled';
  }
  
  if ([
    NotificationCategory.SYNC_STARTED,
    NotificationCategory.SYNC_COMPLETED,
    NotificationCategory.SYNC_FAILED
  ].includes(category)) {
    return 'syncEnabled';
  }
  
  if ([
    NotificationCategory.SALE_COMPLETED,
    NotificationCategory.PURCHASE_COMPLETED,
    NotificationCategory.RETURN_PROCESSED,
    NotificationCategory.TRANSFER_INITIATED,
    NotificationCategory.TRANSFER_COMPLETED
  ].includes(category)) {
    return 'operationsEnabled';
  }
  
  if ([
    NotificationCategory.CREDIT_LIMIT_WARNING,
    NotificationCategory.CREDIT_LIMIT_EXCEEDED,
    NotificationCategory.CREDIT_PAYMENT_DUE
  ].includes(category)) {
    return 'debtEnabled';
  }
  
  if ([
    NotificationCategory.USER_MENTIONED,
    NotificationCategory.PERMISSION_GRANTED,
    NotificationCategory.PERMISSION_REVOKED,
    NotificationCategory.USER_INVITE
  ].includes(category)) {
    return 'userActionsEnabled';
  }
  
  return 'systemEnabled';
}

/**
 * Utilidad: Obtener etiqueta localizada para categoría
 */
export function getCategoryLabel(category: NotificationCategory): string {
  const labels: Record<NotificationCategory, string> = {
    [NotificationCategory.LOW_STOCK]: 'Stock Bajo',
    [NotificationCategory.CRITICAL_STOCK]: 'Stock Crítico',
    [NotificationCategory.STOCK_ADJUSTMENT]: 'Ajuste de Stock',
    
    [NotificationCategory.SYNC_STARTED]: 'Sincronización Iniciada',
    [NotificationCategory.SYNC_COMPLETED]: 'Sincronización Completada',
    [NotificationCategory.SYNC_FAILED]: 'Error en Sincronización',
    
    [NotificationCategory.SALE_COMPLETED]: 'Venta Completada',
    [NotificationCategory.PURCHASE_COMPLETED]: 'Compra Completada',
    [NotificationCategory.RETURN_PROCESSED]: 'Devolución Procesada',
    [NotificationCategory.TRANSFER_INITIATED]: 'Transferencia Iniciada',
    [NotificationCategory.TRANSFER_COMPLETED]: 'Transferencia Completada',
    
    [NotificationCategory.CREDIT_LIMIT_WARNING]: 'Límite de Crédito Próximo',
    [NotificationCategory.CREDIT_LIMIT_EXCEEDED]: 'Límite de Crédito Excedido',
    [NotificationCategory.CREDIT_PAYMENT_DUE]: 'Pago Vencido',
    
    [NotificationCategory.USER_MENTIONED]: 'Mencionado por Usuario',
    [NotificationCategory.PERMISSION_GRANTED]: 'Permisos Asignados',
    [NotificationCategory.PERMISSION_REVOKED]: 'Permisos Revocados',
    [NotificationCategory.USER_INVITE]: 'Invitación de Usuario',
    
    [NotificationCategory.SYSTEM_MAINTENANCE]: 'Mantenimiento del Sistema',
    [NotificationCategory.BACKUP_COMPLETED]: 'Backup Completado',
    [NotificationCategory.ERROR_OCCURRED]: 'Error del Sistema',
    [NotificationCategory.VERSION_UPDATE]: 'Nueva Versión Disponible'
  };
  
  return labels[category] || 'Notificación';
}

/**
 * Utilidad: Color para badge según prioridad
 */
export function getPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    [NotificationPriority.LOW]: 'bg-blue-100 text-blue-800',
    [NotificationPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [NotificationPriority.HIGH]: 'bg-orange-100 text-orange-800',
    [NotificationPriority.CRITICAL]: 'bg-red-100 text-red-800'
  };
  
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

