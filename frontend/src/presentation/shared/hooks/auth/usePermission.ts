import { useMemo } from 'react';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  const permissions = useMemo(
    () => new Set(user?.role?.permissions?.map((p) => typeof p === 'string' ? p : p.code) ?? []),
    [user?.role?.permissions],
  );

  return {
    /** Verifica si el usuario tiene TODOS los permisos especificados */
    can: useMemo(() => {
      return (...required: string[]) => required.every((p) => permissions.has(p));
    }, [permissions]),
    /** Verifica si el usuario tiene ALGUNO de los permisos especificados */
    canAny: useMemo(() => {
      return (...required: string[]) => required.some((p) => permissions.has(p));
    }, [permissions]),
    /** Lista de códigos de permisos del usuario */
    permissions,
    /** Rol del usuario */
    role: user?.role?.code ?? '',
  };
}
