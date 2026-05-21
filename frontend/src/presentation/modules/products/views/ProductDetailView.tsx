'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Sparkles } from 'lucide-react';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { Card, CardContent } from '@/presentation/shared/components/ui/card';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { formatDateShort } from '@/presentation/shared/lib/utils';

type Tab = 'info' | 'images';

const TAB_LABELS: Record<Tab, string> = {
  info: 'Información',
  images: 'Imágenes',
};

const repository = new ProductRepository();

interface ProductDetailViewProps {
  productId: string;
  onBack?: () => void;
}

export function ProductDetailView({ productId, onBack }: ProductDetailViewProps) {
  const [tab, setTab] = useState<Tab>('info');
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => repository.getById(productId),
    enabled: !!productId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !product) return <AlertMessage variant="error" message="Producto no encontrado" />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="mb-2 flex items-center gap-2 text-cyan-100">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Ficha de producto</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button size="sm" variant="ghost" onClick={onBack} title="Volver al listado de productos" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <Badge className={product.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}>
            {product.status === 'ACTIVE' ? 'Activo' : 'Archivado'}
          </Badge>
        </div>
        <Link href={`/products/${product.id}/edit`} title="Modificar este producto">
          <Button title="Modificar este producto" className="bg-white text-slate-900 hover:bg-slate-100">
            <Pencil className="mr-2 h-4 w-4" />
            Modificar
          </Button>
        </Link>
      </div>
      </div>

      <div className="flex gap-0 border-b">
        {(Object.keys(TAB_LABELS) as Tab[]).map((currentTab) => (
          <button
            key={currentTab}
            type="button"
            onClick={() => setTab(currentTab)}
            title={`Ver ${TAB_LABELS[currentTab]}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === currentTab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[currentTab]}
          </button>
        ))}
      </div>

      <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-4">
          {tab === 'info' && (
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
          )}
          {tab === 'images' && <ProductImageGallery productId={productId} editable={false} />}
        </CardContent>
      </Card>
    </div>
  );
}