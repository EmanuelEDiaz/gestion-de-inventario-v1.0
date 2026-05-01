'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/presentation/shared/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  iconOpen?: React.ReactNode;
  items: NavItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function SidebarSection({ title, icon, iconOpen, items, isOpen, isCollapsed, onToggle }: SidebarSectionProps) {
  const pathname = usePathname();

  const renderHeader = () => (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'text-gray-400 hover:bg-gray-800 hover:text-white',
        isCollapsed && 'justify-center'
      )}
      title={isCollapsed ? title : undefined}
    >
      {isCollapsed ? (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-800" title={title}>
          {isOpen && iconOpen ? iconOpen : (icon || <span className="text-xs">{title.charAt(0)}</span>)}
        </span>
      ) : (
        <>
          <span className="flex h-6 w-6 items-center justify-center">
            {isOpen && iconOpen ? iconOpen : icon}
          </span>
          <span className="flex-1 text-left">{title}</span>
          <ChevronIcon isOpen={isOpen} />
        </>
      )}
    </button>
  );

  const renderItems = () => (
    <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-2">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <li className="mb-2">
      {renderHeader()}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {renderItems()}
      </div>
    </li>
  );
}