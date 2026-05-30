'use client';

import { useState } from 'react';
import { useCustomerDebts } from '../hooks/useCustomerDebts';
import { useDebtPayment } from '../hooks/useDebtPayment';
import { DebtPaymentForm } from './DebtPaymentForm';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { DEBT_STATUS_LABELS, DEBT_STATUS_COLORS } from '@/core/customer/entities/customer-debt';
import type { RegisterDebtPaymentData } from '@/core/customer/entities/debt-payment';
import { toast } from '@/presentation/shared/components/ui/toast';
import { CreditCard } from '@/presentation/shared/components/ui/icon-mapping';

interface CustomerDebtListProps {
  customerId: string;
}

export function CustomerDebtList({ customerId }: CustomerDebtListProps) {
  const { debts, isLoading } = useCustomerDebts(customerId);
  const payment = useDebtPayment(customerId);
  const [payingId, setPayingId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (!debts.length) return <EmptyState message="Sin deudas registradas" />;

  const handlePayment = async (debtId: string, data: RegisterDebtPaymentData) => {
    await payment.mutateAsync({ debtId, data });
    toast.success('Pago registrado correctamente');
    setPayingId(null);
  };

  return (
    <div className="space-y-3">
      {debts.map((debt) => (
        <div key={debt.id} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                Deuda #{debt.id.slice(-6).toUpperCase()}
              </p>
              {debt.description && (
                <p className="text-xs text-gray-500">{debt.description}</p>
              )}
              {debt.dueDate && (
                <p className="text-xs text-gray-400">Vence: {debt.dueDate.slice(0, 10)}</p>
              )}
            </div>
            <Badge className={DEBT_STATUS_COLORS[debt.status]}>
              {DEBT_STATUS_LABELS[debt.status]}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 space-y-0.5">
            <p>Total: <span className="font-medium">{debt.originalAmount} {debt.currencyCode}</span></p>
            <p>Pendiente: <span className="font-semibold text-orange-600">{debt.pendingAmount} {debt.currencyCode}</span></p>
            {debt.paidAmount > 0 && (
              <p>Pagado: <span className="text-success">{debt.paidAmount} {debt.currencyCode}</span></p>
            )}
          </div>

          {debt.status !== 'PAID' && debt.status !== 'CANCELLED' && payingId !== debt.id && (
            <TooltipWrapper content="Registrar pago">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPayingId(debt.id)}
                title="Registrar pago para esta deuda"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Registrar pago
              </Button>
            </TooltipWrapper>
          )}

          {payingId === debt.id && (
            <DebtPaymentForm
              debtId={debt.id}
              pendingAmount={debt.pendingAmount}
              onSubmit={handlePayment}
              onCancel={() => setPayingId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
