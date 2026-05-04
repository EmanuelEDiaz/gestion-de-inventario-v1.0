'use client';

import { useState } from 'react';
import { useDebts } from '../hooks/useDebts';
import { DebtRow } from '../components/DebtRow';
import { DebtDetailPanel } from '../components/DebtDetailPanel';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
import type { DebtStatus } from '@/core/entities/customer-debt';

const STATUS_OPTIONS: { value: DebtStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Pago parcial' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

export function DebtsListView() {
  const [status, setStatus] = useState<DebtStatus | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: debts, isLoading } = useDebts(status || undefined);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <ComboboxSelect
          options={STATUS_OPTIONS}
          value={status}
          onChange={(val) => { setStatus(val as DebtStatus | ''); setExpandedId(null); }}
          className="w-40"
          placeholder="Filtrar por estado"
        />
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && (!debts || debts.length === 0) && (
        <EmptyState message="No hay deudas registradas con este filtro" />
      )}

      {!isLoading && debts && debts.length > 0 && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Original</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Pendiente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Vencimiento</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {debts.map((debt) => (
                <>
                  <DebtRow
                    key={debt.id}
                    debt={debt}
                    expanded={expandedId === debt.id}
                    onToggle={() => setExpandedId(expandedId === debt.id ? null : debt.id)}
                  />
                  {expandedId === debt.id && (
                    <DebtDetailPanel key={`panel-${debt.id}`} debt={debt} />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
