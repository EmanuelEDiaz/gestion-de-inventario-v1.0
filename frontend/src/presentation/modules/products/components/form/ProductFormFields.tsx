import type { Category } from '@/core/entities/category';
import type { UnitOfMeasure } from '@/core/entities/product';
import { ProductBasicInfoSection } from './ProductBasicInfoSection';
import { ProductPricingSection } from './ProductPricingSection';
import { ProductInventorySection } from './ProductInventorySection';

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
      <ProductBasicInfoSection
        data={data}
        onChange={onChange}
        categoryOptions={categoryOptions}
      />
      <ProductPricingSection
        data={data}
        onChange={onChange}
      />
      <ProductInventorySection
        data={data}
        onChange={onChange}
        unitOptions={UNIT_OPTIONS}
      />
    </div>
  );
}
