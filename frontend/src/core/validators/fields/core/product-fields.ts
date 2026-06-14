import { z } from 'zod';

export const productName = () => z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres');
export const productSku = () => z.string().max(50, 'El SKU no puede exceder 50 caracteres');
export const productBarcode = () => z.string().max(50, 'El código de barras no puede exceder 50 caracteres');
export const productDescription = () => z.string().max(2000, 'La descripción no puede exceder 2000 caracteres');
export const productStandardCost = () => z.coerce.number().min(0, 'Debe ser mayor o igual a 0');
export const productSalePrice = () => z.coerce.number().min(0, 'Debe ser mayor o igual a 0');
export const productTaxRate = () => z.coerce.number().min(0, 'Debe ser mayor o igual a 0').max(100, 'No puede exceder 100%');
export const productReorderPoint = () => z.coerce.number().min(0, 'Debe ser mayor o igual a 0');

export const unitOfMeasure = z.enum(['UNIT', 'KG', 'L', 'M', 'M2', 'BOX', 'PACK']);
export const productStatus = z.enum(['ACTIVE', 'ARCHIVED']);
export const costMethod = z.enum(['INHERIT', 'STANDARD', 'WAC', 'FIFO']);
