import {
  Dashboard, Inventory2, Category, Warehouse, Inventory,
  ShoppingBag, ShoppingCart, SwapHoriz, EditNote,
  AssignmentReturn, Factory, Groups, Settings,
  BarChart, UploadFile, History, SupervisorAccount,
  AdminPanelSettings, CurrencyExchange,
} from '@material-symbols-svg/react';
import type { ReactNode } from 'react';

const iconProps = { width: 20, height: 20, className: 'text-gray-600' };

export const PERMISSION_CATEGORY_META: Record<string, { label: string; icon: ReactNode }> = {
  dashboard:       { label: 'Panel de Control',  icon: <Dashboard {...iconProps} /> },
  users:          { label: 'Usuarios',           icon: <SupervisorAccount {...iconProps} /> },
  roles:          { label: 'Roles',              icon: <AdminPanelSettings {...iconProps} /> },
  products:       { label: 'Productos',          icon: <Inventory2 {...iconProps} /> },
  categories:     { label: 'Categorías',         icon: <Category {...iconProps} /> },
  warehouses:     { label: 'Almacenes',          icon: <Warehouse {...iconProps} /> },
  stock:          { label: 'Stock',              icon: <Inventory {...iconProps} /> },
  sales:          { label: 'Ventas',             icon: <ShoppingBag {...iconProps} /> },
  purchases:      { label: 'Compras',            icon: <ShoppingCart {...iconProps} /> },
  transfers:      { label: 'Transferencias',     icon: <SwapHoriz {...iconProps} /> },
  adjustments:    { label: 'Ajustes',            icon: <EditNote {...iconProps} /> },
  returns:        { label: 'Devoluciones',       icon: <AssignmentReturn {...iconProps} /> },
  suppliers:      { label: 'Proveedores',        icon: <Factory {...iconProps} /> },
  customers:      { label: 'Clientes',           icon: <Groups {...iconProps} /> },
  currencies:     { label: 'Monedas',            icon: <CurrencyExchange {...iconProps} /> },
  exchange_rates: { label: 'Tasas de Cambio',    icon: <CurrencyExchange {...iconProps} /> },
  settings:       { label: 'Configuración',      icon: <Settings {...iconProps} /> },
  reports:        { label: 'Reportes',           icon: <BarChart {...iconProps} /> },
  exports:        { label: 'Exportaciones',      icon: <UploadFile {...iconProps} /> },
  imports:        { label: 'Importaciones',      icon: <UploadFile {...iconProps} /> },
  audit:          { label: 'Auditoría',          icon: <History {...iconProps} /> },
};
