import { z } from 'zod';

export const returnType = z.enum(['SALE_RETURN', 'PURCHASE_RETURN']);
export const returnWarehouseId = () => z.string().min(1, 'La bodega es requerida');
export const returnOriginalDocumentId = () => z.string().optional();
export const returnReason = () => z.string().max(500, 'La razón no puede exceder 500 caracteres').optional();
export const returnNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional();
export const returnDate = () => z.string().optional();

// Line fields
export const returnLineProductId = () => z.string().min(1, 'Producto requerido');
export const returnLineQuantity = () => z.coerce.number().min(1, 'La cantidad debe ser mayor a 0');
export const returnLineUnitPrice = () => z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0');
export const returnLineUnitCost = () => z.coerce.number().min(0, 'El costo unitario debe ser mayor o igual a 0').optional();
