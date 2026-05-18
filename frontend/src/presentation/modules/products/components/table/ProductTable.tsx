'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/core/entities/product';
import { StatusBadge } from '@/presentation/shared/components/StatusBadge';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/GenericTable';
import { ImagePreview } from '../ImagePreview';
import { ProductImageCell } from './ProductImageCell';
import { useProductDelete } from './useProductDelete';

interface ProductTableProps {
  products: Product[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onDeleteSuccess?: () => void;
}

export function ProductTable({ products, sortKey, sortDirection, onSort, onDeleteSuccess }: ProductTableProps) {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { handleDelete } = useProductDelete({ onDeleteSuccess });

  const handleRowClick = useCallback((product: Product) => {
    router.push(`/products/${product.id}`);
  }, [router]);

  const columns: Column<Product>[] = useMemo(() => [
    {
      key: 'name', label: 'Producto', sortable: true,
      render: (_, product) => (
        <ProductImageCell product={product} onPreview={(url) => setPreviewImage(url)} />
      ),
      className: 'w-64',
    },
    {
      key: 'sku', label: 'SKU', sortable: true,
      render: (value) => <span>{String(value) || '-'}</span>,
    },
    {
      key: 'categoryName', label: 'Categoría', sortable: true,
      render: (value) => <span>{String(value) || '-'}</span>,
    },
    {
      key: 'salePrice', label: 'Precio', sortable: true,
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
    { icon: Pencil, title: 'Modificar información del producto', href: (row) => `/products/${row.id}/edit` },
    { icon: Trash2, title: 'Eliminar producto del sistema', onClick: handleDelete },
  ], [handleDelete]);

  return (
    <>
      <GenericTable data={products} columns={columns} actions={actions}
        onSort={onSort} sortKey={sortKey} sortDirection={sortDirection}
        emptyMessage="No hay productos registrados" onRowClick={handleRowClick} />
      {previewImage && (
        <ImagePreview src={previewImage} alt="Vista previa"
          isOpen={!!previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </>
  );
}
