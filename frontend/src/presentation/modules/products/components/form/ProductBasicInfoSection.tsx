'use client';

import type { ProductFormData } from './ProductFormFields';
import { Input } from '@/presentation/shared/components/ui';
import { FormField } from '@/presentation/shared/components/FormField';
import { Textarea } from '@/presentation/shared/components/Textarea';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';

interface ProductBasicInfoSectionProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: string) => void;
  categoryOptions: { value: string; label: string }[];
}

export function ProductBasicInfoSection({ data, onChange, categoryOptions }: ProductBasicInfoSectionProps) {
  return (
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
        <ComboboxSelect
          value={data.categoryId}
          onChange={(val) => onChange('categoryId', val)}
          options={categoryOptions}
          placeholder="Sin categoría"
          searchPlaceholder="Buscar categoría..."
        />
      </FormField>
    </section>
  );
}
