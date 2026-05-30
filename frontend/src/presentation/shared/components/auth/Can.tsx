'use client';

import { usePermission } from '@/presentation/shared/hooks/auth/usePermission';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';

interface CanProps {
  permission?: string | string[];
  mode?: 'all' | 'any';
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, mode = 'all', role, children, fallback = null }: CanProps) {
  const { can, canAny } = usePermission();
  const userRole = useAuthStore((s) => s.user?.role?.code);

  const hasRole = role ? userRole === role : true;
  const hasPermission = !permission
    ? true
    : Array.isArray(permission)
      ? mode === 'all'
        ? can(...permission)
        : canAny(...permission)
      : can(permission);

  if (hasRole && hasPermission) return <>{children}</>;
  return <>{fallback}</>;
}
