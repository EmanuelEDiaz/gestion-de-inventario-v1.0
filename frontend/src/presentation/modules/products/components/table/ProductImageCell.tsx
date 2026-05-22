import { Image as ImageIcon } from '@/presentation/shared/components/ui/icon-mapping';
import type { Product } from '@/core/product/entities/product';
import { getMediaUrl } from '@/presentation/shared/lib/utils';

interface ProductImageCellProps {
  product: Product;
  onPreview: (url: string) => void;
}

export function ProductImageCell({ product, onPreview }: ProductImageCellProps) {
  return (
    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <div
        className="h-10 w-10 shrink-0 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center cursor-zoom-in transition-transform hover:scale-105"
        onClick={(e) => {
          e.stopPropagation();
          if (product.mainImage) {
            onPreview(getMediaUrl(product.mainImage));
          }
        }}
      >
        {product.mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getMediaUrl(product.mainImage)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div>
        <div className="font-medium text-gray-900">{product.name}</div>
        {product.barcode && (
          <div className="text-sm text-gray-500">{product.barcode}</div>
        )}
      </div>
    </div>
  );
}
