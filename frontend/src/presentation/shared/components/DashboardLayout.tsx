'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Icons } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: '/dashboard', label: 'Panel de Control', icon: Icons.dashboard },
  { href: '/products', label: 'Productos', icon: Icons.products },
  { href: '/categories', label: 'Categorías', icon: Icons.category },
  { href: '/warehouses', label: 'Almacenes', icon: Icons.warehouse },
  { href: '/suppliers', label: 'Proveedores', icon: Icons.supplier },
  { href: '/customers', label: 'Clientes', icon: Icons.customer },
  { href: '/purchases', label: 'Compras', icon: Icons.purchase },
  { href: '/sales', label: 'Ventas', icon: Icons.sale },
  { href: '/transfers', label: 'Transferencias', icon: Icons.transfer },
  { href: '/adjustments', label: 'Ajustes', icon: Icons.adjustment },
  { href: '/reports', label: 'Reportes', icon: Icons.report },
  { href: '/settings', label: 'Configuración', icon: Icons.settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Recuperar preferencia de sidebar
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Redirigir si no está autenticado
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleToggleSidebar = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // No renderizar si no está autenticado
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
      <Header isSidebarCollapsed={isCollapsed} />
      
      <main
        className={`pt-16 transition-all duration-300 ${
          isCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
