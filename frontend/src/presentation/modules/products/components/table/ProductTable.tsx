'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Eye, Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import type { Product } from '@/core/product/entities/product';
import { StatusBadge } from '@/presentation/shared/components/data-display/StatusBadge';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { ImagePreview } from '../ImagePreview';
import { ProductImageCell } from './ProductImageCell';
import { useProductDeleteMutation } from './useProductDelete';

interface ProductTableProps {
  products: Product[];
  onDeleteSuccess?: () => void;
  onDeleteSelected?: (ids: string[]) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

export function ProductTable({ products, onDeleteSuccess, onDeleteSelected, pagination }: ProductTableProps) {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const deleteMutation = useProductDeleteMutation(onDeleteSuccess);

  const handleRowClick = useCallback((product: Product) => {
    router.push(`/products/${product.id}`);
  }, [router]);

  const columns: Column<Product>[] = useMemo(() => [
    {
      key: 'name', label: 'Producto',
      render: (_, product) => (
        <ProductImageCell product={product} onPreview={(url) => setPreviewImage(url)} />
      ),
      className: 'w-64',
    },
    {
      key: 'sku', label: 'SKU',
      render: (value) => <span>{String(value) || '-'}</span>,
    },
    {
      key: 'categoryName', label: 'Categoría',
      render: (value) => <span>{String(value) || '-'}</span>,
    },
    {
      key: 'salePrice', label: 'Precio',
      render: (value) => <span>{value != null ? `$${Number(value).toFixed(2)}` : '-'}</span>,
      className: 'text-right',
    },
    {
      key: 'status', label: 'Estado',
      render: (value) => <StatusBadge active={value === 'ACTIVE'} />,
      className: 'text-center',
    },
  ], []);

  const actions: TableAction<Product>[] = useMemo(() => [
    { icon: Eye, title: 'Ver detalles del producto', href: (row) => `/products/${row.id}` },
    { icon: Copy, title: 'Duplicar producto: crea uno nuevo con los mismos datos', href: (row) => `/products/new?prefillFrom=${row.id}` },
    { icon: Pencil, title: 'Modificar información del producto', href: (row) => `/products/${row.id}/edit` },
    { icon: Trash2, title: 'Eliminar producto del sistema',
      onClick: (row) => deleteMutation.mutate(row.id),
      confirmMessage: (row) => `¿Estás seguro de eliminar el producto "${row.name}"? Esta acción no se puede deshacer.` },
  ], [deleteMutation]);

  return (
    <>
      <GenericTable data={products} columns={columns} actions={actions}
        emptyMessage="No hay productos registrados" onRowClick={handleRowClick}
        selectable={!!onDeleteSelected} onDeleteSelected={onDeleteSelected}
        pagination={pagination && { page: pagination.page, totalPages: pagination.totalPages, totalElements: pagination.totalElements, onPageChange: pagination.onPageChange, pageSize: pagination.pageSize }} />
      {previewImage && (
        <ImagePreview src={previewImage} alt="Vista previa"
          isOpen={!!previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </>
  );
}
