import { apiClient } from './client';
import type { SupplierSocialLink, AddSupplierSocialLinkData } from '@/core/supplier/entities/supplier-social-link';

const base = (supplierId: string) => `/api/v1/suppliers/${supplierId}/social-links`;

export const supplierSocialLinkApi = {
  list(supplierId: string): Promise<SupplierSocialLink[]> {
    return apiClient.get<SupplierSocialLink[]>(base(supplierId)).then((r) => r.data);
  },

  add(supplierId: string, data: AddSupplierSocialLinkData): Promise<SupplierSocialLink> {
    return apiClient.post<SupplierSocialLink>(base(supplierId), data).then((r) => r.data);
  },

  remove(supplierId: string, linkId: string): Promise<void> {
    return apiClient.delete(`${base(supplierId)}/${linkId}`).then(() => undefined);
  },
};
