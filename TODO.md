# TODO - Persistencia IndexedDB

> Estado: **NO IMPLEMENTADA** - Código comentado en `src/infrastructure/storage/`

---

##Investigar Antes de Implementar

1. **¿Qué entidades persistir offline?**
   - Productos, categorías, almacenes, proveedores, clientes, monedas

2. **¿Qué operaciones ir al outbox?**
   - Crear/actualizar/eliminar entidades
   - Inventario (compras, ventas, ajustes, transferencias)

3. **Login** - siempre online (NO puede usar IndexedDB)

---

## Implementación (a futuro)

1. Descomentar código en `infrastructure/storage/db.ts`
2. Descomentar código en `infrastructure/storage/outbox.ts`
3. Descomentar código en `infrastructure/storage/SyncService.ts`
4. Modificar repositories para usar cache + outbox
5. Agregar UI de progreso/carga
6. Agregar UI de sync status

---

## Reglas

- Consulta: try API → fallback IndexedDB si offline
- Escritura: agregar al outbox si offline
- Auto-sync cada 30s cuando online