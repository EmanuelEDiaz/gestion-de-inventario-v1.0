import Link from 'next/link';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import { Button } from '@/presentation/shared/components/ui';
import { Card, CardHeader, CardTitle, CardDescription } from '@/presentation/shared/components/ui/card';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { statusBadge } from '@/presentation/shared/lib/colors';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onToggleStatus: (warehouse: Warehouse) => void;
}

export function WarehouseCard({ warehouse, onToggleStatus }: WarehouseCardProps) {
  return (
    <Card className={!warehouse.active ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>{warehouse.name}</CardTitle>
            <CardDescription>Código: {warehouse.code}</CardDescription>
          </div>
          <Badge className={statusBadge(warehouse.active)}>
            {warehouse.active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>
      {warehouse.address && (
        <p className="mb-4 px-6 text-sm text-muted-foreground">{warehouse.address}</p>
      )}
      <div className="flex gap-2 px-6 pb-6">
        <Link href={`/warehouses/${warehouse.id}/edit`} className="flex-1">
          <Button variant="secondary" className="w-full">
            Editar
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={() => onToggleStatus(warehouse)}
          className={warehouse.active ? 'text-danger' : 'text-success'}
        >
          {warehouse.active ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
    </Card>
  );
}
