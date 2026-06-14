import { z } from 'zod';

export const purchaseWarehouseId = () => z.string().min(1, 'La bodega es requerida');
export const purchaseSupplierId = () => z.string().optional();
export const purchaseCurrencyCode = () => z.string().length(3, 'La moneda debe tener 3 caracteres').optional();
export const purchaseNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional();
export const purchaseDate = () => z.string().optional();

// Line fields
export const purchaseLineProductId = () => z.string().min(1, 'Producto requerido');
export const purchaseLineQuantity = () => z.coerce.number().min(1, 'La cantidad debe ser mayor a 0');
export const purchaseLineUnitCost = () => z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0');
