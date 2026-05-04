'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierCatalogProductApi } from '@/infrastructure/api/supplier-catalog-product-api';
import type { AddSupplierCatalogProductData } from '@/core/entities/supplier-catalog-product';

const catalogKey = (supplierId: string) => ['supplier-catalog', supplierId];

export function useSupplierCatalog(supplierId: string) {
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: catalogKey(supplierId),
    queryFn: () => supplierCatalogProductApi.list(supplierId),
    enabled: !!supplierId,
  });

  const add = useMutation({
    mutationFn: (data: AddSupplierCatalogProductData) =>
      supplierCatalogProductApi.add(supplierId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKey(supplierId) }),
  });

  const remove = useMutation({
    mutationFn: (catalogProductId: string) =>
      supplierCatalogProductApi.remove(supplierId, catalogProductId),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKey(supplierId) }),
  });

  return { products, isLoading, add, remove };
}
