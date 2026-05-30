'use client';

import Link from 'next/link';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { ArrowLeft, Pencil, Sparkles } from '@/presentation/shared/components/ui/icon-mapping';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { Button } from '@/presentation/shared/components/ui/Button';

interface ProductInfoSectionProps {
  product: { id: string; name: string; status: string };
  onBack?: () => void;
}

export function ProductInfoSection({ product, onBack }: ProductInfoSectionProps) {
  return (
    <div className="rounded-2xl bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
      <div className="mb-2 flex items-center gap-2 text-cyan-100">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Ficha de producto</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <TooltipWrapper content="Volver al listado de productos" side="top">
              <Button size="sm" variant="ghost" onClick={onBack} className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          )}
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <Badge className={product.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}>
            {product.status === 'ACTIVE' ? 'Activo' : 'Archivado'}
          </Badge>
        </div>
        <TooltipWrapper content="Modificar este producto" side="top">
          <Link href={`/products/${product.id}/edit`}>
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              <Pencil className="mr-2 h-4 w-4" />
              Modificar
            </Button>
          </Link>
        </TooltipWrapper>
      </div>
    </div>
  );
}
