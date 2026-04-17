/**
 * WarehouseCard - Card component for warehouse display
 */

import Link from 'next/link';
import type { Warehouse } from '@/core/entities/warehouse';
import { Button } from '@/presentation/shared/components/ui';
import { Card, CardHeader } from '@/presentation/shared/components/Card';
import { StatusBadge } from '@/presentation/shared/components/StatusBadge';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onToggleStatus: (warehouse: Warehouse) => void;
}

export function WarehouseCard({ warehouse, onToggleStatus }: WarehouseCardProps) {
  return (
    <Card inactive={!warehouse.active}>
      <CardHeader
        title={warehouse.name}
        subtitle={`Código: ${warehouse.code}`}
        badge={<StatusBadge active={warehouse.active} />}
      />
      {warehouse.address && (
        <p className="mb-4 text-sm text-gray-600">{warehouse.address}</p>
      )}
      <div className="flex gap-2">
        <Link href={`/warehouses/${warehouse.id}/edit`} className="flex-1">
          <Button variant="secondary" className="w-full">
            Editar
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={() => onToggleStatus(warehouse)}
          className={warehouse.active ? 'text-red-600' : 'text-green-600'}
        >
          {warehouse.active ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
    </Card>
  );
}
