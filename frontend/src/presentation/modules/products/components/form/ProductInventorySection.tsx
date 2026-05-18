'use client';

import type { ProductFormData } from './ProductFormFields';
import { Input } from '@/presentation/shared/components/ui';
import { FormField } from '@/presentation/shared/components/FormField';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';

interface ProductInventorySectionProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: string) => void;
  unitOptions: { value: string; label: string }[];
}

export function ProductInventorySection({ data, onChange, unitOptions }: ProductInventorySectionProps) {
  return (
    <section className="space-y-4 border-t pt-6">
      <h2 className="font-semibold text-gray-900">Inventario</h2>
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
          <ComboboxSelect
            value={data.unitOfMeasure}
            onChange={(val) => onChange('unitOfMeasure', val)}
            options={unitOptions}
            placeholder="Seleccionar..."
          />
        </FormField>
      </div>
    </section>
  );
}
