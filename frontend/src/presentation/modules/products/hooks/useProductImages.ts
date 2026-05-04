'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productImageApi } from '@/infrastructure/api/image-upload-api';

const imgKey = (productId: string) => ['product-images', productId];

export function useProductImages(productId: string) {
  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: imgKey(productId),
    queryFn: () => productImageApi.list(productId),
    enabled: !!productId,
  });

  const upload = useMutation({
    mutationFn: ({ file, isPrimary }: { file: File; isPrimary: boolean }) =>
      productImageApi.upload(productId, file, isPrimary),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(productId) }),
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) => productImageApi.setPrimary(productId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(productId) }),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => productImageApi.delete(productId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(productId) }),
  });

  return { images, isLoading, upload, setPrimary, remove };
}