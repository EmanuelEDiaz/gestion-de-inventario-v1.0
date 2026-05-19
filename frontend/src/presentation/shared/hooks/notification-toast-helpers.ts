import { INotification, NotificationPriority } from '@/core/entities/notification';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export function getToastVariant(notification: INotification): ToastVariant {
  switch (notification.priority) {
    case NotificationPriority.CRITICAL:
      return 'error';
    case NotificationPriority.HIGH:
      return 'warning';
    case NotificationPriority.MEDIUM:
      return 'info';
    default:
      return 'info';
  }
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  LOW_STOCK: 'Stock bajo en inventario',
  CRITICAL_STOCK: 'Stock crítico detectado',
  OUT_OF_STOCK: 'Producto sin stock',
  SYNC_ERROR: 'Error durante sincronización',
  SYNC_SUCCESS: 'Sincronización completada',
  SYNC_CONFLICT: 'Conflicto de datos detectado',
  OPERATION_SALE: 'Venta completada',
  OPERATION_PURCHASE: 'Compra registrada',
  OPERATION_TRANSFER: 'Transferencia completada',
  OPERATION_RETURN: 'Devolución procesada',
  OPERATION_ADJUSTMENT: 'Ajuste de inventario',
  CREDIT_LIMIT_REACHED: 'Límite de crédito alcanzado',
  CREDIT_PAYMENT_DUE: 'Pago de crédito vencido',
  CREDIT_PAYMENT_RECEIVED: 'Pago de crédito recibido',
  USER_LOGIN: 'Usuario iniciando sesión',
  USER_LOGOUT: 'Usuario cerró sesión',
  USER_ACTION_APPROVED: 'Acción aprobada',
  USER_ACTION_REJECTED: 'Acción rechazada',
  SYSTEM_ERROR: 'Error del sistema',
  SYSTEM_WARNING: 'Advertencia del sistema',
  SYSTEM_INFO: 'Información del sistema',
  SYSTEM_MAINTENANCE: 'Mantenimiento del sistema',
};

export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] ?? 'Nueva notificación';
}
