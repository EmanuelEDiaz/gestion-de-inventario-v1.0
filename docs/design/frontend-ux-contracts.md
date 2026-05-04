# Frontend UX Contracts

Contratos de comportamiento de la interfaz de usuario que aplican a **toda** la aplicación.
Estos contratos son obligatorios para todos los módulos (admin y POS).

---

## 1. Sistema de Tooltips Universal

### Regla
Todo elemento interactivo (botón, icono, input, celda de tabla con acción, control de carrusel) **DEBE** tener un tooltip.

### Comportamiento
| Plataforma | Trigger | Delay |
|-----------|---------|-------|
| Desktop | hover del mouse | 500ms |
| Móvil/Táctil | long-press (mantener dedo) | 600ms |

### Implementación (componente)
```tsx
// presentation/shared/components/ui/Tooltip.tsx
interface TooltipProps {
  tip: string          // texto del tooltip — conciso y descriptivo
  side?: 'top' | 'bottom' | 'left' | 'right'  // default: 'bottom'
  children: ReactNode
}

// Uso:
<Tooltip tip="Agregar nuevo producto al catálogo">
  <Button>+</Button>
</Tooltip>

<Tooltip tip="Código único del producto. Déjalo vacío para generarlo automáticamente.">
  <Input name="sku" />
</Tooltip>
```

### Hook
```typescript
// presentation/shared/hooks/useTooltip.ts
// Gestiona el timer del long-press para dispositivos táctiles
export function useTooltip(delay = 600) {
  // retorna: { tooltipProps, isVisible }
}
```

### Estilos
- `z-index: 50`
- `max-width: 200px`
- Centrado sobre el elemento
- Fondo oscuro, texto blanco, bordes redondeados
- Animación de entrada: fade 150ms

### Ejemplos de textos estándar
| Elemento | Texto del tooltip |
|---------|-----------------|
| Botón "+" en tabla | "Agregar nuevo {entidad}" |
| Icono 🛡 en POS | "Ir a administración (solo admin)" |
| Icono 🛒 en admin | "Ir al punto de venta" |
| Campo SKU | "Código único del producto. Opcional — se genera si se deja vacío" |
| Campo barcode | "Código de barras. Opcional — para escaneo futuro" |
| Columna stock | "Unidades disponibles en este almacén" |
| Botón COBRAR | "Confirmar y procesar esta venta" |
| Botón Fiar | "Registrar como venta a crédito o reserva" |
| Icono de imagen en tabla | "Ver imágenes de este {entidad}" |
| Botón sync | "Sincronizar cambios pendientes con el servidor" |

---

## 2. Validación de Formularios

### Librería
- **react-hook-form** para gestión de estado del formulario
- **zod** para el esquema de validación

### Comportamiento visual
| Estado | Borde | Fondo | Mensaje |
|--------|-------|-------|---------|
| Normal | `--border` | transparente | — |
| Enfocado | `--ring` (azul) | transparente | — |
| Error (post-blur) | `--destructive` (rojo) | rojo tenue | ⚠ mensaje debajo |
| Válido (post-submit) | `--border` | transparente | — |

### Cuándo validar
- `onBlur`: al salir del campo (valida ese campo específico)
- `onSubmit`: valida todos los campos
- **NO** validar mientras el usuario escribe (`onChange`) — evita frustración

### Componente
```tsx
// presentation/shared/components/ui/ValidatedField.tsx
interface ValidatedFieldProps {
  name: string
  label: string
  tooltip?: string
  error?: string          // mensaje de error de react-hook-form
  required?: boolean      // muestra * junto al label
  children: ReactNode     // el input/select/etc
}

// Renderiza:
// [Label] (*si required)
// [Tooltip > children]
// [⚠ mensaje de error] (solo si error != null)
```

