/**
 * ProductRow - Single row in products table
 */

import Image from 'next/image';
import { Box } from 'lucide-react';
import type { Product } from '@/core/entities/product';
import { StatusBadge } from '@/presentation/shared/components/StatusBadge';
import { IconButton } from '@/presentation/shared/components/IconButton';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { productRepository } from '@/infrastructure/repositories/ProductRepository';

interface ProductRowProps {
  product: Product;
  onDeleteSuccess?: () => void;
}

export function ProductRow({ product, onDeleteSuccess }: ProductRowProps) {
  const formatPrice = (price: number | null) =>
    price != null ? `$${price.toFixed(2)}` : '-';

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      return;
    }
    
    try {
      await productRepository.delete(product.id);
      toast.success('Producto eliminado correctamente');
      onDeleteSuccess?.();
    } catch {
      toast.error('Error al eliminar el producto');
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
            {product.mainImage ? (
              <Image
                src={product.mainImage}
                alt={product.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <Box className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            {product.barcode && (
              <div className="text-sm text-gray-500">{product.barcode}</div>
            )}
          </div>
        </div>
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
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            title="Ver detalles del producto"
            href={`/products/${product.id}`}
            size="sm"
          />
          <IconButton
            icon={Pencil}
            title="Modificar información del producto"
            href={`/products/${product.id}/edit`}
            size="sm"
          />
          <IconButton
            icon={Trash2}
            title="Eliminar producto del sistema"
            onClick={handleDelete}
            variant="danger"
            size="sm"
          />
        </div>
      </td>
    </tr>
  );
}
