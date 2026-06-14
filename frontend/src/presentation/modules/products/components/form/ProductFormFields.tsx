'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import { toast } from '@/presentation/shared/components/ui';
import type { Category } from '@/core/category/entities/category';
import type { UnitOfMeasure } from '@/core/product/entities/product';

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

const FIELD_VALIDATORS: Record<string, (value: string, allValues: Record<string, string>) => string | undefined> = {
  name: (v) => {
    if (!v.trim()) return 'El nombre del producto es obligatorio';
    if (v.length > 200) return 'El nombre no puede exceder 200 caracteres';
    return undefined;
  },
  sku: (v) => {
    if (v && v.length > 50) return 'El SKU no puede exceder 50 caracteres';
    return undefined;
  },
  barcode: (v) => {
    if (!v) return undefined;
    if (v.length > 50) return 'El código de barras no puede exceder 50 caracteres';
    if (!/^\d+$/.test(v)) return 'El código de barras debe contener solo números';
    if (v.length < 8) return 'El código de barras debe tener al menos 8 dígitos';
    return undefined;
  },
  description: (v) => {
    if (v && v.length > 2000) return 'La descripción no puede exceder 2000 caracteres';
    return undefined;
  },
  standardCost: (v) => {
    if (!v) return undefined;
    const n = parseFloat(v);
    if (isNaN(n)) return 'El costo debe ser un número válido';
    if (n < 0) return 'El costo no puede ser negativo';
    return undefined;
  },
  salePrice: (v) => {
    if (!v) return undefined;
    const n = parseFloat(v);
    if (isNaN(n)) return 'El precio debe ser un número válido';
    if (n < 0) return 'El precio no puede ser negativo';
    return undefined;
  },
  reorderPoint: (v) => {
    if (!v) return undefined;
    const n = parseFloat(v);
    if (isNaN(n)) return 'El punto de reorden debe ser un número válido';
    if (n < 0) return 'El punto de reorden no puede ser negativo';
    return undefined;
  },
  taxRate: (v) => {
    if (!v) return undefined;
    const n = parseFloat(v);
    if (isNaN(n)) return 'La tasa de impuesto debe ser un número válido';
    if (n < 0) return 'La tasa de impuesto no puede ser negativa';
    if (n > 100) return 'La tasa de impuesto no puede exceder 100%';
    return undefined;
  },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalFieldErrors, setExternalFieldErrors] = useState<Record<string, string>>({});

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
    { name: 'name', label: 'Nombre del Producto', type: 'text', required: true, maxLength: 200, placeholder: 'Ej: Aceite de Motor 5W-30', validate: FIELD_VALIDATORS.name, hint: 'Nombre del producto', hintDescription: 'Nombre único para identificar el producto en el catálogo y en los comprobantes de venta.' },
    { name: 'sku', label: 'SKU', type: 'text', maxLength: 50, placeholder: 'Ej: ACE-5W30-1L', className: 'sm:col-span-1', validate: FIELD_VALIDATORS.sku, hint: 'SKU (Stock Keeping Unit)', hintDescription: 'Código alfanumérico único interno para identificar el producto en el sistema de inventario.' },
    { name: 'barcode', label: 'Código de Barras', type: 'text', maxLength: 50, placeholder: 'Ej: 7501234567890', className: 'sm:col-span-1', validate: FIELD_VALIDATORS.barcode, hint: 'Código de Barras', hintDescription: 'Código numérico único de 8 a 14 dígitos para lector de barras (opcional). Ej: 7501234567890.' },
    { name: 'description', label: 'Descripción', type: 'textarea', maxLength: 2000, placeholder: 'Descripción del producto...', rows: 3, validate: FIELD_VALIDATORS.description, hint: 'Descripción del producto', hintDescription: 'Información adicional del producto: características, especificaciones técnicas, uso sugerido.' },
    { name: 'categoryId', label: 'Categoría', type: 'select', options: categoryOptions, placeholder: 'Sin categoría', emptyMessage: 'No hay categorías disponibles', autoSelectFirst: true, hint: 'Categoría del producto', hintDescription: 'Clasifica el producto dentro de una categoría existente para organizar el catálogo.' },
    { name: 'section-pricing', label: 'Precios', type: 'section-header' },
    { name: 'standardCost', label: 'Costo Estándar', type: 'number', step: '0.01', min: 0, placeholder: '0.00', validate: FIELD_VALIDATORS.standardCost, hint: 'Costo del producto', hintDescription: 'Precio de compra al proveedor por unidad. Usado para calcular el margen de ganancia.', className: 'sm:col-span-1' },
    { name: 'salePrice', label: 'Precio de Venta', type: 'number', step: '0.01', min: 0, placeholder: '0.00', validate: FIELD_VALIDATORS.salePrice, hint: 'Precio de venta', hintDescription: 'Precio final de venta al público. Se muestra en el catálogo y se usa en las facturas.', className: 'sm:col-span-1' },
    { name: 'section-inventory', label: 'Inventario', type: 'section-header' },
    { name: 'reorderPoint', label: 'Punto de Reorden', type: 'number', min: 0, placeholder: '10', validate: FIELD_VALIDATORS.reorderPoint, hint: 'Stock mínimo', hintDescription: 'Cuando el stock disponible baje de este nivel, el sistema generará una alerta de reabastecimiento.', className: 'sm:col-span-1' },
    { name: 'taxRate', label: 'Tasa de Impuesto (%)', type: 'number', step: '0.01', min: 0, max: 100, placeholder: '0', validate: FIELD_VALIDATORS.taxRate, hint: 'Impuesto aplicado', hintDescription: 'Porcentaje de impuesto que se aplica al producto (IVA, ITBIS, etc.). Se usa para calcular el precio con impuesto incluido.', className: 'sm:col-span-1' },
    { name: 'unitOfMeasure', label: 'Unidad de Medida', type: 'select', options: UNIT_OPTIONS, placeholder: 'Seleccionar...', hint: 'Unidad de medida', hintDescription: 'Unidad en la que se mide, comercializa y controla el stock del producto.', className: 'sm:col-span-1' },
  ], [categoryOptions]);

  const mapBackendErrorToField = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    const fieldErrors: Record<string, string> = {};
    if (message.includes('sku') && (message.includes('ya existe') || message.includes('duplicado') || message.includes('conflict'))) {
      fieldErrors.sku = err instanceof Error ? err.message : 'Ya existe un producto con este SKU';
    } else if (message.includes('código de barras') && (message.includes('ya existe') || message.includes('duplicado') || message.includes('conflict'))) {
      fieldErrors.barcode = err instanceof Error ? err.message : 'Ya existe un producto con este código de barras';
    }
    if (Object.keys(fieldErrors).length > 0) {
      setExternalFieldErrors(fieldErrors);
    }
    return Object.keys(fieldErrors).length > 0;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setExternalFieldErrors({});
    try {
      await onSubmit(values as unknown as ProductFormData);
    } catch (err) {
      const mapped = mapBackendErrorToField(err);
      if (!mapped) {
        const message = err instanceof Error ? err.message : (isEditing ? 'Error al actualizar el producto' : 'Error al crear el producto');
        toast.error(err instanceof Error ? err : 'Error al crear el producto');
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, isEditing, mapBackendErrorToField]);

  const handleContinue = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setExternalFieldErrors({});
    try {
      await onContinue?.(values as unknown as ProductFormData);
    } catch (err) {
      const mapped = mapBackendErrorToField(err);
      if (!mapped) {
        toast.error(err instanceof Error ? err : 'Error al crear el producto');
        setError('Error al crear el producto');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onContinue, mapBackendErrorToField]);

  return (
    <EntityForm
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      description={isEditing ? 'Modifica los datos del producto' : 'Completa los datos del producto'}
      fields={fields}
      values={values}
      onChange={onChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      onContinue={onContinue ? handleContinue : undefined}
      isSubmitting={isSubmitting}
      isEditing={isEditing}
      error={error}
      externalFieldErrors={externalFieldErrors}
      onClearExternalFieldError={(field) => setExternalFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; })}
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
