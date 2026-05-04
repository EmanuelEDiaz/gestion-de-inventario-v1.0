/**
 * ProductFormFields - Form fields for product create/edit
 * Reusable across create and edit views
 */

import type { Category } from '@/core/entities/category';
import type { UnitOfMeasure } from '@/core/entities/product';
import { Input } from '@/presentation/shared/components/ui';
import { FormField } from '@/presentation/shared/components/FormField';
import { Select } from '@/presentation/shared/components/Select';
import { Textarea } from '@/presentation/shared/components/Textarea';

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

interface ProductFormFieldsProps {
  data: ProductFormData;
  categories: Category[];
  onChange: (field: keyof ProductFormData, value: string) => void;
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

export function ProductFormFields({ data, categories, onChange }: ProductFormFieldsProps) {
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: '─'.repeat(cat.level) + ' ' + cat.name,
  }));

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="font-semibold text-gray-900">Información Básica</h2>
        <Input
          label="Nombre del Producto"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          required
          placeholder="Ej: Aceite de Motor 5W-30"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="SKU"
            value={data.sku}
            onChange={(e) => onChange('sku', e.target.value)}
            placeholder="Ej: ACE-5W30-1L"
          />
          <Input
            label="Código de Barras"
            value={data.barcode}
            onChange={(e) => onChange('barcode', e.target.value)}
            placeholder="Ej: 7501234567890"
          />
        </div>
        <FormField label="Descripción">
          <Textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            placeholder="Descripción del producto..."
          />
        </FormField>
        <FormField label="Categoría">
          <Select
            value={data.categoryId}
            onChange={(e) => onChange('categoryId', e.target.value)}
            options={categoryOptions}
            placeholder="Sin categoría"
          />
        </FormField>
      </section>

      {/* Pricing */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="font-semibold text-gray-900">Precios e Inventario</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Costo Estándar"
            type="number"
            step="0.01"
            min="0"
            value={data.standardCost}
            onChange={(e) => onChange('standardCost', e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Precio de Venta"
            type="number"
            step="0.01"
            min="0"
            value={data.salePrice}
            onChange={(e) => onChange('salePrice', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Punto de Reorden"
            type="number"
            min="0"
            value={data.reorderPoint}
            onChange={(e) => onChange('reorderPoint', e.target.value)}
            placeholder="10"
          />
          <Input
            label="Tasa de Impuesto (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={data.taxRate}
            onChange={(e) => onChange('taxRate', e.target.value)}
            placeholder="0"
          />
          <FormField label="Unidad de Medida">
            <Select
              value={data.unitOfMeasure}
              onChange={(e) => onChange('unitOfMeasure', e.target.value)}
              options={UNIT_OPTIONS}
            />
          </FormField>
        </div>
      </section>
    </div>
  );
}
