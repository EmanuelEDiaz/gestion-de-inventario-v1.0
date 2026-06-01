'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/presentation/shared/components/ui/card';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { toast } from '@/presentation/shared/components/ui';
import { EditViewHeader } from './EditViewHeader';
import { EditViewTabs } from './EditViewTabs';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import { useCategories } from '../hooks/useCategories';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { UpdateProductUseCase } from '@/core/product/use-cases/UpdateProductUseCase';
import type { UpdateProductData } from '@/core/product/entities/product';

const repository = new ProductRepository();
const updateProductUseCase = new UpdateProductUseCase(repository);

interface ProductEditViewProps { productId: string }

export function ProductEditView({ productId }: ProductEditViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'form' | 'images'>('form');

  const { data: product, isLoading, error: queryError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => repository.getById(productId),
    enabled: !!productId,
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(true);

  const initialData = product ? {
    name: product.name, sku: product.sku ?? '', barcode: product.barcode ?? '',
    description: product.description ?? '', categoryId: product.categoryId ?? '',
    standardCost: product.standardCost?.toString() ?? '',
    salePrice: product.salePrice?.toString() ?? '',
    reorderPoint: product.reorderPoint?.toString() ?? '',
    taxRate: product.taxRate.toString(), unitOfMeasure: product.unitOfMeasure,
  } : undefined;

  const handleSubmit = useCallback(async (data: ProductFormData) => {
    const payload: UpdateProductData = {
      name: data.name, sku: data.sku || undefined,
      barcode: data.barcode || undefined, description: data.description || undefined,
      categoryId: data.categoryId || undefined,
      standardCost: data.standardCost ? parseFloat(data.standardCost) : undefined,
      salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
      reorderPoint: data.reorderPoint ? parseFloat(data.reorderPoint) : undefined,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : 0,
      unitOfMeasure: data.unitOfMeasure,
    };
    await updateProductUseCase.execute(productId, payload);
    toast.success('Producto actualizado correctamente');
    router.push(`/products/${productId}`);
  }, [productId, router]);

  if (isLoading || isLoadingCategories) return <LoadingSpinner />;
  if (queryError || !product) return <AlertMessage variant="error" message="Producto no encontrado" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <EditViewHeader />
      <EditViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'form' ? (
        <ProductFormFields
          categories={categories}
          initialData={initialData}
          isEditing
          onSubmit={handleSubmit}
          onCancel={() => router.push('/products')}
        />
      ) : (
        <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
          <ProductImageGallery productId={productId} editable />
        </Card>
      )}
    </div>
  );
}
