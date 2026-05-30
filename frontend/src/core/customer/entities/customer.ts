import type { CustomerImage } from './customer-image';

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  code?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  province?: string;
  municipality?: string;
  street?: string;
  locality?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  images?: CustomerImage[];
}

export interface CreateCustomerData {
  code?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  province?: string;
  municipality?: string;
  street?: string;
  locality?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface UpdateCustomerData {
  code?: string;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  province?: string;
  municipality?: string;
  street?: string;
  locality?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}
