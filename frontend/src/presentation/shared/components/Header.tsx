'use client';

import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';
import { Icons } from './Sidebar';
import { SyncIndicator } from './SyncIndicator';

interface HeaderProps {
  isSidebarCollapsed?: boolean;
}

export function Header({ isSidebarCollapsed = false }: HeaderProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header
      className={`fixed top-0 z-30 h-16 border-b border-gray-200 bg-white transition-all duration-300 ${
        isSidebarCollapsed ? 'left-16' : 'left-64'
      } right-0`}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Breadcrumb o título */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-800">
            Sistema de Inventario
          </h1>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center gap-4">
          <SyncIndicator />
          {/* Nombre del usuario */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {Icons.user}
            <span>{user?.displayName || user?.username || 'Usuario'}</span>
            {user?.role && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {user.role.name}
              </span>
            )}
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600"
            title="Cerrar sesión"
          >
            {Icons.logout}
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
