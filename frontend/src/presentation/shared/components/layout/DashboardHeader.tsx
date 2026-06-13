'use client';

import type { NavSection } from '@/presentation/shared/hooks/ui/useSidebarSections';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/presentation/shared/lib/utils';

interface DashboardHeaderProps {
  navigationSections: NavSection[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  openSections: Record<string, boolean>;
  onToggleSidebar: () => void;
  onToggleSection: (id: string) => void;
  onCloseMobileMenu: () => void;
  onLogoutRequest: () => void;
  onToggleMobileMenu: () => void;
  disabled?: boolean;
}

export function DashboardHeader({
  navigationSections,
  isCollapsed,
  isMobileOpen,
  openSections,
  onToggleSidebar,
  onToggleSection,
  onCloseMobileMenu,
  onLogoutRequest,
  onToggleMobileMenu,
  disabled,
}: DashboardHeaderProps) {
  return (
    <>
      <div className="hidden md:block">
        <Sidebar
          sections={navigationSections}
          isCollapsed={isCollapsed}
          onToggle={onToggleSidebar}
          openSections={openSections}
          onToggleSection={onToggleSection}
          disabled={disabled}
        />
      </div>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      <div className={cn(
        'fixed left-0 top-0 z-50 h-screen w-64 transform transition-transform duration-300 md:hidden',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          sections={navigationSections}
          isCollapsed={false}
          onToggle={onCloseMobileMenu}
          openSections={openSections}
          onToggleSection={onToggleSection}
          disabled={disabled}
        />
      </div>
      <Header
        isSidebarCollapsed={isCollapsed}
        onLogoutRequest={onLogoutRequest}
        onToggleMobileMenu={onToggleMobileMenu}
        disabled={disabled}
      />
    </>
  );
}
