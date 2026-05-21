'use client';

import type { Supplier } from '@/core/supplier/entities/supplier';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface SupplierActionsProps {
  id: string;
  active: boolean;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SupplierActions({ id, active, onActivate, onDeactivate, onDelete }: SupplierActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {active && onDeactivate && (
        <Button size="sm" variant="ghost" onClick={() => onDeactivate(id)} title="Desactivar">
          <EyeOff className="h-4 w-4 text-orange-600" />
        </Button>
      )}
      {!active && onActivate && (
        <Button size="sm" variant="ghost" onClick={() => onActivate(id)} title="Activar">
          <Eye className="h-4 w-4 text-success" />
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="ghost" onClick={() => onDelete(id)} title="Eliminar">
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      )}
    </div>
  );
}
