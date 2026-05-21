'use client';

interface DebtInfoHeaderProps {
  originalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  notes?: string | null;
}

export function DebtInfoHeader({ originalAmount, paidAmount, pendingAmount, notes }: DebtInfoHeaderProps) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
      <div>
        <dt className="text-gray-500">Original</dt>
        <dd className="font-medium">{originalAmount}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Pagado</dt>
        <dd className="font-medium text-green-700">{paidAmount}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Pendiente</dt>
        <dd className="font-medium text-yellow-700">{pendingAmount}</dd>
      </div>
      {notes && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-gray-500">Notas</dt>
          <dd className="whitespace-pre-wrap">{notes}</dd>
        </div>
      )}
    </dl>
  );
}
