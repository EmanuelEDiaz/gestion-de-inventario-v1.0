'use client';

import type { CustomerDebt } from '@/core/entities/customer-debt';
import { DEBT_STATUS_LABELS, DEBT_STATUS_COLORS } from '@/core/entities/customer-debt';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DebtRowProps {
  debt: CustomerDebt;
  expanded: boolean;
  onToggle: () => void;
}

export function DebtRow({ debt, expanded, onToggle }: DebtRowProps) {
  const overdue =
    debt.dueDate && debt.status !== 'PAID' && debt.status !== 'CANCELLED'
      ? new Date(debt.dueDate) < new Date()
      : false;

  return (
    <tr
      className={`cursor-pointer hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}
      onClick={onToggle}
      title="Clic para ver historial de pagos"
    >
      <td className="px-4 py-3 text-sm font-medium text-gray-700">
        {debt.description ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DEBT_STATUS_COLORS[debt.status]}`}>
          {DEBT_STATUS_LABELS[debt.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {formatCurrency(debt.originalAmount, debt.currencyCode)}
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium">
        {formatCurrency(debt.pendingAmount, debt.currencyCode)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {debt.dueDate
          ? <span className={overdue ? 'text-danger font-medium' : ''}>
              {new Date(debt.dueDate).toLocaleDateString('es')}
            </span>
          : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {new Date(debt.createdAt).toLocaleDateString('es')}
      </td>
      <td className="px-4 py-3">
        {expanded
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </td>
    </tr>
  );
}
