import { apiClient } from './client';
import type { SupplierCatalogProduct, AddSupplierCatalogProductData } from '@/core/entities/supplier-catalog-product';

const base = (supplierId: string) => `/api/v1/suppliers/${supplierId}/catalog`;

export const supplierCatalogProductApi = {
  list(supplierId: string): Promise<SupplierCatalogProduct[]> {
    return apiClient.get<SupplierCatalogProduct[]>(base(supplierId)).then((r) => r.data);
  },

  add(supplierId: string, data: AddSupplierCatalogProductData): Promise<SupplierCatalogProduct> {
    return apiClient.post<SupplierCatalogProduct>(base(supplierId), data).then((r) => r.data);
  },

  remove(supplierId: string, catalogProductId: string): Promise<void> {
    return apiClient.delete(`${base(supplierId)}/${catalogProductId}`).then(() => undefined);
  },
};
