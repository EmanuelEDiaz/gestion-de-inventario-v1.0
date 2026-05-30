'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';

interface DebtActionsProps {
  status: string;
  showPayForm: boolean;
  showEditForm: boolean;
  onTogglePayForm: () => void;
  onToggleEditForm: () => void;
  onCancelDebt: () => void;
  cancelPending: boolean;
}

export function DebtActions({ status, showPayForm, showEditForm, onTogglePayForm, onToggleEditForm, onCancelDebt, cancelPending }: DebtActionsProps) {
  if (status === 'PAID' || status === 'CANCELLED') return null;

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipWrapper content="Registrar pago">
        <Button
          type="button"
          variant="outline"
          onClick={onTogglePayForm}
          title="Registrar un pago parcial o total de esta deuda"
        >
          {showPayForm ? 'Cancelar pago' : 'Registrar pago'}
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content="Editar deuda">
        <Button
          type="button"
          variant="outline"
          onClick={onToggleEditForm}
          title="Editar descripción, vencimiento o notas de la deuda"
        >
          {showEditForm ? 'Cancelar edición' : 'Editar deuda'}
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content="Cancelar deuda — acción irreversible">
        <Button
          type="button"
          variant="outline"
          className="text-danger border-danger/20 hover:bg-danger/5"
          onClick={onCancelDebt}
          disabled={cancelPending}
          title="Cancelar esta deuda — acción irreversible"
        >
          Cancelar deuda
        </Button>
      </TooltipWrapper>
    </div>
  );
}
