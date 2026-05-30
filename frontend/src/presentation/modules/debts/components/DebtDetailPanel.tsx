'use client';

import { useState } from 'react';
import type { CustomerDebt } from '@/core/customer/entities/customer-debt';
import { useDebtDetail } from '../hooks/useDebtDetail';
import { useUpdateDebt, useCancelDebt } from '../hooks/useUpdateDebt';
import { useDebtPayment } from '@/presentation/modules/customers/hooks/useDebtPayment';
import { DebtPaymentForm } from '@/presentation/modules/customers/components/DebtPaymentForm';
import { DebtUpdateForm } from './DebtUpdateForm';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { DebtInfoHeader } from './DebtInfoHeader';
import { DebtActions } from './DebtActions';
import { DebtActionForms } from './DebtActionForms';

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
          <DebtActions
            status={current.status}
            showPayForm={showPayForm}
            showEditForm={showEditForm}
            onTogglePayForm={() => { setShowPayForm((v) => !v); setShowEditForm(false); }}
            onToggleEditForm={() => { setShowEditForm((v) => !v); setShowPayForm(false); }}
            onCancelDebt={() => cancelMutation.mutate()}
            cancelPending={cancelMutation.isPending}
          />

          <DebtActionForms
            showPayForm={showPayForm}
            showEditForm={showEditForm}
            payForm={
              <DebtPaymentForm
                debtId={debt.id}
                pendingAmount={current.pendingAmount}
                onSubmit={async (id, data) => {
                  await registerPayment({ debtId: id, data });
                  setShowPayForm(false);
                }}
                onCancel={() => setShowPayForm(false)}
              />
            }
            editForm={
              <DebtUpdateForm
                debt={current}
                onSubmit={async (data) => {
                  await updateMutation.mutateAsync(data);
                  setShowEditForm(false);
                }}
                onCancel={() => setShowEditForm(false)}
              />
            }
          />

          <DebtInfoHeader
            originalAmount={formatCurrency(current.originalAmount, current.currencyCode)}
            paidAmount={formatCurrency(current.paidAmount, current.currencyCode)}
            pendingAmount={formatCurrency(current.pendingAmount, current.currencyCode)}
            notes={current.notes}
          />
        </div>
      </td>
    </tr>
  );
}
