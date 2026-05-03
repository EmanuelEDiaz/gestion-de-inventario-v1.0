'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Icons } from './Sidebar';
import { Header } from './Header';
import { NetworkStatusWidget } from './NetworkStatusWidget';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';
import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';
import { useSidebarSections } from '@/presentation/shared/hooks/useSidebarSections';
import { getOutboxCount } from '@/infrastructure/storage/db';
import { cn } from '@/presentation/shared/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationSections = [
  {
    id: 'general',
    title: 'General',
    defaultOpen: true,
    items: [
      { href: '/dashboard', label: 'Panel de Control', icon: Icons.dashboard },
    ],
  },
  {
    id: 'inventario',
    title: 'Inventario',
    defaultOpen: true,
    items: [
      { href: '/products', label: 'Productos', icon: Icons.products },
      { href: '/categories', label: 'Categorías', icon: Icons.category },
      { href: '/warehouses', label: 'Almacenes', icon: Icons.warehouse },
      { href: '/stock', label: 'Stock', icon: Icons.stock },
      { href: '/movements', label: 'Movimientos', icon: Icons.movements },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    defaultOpen: false,
    items: [
      { href: '/suppliers', label: 'Proveedores', icon: Icons.supplier },
      { href: '/customers', label: 'Clientes', icon: Icons.customer },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    defaultOpen: true,
    items: [
      { href: '/purchases', label: 'Compras', icon: Icons.purchase },
      { href: '/sales', label: 'Ventas', icon: Icons.sale },
      { href: '/transfers', label: 'Transferencias', icon: Icons.transfer },
      { href: '/adjustments', label: 'Ajustes', icon: Icons.adjustment },
      { href: '/returns', label: 'Devoluciones', icon: Icons.returnDoc },
    ],
  },
  {
    id: 'datos',
    title: 'Datos',
    defaultOpen: false,
    items: [
      { href: '/import', label: 'Importar', icon: Icons.importData },
      { href: '/export', label: 'Exportar', icon: Icons.exportData },
      { href: '/reports', label: 'Reportes', icon: Icons.report },
    ],
  },
  {
    id: 'sistema',
    title: 'Sistema',
    defaultOpen: false,
    items: [
      { href: '/users', label: 'Usuarios', icon: Icons.users },
      { href: '/currencies', label: 'Monedas', icon: Icons.currency },
      { href: '/exchange-rates', label: 'Tasas de Cambio', icon: Icons.exchangeRate },
      { href: '/settings', label: 'Configuración', icon: Icons.settings },
    ],
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { openSections, toggleSection } = useSidebarSections({ 
    sections: navigationSections,
    currentPathname: pathname 
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  const handleToggleMobileMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileOpen(false);
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
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar
          sections={navigationSections}
          isCollapsed={isCollapsed}
          onToggle={handleToggleSidebar}
          openSections={openSections}
          onToggleSection={toggleSection}
        />
      </div>

      {/* Sidebar mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleCloseMobileMenu}
        />
      )}
      
      {/* Sidebar mobile */}
      <div className={cn(
        'fixed left-0 top-0 z-50 h-screen w-64 transform transition-transform duration-300 md:hidden',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          sections={navigationSections}
          isCollapsed={false}
          onToggle={handleCloseMobileMenu}
          openSections={openSections}
          onToggleSection={toggleSection}
        />
      </div>

      <Header 
        isSidebarCollapsed={isCollapsed} 
        onLogoutRequest={handleLogoutRequest}
        onToggleMobileMenu={handleToggleMobileMenu}
      />
      
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          'pl-0 md:pl-16 lg:pl-64'
        )}
      >
        <div className="p-4 md:p-6">
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