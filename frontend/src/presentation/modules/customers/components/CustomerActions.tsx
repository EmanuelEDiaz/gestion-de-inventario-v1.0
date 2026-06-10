'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Eye, EyeOff, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

interface CustomerActionsProps {
  id: string;
  active: boolean;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CustomerActions({ id, active, onActivate, onDeactivate, onDelete }: CustomerActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {active && onDeactivate && (
        <TooltipWrapper content="Desactivar cliente" side="left">
          <Button size="sm" variant="ghost" onClick={() => onDeactivate(id)} title="Desactivar">
            <EyeOff className="h-4 w-4 text-orange-600" />
          </Button>
        </TooltipWrapper>
      )}
      {!active && onActivate && (
        <TooltipWrapper content="Activar cliente" side="left">
          <Button size="sm" variant="ghost" onClick={() => onActivate(id)} title="Activar">
            <Eye className="h-4 w-4 text-green-600" />
          </Button>
        </TooltipWrapper>
      )}
      {onDelete && (
        <TooltipWrapper content="Eliminar cliente" side="left">
          <Button size="sm" variant="ghost" onClick={() => onDelete(id)} title="Eliminar">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
