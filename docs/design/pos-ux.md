# POS UX — Punto de Venta

## 1. Navegación Admin ↔ POS

### Redirección post-login
| Rol | Destino |
|-----|---------|
| SELLER | `/pos` |
| MANAGER | `/admin/dashboard` |
| ADMIN | `/admin/dashboard` |

### Icono de cambio de modo

**En `/pos` (modo ventas):**
- Icono 🛡 en la esquina superior derecha del header
- Solo visible si el usuario tiene rol `MANAGER` o `ADMIN`
- Tooltip: _"Ir a administración"_
- Acción: navega a `/admin/dashboard`
- Si el usuario es `SELLER`: el icono está oculto (no en el DOM, no solo invisible)

**En `/admin` (modo administración):**
- Icono 🛒 en la esquina superior derecha del header
- Visible para todos los roles autenticados
- Tooltip: _"Ir al punto de venta"_
- Acción: navega a `/pos`

---

## 2. Layout del POS

### Diseño mobile-first

```
┌─────────────────────────────────────┐
│ [🛒 Inventario]          [🛡][👤]   │  ← header
├─────────────────────────────────────┤
│ 🔍 [Buscar producto o escanear...] │  ← buscador siempre visible
├─────────────────────────────────────┤
│                                     │
│  [📦 Arroz 5kg  $5]  [🥛 Leche $6] │
│  [🫙 Aceite  $8] [🍚 Frijoles $4]  │  ← grid de productos
│  [     Cargar más...              ] │
│                                     │
├─────────────────────────────────────┤
│ 🛒 Carrito (2 ítems)                │
│  Arroz 5kg    ×1    = $5.00   [✕]  │
│  Leche        ×2    = $12.00  [✕]  │
│                                     │
│  Subtotal: $17.00                   │
│  [💰 COBRAR $17.00]  [Fiar ▼]      │  ← botones principales
└─────────────────────────────────────┘
```

### Reglas de layout
- El carrito y el botón COBRAR siempre están visibles en la parte inferior (sticky)
- El grid de productos ocupa el espacio restante con scroll
- En desktop: grid 2-3 columnas | En móvil: grid 2 columnas
- Tamaño mínimo de botón: 44×44px (accesibilidad táctil)

---

## 3. Flujo de Venta en 2 Toques

### Toque 1 — Seleccionar producto
- **Opción A**: escribir nombre/SKU en el buscador → debounce 300ms → aparecen resultados → toca el producto
- **Opción B**: tocar directamente en el grid de productos frecuentes
- Al tocar → agrega ×1 al carrito
- Long-press (600ms) → abre panel de cantidad: `[-] [cantidad] [+]` con teclado numérico

### Toque 2 — COBRAR (paymentMode = IMMEDIATE)
1. Usuario toca **COBRAR**
2. Aparece hoja inferior (bottom sheet) de confirmación:
   ```
   ┌──────────────────────────────┐
   │ Confirmar venta              │
   │ 2 productos · Total: $17.00  │
   │ Almacén: Principal           │
   │ Pago: Efectivo               │
   │                              │
   │ [Cancelar]  [✓ Confirmar]   │
   └──────────────────────────────┘
   ```
3. Toca Confirmar → venta procesada
4. Muestra recibo (bottom sheet o pantalla completa):
   - Número de venta, ítems, total, fecha
   - Botón **"Nueva venta"** → limpia carrito
   - Botón **"Compartir recibo"** (opcional)

### Flujo de Fiado (paymentMode = CREDIT o RESERVE)
1. Usuario toca **Fiar ▼** → dropdown: [Crédito (CREDIT)] [Reserva (RESERVE)]
2. Selecciona modo → aparece buscador de clientes (obligatorio)
3. Selecciona cliente → el botón COBRAR cambia a **FIAR** con el nombre del cliente
4. Toca FIAR → confirmación:
   ```
   ┌──────────────────────────────┐
   │ Venta fiada a: Juan García   │
   │ Total: $17.00                │
   │ Modo: Crédito                │
   │                              │
   │ [Cancelar]  [✓ Confirmar]   │
   └──────────────────────────────┘
   ```
5. Confirma → venta registrada + deuda creada

---

## 4. Acciones en el Carrito

| Acción | Gesto / UI |
|--------|-----------|
| Agregar producto | Toque en producto del grid |
| Aumentar cantidad | Toque [+] en la línea del carrito |
| Disminuir cantidad | Toque [-] (si llega a 0 → elimina la línea) |
| Editar cantidad exacta | Toque sobre el número de cantidad |
| Eliminar línea | Toque [✕] o swipe-left en la línea |
| Limpiar todo | Botón 🗑 en el header del carrito (pide confirmación) |
| Agregar descuento por línea | Long-press sobre el precio de la línea |

---

## 5. Buscador POS

- Placeholder: _"Buscar por nombre, SKU o código de barras..."_
- Tooltip: _"Escribe el nombre del producto o escanea su código de barras"_
- Debounce: 300ms (configurable en DisplaySettings)
- Búsqueda en IndexedDB cuando offline, en API cuando online
- Al escribir un código de barras completo → selecciona automáticamente sin pulsar Enter
- Historial de búsquedas recientes (últimas 5, guardado en localStorage)

---

## 6. Offline en el POS

Cuando el dispositivo está offline:
- Badge rojo "Sin conexión" en el header
- Las ventas se encolan en el outbox con `isOfflineCreated = false` (los productos ya existen)
- El stock en IndexedDB se descuenta optimistamente
- Al reconectar → sync automático
- Si hay conflicto de stock → muestra incidencia con opciones FORGET_SALE / CHANGE_PRODUCT

---

## 7. POS — Reglas de Negocio

- `customerId` es completamente opcional para `paymentMode = IMMEDIATE`
- `barcode` en las líneas es opcional (solo si el producto fue buscado por barcode)
- Si no hay stock suficiente en IndexedDB → advertencia: _"Stock insuficiente. Solo quedan X unidades."_ (no bloquea, solo advierte — el servidor es el árbitro final)
- Descuentos por línea: número entre 0 y 100 (porcentaje)
- La venta IMMEDIATE se confirma directamente (no pasa por DRAFT)
- Cuando `paymentMode = CREDIT` o `RESERVE`, el campo `customerId` es **obligatorio** — el botón FIAR no se activa hasta seleccionar cliente
