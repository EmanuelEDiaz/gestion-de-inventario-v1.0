'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Plus } from '@/presentation/shared/components/ui/icon-mapping';

interface AdjustmentToolbarProps {
  onAddLine: () => void;
}

export function AdjustmentToolbar({ onAddLine }: AdjustmentToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium">Líneas de Ajuste</h3>
      <TooltipWrapper content="Agregar línea de ajuste" side="top">
        <Button type="button" size="sm" variant="outline" onClick={onAddLine}>
          <Plus className="h-4 w-4 mr-1" /> Línea
        </Button>
      </TooltipWrapper>
    </div>
  );
}
