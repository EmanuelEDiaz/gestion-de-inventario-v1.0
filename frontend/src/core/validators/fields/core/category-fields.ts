import { z } from 'zod';

export const categoryName = () => z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres');
export const categorySortOrder = () => z.coerce.number().int('Debe ser un número entero').min(0, 'Debe ser mayor o igual a 0');
