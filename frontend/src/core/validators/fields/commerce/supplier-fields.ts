import { z } from 'zod';

export const supplierName = () => z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres');
export const supplierCode = () => z.string().max(50, 'El código no puede exceder 50 caracteres');
export const supplierContactName = () => z.string().max(100, 'El nombre de contacto no puede exceder 100 caracteres');
export const supplierPhone = () => z.string().max(30, 'El teléfono no puede exceder 30 caracteres');
export const supplierEmail = () => z.string().email('Email inválido').max(100, 'El email no puede exceder 100 caracteres').optional().or(z.literal(''));
export const supplierAddress = () => z.string().max(300, 'La dirección no puede exceder 300 caracteres');
export const supplierWebsite = () => z.string().url('URL inválida').max(200, 'La URL no puede exceder 200 caracteres');
// Geo fields
export const supplierProvince = () => z.string().max(100, 'La provincia no puede exceder 100 caracteres');
export const supplierMunicipality = () => z.string().max(100, 'El municipio no puede exceder 100 caracteres');
export const supplierStreet = () => z.string().max(200, 'La calle no puede exceder 200 caracteres');
export const supplierLocality = () => z.string().max(100, 'La localidad no puede exceder 100 caracteres');
export const supplierZipCode = () => z.string().max(20, 'El código postal no puede exceder 20 caracteres');
export const supplierLatitude = () => z.coerce.number().min(-90).max(90);
export const supplierLongitude = () => z.coerce.number().min(-180).max(180);
export const supplierNotes = () => z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres');
