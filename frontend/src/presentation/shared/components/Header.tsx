'use client';

import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';
import { NotificationBadge } from '@/presentation/modules/notifications/components/NotificationBadge';
import { Icons } from './Sidebar';
import { cn } from '@/presentation/shared/lib/utils';

interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onLogoutRequest: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({ isSidebarCollapsed = false, onLogoutRequest, onToggleMobileMenu }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header
      className={cn(
        'fixed top-0 z-30 h-16 border-b border-gray-200 bg-white transition-all duration-300',
        'left-0 md:left-16 lg:left-64'
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Botón menú móvil + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            title="Menú"
          >
            {Icons.menu}
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            Sistema de Inventario
          </h1>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center gap-3 md:gap-4">
          <NotificationBadge />

          {/* Nombre del usuario */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {Icons.user}
            <span className="hidden sm:inline">{user?.displayName || user?.username || 'Usuario'}</span>
            {user?.role && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {user.role.name}
              </span>
            )}
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={onLogoutRequest}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600"
            title="Cerrar sesión"
          >
            {Icons.logout}
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;