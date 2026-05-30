'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomerRepository } from '@/infrastructure/repositories/customer/CustomerRepository';
import { CustomerImageCarousel } from '../components/CustomerImageCarousel';
import { CustomerDebtList } from '../components/CustomerDebtList';
import { Card, CardContent } from '@/presentation/shared/components/ui/card';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { statusBadge } from '@/presentation/shared/lib/colors';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { ArrowLeft } from '@/presentation/shared/components/ui/icon-mapping';

type Tab = 'info' | 'images' | 'debts';

const repo = new CustomerRepository();

const TAB_LABELS: Record<Tab, string> = {
  info: 'Información',
  images: 'Imágenes',
  debts: 'Deudas',
};

interface CustomerDetailViewProps {
  customerId: string;
  onBack?: () => void;
}

export function CustomerDetailView({ customerId, onBack }: CustomerDetailViewProps) {
  const [tab, setTab] = useState<Tab>('info');

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => repo.findById(customerId),
    enabled: !!customerId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !customer) return <AlertMessage variant="error" message="Cliente no encontrado" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <TooltipWrapper content="Volver al listado de clientes">
            <Button size="sm" variant="ghost" onClick={onBack} title="Volver al listado de clientes">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
        )}
        <h1 className="text-xl font-semibold">{customer.name}</h1>
        <Badge className={statusBadge(customer.active)}>
          {customer.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="flex gap-0 border-b">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <TooltipWrapper content={`Ver ${TAB_LABELS[t]}`} side="top">
            <button
              key={t}
              onClick={() => setTab(t)}
              title={`Ver ${TAB_LABELS[t]}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
          {tab === 'info' && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">Código</dt><dd className="font-medium">{customer.code || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Contacto</dt><dd>{customer.contactName || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Teléfono</dt><dd>{customer.phone || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd>{customer.email || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Dirección</dt><dd>{customer.address || 'N/A'}</dd></div>
              <div><dt className="text-gray-500">Registrado</dt><dd>{formatDateShort(customer.createdAt)}</dd></div>
              {customer.notes && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Notas</dt>
                  <dd className="mt-0.5">{customer.notes}</dd>
                </div>
              )}
            </dl>
          )}
          {tab === 'images' && <CustomerImageCarousel customerId={customerId} />}
          {tab === 'debts' && <CustomerDebtList customerId={customerId} />}
        </CardContent>
      </Card>
    </div>
  );
}
