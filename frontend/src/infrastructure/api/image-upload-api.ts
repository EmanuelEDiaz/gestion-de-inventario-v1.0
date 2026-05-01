import { apiClient } from './client';
import type { CustomerImage, CreateCustomerImageData } from '@/core/entities/customer-image';
import type { SupplierImage, CreateSupplierImageData } from '@/core/entities/supplier-image';

export const customerImageApi = {
  list(customerId: string): Promise<CustomerImage[]> {
    return apiClient
      .get<CustomerImage[]>(`/api/v1/customers/${customerId}/images`)
      .then((r) => r.data);
  },

  upload(customerId: string, data: CreateCustomerImageData): Promise<CustomerImage> {
    return apiClient
      .post<CustomerImage>(`/api/v1/customers/${customerId}/images`, data)
      .then((r) => r.data);
  },

  setPrimary(customerId: string, imageId: string): Promise<CustomerImage> {
    return apiClient
      .post<CustomerImage>(`/api/v1/customers/${customerId}/images/${imageId}/primary`)
      .then((r) => r.data);
  },

  delete(customerId: string, imageId: string): Promise<void> {
    return apiClient
      .delete(`/api/v1/customers/${customerId}/images/${imageId}`)
      .then(() => undefined);
  },
};

export const supplierImageApi = {
  list(supplierId: string): Promise<SupplierImage[]> {
    return apiClient
      .get<SupplierImage[]>(`/api/v1/suppliers/${supplierId}/images`)
      .then((r) => r.data);
  },

  upload(supplierId: string, data: CreateSupplierImageData): Promise<SupplierImage> {
    return apiClient
      .post<SupplierImage>(`/api/v1/suppliers/${supplierId}/images`, data)
      .then((r) => r.data);
  },

  setPrimary(supplierId: string, imageId: string): Promise<SupplierImage> {
    return apiClient
      .post<SupplierImage>(`/api/v1/suppliers/${supplierId}/images/${imageId}/primary`)
      .then((r) => r.data);
  },

  delete(supplierId: string, imageId: string): Promise<void> {
    return apiClient
      .delete(`/api/v1/suppliers/${supplierId}/images/${imageId}`)
      .then(() => undefined);
  },
};
