export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
  id: string;
  code?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierData {
  code?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierData {
  code?: string;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}
