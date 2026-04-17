export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
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

export interface CreateCustomerData {
  code?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerData {
  code?: string;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}
