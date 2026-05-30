'use client';

import { useState, useEffect } from 'react';
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
import { getOutboxCount, initPersistence, isPersistenceReady } from '@/infrastructure/storage/db';
import { NAVIGATION_CONFIG } from '@/presentation/shared/config/navigation.config';
import { useSyncStatus } from '@/presentation/shared/hooks/storage/useSyncStatus';
import { useCacheProgress } from '@/presentation/shared/hooks/storage/useCacheProgress';
import { Loader2 } from '../ui/icon-mapping';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationSections = NAVIGATION_CONFIG.map((section) => ({
  ...section,
  label: section.title,
  items: section.items.map(({ iconKey, ...rest }) => ({
    ...rest,
    icon: Icons[iconKey as keyof typeof Icons] ?? Icons.dashboard,
  })),
}));

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { openSections, toggleSection } = useSidebarSections({
    sections: navigationSections, currentPathname: pathname,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => { const saved = localStorage.getItem('sidebar-collapsed'); if (saved !== null) setIsCollapsed(JSON.parse(saved)); }, []);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [pendingForLogout, setPendingForLogout] = useState(0);
  const { isAuthenticated, hasHydrated, logout } = useAuthStore();
  const { status: syncStatus, pendingCount } = useSyncStatus();
  const { isAppReady, modules, overallPercent, isComplete } = useCacheProgress();
  const router = useRouter();

  useEffect(() => { if (!hasHydrated) return; if (!isAuthenticated) router.push('/login'); }, [hasHydrated, isAuthenticated, router]);

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

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Sidebar sections={navigationSections} isCollapsed={isCollapsed} onToggle={handleToggleSidebar} openSections={openSections} onToggleSection={toggleSection} />
        </div>
        <NetworkStatusWidget />
        <LoadingOverlay message="Iniciando..." />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <CacheProgressBar modules={modules} overallPercent={overallPercent} isComplete={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isComplete && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 bg-blue-50 border-b border-blue-200 px-4 py-1.5 text-xs text-blue-700">
          <Loader2 size={14} className="animate-spin shrink-0" />
          <span>Sincronizando catálogo… {overallPercent}%</span>
        </div>
      )}
      <DashboardHeader navigationSections={navigationSections} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} openSections={openSections} onToggleSidebar={handleToggleSidebar} onToggleSection={toggleSection} onCloseMobileMenu={handleCloseMobileMenu} onLogoutRequest={handleLogoutRequest} onToggleMobileMenu={handleToggleMobileMenu} />
      <DashboardMain isCollapsed={isCollapsed}>{children}</DashboardMain>
      <NetworkStatusWidget />
      <LogoutConfirmDialog isOpen={showLogoutDialog} pendingCount={pendingForLogout} onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutDialog(false)} />
    </div>
  );
}

export default DashboardLayout;
