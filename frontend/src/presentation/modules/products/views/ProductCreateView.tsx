'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Sparkles } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { Card } from '@/presentation/shared/components/ui/card';
import { toast } from '@/presentation/shared/components/ui/toast';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import { ProductCreateImageCarousel } from '../components/ProductCreateImageCarousel';
import { useCategories } from '../hooks/useCategories';
import { CreateProductUseCase } from '@/core/product/use-cases/CreateProductUseCase';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { productImageApi } from '@/infrastructure/api/image-upload-api';
import type { CreateProductData } from '@/core/product/entities/product';

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

const createProductUseCase = new CreateProductUseCase(productRepository);

export function ProductCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillId = searchParams.get('prefillFrom');

  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [files, setFiles] = useState<File[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: categories = [] } = useCategories(true);

  const { data: template } = useQuery({
    queryKey: ['product', prefillId],
    queryFn: () => productRepository.getById(prefillId!),
    enabled: !!prefillId,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        sku: template.sku || '',
        barcode: template.barcode || '',
        description: template.description || '',
        categoryId: template.categoryId || '',
        standardCost: template.standardCost?.toString() || '',
        salePrice: template.salePrice?.toString() || '',
        reorderPoint: template.reorderPoint?.toString() || '',
        taxRate: template.taxRate?.toString() || '0',
        unitOfMeasure: template.unitOfMeasure || 'UNIT',
      });
    }
  }, [template]);

  const handleFieldChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveProduct = useCallback(
    async (createAndContinue = false) => {
      setIsSaving(true);
      setError(null);
      try {
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
        const product = await createProductUseCase.execute(payload);

        if (files.length > 0) {
          const primaryImage = files[primaryIndex];
          const secondaryImages = files.filter((_, index) => index !== primaryIndex);
          if (primaryImage) {
            await productImageApi.upload(product.id, primaryImage, true);
          }
          for (const image of secondaryImages) {
            await productImageApi.upload(product.id, image, false);
          }
        }

        if (createAndContinue) {
          setFormData((prev) => ({
            ...INITIAL_FORM_DATA,
            categoryId: prev.categoryId,
            unitOfMeasure: prev.unitOfMeasure,
          }));
          setFiles([]);
          setPrimaryIndex(0);
          toast.success('Producto creado. Puedes seguir agregando.');
        } else {
          router.push('/products');
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status: number } }).response?.status === 409
              ? 'Ya existe un producto con ese SKU o código de barras'
              : 'Error al crear el producto'
            : 'Error al crear el producto';
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [files, formData, primaryIndex, router]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      saveProduct(false);
    },
    [saveProduct]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl bg-linear-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Nuevo Producto</h1>
        </div>
        <p className="mt-1 text-blue-50">Completa datos e imágenes: hasta 8 fotos con una principal para tu catálogo.</p>
      </div>

      {error && <AlertMessage message={error} onDismiss={() => setError(null)} />}

      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <ProductFormFields data={formData} categories={categories} onChange={handleFieldChange} />
            <ProductCreateImageCarousel
              files={files}
              primaryIndex={primaryIndex}
              onChange={(nextFiles, nextPrimary) => {
                setFiles(nextFiles);
                setPrimaryIndex(nextPrimary);
              }}
            />
          </div>
          <div className="flex justify-end gap-4 border-t pt-6">
            <TooltipWrapper content="Cancelar creación del producto" side="top">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancelar
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Crear producto y continuar agregando más" side="top">
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => saveProduct(true)}>
                {isSaving ? 'Guardando...' : 'Crear y Continuar'}
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Guardar producto y subir sus imágenes" side="top">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Crear Producto'}
              </Button>
            </TooltipWrapper>
          </div>
        </form>
      </Card>
    </div>
  );
}
