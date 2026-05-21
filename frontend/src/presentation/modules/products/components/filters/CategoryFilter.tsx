'use client';

import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import type { Category } from '@/core/category/entities/category';

interface CategoryFilterProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Categoría</label>
      <ComboboxSelect
        options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
        value={value}
        onChange={onChange}
        placeholder="Todas las categorías"
      />
    </div>
  );
}
