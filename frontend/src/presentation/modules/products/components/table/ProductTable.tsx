'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Eye, Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import type { Product } from '@/core/product/entities/product';
import { StatusBadge } from '@/presentation/shared/components/data-display/StatusBadge';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { DetailModal } from '@/presentation/shared/components/data-display/DetailModal';
import { ImagePreview } from '../ImagePreview';
import { ProductImageCell } from './ProductImageCell';
import { useProductDeleteMutation } from './useProductDelete';
import { formatDateShort, getMediaUrl } from '@/presentation/shared/lib/utils';
import { productImageApi } from '@/infrastructure/api/image-upload-api';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const deleteMutation = useProductDeleteMutation(onDeleteSuccess);

  const { data: productImages = [] } = useQuery({
    queryKey: ['product-images', quickViewProduct?.id],
    queryFn: () => productImageApi.list(quickViewProduct!.id),
    enabled: !!quickViewProduct?.id,
  });

  const handleRowClick = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

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
    { icon: Eye, title: 'Vista rápida del producto', onClick: (row) => setQuickViewProduct(row) },
    { icon: Copy, title: 'Duplicar producto: crea uno nuevo con los mismos datos', href: (row) => `/products/new?prefillFrom=${row.id}` },
    { icon: Pencil, title: 'Modificar información del producto', href: (row) => `/products/${row.id}/edit` },
    { icon: Trash2, title: 'Eliminar producto del sistema',
      onClick: (row) => deleteMutation.mutate(row.id),
      confirmMessage: (row) => `¿Estás seguro de eliminar el producto "${row.name}"? Esta acción no se puede deshacer.` },
  ], [deleteMutation]);

  const quickViewSections = useMemo(() => {
    if (!quickViewProduct) return [];
    const p = quickViewProduct;
    return [
      {
        title: 'Información General',
        fields: [
          { label: 'SKU', value: p.sku ?? null, tooltip: 'Código único para identificar el producto en el sistema' },
          { label: 'Código de barras', value: p.barcode ?? null, tooltip: 'Código de barras del producto para punto de venta' },
          { label: 'Categoría', value: p.categoryName ?? null },
          { label: 'Unidad de Medida', value: p.unitOfMeasure },
          { label: 'Estado', value: <StatusBadge active={p.status === 'ACTIVE'} /> },
        ],
      },
      {
        title: 'Precios y Costos',
        fields: [
          { label: 'Costo Estándar', value: p.standardCost != null ? `$${Number(p.standardCost).toFixed(2)}` : null },
          { label: 'Precio de Venta', value: p.salePrice != null ? `$${Number(p.salePrice).toFixed(2)}` : null },
          { label: 'Impuesto', value: `${p.taxRate}%` },
          { label: 'Punto de Reorden', value: p.reorderPoint ?? null, tooltip: 'Cantidad mínima en inventario antes de reabastecer' },
        ],
      },
      {
        title: 'Fechas',
        fields: [
          { label: 'Creado', value: formatDateShort(p.createdAt) },
          { label: 'Actualizado', value: formatDateShort(p.updatedAt) },
        ],
      },
    ];
  }, [quickViewProduct]);

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
      <DetailModal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name ?? 'Producto'}
        sections={quickViewSections}
        images={
          quickViewProduct
            ? [
                ...(quickViewProduct.mainImage
                  ? [{ url: getMediaUrl(quickViewProduct.mainImage), alt: quickViewProduct.name }]
                  : []),
                ...productImages.map(img => ({
                  url: getMediaUrl(img.filePath),
                  alt: img.originalFilename ?? quickViewProduct.name,
                })),
              ]
            : undefined
        }
      />
    </>
  );
}
