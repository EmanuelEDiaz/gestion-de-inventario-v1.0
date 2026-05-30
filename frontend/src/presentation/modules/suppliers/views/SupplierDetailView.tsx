'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SupplierRepository } from '@/infrastructure/repositories/supplier/SupplierRepository';
import { SupplierImageCarousel } from '../components/SupplierImageCarousel';
import { SupplierSocialLinks } from '../components/SupplierSocialLinks';
import { SupplierCatalogProducts } from '../components/SupplierCatalogProducts';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Card, CardContent } from '@/presentation/shared/components/ui/card';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { SupplierInfoCard } from './SupplierInfoCard';
import { SupplierContactList } from './SupplierContactList';
import { SupplierCatalogSummary } from './SupplierCatalogSummary';

type Tab = 'info' | 'images' | 'social' | 'catalog';

const repo = new SupplierRepository();

const TAB_LABELS: Record<Tab, string> = {
  info: 'Información',
  images: 'Imágenes',
  social: 'Redes Sociales',
  catalog: 'Catálogo',
};

interface SupplierDetailViewProps {
  supplierId: string;
  onBack?: () => void;
}

export function SupplierDetailView({ supplierId, onBack }: SupplierDetailViewProps) {
  const [tab, setTab] = useState<Tab>('info');

  const { data: supplier, isLoading, error } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => repo.findById(supplierId),
    enabled: !!supplierId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !supplier) return <AlertMessage variant="error" message="Proveedor no encontrado" />;

  return (
    <div className="space-y-4">
      <SupplierInfoCard supplier={supplier} onBack={onBack} />

      <div className="flex gap-0 border-b overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <TooltipWrapper content={`Ver ${TAB_LABELS[t]}`} side="top">
              <button
              key={t}
              onClick={() => setTab(t)}
              title={`Ver ${TAB_LABELS[t]}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
            </TooltipWrapper>
        ))}
      </div>

      <Card>
        <CardContent>
          {tab === 'info' && <SupplierContactList supplier={supplier} />}
          {tab === 'images' && <SupplierImageCarousel supplierId={supplierId} />}
          {tab === 'social' && <SupplierSocialLinks supplierId={supplierId} />}
          {tab === 'catalog' && (
            <SupplierCatalogSummary>
              <SupplierCatalogProducts supplierId={supplierId} />
            </SupplierCatalogSummary>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
