'use client';

import { useState } from 'react';
import type { CustomerDebt } from '@/core/entities/customer-debt';
import { useDebtDetail } from '../hooks/useDebtDetail';
import { useUpdateDebt, useCancelDebt } from '../hooks/useUpdateDebt';
import { useDebtPayment } from '@/presentation/modules/customers/hooks/useDebtPayment';
import { DebtPaymentForm } from '@/presentation/modules/customers/components/DebtPaymentForm';
import { DebtUpdateForm } from './DebtUpdateForm';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { Button } from '@/presentation/shared/components/ui/Button';

interface DebtDetailPanelProps {
  debt: CustomerDebt;
}

export function DebtDetailPanel({ debt }: DebtDetailPanelProps) {
  const { data: detail, isLoading } = useDebtDetail(debt.id);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const updateMutation = useUpdateDebt(debt.id);
  const cancelMutation = useCancelDebt(debt.id);
  const { registerPayment } = useDebtPayment(debt.customerId, debt.id);

  if (isLoading) return <tr><td colSpan={7} className="px-4 py-4"><LoadingSpinner /></td></tr>;

  const current = detail ?? debt;

  return (
    <tr>
      <td colSpan={7} className="px-4 pb-4 bg-gray-50 border-b">
        <div className="space-y-3 pt-3">
          {/* Acciones */}
          {current.status !== 'PAID' && current.status !== 'CANCELLED' && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowPayForm((v) => !v); setShowEditForm(false); }}
                title="Registrar un pago parcial o total de esta deuda"
              >
                {showPayForm ? 'Cancelar pago' : 'Registrar pago'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowEditForm((v) => !v); setShowPayForm(false); }}
                title="Editar descripción, vencimiento o notas de la deuda"
              >
                {showEditForm ? 'Cancelar edición' : 'Editar deuda'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-danger border-danger/20 hover:bg-danger/5"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                title="Cancelar esta deuda — acción irreversible"
              >
                Cancelar deuda
              </Button>
            </div>
          )}

          {showPayForm && (
            <DebtPaymentForm
              debtId={debt.id}
              pendingAmount={current.pendingAmount}
              onSubmit={async (id, data) => {
                await registerPayment({ debtId: id, data });
                setShowPayForm(false);
              }}
              onCancel={() => setShowPayForm(false)}
            />
          )}

          {showEditForm && (
            <DebtUpdateForm
              debt={current}
              onSubmit={async (data) => {
                await updateMutation.mutateAsync(data);
                setShowEditForm(false);
              }}
              onCancel={() => setShowEditForm(false)}
            />
          )}

          {/* Datos básicos */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <dt className="text-gray-500">Original</dt>
              <dd className="font-medium">{formatCurrency(current.originalAmount, current.currencyCode)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Pagado</dt>
              <dd className="font-medium text-green-700">{formatCurrency(current.paidAmount, current.currencyCode)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Pendiente</dt>
              <dd className="font-medium text-yellow-700">{formatCurrency(current.pendingAmount, current.currencyCode)}</dd>
            </div>
            {current.notes && (
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-gray-500">Notas</dt>
                <dd className="whitespace-pre-wrap">{current.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </td>
    </tr>
  );
}
