'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/presentation/shared/components/ui/card';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EditViewHeader } from './EditViewHeader';
import { EditViewTabs } from './EditViewTabs';
import { EditViewFormContent } from './EditViewFormContent';
import { ProductImageGallery } from '../components/ProductImageGallery';
import type { ProductFormData } from '../components/form/ProductFormFields';
import { useCategories } from '../hooks/useCategories';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { UpdateProductUseCase } from '@/core/product/use-cases/UpdateProductUseCase';
import type { UpdateProductData } from '@/core/product/entities/product';

const INITIAL_FORM: ProductFormData = { name: '', sku: '', barcode: '', description: '', categoryId: '', standardCost: '', salePrice: '', reorderPoint: '', taxRate: '0', unitOfMeasure: 'UNIT' };
const repository = new ProductRepository();
const updateProductUseCase = new UpdateProductUseCase(repository);

interface ProductEditViewProps { productId: string }

export function ProductEditView({ productId }: ProductEditViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'form' | 'images'>('form');
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: product, isLoading, error: queryError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => repository.getById(productId),
    enabled: !!productId,
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(true);

  useEffect(() => {
    if (!product) return;
    setFormData({
      name: product.name, sku: product.sku ?? '', barcode: product.barcode ?? '',
      description: product.description ?? '', categoryId: product.categoryId ?? '',
      standardCost: product.standardCost?.toString() ?? '',
      salePrice: product.salePrice?.toString() ?? '',
      reorderPoint: product.reorderPoint?.toString() ?? '',
      taxRate: product.taxRate.toString(), unitOfMeasure: product.unitOfMeasure,
    });
  }, [product]);

  const handleFieldChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const payload: UpdateProductData = {
      name: formData.name, sku: formData.sku || undefined,
      barcode: formData.barcode || undefined, description: formData.description || undefined,
      categoryId: formData.categoryId || undefined,
      standardCost: formData.standardCost ? parseFloat(formData.standardCost) : undefined,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : undefined,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
      unitOfMeasure: formData.unitOfMeasure,
    };
    try {
      await updateProductUseCase.execute(productId, payload);
      router.push(`/products/${productId}`);
    } catch {
      setError('Error al actualizar el producto');
      setIsSaving(false);
    }
  }, [formData, productId, router]);

  if (isLoading || isLoadingCategories) return <LoadingSpinner />;
  if (queryError || !product) return <AlertMessage variant="error" message="Producto no encontrado" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <EditViewHeader />
      {error && <AlertMessage message={error} onDismiss={() => setError(null)} />}
      <EditViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'form' ? (
        <EditViewFormContent
          formData={formData} categories={categories} isSaving={isSaving}
          onSubmit={handleSubmit} onChange={handleFieldChange}
          onCancel={() => router.push(`/products/${productId}`)}
        />
      ) : (
        <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
          <ProductImageGallery productId={productId} editable />
        </Card>
      )}
    </div>
  );
}