### Ejemplos de mensajes de error estándar
| Campo | Mensaje |
|-------|---------|
| name (vacío) | "El nombre es obligatorio" |
| sku (duplicado) | "Este SKU ya existe. Usa uno diferente o déjalo vacío para generarlo automáticamente" |
| price (negativo) | "El precio debe ser mayor que cero" |
| email (mal formato) | "Ingresa un email válido, por ejemplo: ejemplo@correo.com" |
| amount > remaining | "El monto no puede superar la deuda restante de $X.XX" |
| customerId (requerido en fiar) | "Debes seleccionar un cliente para registrar una venta fiada" |
| file size | "El archivo es demasiado grande. El máximo es {N} MiB" |
| file type | "Solo se aceptan imágenes JPG, PNG o WebP" |

---

## 3. Búsqueda con Debounce y Filtros

### Componente
```tsx
// presentation/shared/components/ui/SearchBar.tsx
interface SearchBarProps {
  placeholder: string
  tooltip: string
  debounceMs?: number         // default: de DisplaySettings (300ms)
  onSearch: (value: string) => void
  filters?: FilterConfig
  activeFilters?: ActiveFilter[]
  onFilterChange?: (filters: ActiveFilter[]) => void
}
```

### Comportamiento
1. Buscador siempre visible en la parte superior de cada módulo
2. Filtros: botón "Filtros ▼" que expande panel debajo del buscador
3. Filtros activos: chips `[nombre del filtro ×]` debajo del buscador para quitar fácilmente
4. Cualquier cambio (búsqueda o filtro) → resetea a página 1
5. Offline: busca en IndexedDB; Online: busca en API
6. Al limpiar el buscador → vuelve al estado sin filtro de búsqueda (manteniendo filtros de panel)

### Filtros disponibles por módulo

**Productos:**
- Categoría (select de árbol)
- Estado: Activo / Archivado
- Precio mínimo / Precio máximo
- Solo con stock bajo

**Clientes:**
- Solo activos (toggle)
- Con deuda pendiente (toggle)

**Proveedores:**
- Solo activos (toggle)
- Red social (select: WHATSAPP, TELEGRAM, etc.)
- Con productos vinculados (toggle)

**Ventas:**
- Almacén (select)
- Estado (multi-select: DRAFT / CONFIRMED / RESERVED / DELIVERED / CANCELLED)
- Modo de pago (multi-select: IMMEDIATE / CREDIT / RESERVE)
- Desde / Hasta (date pickers)

**Compras:**
- Almacén (select)
- Proveedor (buscador)
- Estado (multi-select)
- Desde / Hasta (date pickers)

**Deudas:**
- Estado (multi-select: PENDING / PARTIAL / PAID / CANCELLED)
- Vencen antes de (date picker)

**Movimientos:**
- Tipo (multi-select: PURCHASE / SALE / ADJUSTMENT / TRANSFER / RETURN)
- Almacén (select)
- Desde / Hasta (date pickers)

**Notificaciones:**
- Solo no leídas (toggle)
- Categoría (select)

**Incidencias:**
- Tipo (multi-select)
- Entidad (select)
- Estado (multi-select)

---

## 4. Paginación Universal

### Componente
```tsx
// presentation/shared/components/ui/DataTable.tsx
// Tabla universal con paginación, thumbnails y búsqueda integrada
```

### Comportamiento
- Default: 20 registros por página
- Opciones de tamaño: 10 / 20 / 50 / 100
- La URL refleja la paginación: `?page=2&size=20` → al recargar o volver, restaura la misma página
- Al filtrar/buscar → resetea siempre a página 1

### Header de tabla
```
Mostrando 21-40 de 245 productos        [20 ▼] por página
```

### Footer (desktop)
```
← Anterior  1  2  [3]  4  5  …  13  Siguiente →
```

### Footer (móvil)
```
← Página 3 de 13 →
```

---

## 5. Imágenes: Thumbnail en Tabla + Carrusel en Detalle

### Thumbnail en tablas

| Entidad | Forma | Tamaño |
|---------|-------|--------|
| Usuarios | Circular | 32×32px |
| Clientes | Circular | 32×32px |
| Proveedores | Circular | 32×32px |
| Productos | Cuadrado redondeado | 40×40px |

