'use client';

import { formatDateShort } from '@/presentation/shared/lib/utils';

interface ProductStatsSectionProps {
  product: {
    sku?: string | null;
    barcode?: string | null;
    categoryName?: string | null;
    unitOfMeasure: string;
    standardCost?: number | null;
    salePrice?: number | null;
    reorderPoint?: number | null;
    taxRate: number;
    createdAt: string;
    updatedAt: string;
    description?: string | null;
  };
}

export function ProductStatsSection({ product }: ProductStatsSectionProps) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div><dt className="text-gray-500">SKU</dt><dd className="font-medium">{product.sku || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Código de barras</dt><dd>{product.barcode || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Categoría</dt><dd>{product.categoryName || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Unidad</dt><dd>{product.unitOfMeasure}</dd></div>
      <div><dt className="text-gray-500">Costo estándar</dt><dd>{product.standardCost ?? 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Precio venta</dt><dd>{product.salePrice ?? 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Punto de reorden</dt><dd>{product.reorderPoint ?? 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Impuesto (%)</dt><dd>{product.taxRate}</dd></div>
      <div><dt className="text-gray-500">Creado</dt><dd>{formatDateShort(product.createdAt)}</dd></div>
      <div><dt className="text-gray-500">Actualizado</dt><dd>{formatDateShort(product.updatedAt)}</dd></div>
      {product.description && (
        <div className="sm:col-span-2"><dt className="text-gray-500">Descripción</dt><dd>{product.description}</dd></div>
      )}
    </dl>
  );
}
