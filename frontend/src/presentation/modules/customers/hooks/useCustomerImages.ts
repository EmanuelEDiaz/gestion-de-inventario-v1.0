'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerImageApi } from '@/infrastructure/api/image-upload-api';
import type { CreateCustomerImageData } from '@/core/entities/customer-image';

const imgKey = (customerId: string) => ['customer-images', customerId];

export function useCustomerImages(customerId: string) {
  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: imgKey(customerId),
    queryFn: () => customerImageApi.list(customerId),
    enabled: !!customerId,
  });

  const upload = useMutation({
    mutationFn: (data: CreateCustomerImageData) =>
      customerImageApi.upload(customerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(customerId) }),
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) =>
      customerImageApi.setPrimary(customerId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(customerId) }),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) =>
      customerImageApi.delete(customerId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: imgKey(customerId) }),
  });

  return { images, isLoading, upload, setPrimary, remove };
}
