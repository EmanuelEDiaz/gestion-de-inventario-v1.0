'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { NotificationTray } from '@/presentation/modules/notifications/components/NotificationTray';
import { Icons } from './SidebarIcons';

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function UserAvatar({ user }: { user: { displayName: string; username: string; avatarUrl?: string } }) {
  const [imageError, setImageError] = useState(false);
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.username[0].toUpperCase();
  const bgColor = stringToColor(user.username);

  if (user.avatarUrl && !imageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}

interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onLogoutRequest: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({ onLogoutRequest, onToggleMobileMenu }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-gray-200 bg-white"
    >
      <div className="flex h-full items-center justify-between px-2 md:px-4">
        {/* Izquierda: botón menú (móvil) o vacío en PC */}
        <div className="flex w-12 items-center md:w-auto">
          <button
            onClick={onToggleMobileMenu}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            title="Menú"
          >
            {Icons.menu}
          </button>
        </div>

        {/* Centro: Logo + Título (centrado) */}
        <div className="flex items-center gap-2">
          <div className="relative h-7 w-7 flex-shrink-0 md:h-8 md:w-8">
            <Image
              src="/icons/bag-discount-sale-svgrepo-com.svg"
              alt="Inventario"
              width={28}
              height={28}
              className="object-contain md:w-8 md:h-8"
            />
          </div>
          <h1 className="text-sm font-semibold text-gray-800 md:text-lg">
            Sistema de Inventario
          </h1>
        </div>

        {/* Derecha: Acciones del usuario */}
        <div className="flex items-center gap-1 md:gap-4">
          <NotificationTray />

          {/* Avatar + Nombre del usuario - oculto en móvil */}
          <div className="hidden items-center gap-2 text-sm text-gray-600 md:flex">
            {user && <UserAvatar user={user} />}
            <span className="max-w-[120px] truncate">{user?.displayName || user?.username || 'Usuario'}</span>
            {user?.role && (
              <span className="rounded bg-info/10 px-2 py-0.5 text-xs text-info">
                {user.role.name}
              </span>
            )}
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={onLogoutRequest}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-danger md:px-3 md:gap-2"
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