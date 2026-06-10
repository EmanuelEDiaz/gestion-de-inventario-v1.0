'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { Sparkles } from '@/presentation/shared/components/ui/icon-mapping';
import { toast } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import { ProductCreateImageCarousel } from '../components/ProductCreateImageCarousel';
import { useCategories } from '../hooks/useCategories';
import { CreateProductUseCase } from '@/core/product/use-cases/CreateProductUseCase';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { productImageApi } from '@/infrastructure/api/image-upload-api';
import type { CreateProductData } from '@/core/product/entities/product';

const STORAGE_KEY = 'product-create';
const createProductUseCase = new CreateProductUseCase(productRepository);

export function ProductCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillId = searchParams.get('prefillFrom');

  const [files, setFiles] = useState<File[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const { data: categories = [] } = useCategories(true);

  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['product', prefillId],
    queryFn: () => productRepository.getById(prefillId!),
    enabled: !!prefillId,
  });

  const initialData: Partial<ProductFormData> = {
    name: 'Aceite de Motor 5W-30',
    sku: 'ACE-5W30-1L',
    barcode: '7501234567890',
    description: 'Aceite de motor multigrado 5W-30 para motor a gasolina. Presentación de 1 litro.',
    standardCost: '150.00',
    salePrice: '220.00',
    reorderPoint: '10',
    taxRate: '16',
    unitOfMeasure: 'UNIT',
  };

  const initialValues = template ? {
    name: template.name,
    sku: template.sku ?? '',
    barcode: template.barcode ?? '',
    description: template.description ?? '',
    categoryId: template.categoryId ?? '',
    standardCost: template.standardCost?.toString() ?? '',
    salePrice: template.salePrice?.toString() ?? '',
    reorderPoint: template.reorderPoint?.toString() ?? '',
    taxRate: template.taxRate?.toString() ?? '0',
    unitOfMeasure: template.unitOfMeasure ?? 'UNIT',
  } : undefined;

  const uploadImages = useCallback(async (productId: string) => {
    if (files.length === 0) return;
    const primaryImage = files[primaryIndex];
    const secondaryImages = files.filter((_, index) => index !== primaryIndex);
    if (primaryImage) {
      await productImageApi.upload(productId, primaryImage, true);
    }
    for (const image of secondaryImages) {
      await productImageApi.upload(productId, image, false);
    }
  }, [files, primaryIndex]);

  const handleSubmit = useCallback(async (data: ProductFormData) => {
    const payload: CreateProductData = {
      name: data.name, sku: data.sku || undefined,
      barcode: data.barcode || undefined, description: data.description || undefined,
      categoryId: data.categoryId || undefined,
      standardCost: data.standardCost ? parseFloat(data.standardCost) : undefined,
      salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
      reorderPoint: data.reorderPoint ? parseFloat(data.reorderPoint) : undefined,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : 0,
      unitOfMeasure: data.unitOfMeasure,
    };
    const product = await createProductUseCase.execute(payload);
    await uploadImages(product.id);
    toast.success('Producto creado correctamente');
    router.push('/products');
  }, [uploadImages, router]);

  const handleContinue = useCallback(async (data: ProductFormData) => {
    const payload: CreateProductData = {
      name: data.name, sku: data.sku || undefined,
      barcode: data.barcode || undefined, description: data.description || undefined,
      categoryId: data.categoryId || undefined,
      standardCost: data.standardCost ? parseFloat(data.standardCost) : undefined,
      salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
      reorderPoint: data.reorderPoint ? parseFloat(data.reorderPoint) : undefined,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : 0,
      unitOfMeasure: data.unitOfMeasure,
    };
    const product = await createProductUseCase.execute(payload);
    await uploadImages(product.id);
    setFiles([]);
    setPrimaryIndex(0);
    toast.success('Producto creado. Puedes seguir agregando.');
  }, [uploadImages]);

  if (prefillId && isLoadingTemplate) return <LoadingSpinner />;

  const afterFields = (
    <div className="col-span-full">
      <label className="mb-2 block text-sm font-medium text-gray-900">
        <span className="inline-flex items-center gap-1">
          Imágenes del Producto
          <TooltipHint title="Imágenes del producto" description="Hasta 8 fotos en formato JPG, PNG o WebP (máximo 5MB cada una). La primera imagen seleccionada se usará como principal en el catálogo." />
        </span>
      </label>
      <ProductCreateImageCarousel
        files={files}
        primaryIndex={primaryIndex}
        onChange={(nextFiles, nextPrimary) => {
          setFiles(nextFiles);
          setPrimaryIndex(nextPrimary);
        }}
      />
    </div>
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

      <ProductFormFields
        key={prefillId || 'create'}
        categories={categories}
        initialData={initialData}
        initialValues={initialValues}
        storageKey={prefillId ? undefined : STORAGE_KEY}
        onSubmit={handleSubmit}
        onContinue={handleContinue}
        onCancel={() => router.back()}
        afterFields={afterFields}
      />
    </div>
  );
}
