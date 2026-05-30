import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = new Set(user?.role?.permissions?.map((p) => p.code) ?? []);

  return {
    /** Verifica si el usuario tiene TODOS los permisos especificados */
    can: (...required: string[]) => required.every((p) => permissions.has(p)),
    /** Verifica si el usuario tiene ALGUNO de los permisos especificados */
    canAny: (...required: string[]) => required.some((p) => permissions.has(p)),
    /** Lista de códigos de permisos del usuario */
    permissions,
    /** Rol del usuario */
    role: user?.role?.code ?? '',
  };
}
