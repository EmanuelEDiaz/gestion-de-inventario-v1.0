'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierSocialLinkApi } from '@/infrastructure/api/supplier-social-link-api';
import type { AddSupplierSocialLinkData } from '@/core/entities/supplier-social-link';

const linkKey = (supplierId: string) => ['supplier-social-links', supplierId];

export function useSupplierSocialLinks(supplierId: string) {
  const qc = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: linkKey(supplierId),
    queryFn: () => supplierSocialLinkApi.list(supplierId),
    enabled: !!supplierId,
  });

  const add = useMutation({
    mutationFn: (data: AddSupplierSocialLinkData) =>
      supplierSocialLinkApi.add(supplierId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: linkKey(supplierId) }),
  });

  const remove = useMutation({
    mutationFn: (linkId: string) =>
      supplierSocialLinkApi.remove(supplierId, linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: linkKey(supplierId) }),
  });

  return { links, isLoading, add, remove };
}
