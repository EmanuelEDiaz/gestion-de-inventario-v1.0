import { z } from 'zod';
import {
  supplierName, supplierCode, supplierContactName, supplierPhone,
  supplierEmail, supplierAddress, supplierNotes, supplierWebsite,
  supplierProvince, supplierMunicipality, supplierStreet,
  supplierLocality, supplierZipCode, supplierLatitude, supplierLongitude,
} from './fields/commerce/supplier-fields';

const geoFields = {
  province: supplierProvince().optional(),
  municipality: supplierMunicipality().optional(),
  street: supplierStreet().optional(),
  locality: supplierLocality().optional(),
  zipCode: supplierZipCode().optional(),
  latitude: supplierLatitude().optional(),
  longitude: supplierLongitude().optional(),
};

export const createSupplierSchema = z.object({
  code: supplierCode().optional(),
  name: supplierName(),
  contactName: supplierContactName().optional(),
  phone: supplierPhone().optional(),
  email: supplierEmail().optional(),
  address: supplierAddress().optional(),
  notes: supplierNotes().optional(),
  website: supplierWebsite().optional().or(z.literal('')).nullable(),
  ...geoFields,
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
