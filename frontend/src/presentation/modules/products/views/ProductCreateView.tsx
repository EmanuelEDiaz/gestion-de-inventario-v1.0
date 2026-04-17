/**
 * ProductCreateView - Composition view for product create page
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/presentation/shared/components/ui';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Card } from '@/presentation/shared/components/Card';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import { useProductFormController } from '../hooks/useProductFormController';
import type { Category } from '@/core/entities/category';
import type { CreateProductData } from '@/core/entities/product';
import { GetCategoriesUseCase } from '@/core/use-cases/category/GetCategoriesUseCase';
import { categoryRepository } from '@/infrastructure/repositories/CategoryRepository';

const INITIAL_FORM_DATA: ProductFormData = {
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

const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);

export function ProductCreateView() {
  const { isLoading, error, handleSubmit, clearError, goBack } = useProductFormController();
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategoriesUseCase.execute(true).then(setCategories).catch(console.error);
  }, []);

  const handleFieldChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const payload: CreateProductData = {
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
      handleSubmit(payload);
    },
    [formData, handleSubmit]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-gray-600">Ingresa la información del nuevo producto</p>
      </div>

      {error && <AlertMessage message={error} onDismiss={clearError} />}

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <ProductFormFields
            data={formData}
            categories={categories}
            onChange={handleFieldChange}
          />
          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="secondary" onClick={goBack}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
