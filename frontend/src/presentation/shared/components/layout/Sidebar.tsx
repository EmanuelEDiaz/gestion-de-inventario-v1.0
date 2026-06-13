'use client';

import type { NavSection } from '@/presentation/shared/hooks/ui/useSidebarSections';
import { cn } from '@/presentation/shared/lib/utils';
import { SidebarSection } from './SidebarSection';
import { SidebarCollapseButton } from './SidebarCollapseButton';
import { sectionIcons, fallbackIcon } from './SidebarIcons';

interface SidebarProps {
  sections: NavSection[];
  isCollapsed?: boolean;
  onToggle: () => void;
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  disabled?: boolean;
}

export { Icons } from './SidebarIcons';

export function Sidebar({ sections, isCollapsed = false, onToggle, openSections, onToggleSection, disabled }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gray-900 text-white transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        {!isCollapsed && (
          <span className="text-xl font-bold">Inventario</span>
        )}
        <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={onToggle} />
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {sections.map((section) => {
            const icons = sectionIcons[section.id] ?? fallbackIcon;
            const isOpen = openSections[section.id] ?? false;
            return (
              <SidebarSection
                key={section.id}
                title={section.title}
                description={section.description}
                icon={icons.closed}
                iconOpen={icons.open}
                items={section.items}
                isOpen={isOpen}
                isCollapsed={isCollapsed}
                onToggle={() => onToggleSection(section.id)}
                disabled={disabled}
              />
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
