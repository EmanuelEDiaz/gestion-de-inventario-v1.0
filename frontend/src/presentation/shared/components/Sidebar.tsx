'use client';

import type { NavSection } from '../hooks/useSidebarSections';
import { cn } from '@/presentation/shared/lib/utils';
import { SidebarSection } from './SidebarSection';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import {
  Dashboard, DashboardFill,
  Inventory2, Inventory2Fill,
  Storefront, StorefrontFill,
  LocalShipping, LocalShippingFill,
  Storage, StorageFill,
  Settings, SettingsFill,
  ShoppingCart, ShoppingBag,
  SwapHoriz, TrendingUp, BarChart, EditNote,
  Person, Payments, UploadFile, Download,
  Menu, Logout, Groups, Category, Factory, Close,
  Folder, FolderOpen,
  Warehouse,
  AssignmentReturn,
  Inventory,
  SupervisorAccount,
  CurrencyExchange,
} from '@material-symbols-svg/react';

interface SidebarProps {
  sections: NavSection[];
  isCollapsed?: boolean;
  onToggle: () => void;
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
}

const iconProps = { width: 20, height: 20, className: 'text-white' };

export const Icons = {
  folder: <Folder {...iconProps} />,
  folderOpen: <FolderOpen {...iconProps} />,
  dashboard: <Dashboard {...iconProps} />,
  products: <Inventory2 {...iconProps} />,
  warehouse: <Warehouse {...iconProps} />,
  purchase: <ShoppingCart {...iconProps} />,
  sale: <ShoppingBag {...iconProps} />,
  transfer: <SwapHoriz {...iconProps} />,
  adjustment: <EditNote {...iconProps} />,
  report: <BarChart {...iconProps} />,
  settings: <Settings {...iconProps} />,
  menu: <Menu {...iconProps} />,
  close: <Close {...iconProps} />,
  logout: <Logout {...iconProps} />,
  user: <Person {...iconProps} />,
  category: <Category {...iconProps} />,
  supplier: <Factory {...iconProps} />,
  customer: <Groups {...iconProps} />,
  returnDoc: <AssignmentReturn {...iconProps} />,
  stock: <Inventory {...iconProps} />,
  movements: <TrendingUp {...iconProps} />,
  users: <SupervisorAccount {...iconProps} />,
  currency: <Payments {...iconProps} />,
  exchangeRate: <CurrencyExchange {...iconProps} />,
  importData: <UploadFile {...iconProps} />,
  exportData: <Download {...iconProps} />,
};

const sectionIcons: Record<string, { closed: React.ReactNode; open: React.ReactNode }> = {
  general:    { closed: <Dashboard {...iconProps} />,     open: <DashboardFill {...iconProps} /> },
  inventario: { closed: <Inventory2 {...iconProps} />,    open: <Inventory2Fill {...iconProps} /> },
  comercial:  { closed: <Storefront {...iconProps} />,    open: <StorefrontFill {...iconProps} /> },
  operaciones:{ closed: <LocalShipping {...iconProps} />, open: <LocalShippingFill {...iconProps} /> },
  datos:      { closed: <Storage {...iconProps} />,       open: <StorageFill {...iconProps} /> },
  sistema:    { closed: <Settings {...iconProps} />,      open: <SettingsFill {...iconProps} /> },
};

const fallbackIcon = { closed: <Inventory2 {...iconProps} />, open: <Inventory2Fill {...iconProps} /> };

export function Sidebar({ sections, isCollapsed = false, onToggle, openSections, onToggleSection }: SidebarProps) {
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
        <TooltipWrapper content={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}>
          <button
            onClick={onToggle}
            className="rounded p-1 hover:bg-gray-800"
          >
            {isCollapsed ? Icons.menu : Icons.close}
          </button>
        </TooltipWrapper>
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
              />
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
