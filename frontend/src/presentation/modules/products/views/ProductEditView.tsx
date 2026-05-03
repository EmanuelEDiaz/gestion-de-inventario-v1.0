'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Card } from '@/presentation/shared/components/Card';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { useCategories } from '../hooks/useCategories';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { UpdateProductUseCase } from '@/core/use-cases/product/UpdateProductUseCase';
import type { UpdateProductData } from '@/core/entities/product';

const INITIAL_FORM: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  categoryId: '',
  standardCost: '',
  salePrice: '',
  reorderPoint: '',
  taxRate: '0',
  unitOfMeasure: 'UNIT',
};

const repository = new ProductRepository();
const updateProductUseCase = new UpdateProductUseCase(repository);

interface ProductEditViewProps {
  productId: string;
}

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
      name: product.name,
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      standardCost: product.standardCost?.toString() ?? '',
      salePrice: product.salePrice?.toString() ?? '',
      reorderPoint: product.reorderPoint?.toString() ?? '',
      taxRate: product.taxRate.toString(),
      unitOfMeasure: product.unitOfMeasure,
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
      name: formData.name,
      sku: formData.sku || undefined,
      barcode: formData.barcode || undefined,
      description: formData.description || undefined,
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
      <div className="rounded-2xl bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h1 className="text-2xl font-bold text-white">Modificar Producto</h1>
        </div>
        <p className="mt-1 text-indigo-100">Edita datos y administra el carrusel con imagen principal (máximo 8).</p>
      </div>

      {error && <AlertMessage message={error} onDismiss={() => setError(null)} />}

      <div className="flex gap-0 border-b">
        <button
          type="button"
          title="Editar datos del producto"
          onClick={() => setActiveTab('form')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'form' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Datos
        </button>
        <button
          type="button"
          title="Gestionar imágenes del producto"
          onClick={() => setActiveTab('images')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'images' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Imágenes
        </button>
      </div>

      {activeTab === 'form' ? (
        <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ProductFormFields data={formData} categories={categories} onChange={handleFieldChange} />
            <div className="flex justify-end gap-4 border-t pt-6">
              <Button type="button" variant="secondary" onClick={() => router.push(`/products/${productId}`)} title="Cancelar edición">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} title="Guardar cambios del producto">
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
          <ProductImageGallery productId={productId} editable={true} />
        </Card>
      )}
    </div>
  );
}