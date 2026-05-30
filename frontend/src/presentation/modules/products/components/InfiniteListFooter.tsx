'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';

interface InfiniteListFooterProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  productsLength: number;
}

export function InfiniteListFooter({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  productsLength,
}: InfiniteListFooterProps) {
  if (hasNextPage) {
    return (
      <div className="flex justify-center">
        <TooltipWrapper content="Cargar más productos" side="top">
          <Button variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Cargando...
            </>
          ) : (
            'Cargar más productos'
          )}
        </Button>
        </TooltipWrapper>
      </div>
    );
  }

  if (productsLength > 0) {
    return (
      <p className="text-center text-sm text-gray-500">
        No hay más productos para mostrar
      </p>
    );
  }

  return null;
}
