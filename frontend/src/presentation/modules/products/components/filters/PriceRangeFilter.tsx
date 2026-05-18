'use client';

import { Input } from '@/presentation/shared/components/ui/Input';

interface PriceRangeFilterProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function PriceRangeFilter({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceRangeFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Rango de Precio</label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
          className="w-full"
        />
        <span className="text-gray-400">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}
