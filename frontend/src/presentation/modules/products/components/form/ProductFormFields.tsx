'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import type { Category } from '@/core/category/entities/category';
import type { UnitOfMeasure } from '@/core/product/entities/product';
import { createProductSchema, updateProductSchema } from '@/core/validators/product-validators';

export interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  standardCost: string;
  salePrice: string;
  reorderPoint: string;
  taxRate: string;
  unitOfMeasure: UnitOfMeasure;
}

const UNIT_OPTIONS = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'L', label: 'Litro' },
  { value: 'M', label: 'Metro' },
  { value: 'M2', label: 'Metro cuadrado' },
  { value: 'BOX', label: 'Caja' },
  { value: 'PACK', label: 'Paquete' },
];

const INITIAL_VALUES: ProductFormData = {
  name: '', sku: '', barcode: '', description: '', categoryId: '',
  standardCost: '0', salePrice: '0', reorderPoint: '0', taxRate: '0', unitOfMeasure: 'UNIT',
};

interface ProductFormFieldsProps {
  categories: Category[];
  initialData?: ProductFormData;
  initialValues?: Record<string, unknown>;
  storageKey: string;
  isEditing?: boolean;
  persistCreateValues?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onContinue?: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  afterFields?: React.ReactNode;
  continueAfterFields?: React.ReactNode;
}

