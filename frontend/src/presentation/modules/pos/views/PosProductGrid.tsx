'use client';

import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import type { Product } from '@/core/product/entities/product';

interface PosProductGridProps {
  filteredProducts: Product[];
  productSearch: string;
  onAddProduct: (product: Product) => void;
  onClearSearch: () => void;
}

export function PosProductGrid({ filteredProducts, productSearch, onAddProduct, onClearSearch }: PosProductGridProps) {
  if (productSearch.trim().length >= 2 && filteredProducts.length === 0) {
    return <EmptyState message="Sin resultados para la búsqueda" />;
  }

  if (filteredProducts.length === 0) return null;

  return (
    <ul className="rounded-lg border divide-y max-h-64 overflow-y-auto">
      {filteredProducts.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex justify-between"
            onClick={() => {
              onAddProduct(p);
              onClearSearch();
            }}
            title={`Agregar ${p.name} al carrito`}
          >
            <span className="truncate font-medium">{p.name}</span>
            <span className="ml-2 text-gray-500 shrink-0">
              {formatCurrency(p.salePrice ?? 0, 'USD')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
