/**
 * ProductRow - Single row in products table
 */

import Link from 'next/link';
import type { Product } from '@/core/entities/product';
import { StatusBadge } from '@/presentation/shared/components/StatusBadge';
import { Button } from '@/presentation/shared/components/ui';

interface ProductRowProps {
  product: Product;
  onEdit?: (product: Product) => void;
}

export function ProductRow({ product, onEdit }: ProductRowProps) {
  const formatPrice = (price: number | null) =>
    price != null ? `$${price.toFixed(2)}` : '-';

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="font-medium text-gray-900">{product.name}</div>
        {product.barcode && (
          <div className="text-sm text-gray-500">{product.barcode}</div>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {product.sku || '-'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {product.categoryName || '-'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
        {formatPrice(product.salePrice)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-center">
        <StatusBadge active={product.status === 'ACTIVE'} />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right">
        <Link href={`/products/${product.id}/edit`}>
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        </Link>
      </td>
    </tr>
  );
}
