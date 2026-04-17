/**
 * ProductTable - Table displaying products list
 * Max 100 lines per component rule
 */

import type { Product } from '@/core/entities/product';
import { ProductRow } from './ProductRow';

interface ProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
}

export function ProductTable({ products, onEdit }: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Categoría
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Precio
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
