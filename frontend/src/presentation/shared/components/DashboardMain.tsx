'use client';

import { cn } from '@/presentation/shared/lib/utils';

interface DashboardMainProps {
  isCollapsed: boolean;
  children: React.ReactNode;
}

export function DashboardMain({ isCollapsed, children }: DashboardMainProps) {
  return (
    <main
      className={cn(
        'pt-16 transition-all duration-300',
        isCollapsed ? 'pl-0 md:pl-16' : 'pl-0 md:pl-16 lg:pl-64'
      )}
    >
      <div className="p-4 md:p-6">
        {children}
      </div>
    </main>
  );
}
