import type { SupplierImage } from './supplier-image';
import type { SupplierSocialLink } from './supplier-social-link';
import type { SupplierCatalogProduct } from './supplier-catalog-product';

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
  website?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  images?: SupplierImage[];
  socialLinks?: SupplierSocialLink[];
  catalogProducts?: SupplierCatalogProduct[];
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
