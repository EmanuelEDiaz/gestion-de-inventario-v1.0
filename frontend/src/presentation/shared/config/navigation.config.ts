/**
 * Configuración central de la navegación del sidebar.
 *
 * ¿Por qué un archivo .ts y no .md?
 * - Tipado estático: TypeScript valida que no falte ningún campo.
 * - Autocompletado en el IDE al referenciar iconKey o href.
 * - Sin parseo adicional: se importa directamente como módulo.
 * - Estándar en la comunidad React/Next.js (ver Linear, Vercel, etc.).
 *
 * Si necesitas documentación de los textos para revisión editorial,
 * crea un docs/contracts/navigation-copy.md complementario, pero el
 * runtime siempre consume este archivo.
 */

export type IconKey =
  | 'dashboard'
  | 'products'
  | 'warehouse'
  | 'stock'
  | 'movements'
  | 'category'
  | 'supplier'
  | 'customer'
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'adjustment'
  | 'returnDoc'
  | 'importData'
  | 'exportData'
  | 'report'
  | 'auditLog'
  | 'users'
  | 'roles'
  | 'currency'
  | 'exchangeRate'
  | 'settings';

export interface NavItemConfig {
  href: string;
  label: string;
  /** Descripción breve que aparece en el tooltip cuando el sidebar está colapsado. */
  description: string;
  iconKey: IconKey;
  requiredPermission?: string;
}

export interface NavSectionConfig {
  id: string;
  title: string;
  /** Descripción de la sección para el tooltip colapsado. */
  description: string;
  defaultOpen?: boolean;
  items: NavItemConfig[];
}

