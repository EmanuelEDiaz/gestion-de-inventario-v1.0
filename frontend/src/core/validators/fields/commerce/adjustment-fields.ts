import { z } from 'zod';

export const adjustmentWarehouseId = () => z.string().min(1, 'La bodega es requerida');
export const adjustmentType = z.enum(['COUNT', 'DAMAGE', 'LOSS', 'FOUND', 'CORRECTION', 'OTHER']);
export const adjustmentReason = () => z.string().max(500, 'La razón no puede exceder 500 caracteres').optional();
export const adjustmentNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional();
export const adjustmentDate = () => z.string().optional();

// Line fields
export const adjustmentLineProductId = () => z.string().min(1, 'Producto requerido');
export const adjustmentLineSystemQty = () => z.coerce.number().min(0, 'La cantidad del sistema debe ser mayor o igual a 0');
export const adjustmentLineCountedQty = () => z.coerce.number().min(0, 'La cantidad contada debe ser mayor o igual a 0');
export const adjustmentLineUnitCost = () => z.coerce.number().min(0, 'El costo unitario debe ser mayor o igual a 0').optional();
