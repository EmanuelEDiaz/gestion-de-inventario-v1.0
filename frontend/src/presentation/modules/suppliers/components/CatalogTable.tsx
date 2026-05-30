'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

interface CatalogProduct {
  id: string;
  description: string | null;
  unitPrice: number | null;
  currencyCode: string | null;
}

interface CatalogTableProps {
  products: CatalogProduct[];
  onRemove: (id: string) => void;
}

export function CatalogTable({ products, onRemove }: CatalogTableProps) {
  if (products.length === 0) return null;

  return (
    <div className="divide-y rounded-lg border">
      {products.map((p) => (
        <div key={p.id} className="flex items-center justify-between px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" title={p.description || ''}>
              {p.description || '(sin descripción)'}
            </p>
            {p.unitPrice != null && (
              <p className="text-xs text-gray-500">
                {p.unitPrice} {p.currencyCode || ''}
              </p>
            )}
          </div>
          <TooltipWrapper content="Eliminar del catálogo">
            <button
              className="ml-2 p-1 rounded hover:bg-red-50"
              onClick={() => onRemove(p.id)}
              title="Eliminar del catálogo"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </TooltipWrapper>
        </div>
      ))}
    </div>
  );
}
