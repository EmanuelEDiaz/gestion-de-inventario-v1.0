import { z } from 'zod';

export const warehouseCode = () => z.string().min(1, 'El código es requerido').max(20, 'El código no puede exceder 20 caracteres');
export const warehouseName = () => z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres');
export const warehouseAddress = () => z.string().max(500, 'La dirección no puede exceder 500 caracteres');
