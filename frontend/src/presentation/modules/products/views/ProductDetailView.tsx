'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { Card, CardContent } from '@/presentation/shared/components/ui/card';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { ProductInfoSection } from './ProductInfoSection';
import { ProductStatsSection } from './ProductStatsSection';


type Tab = 'info' | 'images';

const TAB_LABELS: Record<Tab, string> = {
  info: 'Información',
  images: 'Imágenes',
};

const repository = new ProductRepository();

interface ProductDetailViewProps {
  productId: string;
  onBack?: () => void;
}

export function ProductDetailView({ productId, onBack }: ProductDetailViewProps) {
  const [tab, setTab] = useState<Tab>('info');
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => repository.getById(productId),
    enabled: !!productId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !product) return <AlertMessage variant="error" message="Producto no encontrado" />;

  return (
    <div className="space-y-4">
      <ProductInfoSection product={product} onBack={onBack} />

      <div className="flex gap-0 border-b">
        {(Object.keys(TAB_LABELS) as Tab[]).map((currentTab) => (
          <TooltipWrapper key={currentTab} content={`Ver ${TAB_LABELS[currentTab]}`} side="top">
            <button
              type="button"
              onClick={() => setTab(currentTab)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === currentTab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_LABELS[currentTab]}
            </button>
          </TooltipWrapper>
        ))}
      </div>

      <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
        <CardContent>
          {tab === 'info' && <ProductStatsSection product={product} />}
          {tab === 'images' && (
            <ProductImageGallery productId={productId} editable={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}