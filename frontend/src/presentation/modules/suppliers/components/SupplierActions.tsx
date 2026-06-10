'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Eye, EyeOff, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

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
        <TooltipWrapper content="Desactivar proveedor" side="left">
          <Button size="sm" variant="ghost" onClick={() => onDeactivate(id)} title="Desactivar">
            <EyeOff className="h-4 w-4 text-orange-600" />
          </Button>
        </TooltipWrapper>
      )}
      {!active && onActivate && (
        <TooltipWrapper content="Activar proveedor" side="left">
          <Button size="sm" variant="ghost" onClick={() => onActivate(id)} title="Activar">
            <Eye className="h-4 w-4 text-success" />
          </Button>
        </TooltipWrapper>
      )}
      {onDelete && (
        <TooltipWrapper content="Eliminar proveedor" side="left">
          <Button size="sm" variant="ghost" onClick={() => onDelete(id)} title="Eliminar">
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
