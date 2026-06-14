import { z } from 'zod';

export const currencyCode = () => z.string().length(3, 'El código ISO debe tener exactamente 3 caracteres').toUpperCase();
export const currencyName = () => z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres');
export const currencySymbol = () => z.string().min(1, 'El símbolo es requerido').max(10, 'El símbolo no puede exceder 10 caracteres');
