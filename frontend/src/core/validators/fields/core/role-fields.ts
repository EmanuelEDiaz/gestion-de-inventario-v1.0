import { z } from 'zod';

export const roleCode = () => z.string().min(1, 'El código es requerido').max(50, 'El código no puede exceder 50 caracteres').toUpperCase();
export const roleName = () => z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres');
export const roleDescription = () => z.string().max(500, 'La descripción no puede exceder 500 caracteres');