- `loading="lazy"` en todos los thumbnails
- Si no tiene imagen: placeholder con inicial del nombre (fondo de color generado del ID)
- Tooltip: _"Ver imágenes de este {entidad}"_
- Al hacer clic en el thumbnail → navega a la vista detalle de la entidad

### Carrusel en vista detalle

```
┌──────────────────────────────┐
│                              │
│   [imagen principal grande]  │
│                              │
│  ← [🖼] [🖼] [🖼] [🖼] →    │  ← miniaturas navegables
│       ● ○ ○ ○               │  ← indicador de posición
├──────────────────────────────┤
│ [+ Agregar] [★ Principal] [✕ Eliminar] │
└──────────────────────────────┘
```

- En móvil: swipe horizontal para cambiar imagen
- Con teclado: ←/→ para navegar
- Alt text: `"{nombre} — imagen {n} de {total}"`
- Si hay 0 imágenes: placeholder grande con botón _"Agregar primera imagen"_
- Botón "Hacer principal" solo activo cuando la imagen mostrada no es la principal
- Botón "Eliminar" pide confirmación: _"¿Eliminar esta imagen? Esta acción no se puede deshacer."_

---

## 6. Configuración de Pantalla (DisplaySettings)

### Almacenamiento
- `localStorage` key: `display_settings`
- Disponible inmediatamente al cargar la app (antes de autenticación)
- No requiere endpoint de backend

### Configuración disponible

**Tamaño de texto:**
```
[A-]   [A]    [A+]   [A++]
85%   100%   115%   130%
```

**Tema:**
```
[☀ Claro]  [🌙 Oscuro]  [💻 Sistema]
```

**Velocidad de búsqueda (debounce):**
```
[Rápida 150ms]  [Normal 300ms]  [Lenta 500ms]
```

**Barra de sync:**
```
[○ Oculta]  [● Visible]
```

### Implementación CSS
```css
/* En globals.css */
:root { --font-scale: 1; }
html { font-size: calc(16px * var(--font-scale)); }
/* Todos los tamaños en rem escalan automáticamente */
```

```typescript
// Al cambiar fontScale:
document.documentElement.style.setProperty('--font-scale', String(scale))
localStorage.setItem('display_settings', JSON.stringify(settings))
```

> El cambio de tamaño de fuente es **instantáneo**, sin recarga de página.

### Ubicación en la UI
- Accesible desde: icono ⚙ en el header → "Configuración de pantalla"
- También en: `/admin/settings` → pestaña "Pantalla"

---

## 7. Smart Defaults (Autocompletado de Formularios)

Los formularios de creación pre-llenan campos con la información más probable. Los datos vienen de IndexedDB o localStorage (sin petición al servidor).

### Hook
```typescript
// presentation/shared/hooks/useSmartDefaults.ts
export function useSmartDefaults(entityType: 'product' | 'sale' | 'purchase' | 'customer' | 'supplier')
  : { defaults: Partial<CreateData> }
```

### Defaults por entidad

| Entidad | Campo | Fuente del default |
|---------|-------|-------------------|
| Producto | moneda | `app_settings.defaultCurrencyCode` de IndexedDB |
| Producto | método de costo | `app_settings.defaultCostMethod` de IndexedDB |
| Producto | categoría | última categoría usada (localStorage `last_used_categoryId`) |
| Compra | almacén | último almacén usado (localStorage `last_used_warehouseId`) |
| Compra | moneda | moneda del proveedor seleccionado |
| Compra | costo unitario | último precio de ese producto a ese proveedor (IndexedDB) |
| Venta POS | almacén | último almacén del usuario (localStorage) |
| Venta POS | precio unitario | `product.salePrice` del catálogo (IndexedDB) |
| Venta POS | moneda | `app_settings.defaultCurrencyCode` de IndexedDB |

### Actualización de defaults
Después de cada operación exitosa, se guarda en localStorage:
```typescript
localStorage.setItem('last_used_warehouseId', warehouseId)
localStorage.setItem('last_used_categoryId', categoryId)
// etc.
```
