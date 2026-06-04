'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Icons } from './SidebarIcons';
import { DashboardHeader } from './DashboardHeader';
import { DashboardMain } from './DashboardMain';
import { NetworkStatusWidget } from '../data-display/NetworkStatusWidget';
import { LogoutConfirmDialog } from '../feedback/LogoutConfirmDialog';
import { LoadingOverlay } from '../form/LoadingSpinner';
import { CacheProgressBar } from '../network-status/CacheProgressBar';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { useSidebarSections } from '@/presentation/shared/hooks/ui/useSidebarSections';
import { getOutboxCount } from '@/infrastructure/storage/db';
import { NAVIGATION_CONFIG } from '@/presentation/shared/config/navigation.config';
import { useCacheProgress } from '@/presentation/shared/hooks/storage/useCacheProgress';
import { useAppLoader } from '@/presentation/shared/hooks/storage/useAppLoader';
import { usePermission } from '@/presentation/shared/hooks/auth/usePermission';
import { PERMISSION_ROUTES } from '@/presentation/shared/config/permission-routes';
import { useErrorLogStore } from '@/core/loading/errorLogStore';
import { toast } from '@/presentation/shared/components/ui';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermission();
  const { isAuthenticated, hasHydrated, logout } = useAuthStore();
  const { phase: appPhase, availability: appAvailability, error: appError, phaseLabel, startLoading } = useAppLoader();
  const addError = useErrorLogStore((s) => s.addError);
  const { overallPercent } = useCacheProgress();

  const isAuthReady = hasHydrated && isAuthenticated;
  const isAppComplete = appAvailability === 'ready_complete';
  const isAppError = appAvailability === 'error';

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    const required = PERMISSION_ROUTES[pathname];
    if (required && !can(...(Array.isArray(required) ? required : [required]))) {
      router.push('/dashboard');
      toast.error('No tienes permiso para acceder a esta sección');
    }
  }, [pathname, hasHydrated, isAuthenticated, can, router]);

  // Trigger AppLoader when auth is ready
  useEffect(() => {
    if (isAuthReady && appPhase === 'idle') {
      startLoading();
    }
  }, [isAuthReady, appPhase, startLoading]);

  // Show toast and audit error on loading failure
  useEffect(() => {
    if (appPhase === 'error' && appError) {
      addError('app_loader', appError);
      toast.error('Error en carga inicial', {
        description: appError,
        action: 'Carga de datos offline',
        duration: 12000,
      });
    }
  }, [appPhase, appError, addError]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(JSON.parse(saved));
  }, []);

  const navigationSections = useMemo(() => NAVIGATION_CONFIG
    .map((section) => ({
      ...section,
      label: section.title,
      items: section.items
        .filter((item) => !item.requiredPermission || can(item.requiredPermission))
        .map(({ iconKey, ...rest }) => ({
          ...rest,
          icon: Icons[iconKey as keyof typeof Icons] ?? Icons.dashboard,
        })),
    }))
    .filter((section) => section.items.length > 0), [can]);

  const { openSections, toggleSection } = useSidebarSections({
    sections: navigationSections, currentPathname: pathname,
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [pendingForLogout, setPendingForLogout] = useState(0);

  const handleLogoutRequest = async () => {
    try { setPendingForLogout(await getOutboxCount()); } catch { setPendingForLogout(0); }
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    await logout();
    window.location.href = '/login';
  };

  const handleToggleSidebar = () => setIsCollapsed((prev) => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(!prev));
    return !prev;
  });

  const handleToggleMobileMenu = () => setIsMobileOpen((prev) => !prev);
  const handleCloseMobileMenu = () => setIsMobileOpen(false);

  // Not hydrated yet
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Sidebar sections={navigationSections} isCollapsed={isCollapsed} onToggle={handleToggleSidebar} openSections={openSections} onToggleSection={toggleSection} />
        </div>
        <LoadingOverlay message="Iniciando..." />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) return null;

  // Loading — block until app is fully loaded
  if (!isAppComplete && !isAppError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <p className="text-center text-xs text-gray-400 mb-2">Preparando aplicación para uso offline...</p>
          <CacheProgressBar />
          <p className="text-center text-xs text-gray-400 mt-2">{overallPercent}%</p>
        </div>
      </div>
    );
  }

  // Error
  if (isAppError) {
    const isTokenError = appError
      ? /sesión|token|expirada|expir/i.test(appError)
      : false;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <CacheProgressBar />
          <div className="mt-4 flex flex-col gap-2">
            {isTokenError ? (
              <button
                onClick={() => { logout(); window.location.href = '/login'; }}
                className="rounded bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700"
              >
                Desconectarse
              </button>
            ) : (
              <button
                onClick={() => startLoading()}
                className="rounded bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard fully loaded
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        navigationSections={navigationSections}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        openSections={openSections}
        onToggleSidebar={handleToggleSidebar}
        onToggleSection={toggleSection}
        onCloseMobileMenu={handleCloseMobileMenu}
        onLogoutRequest={handleLogoutRequest}
        onToggleMobileMenu={handleToggleMobileMenu}
      />
      <DashboardMain isCollapsed={isCollapsed}>{children}</DashboardMain>
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
