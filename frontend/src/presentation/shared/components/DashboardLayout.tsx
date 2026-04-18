'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Icons } from './Sidebar';
import { Header } from './Header';
import { NetworkStatusWidget } from './NetworkStatusWidget';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';
import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';
import { getOutboxCount } from '@/infrastructure/storage/db';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: '/dashboard', label: 'Panel de Control', icon: Icons.dashboard },
  { href: '/products', label: 'Productos', icon: Icons.products },
  { href: '/categories', label: 'Categorías', icon: Icons.category },
  { href: '/warehouses', label: 'Almacenes', icon: Icons.warehouse },
  { href: '/stock', label: 'Stock', icon: Icons.stock },
  { href: '/movements', label: 'Movimientos', icon: Icons.movements },
  { href: '/suppliers', label: 'Proveedores', icon: Icons.supplier },
  { href: '/customers', label: 'Clientes', icon: Icons.customer },
  { href: '/purchases', label: 'Compras', icon: Icons.purchase },
  { href: '/sales', label: 'Ventas', icon: Icons.sale },
  { href: '/transfers', label: 'Transferencias', icon: Icons.transfer },
  { href: '/adjustments', label: 'Ajustes', icon: Icons.adjustment },
  { href: '/returns', label: 'Devoluciones', icon: Icons.returnDoc },
  { href: '/reports', label: 'Reportes', icon: Icons.report },
  { href: '/import', label: 'Importar', icon: Icons.importData },
  { href: '/export', label: 'Exportar', icon: Icons.exportData },
  { href: '/users', label: 'Usuarios', icon: Icons.users },
  { href: '/currencies', label: 'Monedas', icon: Icons.currency },
  { href: '/exchange-rates', label: 'Tasas de Cambio', icon: Icons.exchangeRate },
  { href: '/settings', label: 'Configuración', icon: Icons.settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [pendingForLogout, setPendingForLogout] = useState(0);
  const { isAuthenticated, hasHydrated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleLogoutRequest = async () => {
    // Check for unsynchronized changes before showing dialog
    try {
      const count = await getOutboxCount();
      setPendingForLogout(count);
    } catch {
      setPendingForLogout(0);
    }
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    await logout();
    window.location.href = '/login';
  };

  const handleToggleSidebar = () => {
    setIsCollapsed((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue));
      return newValue;
    });
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        items={navigationItems}
        isCollapsed={isCollapsed}
        onToggle={handleToggleSidebar}
      />
      <Header isSidebarCollapsed={isCollapsed} onLogoutRequest={handleLogoutRequest} />
      
      <main
        className={`pt-16 transition-all duration-300 ${
          isCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>

      <NetworkStatusWidget />
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        pendingCount={pendingForLogout}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </div>
  );
}

export default DashboardLayout;
