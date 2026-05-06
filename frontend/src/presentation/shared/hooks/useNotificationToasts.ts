import { useEffect } from 'react';
import { toast } from 'sonner';
import { UseSystemNotificationsReturn } from './useSystemNotifications';
import { UseUserNotificationsReturn } from './useUserNotifications';
import { ToastContent } from '@/presentation/shared/components/ui/toast';
import { INotification, NotificationPriority } from '@/core/entities/notification';

/**
 * Hook para mostrar notificaciones como toasts visuales en el UI
 * 
 * Características:
 * - Muestra toast solo para notificaciones CRITICAL
 * - Diferentes colores según prioridad
 * - Descripción personalizada según categoría
 * - Auto-dismiss después de 5 segundos
 * - Click en toast abre detalles (Week 5 enhancement)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const system = useSystemNotifications();
 *   const users = useUserNotifications();
 *   
 *   useNotificationToasts(system, users);
 *   
 *   // Toasts automatically shown when new CRITICAL notifications arrive
 * }
 * ```
 */
export function useNotificationToasts(
  systemNotifications?: UseSystemNotificationsReturn,
  userNotifications?: UseUserNotificationsReturn
) {
  // Track shown notifications to avoid duplicates
  const shownNotificationsRef = new Set<string>();

  useEffect(() => {
    if (!systemNotifications) return;

    // Monitor system notifications for new critical ones
    const criticalNotifs = systemNotifications.notifications?.filter(
      (n) => n.priority === NotificationPriority.CRITICAL && !n.read
    ) ?? [];

    criticalNotifs.forEach((notif) => {
      // Avoid showing duplicate toasts
      if (shownNotificationsRef.has(notif.id)) {
        return;
      }

      shownNotificationsRef.add(notif.id);

      // Get toast variant based on notification priority
      const toastVariant = getToastVariant(notif);

      // Show toast
      toast.custom(
        (t) => (
          <ToastContent
            title={notif.title}
            description={getCategoryDescription(notif.category)}
            variant={toastVariant}
            duration={5000}
          />
        ),
        {
          duration: 5000,
          position: 'top-right',
          classNameToast: 'p-0 shadow-lg rounded-lg',
        }
      );
    });
  }, [systemNotifications?.notifications]);

  useEffect(() => {
    if (!userNotifications) return;

    // Monitor user notifications for new critical ones
    const criticalNotifs = userNotifications.notifications?.filter(
      (n) => n.priority === NotificationPriority.CRITICAL && !n.read
    ) ?? [];

    criticalNotifs.forEach((notif) => {
      if (shownNotificationsRef.has(notif.id)) {
        return;
      }

      shownNotificationsRef.add(notif.id);

      const toastVariant = getToastVariant(notif);

      toast.custom(
        (t) => (
          <ToastContent
            title={notif.title}
            description={getCategoryDescription(notif.category)}
            variant={toastVariant}
            duration={5000}
          />
        ),
        {
          duration: 5000,
          position: 'top-right',
          classNameToast: 'p-0 shadow-lg rounded-lg',
        }
      );
    });
  }, [userNotifications?.notifications]);
}

/**
 * Map notification priority to toast variant
 */
function getToastVariant(
  notification: INotification
): 'success' | 'error' | 'warning' | 'info' {
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

/**
 * Get human-readable description for notification category
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    // Inventory
    LOW_STOCK: 'Stock bajo en inventario',
    CRITICAL_STOCK: 'Stock crítico detectado',
    OUT_OF_STOCK: 'Producto sin stock',

    // Sync
    SYNC_ERROR: 'Error durante sincronización',
    SYNC_SUCCESS: 'Sincronización completada',
    SYNC_CONFLICT: 'Conflicto de datos detectado',

    // Operations
    OPERATION_SALE: 'Venta completada',
    OPERATION_PURCHASE: 'Compra registrada',
    OPERATION_TRANSFER: 'Transferencia completada',
    OPERATION_RETURN: 'Devolución procesada',
    OPERATION_ADJUSTMENT: 'Ajuste de inventario',

    // Credit
    CREDIT_LIMIT_REACHED: 'Límite de crédito alcanzado',
    CREDIT_PAYMENT_DUE: 'Pago de crédito vencido',
    CREDIT_PAYMENT_RECEIVED: 'Pago de crédito recibido',

    // User Actions
    USER_LOGIN: 'Usuario iniciando sesión',
    USER_LOGOUT: 'Usuario cerró sesión',
    USER_ACTION_APPROVED: 'Acción aprobada',
    USER_ACTION_REJECTED: 'Acción rechazada',

    // System
    SYSTEM_ERROR: 'Error del sistema',
    SYSTEM_WARNING: 'Advertencia del sistema',
    SYSTEM_INFO: 'Información del sistema',
    SYSTEM_MAINTENANCE: 'Mantenimiento del sistema',
  };

  return descriptions[category] ?? 'Nueva notificación';
}
