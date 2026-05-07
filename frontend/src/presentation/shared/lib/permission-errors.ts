import { isApiError, getErrorMessage } from '@/infrastructure/api/client';
import { toast } from '@/presentation/shared/components/ui/toast';

export interface PermissionErrorInfo {
  statusCode: number;
  title: string;
  action: string;
  requiredPermission: string;
  description?: string;
}

/**
 * Detecta si un error es de tipo 403 (Forbidden/Sin permisos)
 */
export function isPermissionError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.response?.status === 403;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('permission') || 
           message.includes('forbidden') || 
           message.includes('access') ||
           message.includes('no autorizado');
  }
  return false;
}

/**
 * Extrae el código de estado de un error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Crea la información de error de permisos para el toast
 */
export function createPermissionErrorInfo(
  error: unknown,
  action: string,
  requiredPermission: string
): PermissionErrorInfo {
  const statusCode = getErrorStatusCode(error) || 403;
  const message = getErrorMessage(error);
  
  return {
    statusCode,
    title: `No tienes permisos para "${action}"`,
    action,
    requiredPermission,
    description: message !== 'Error desconocido' ? message : undefined,
  };
}

/**
 * Muestra un toast de error de permisos
 */
export function showPermissionDeniedToast(
  error: unknown,
  action: string,
  requiredPermission: string
): void {
  const errorInfo = createPermissionErrorInfo(error, action, requiredPermission);
  
  toast.permissionDenied({
    action: errorInfo.action,
    requiredPermission: errorInfo.requiredPermission,
    statusCode: errorInfo.statusCode,
    description: errorInfo.description,
  });
}

/**
 * Wrapper para usar en hooks de mutations
 * Detecta automáticamente si es error de permisos y muestra el toast apropiado
 */
export function handleErrorWithPermissionCheck(
  error: unknown,
  action: string,
  requiredPermission: string
): void {
  if (isPermissionError(error)) {
    showPermissionDeniedToast(error, action, requiredPermission);
  } else {
    const message = getErrorMessage(error);
    toast.error(message || `Error al ${action.toLowerCase()}`);
  }
}