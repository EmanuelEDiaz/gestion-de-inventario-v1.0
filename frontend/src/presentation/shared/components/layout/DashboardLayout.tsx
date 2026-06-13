'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Icons } from './SidebarIcons';
import { DashboardHeader } from './DashboardHeader';
import { DashboardMain } from './DashboardMain';
import { NetworkStatusWidget } from '../data-display/NetworkStatusWidget';
import { LogoutConfirmDialog } from '../feedback/LogoutConfirmDialog';
import { LoadingOverlay } from '../form/LoadingSpinner';
import { CacheProgressBar } from '../network-status/CacheProgressBar';
import { SkeletonDashboard } from './SkeletonDashboard';
import { CorruptionRepairCenter } from '../data-repair/CorruptionRepairCenter';
import { TooltipHint } from '../ui/tooltip';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { useSidebarSections } from '@/presentation/shared/hooks/ui/useSidebarSections';
import { getOutboxCount } from '@/infrastructure/storage/db';
import { NAVIGATION_CONFIG } from '@/presentation/shared/config/navigation.config';
import { useCacheProgress } from '@/presentation/shared/hooks/storage/useCacheProgress';
import { useAppLoader } from '@/presentation/shared/hooks/storage/useAppLoader';
import { useAppLoaderStore, formatPhaseError } from '@/core/loading/appLoaderStore';
import { useMaintenance } from '@/presentation/shared/hooks/storage/useMaintenance';
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
  const { isAuthenticated, hasHydrated, user, logout } = useAuthStore();
  const { phase: appPhase, availability: appAvailability, error: appError, startLoading } = useAppLoader();
  const store = useAppLoaderStore();
  useMaintenance();
  const addError = useErrorLogStore((s) => s.addError);
  const { overallPercent } = useCacheProgress();

  const isAuthReady = hasHydrated && isAuthenticated;
  const isAppError = appAvailability === 'error';
  const isBlocking = appAvailability === 'blocking';
  const isAppReady = appAvailability === 'ready_partial'
    || appAvailability === 'ready_complete'
    || appAvailability === 'degraded';

  const [showRepairCenter, setShowRepairCenter] = useState(false);
  const userId = user?.id ?? 'boot-loader';
  const lastFailedPhase = useAppLoaderStore((s) => s.lastFailedPhase);

  const retryBoot = useCallback(() => {
    useAppLoaderStore.getState().start();
  }, []);

  const skipAndContinue = useCallback(() => {
    useAppLoaderStore.getState().setAvailability('degraded');
    useAppLoaderStore.getState().setPhase('idle');
  }, []);

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

  // Listen for corruption-detected events and show toast
  useEffect(() => {
    const handler = (e: Event) => {
      const { idbStoreName } = (e as CustomEvent).detail;
      toast.warning('Datos corruptos detectados', {
        description: `${idbStoreName}: el checksum del chunk no coincide. Los datos se guardaron en el centro de reparación.`,
        action: 'Ir a reparar',
        onAction: () => setShowRepairCenter(true),
        duration: 120_000,
      });
    };
    window.addEventListener('corruption-detected', handler);
    return () => window.removeEventListener('corruption-detected', handler);
  }, []);

  // Listen for open-repair-center events
  useEffect(() => {
    const handler = () => setShowRepairCenter(true);
    window.addEventListener('open-repair-center', handler);
    return () => window.removeEventListener('open-repair-center', handler);
  }, []);

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

  // Loading — render layout with skeleton + disabled navigation + floating progress
  if (isBlocking && !isAppError) {
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
          disabled={true}
        />
        <DashboardMain isCollapsed={isCollapsed}>
          <SkeletonDashboard />
        </DashboardMain>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="rounded-full bg-gray-900/80 px-4 py-2 text-xs text-white shadow-lg">
            Cargando aplicación — la navegación estará disponible en unos segundos
          </div>
        </div>
        <CacheProgressBar variant="floating" />
      </div>
    );
  }

  // Error screen with 3 actions + tooltips
  if (isAppError) {
    const isTokenError = appError
      ? /sesión|token|expirada|expir/i.test(appError)
      : false;
    const errorParts = formatPhaseError(store.phase, store.step, false, true);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            {isTokenError ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Sesión expirada</h2>
                <p className="mt-2 text-sm text-red-600">{appError}</p>
                <div className="mt-6">
                  <button
                    onClick={() => { logout(); window.location.href = '/login'; }}
                    className="min-h-11 rounded bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700"
                  >
                    Iniciar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Error al cargar datos</h2>
                <p className="mt-2 text-sm text-red-600">{appError}</p>
                <p className="mt-3 text-sm text-gray-700">{errorParts.whatHappened}</p>
                <p className="mt-1 text-xs text-gray-500">{errorParts.impact} {errorParts.autoRetry}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <TooltipHint
                    title="Reintentar descarga"
                    description="Reinicia la carga desde cero. Las fases con datos ya descargados se saltan automáticamente."
                    variant="info"
                  >
                    <button onClick={retryBoot} className="min-h-11 rounded bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700">
                      Reintentar descarga
                    </button>
                  </TooltipHint>
                  <TooltipHint
                    title="Abrir centro de reparación"
                    description="Muestra los chunks corruptos con opciones: re-descargar, editar JSON manualmente, o descartar."
                    variant="info"
                  >
                    <button onClick={() => setShowRepairCenter(true)} className="min-h-11 rounded bg-amber-600 px-4 py-2 text-xs text-white hover:bg-amber-700">
                      Reparar datos corruptos
                    </button>
                  </TooltipHint>
                  <TooltipHint
                    title="Omitir y continuar con datos parciales"
                    description="La app se mostrará con los datos que ya están en caché. Puedes reintentar la descarga después desde el panel de estado."
                    variant="info"
                  >
                    <button onClick={skipAndContinue} className="min-h-11 rounded bg-gray-600 px-4 py-2 text-xs text-white hover:bg-gray-700">
                      Omitir y continuar
                    </button>
                  </TooltipHint>
                </div>
              </>
            )}
          </div>
          {showRepairCenter && (
            <div className="mt-4">
              <CorruptionRepairCenter onClose={() => setShowRepairCenter(false)} userId={userId} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard fully loaded (could be degraded with banner)
  return (
    <div className="min-h-screen bg-gray-50">
      {appAvailability === 'degraded' && lastFailedPhase && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Carga parcial — algunos datos no están disponibles
              </p>
              <p className="mt-1 text-xs text-amber-700">
                No se pudo descargar {lastFailedPhase.phaseLabel}. La app usará datos anteriores.
                Puedes reintentar o reparar datos corruptos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TooltipHint
                title="Reintentar descarga"
                description="Reinicia la carga. Las fases con datos ya descargados se saltan automáticamente."
                variant="info"
              >
                <button onClick={retryBoot} className="min-h-11 rounded bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700">
                  Reintentar
                </button>
              </TooltipHint>
              <TooltipHint
                title="Abrir centro de reparación"
                description="Muestra los chunks corruptos con opciones de reparación."
                variant="info"
              >
                <button onClick={() => setShowRepairCenter(true)} className="min-h-11 rounded bg-white px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100">
                  Reparar
                </button>
              </TooltipHint>
            </div>
          </div>
          {showRepairCenter && (
            <CorruptionRepairCenter onClose={() => setShowRepairCenter(false)} userId={userId} />
          )}
        </div>
      )}
      {appAvailability === 'ready_partial' && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-2">
          <p className="text-xs text-blue-700">
            Descargando recursos secundarios...
          </p>
        </div>
      )}
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
        disabled={false}
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
