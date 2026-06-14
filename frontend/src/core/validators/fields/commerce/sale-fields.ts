import { z } from 'zod';

export const saleWarehouseId = () => z.string().min(1, 'La bodega es requerida');
export const saleCustomerId = () => z.string().optional();
export const saleCurrencyCode = () => z.string().length(3, 'La moneda debe tener 3 caracteres').optional();
export const saleNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional();
export const saleDate = () => z.string().optional();
export const salePaymentMode = z.enum(['IMMEDIATE', 'CREDIT', 'RESERVE']).optional();

// Line fields
export const saleLineProductId = () => z.string().min(1, 'Producto requerido');
export const saleLineQuantity = () => z.coerce.number().min(1, 'La cantidad debe ser mayor a 0');
export const saleLineUnitPrice = () => z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0');
export const saleLineDiscount = () => z.coerce.number().min(0, 'El descuento debe ser mayor o igual a 0').optional();
