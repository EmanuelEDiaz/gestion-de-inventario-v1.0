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
  | 'users'
  | 'currency'
  | 'exchangeRate'
  | 'settings';

export interface NavItemConfig {
  href: string;
  label: string;
  /** Descripción breve que aparece en el tooltip cuando el sidebar está colapsado. */
  description: string;
  iconKey: IconKey;
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
      },
    ],
  },
  {
    id: 'inventario',
    title: 'Inventario',
    description: 'Todo lo relacionado con tus productos y almacenes',
    defaultOpen: true,
    items: [
      { href: '/products',   label: 'Productos',   description: 'Consulta, agrega y edita los artículos del catálogo',              iconKey: 'products'  },
      { href: '/categories', label: 'Categorías',  description: 'Agrupa y clasifica tus productos por tipo o familia',               iconKey: 'category'  },
      { href: '/warehouses', label: 'Almacenes',   description: 'Administra los puntos físicos donde guardas tu mercancía',          iconKey: 'warehouse' },
      { href: '/stock',      label: 'Stock',       description: 'Consulta cuántas unidades hay disponibles de cada producto',        iconKey: 'stock'     },
      { href: '/movements',  label: 'Movimientos', description: 'Historial completo de entradas y salidas de inventario',            iconKey: 'movements' },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    description: 'Gestión de proveedores y clientes',
    defaultOpen: false,
    items: [
      { href: '/suppliers', label: 'Proveedores', description: 'Administra a quienes te suministran la mercancía',          iconKey: 'supplier' },
      { href: '/customers', label: 'Clientes',    description: 'Base de datos de clientes y su historial de compras',      iconKey: 'customer' },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    description: 'Registro de compras, ventas y movimientos de mercancía',
    defaultOpen: true,
    items: [
      { href: '/purchases',   label: 'Compras',        description: 'Registra la mercancía que recibes de tus proveedores',            iconKey: 'purchase'    },
      { href: '/sales',       label: 'Ventas',         description: 'Registra las ventas realizadas a tus clientes',                   iconKey: 'sale'        },
      { href: '/transfers',   label: 'Transferencias', description: 'Mueve mercancía de un almacén a otro',                            iconKey: 'transfer'    },
      { href: '/adjustments', label: 'Ajustes',        description: 'Corrige el stock cuando hay diferencias con el inventario físico', iconKey: 'adjustment'  },
      { href: '/returns',     label: 'Devoluciones',   description: 'Gestiona la mercancía devuelta por clientes o a proveedores',     iconKey: 'returnDoc'   },
    ],
  },
  {
    id: 'datos',
    title: 'Datos',
    description: 'Carga masiva de información y descarga de reportes',
    defaultOpen: false,
    items: [
      { href: '/import',  label: 'Importar', description: 'Carga datos de manera masiva desde archivos CSV o Excel', iconKey: 'importData' },
      { href: '/export',  label: 'Exportar', description: 'Descarga información del sistema en distintos formatos',  iconKey: 'exportData' },
      { href: '/reports', label: 'Reportes', description: 'Consulta análisis y estadísticas de ventas e inventario', iconKey: 'report'     },
    ],
  },
  {
    id: 'sistema',
    title: 'Sistema',
    description: 'Configuración general, usuarios y monedas',
    defaultOpen: false,
    items: [
      { href: '/users',          label: 'Usuarios',        description: 'Gestiona las cuentas y niveles de acceso al sistema', iconKey: 'users'        },
      { href: '/currencies',     label: 'Monedas',         description: 'Configura las monedas que acepta el sistema',         iconKey: 'currency'     },
      { href: '/exchange-rates', label: 'Tasas de Cambio', description: 'Define los valores de conversión entre monedas',      iconKey: 'exchangeRate' },
      { href: '/settings',       label: 'Configuración',   description: 'Ajusta las preferencias generales del sistema',       iconKey: 'settings'     },
    ],
  },
];
