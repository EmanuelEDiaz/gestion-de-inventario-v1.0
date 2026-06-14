import { z } from 'zod';

export const transferFromWarehouseId = () => z.string().min(1, 'La bodega origen es requerida');
export const transferToWarehouseId = () => z.string().min(1, 'La bodega destino es requerida');
export const transferNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional();
export const transferDate = () => z.string().optional();

// Line fields
export const transferLineProductId = () => z.string().min(1, 'Producto requerido');
export const transferLineQuantity = () => z.coerce.number().min(1, 'La cantidad debe ser mayor a 0');
