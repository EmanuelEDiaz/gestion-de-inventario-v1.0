'use client';

import { Menu, Close } from '@material-symbols-svg/react';
import { TooltipWrapper } from '@/presentation/shared/components/ui';

interface SidebarCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SidebarCollapseButton({ isCollapsed, onToggle }: SidebarCollapseButtonProps) {
  return (
    <TooltipWrapper content={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}>
      <button
        onClick={onToggle}
        className="rounded p-1 hover:bg-gray-800"
      >
        {isCollapsed
          ? <Menu width={20} height={20} className="text-white" />
          : <Close width={20} height={20} className="text-white" />}
      </button>
    </TooltipWrapper>
  );
}