export const NAVIGATION_CONFIG: NavSectionConfig[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Resumen del estado del negocio en tiempo real',
    defaultOpen: true,
    items: [
      {
        href: '/dashboard',
        label: 'Panel de Control',
        description: 'Vista general con las métricas más importantes del negocio',
        iconKey: 'dashboard',
        requiredPermission: 'dashboard:read',
      },
    ],
  },
  {
    id: 'inventario',
    title: 'Inventario',
    description: 'Todo lo relacionado con tus productos y almacenes',
    defaultOpen: true,
    items: [
      { href: '/products',   label: 'Productos',   description: 'Consulta, agrega y edita los artículos del catálogo',              iconKey: 'products',  requiredPermission: 'products:read'  },
      { href: '/categories', label: 'Categorías',  description: 'Agrupa y clasifica tus productos por tipo o familia',               iconKey: 'category',  requiredPermission: 'categories:read'  },
      { href: '/warehouses', label: 'Almacenes',   description: 'Administra los puntos físicos donde guardas tu mercancía',          iconKey: 'warehouse', requiredPermission: 'warehouses:read'  },
      { href: '/stock',      label: 'Stock',       description: 'Consulta cuántas unidades hay disponibles de cada producto',        iconKey: 'stock',     requiredPermission: 'stock:read'  },
      { href: '/movements',  label: 'Movimientos', description: 'Historial completo de entradas y salidas de inventario',            iconKey: 'movements', requiredPermission: 'stock:read'  },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    description: 'Gestión de proveedores y clientes',
    defaultOpen: false,
    items: [
      { href: '/suppliers', label: 'Proveedores', description: 'Administra a quienes te suministran la mercancía',          iconKey: 'supplier', requiredPermission: 'suppliers:read' },
      { href: '/customers', label: 'Clientes',    description: 'Base de datos de clientes y su historial de compras',      iconKey: 'customer', requiredPermission: 'customers:read' },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    description: 'Registro de compras, ventas y movimientos de mercancía',
    defaultOpen: true,
    items: [
      { href: '/purchases',   label: 'Compras',        description: 'Registra la mercancía que recibes de tus proveedores',            iconKey: 'purchase',   requiredPermission: 'purchases:read'   },
      { href: '/sales',       label: 'Ventas',         description: 'Registra las ventas realizadas a tus clientes',                   iconKey: 'sale',       requiredPermission: 'sales:read'       },
      { href: '/transfers',   label: 'Transferencias', description: 'Mueve mercancía de un almacén a otro',                            iconKey: 'transfer',   requiredPermission: 'transfers:read'   },
      { href: '/adjustments', label: 'Ajustes',        description: 'Corrige el stock cuando hay diferencias con el inventario físico', iconKey: 'adjustment', requiredPermission: 'adjustments:read' },
      { href: '/returns',     label: 'Devoluciones',   description: 'Gestiona la mercancía devuelta por clientes o a proveedores',     iconKey: 'returnDoc',  requiredPermission: 'returns:read'      },
    ],
  },
  {
    id: 'datos',
    title: 'Datos',
    description: 'Carga masiva de información y descarga de reportes',
    defaultOpen: false,
    items: [
      { href: '/import',  label: 'Importar', description: 'Carga datos de manera masiva desde archivos CSV o Excel', iconKey: 'importData', requiredPermission: 'imports:create' },
      { href: '/export',  label: 'Exportar', description: 'Descarga información del sistema en distintos formatos',  iconKey: 'exportData', requiredPermission: 'exports:read' },
      { href: '/reports', label: 'Reportes', description: 'Consulta análisis y estadísticas de ventas e inventario', iconKey: 'report',     requiredPermission: 'reports:read' },
    ],
  },
  {
    id: 'sistema',
    title: 'Sistema',
    description: 'Configuración general, usuarios y monedas',
    defaultOpen: false,
    items: [
      { href: '/audit-log',      label: 'Auditoría',      description: 'Consulta el registro detallado de cambios en el sistema', iconKey: 'auditLog',    requiredPermission: 'audit:read'         },
      { href: '/users',          label: 'Usuarios',        description: 'Gestiona las cuentas y niveles de acceso al sistema',     iconKey: 'users',       requiredPermission: 'users:read'         },
      { href: '/roles',          label: 'Roles',           description: 'Gestiona los roles y permisos del sistema',                iconKey: 'roles',       requiredPermission: 'roles:read'         },
      { href: '/currencies',     label: 'Monedas',         description: 'Configura las monedas que acepta el sistema',             iconKey: 'currency',    requiredPermission: 'currencies:read'    },
      { href: '/exchange-rates', label: 'Tasas de Cambio', description: 'Define los valores de conversión entre monedas',          iconKey: 'exchangeRate', requiredPermission: 'exchange_rates:read' },
      { href: '/settings',       label: 'Configuración',   description: 'Ajusta las preferencias generales del sistema',           iconKey: 'settings',    requiredPermission: 'settings:read'      },
    ],
  },
];

export const sectionIconsMap: Record<IconKey, { section: string; icon: string }> = {
  dashboard:    { section: 'General',      icon: 'dashboard' },
  products:     { section: 'Inventario',   icon: 'products' },
  category:     { section: 'Inventario',   icon: 'category' },
  warehouse:    { section: 'Inventario',   icon: 'warehouse' },
  stock:        { section: 'Inventario',   icon: 'stock' },
  movements:    { section: 'Inventario',   icon: 'movements' },
  supplier:     { section: 'Comercial',    icon: 'supplier' },
  customer:     { section: 'Comercial',    icon: 'customer' },
  purchase:     { section: 'Operaciones',  icon: 'purchase' },
  sale:         { section: 'Operaciones',  icon: 'sale' },
  transfer:     { section: 'Operaciones',  icon: 'transfer' },
  adjustment:   { section: 'Operaciones',  icon: 'adjustment' },
  returnDoc:    { section: 'Operaciones',  icon: 'returnDoc' },
  importData:   { section: 'Datos',        icon: 'importData' },
  exportData:   { section: 'Datos',        icon: 'exportData' },
  report:       { section: 'Datos',        icon: 'report' },
  auditLog:     { section: 'Sistema',      icon: 'auditLog' },
  users:        { section: 'Sistema',      icon: 'users' },
  roles:        { section: 'Sistema',      icon: 'roles' },
  currency:     { section: 'Sistema',      icon: 'currency' },
  exchangeRate: { section: 'Sistema',      icon: 'exchangeRate' },
  settings:     { section: 'Sistema',      icon: 'settings' },
};
