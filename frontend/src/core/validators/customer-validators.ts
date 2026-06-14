import { z } from 'zod';
import {
  customerName, customerCode, customerContactName, customerPhone,
  customerEmail, customerAddress, customerNotes,
  customerProvince, customerMunicipality, customerStreet,
  customerLocality, customerZipCode, customerLatitude, customerLongitude,
} from './fields/commerce/customer-fields';

const geoFields = {
  province: customerProvince().optional(),
  municipality: customerMunicipality().optional(),
  street: customerStreet().optional(),
  locality: customerLocality().optional(),
  zipCode: customerZipCode().optional(),
  latitude: customerLatitude().optional(),
  longitude: customerLongitude().optional(),
};

export const createCustomerSchema = z.object({
  code: customerCode().optional(),
  name: customerName(),
  contactName: customerContactName().optional(),
  phone: customerPhone().optional(),
  email: customerEmail().optional(),
  address: customerAddress().optional(),
  notes: customerNotes().optional(),
  ...geoFields,
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
