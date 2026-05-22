'use client';

import { ArrowLeft } from '@/presentation/shared/components/ui/icon-mapping';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { statusBadge } from '@/presentation/shared/lib/colors';
import { Button } from '@/presentation/shared/components/ui/Button';

interface SupplierInfoCardProps {
  supplier: { name: string; active: boolean };
  onBack?: () => void;
}

export function SupplierInfoCard({ supplier, onBack }: SupplierInfoCardProps) {
  return (
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
  );
}
