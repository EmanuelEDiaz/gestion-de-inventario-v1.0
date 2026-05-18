'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SupplierRepository } from '@/infrastructure/repositories/SupplierRepository';
import { SupplierImageCarousel } from '../components/SupplierImageCarousel';
import { SupplierSocialLinks } from '../components/SupplierSocialLinks';
import { SupplierCatalogProducts } from '../components/SupplierCatalogProducts';
import { Card, CardContent } from '@/presentation/shared/components/ui/card';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { statusBadge } from '@/presentation/shared/lib/colors';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { ArrowLeft } from 'lucide-react';

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
      <div className="flex items-center gap-2">
        {onBack && (
          <Button size="sm" variant="ghost" onClick={onBack} title="Volver al listado de proveedores">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-xl font-semibold">{supplier.name}</h1>
        <Badge className={statusBadge(supplier.active)}>
          {supplier.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="flex gap-0 border-b overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
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
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {tab === 'info' && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">Código</dt><dd className="font-medium">{supplier.code || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Contacto</dt><dd>{supplier.contactName || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Teléfono</dt><dd>{supplier.phone || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd>{supplier.email || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Sitio web</dt><dd>{supplier.website || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Dirección</dt><dd>{supplier.address || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Registrado</dt><dd>{formatDateShort(supplier.createdAt)}</dd></div>
              {supplier.notes && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Notas</dt>
                  <dd className="mt-0.5">{supplier.notes}</dd>
                </div>
              )}
            </dl>
          )}
          {tab === 'images' && <SupplierImageCarousel supplierId={supplierId} />}
          {tab === 'social' && <SupplierSocialLinks supplierId={supplierId} />}
          {tab === 'catalog' && <SupplierCatalogProducts supplierId={supplierId} />}
        </CardContent>
      </Card>
    </div>
  );
}
