'use client';

import { cn } from '@/presentation/shared/lib/utils';
import { SidebarSection } from './SidebarSection';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import type { NavSection } from '../hooks/useSidebarSections';

import {
  Dashboard,
  Inventory2,
  Storefront,
  LocalShipping,
  Storage,
  Settings,
  ShoppingCart,
  ShoppingBag,
  SwapHoriz,
  TrendingUp,
  BarChart,
  EditNote,
  Person,
  Payments,
  UploadFile,
  Download,
  Menu,
  Logout,
  Groups,
  Category,
  Factory,
  Close,
} from '@material-symbols-svg/react';

const iconProps = { width: 20, height: 20 };

const Folder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const FolderOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 14 1.5-2.9A2 2 0 0 1 9.8 10l2.3-2.8a2 2 0 0 1 3.6 0l2.3 2.8a2 2 0 0 1 1.7 1.1"/>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const Warehouse = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
    <path d="M6 18h12"/>
    <path d="M6 14h12"/>
    <rect width="12" height="12" x="6" y="10"/>
  </svg>
);

const AssignmentReturn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4"/>
    <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
  </svg>
);

const Inventory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20"/>
    <path d="M5 20V10l7-7 7 7v10"/>
    <path d="M9 20v-4h6v4"/>
  </svg>
);

const SupervisorAccount = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const CurrencyExchange = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5"/>
    <path d="M8 3H3v5"/>
    <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
    <path d="m15 9 6-6"/>
  </svg>
);

export const Icons = {
  folder: <Folder />,
  folderOpen: <FolderOpen />,
  chevronDown: ChevronDownIcon,
  dashboard: <Dashboard {...iconProps} />,
  products: <Inventory2 {...iconProps} />,
  warehouse: <Warehouse />,
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
  returnDoc: <AssignmentReturn />,
  stock: <Inventory />,
  movements: <TrendingUp {...iconProps} />,
  users: <SupervisorAccount />,
  currency: <Payments {...iconProps} />,
  exchangeRate: <CurrencyExchange />,
  importData: <UploadFile {...iconProps} />,
  exportData: <Download {...iconProps} />,
};

const sectionIcons: Record<string, { closed: React.ReactNode; open: React.ReactNode }> = {
  general: { 
    closed: <Dashboard fill {...iconProps} />, 
    open: <Dashboard {...iconProps} /> 
  },
  inventario: { 
    closed: <Inventory2 fill {...iconProps} />, 
    open: <Inventory2 {...iconProps} /> 
  },
  comercial: { 
    closed: <Storefront fill {...iconProps} />, 
    open: <Storefront {...iconProps} /> 
  },
  operaciones: { 
    closed: <LocalShipping fill {...iconProps} />, 
    open: <LocalShipping {...iconProps} /> 
  },
  datos: { 
    closed: <Storage fill {...iconProps} />, 
    open: <Storage {...iconProps} /> 
  },
  sistema: { 
    closed: <Settings fill {...iconProps} />, 
    open: <Settings {...iconProps} /> 
  },
};

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
            const icons = sectionIcons[section.id] || { closed: <Inventory2 {...iconProps} />, open: <Inventory2 {...iconProps} /> };
            const isOpen = openSections[section.id] ?? false;
            return (
              <SidebarSection
                key={section.id}
                title={section.title}
                icon={isCollapsed ? undefined : icons.closed}
                iconOpen={isCollapsed ? undefined : icons.open}
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
