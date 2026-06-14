import { z } from 'zod';

export const customerName = () => z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres');
export const customerCode = () => z.string().max(50, 'El código no puede exceder 50 caracteres');
export const customerContactName = () => z.string().max(100, 'El nombre de contacto no puede exceder 100 caracteres');
export const customerPhone = () => z.string().max(30, 'El teléfono no puede exceder 30 caracteres');
export const customerEmail = () => z.string().email('Email inválido').max(100, 'El email no puede exceder 100 caracteres').optional().or(z.literal(''));
export const customerAddress = () => z.string().max(300, 'La dirección no puede exceder 300 caracteres');
// Geo fields
export const customerProvince = () => z.string().max(100, 'La provincia no puede exceder 100 caracteres');
export const customerMunicipality = () => z.string().max(100, 'El municipio no puede exceder 100 caracteres');
export const customerStreet = () => z.string().max(200, 'La calle no puede exceder 200 caracteres');
export const customerLocality = () => z.string().max(100, 'La localidad no puede exceder 100 caracteres');
export const customerZipCode = () => z.string().max(20, 'El código postal no puede exceder 20 caracteres');
export const customerLatitude = () => z.coerce.number().min(-90).max(90);
export const customerLongitude = () => z.coerce.number().min(-180).max(180);
export const customerNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres');
