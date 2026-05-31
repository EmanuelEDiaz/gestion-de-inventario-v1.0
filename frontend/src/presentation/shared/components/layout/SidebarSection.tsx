'use client';

import { ExpandCircleDown } from '@material-symbols-svg/react';
import { cn } from '@/presentation/shared/lib/utils';
import type { NavItem } from './SidebarNavItem';
import { SidebarNavItem } from './SidebarNavItem';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

interface SidebarSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconOpen?: React.ReactNode;
  items: NavItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <ExpandCircleDown
      width={16}
      height={16}
      className={cn('shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
    />
  );
}

export function SidebarSection({
  title,
  description,
  icon,
  iconOpen,
  items,
  isOpen,
  isCollapsed,
  onToggle,
}: SidebarSectionProps) {
  const sectionButton = (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white',
        isCollapsed && 'justify-center'
      )}
    >
      {isCollapsed ? (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-800">
          {isOpen && iconOpen
            ? iconOpen
            : icon ?? <span className="text-xs font-bold">{title.charAt(0)}</span>}
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

  return (
    <li className="mb-2">
      {isCollapsed ? (
        <TooltipWrapper content={title} description={description} side="right">
          {sectionButton}
        </TooltipWrapper>
      ) : (
        sectionButton
      )}
      <div className={cn('overflow-hidden transition-all duration-200', isOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0')}>
        <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-2">
          {items.map((item) => (
            <li key={item.href}>
              {isCollapsed ? (
                <TooltipWrapper content={item.label} description={item.description} side="right">
                  <SidebarNavItem item={item} isCollapsed={isCollapsed} />
                </TooltipWrapper>
              ) : (
                <SidebarNavItem item={item} isCollapsed={isCollapsed} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
