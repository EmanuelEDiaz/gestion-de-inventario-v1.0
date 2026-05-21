'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/presentation/shared/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
}

export function SidebarNavItem({ item, isCollapsed }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs">{item.badge}</span>
          )}
        </>
      )}
    </Link>
  );
}
