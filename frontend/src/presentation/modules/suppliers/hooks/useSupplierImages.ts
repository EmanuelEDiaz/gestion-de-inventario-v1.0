'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierImageApi } from '@/infrastructure/api/image-upload-api';
import type { CreateSupplierImageData } from '@/core/entities/supplier-image';

const imgKey = (supplierId: string) => ['supplier-images', supplierId];

export function useSupplierImages(supplierId: string) {
  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: imgKey(supplierId),
    queryFn: () => supplierImageApi.list(supplierId),
    enabled: !!supplierId,
  });

  const upload = useMutation({
    mutationFn: (data: CreateSupplierImageData) =>
      supplierImageApi.upload(supplierId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(supplierId) }),
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) =>
      supplierImageApi.setPrimary(supplierId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(supplierId) }),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) =>
      supplierImageApi.delete(supplierId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(supplierId) }),
  });

  return { images, isLoading, upload, setPrimary, remove };
}