export function ProductFormFields({
  categories, initialData, initialValues, storageKey,
  isEditing, onSubmit, onContinue, onCancel, afterFields, continueAfterFields,
  persistCreateValues,
}: ProductFormFieldsProps) {
  const mergedInitial = useMemo(() => {
    const base = { ...INITIAL_VALUES, ...initialData };
    if (initialValues) {
      for (const [key, value] of Object.entries(initialValues)) {
        if (value != null && key in INITIAL_VALUES) {
          (base as Record<string, string>)[key] = String(value);
        }
      }
    }
    return base;
  }, [initialData, initialValues]);

  const [name, setName] = useState(mergedInitial.name);
  const [sku, setSku] = useState(mergedInitial.sku);
  const [barcode, setBarcode] = useState(mergedInitial.barcode);
  const [description, setDescription] = useState(mergedInitial.description);
  const [categoryId, setCategoryId] = useState(mergedInitial.categoryId);
  const [standardCost, setStandardCost] = useState(mergedInitial.standardCost);
  const [salePrice, setSalePrice] = useState(mergedInitial.salePrice);
  const [reorderPoint, setReorderPoint] = useState(mergedInitial.reorderPoint);
  const [taxRate, setTaxRate] = useState(mergedInitial.taxRate);
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>(mergedInitial.unitOfMeasure as UnitOfMeasure);

  useEffect(() => {
    if (isEditing) return;
    if (categories.length === 0) return;
    if (!categoryId) setCategoryId(categories[0].id);
  }, [categories, categoryId, isEditing]);

  const values: Record<string, string> = useMemo(() => ({
    name, sku, barcode, description, categoryId,
    standardCost, salePrice, reorderPoint, taxRate, unitOfMeasure,
  }), [name, sku, barcode, description, categoryId, standardCost, salePrice, reorderPoint, taxRate, unitOfMeasure]);

  const onChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      name: setName, sku: setSku, barcode: setBarcode,
      description: setDescription, categoryId: setCategoryId,
      standardCost: setStandardCost, salePrice: setSalePrice,
      reorderPoint: setReorderPoint, taxRate: setTaxRate,
      unitOfMeasure: (v) => setUnitOfMeasure(v as UnitOfMeasure),
    };
    setters[field]?.(value);
  }, []);

  const categoryOptions = useMemo(() =>
    categories.map((cat) => ({
      value: cat.id,
      label: '─'.repeat(cat.level) + ' ' + cat.name,
    })),
    [categories],
  );

  const fields: EntityFormField[] = useMemo(() => [
    { name: 'section-basic', label: 'Información Básica', type: 'section-header' },
    { name: 'name', label: 'Nombre del Producto', type: 'text', required: true, maxLength: 200, placeholder: 'Ej: Aceite de Motor 5W-30', hint: 'Nombre del producto', hintDescription: 'Nombre único para identificar el producto en el catálogo y en los comprobantes de venta.' },
    { name: 'sku', label: 'SKU', type: 'text', maxLength: 50, placeholder: 'Ej: ACE-5W30-1L', className: 'sm:col-span-1', hint: 'SKU (Stock Keeping Unit)', hintDescription: 'Código alfanumérico único interno para identificar el producto en el sistema de inventario.' },
    { name: 'barcode', label: 'Código de Barras', type: 'text', maxLength: 50, placeholder: 'Ej: 7501234567890', className: 'sm:col-span-1', hint: 'Código de Barras', hintDescription: 'Código numérico único de 8 a 14 dígitos para lector de barras (opcional).' },
    { name: 'description', label: 'Descripción', type: 'textarea', maxLength: 2000, placeholder: 'Descripción del producto...', rows: 3, hint: 'Descripción del producto', hintDescription: 'Información adicional del producto: características, especificaciones técnicas, uso sugerido.' },
    { name: 'categoryId', label: 'Categoría', type: 'select', options: categoryOptions, placeholder: 'Sin categoría', emptyMessage: 'No hay categorías disponibles', autoSelectFirst: true, hint: 'Categoría del producto', hintDescription: 'Clasifica el producto dentro de una categoría existente para organizar el catálogo.' },
    { name: 'section-pricing', label: 'Precios', type: 'section-header' },
    { name: 'standardCost', label: 'Costo Estándar', type: 'number', step: '0.01', min: 0, placeholder: '0.00', hint: 'Costo del producto', hintDescription: 'Precio de compra al proveedor por unidad. Usado para calcular el margen de ganancia.', className: 'sm:col-span-1' },
    { name: 'salePrice', label: 'Precio de Venta', type: 'number', step: '0.01', min: 0, placeholder: '0.00', hint: 'Precio de venta', hintDescription: 'Precio final de venta al público. Se muestra en el catálogo y se usa en las facturas.', className: 'sm:col-span-1' },
    { name: 'section-inventory', label: 'Inventario', type: 'section-header' },
    { name: 'reorderPoint', label: 'Punto de Reorden', type: 'number', min: 0, placeholder: '10', hint: 'Stock mínimo', hintDescription: 'Cuando el stock disponible baje de este nivel, el sistema generará una alerta de reabastecimiento.', className: 'sm:col-span-1' },
    { name: 'taxRate', label: 'Tasa de Impuesto (%)', type: 'number', step: '0.01', min: 0, max: 100, placeholder: '0', hint: 'Impuesto aplicado', hintDescription: 'Porcentaje de impuesto que se aplica al producto (IVA, ITBIS, etc.).', className: 'sm:col-span-1' },
    { name: 'unitOfMeasure', label: 'Unidad de Medida', type: 'select', options: UNIT_OPTIONS, placeholder: 'Seleccionar...', hint: 'Unidad de medida', hintDescription: 'Unidad en la que se mide, comercializa y controla el stock del producto.', className: 'sm:col-span-1' },
  ], [categoryOptions]);

  const handleSubmitAction = useCallback(async (formValues: Record<string, string>) => {
    await onSubmit(formValues as unknown as ProductFormData);
  }, [onSubmit]);

  const handleContinueAction = useCallback(async () => {
    if (!onContinue) return;
    await onContinue(values as unknown as ProductFormData);
  }, [onContinue, values]);

  return (
    <EntityForm
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      description={isEditing ? 'Modifica los datos del producto' : 'Completa los datos del producto'}
      fields={fields}
      values={values}
      onChange={onChange}
      onSubmitAction={handleSubmitAction}
      onCancel={onCancel}
      onContinue={onContinue ? handleContinueAction : undefined}
      isEditing={isEditing}
      createSchema={createProductSchema}
      updateSchema={updateProductSchema}
      storageKey={storageKey}
      persistCreateValues={persistCreateValues}
      initialValues={initialValues}
      afterFields={afterFields}
      continueAfterFields={continueAfterFields}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Producto'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Guardando...'}
      className="border-0 bg-white/80 backdrop-blur-sm shadow-xl"
    />
  );
}
