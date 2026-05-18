'use client';

import type { ProductFormData } from './ProductFormFields';
import { Input } from '@/presentation/shared/components/ui';

interface ProductPricingSectionProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: string) => void;
}

export function ProductPricingSection({ data, onChange }: ProductPricingSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-gray-900">Precios</h2>
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
    </section>
  );
}
