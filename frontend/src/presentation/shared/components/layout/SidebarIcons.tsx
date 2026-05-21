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
  AdminPanelSettings,
} from '@material-symbols-svg/react';

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
  roles: <AdminPanelSettings {...iconProps} />,
  currency: <Payments {...iconProps} />,
  exchangeRate: <CurrencyExchange {...iconProps} />,
  importData: <UploadFile {...iconProps} />,
  exportData: <Download {...iconProps} />,
};

export const sectionIcons: Record<string, { closed: React.ReactNode; open: React.ReactNode }> = {
  general:    { closed: <Dashboard {...iconProps} />,     open: <DashboardFill {...iconProps} /> },
  inventario: { closed: <Inventory2 {...iconProps} />,    open: <Inventory2Fill {...iconProps} /> },
  comercial:  { closed: <Storefront {...iconProps} />,    open: <StorefrontFill {...iconProps} /> },
  operaciones:{ closed: <LocalShipping {...iconProps} />, open: <LocalShippingFill {...iconProps} /> },
  datos:      { closed: <Storage {...iconProps} />,       open: <StorageFill {...iconProps} /> },
  sistema:    { closed: <Settings {...iconProps} />,      open: <SettingsFill {...iconProps} /> },
};

export const fallbackIcon = { closed: <Inventory2 {...iconProps} />, open: <Inventory2Fill {...iconProps} /> };
