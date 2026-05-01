'use client';

import { useState } from 'react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Select } from '@/presentation/shared/components/Select';
import { Textarea } from '@/presentation/shared/components/Textarea';
import type { RegisterDebtPaymentData } from '@/core/entities/debt-payment';
import type { DebtPaymentMethod } from '@/core/entities/customer-debt';

const METHODS: { value: DebtPaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'OTHER', label: 'Otro' },
];

interface DebtPaymentFormProps {
  debtId: string;
  pendingAmount: number;
  onSubmit: (debtId: string, data: RegisterDebtPaymentData) => Promise<void>;
  onCancel: () => void;
}

export function DebtPaymentForm({ debtId, pendingAmount, onSubmit, onCancel }: DebtPaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DebtPaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Monto inválido'); return; }
    if (parsed > pendingAmount) { setError(`Monto máximo permitido: ${pendingAmount}`); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(debtId, { amount: parsed, paymentMethod: method, notes: notes || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t mt-2">
      <Input
        label="Monto a pagar"
        type="number"
        step="0.01"
        min="0.01"
        max={pendingAmount}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Máx: ${pendingAmount}`}
        title="Ingrese el monto del pago"
        required
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Método de pago</label>
        <Select
          options={METHODS}
          value={method}
          onChange={(e) => setMethod(e.target.value as DebtPaymentMethod)}
          title="Seleccione el método de pago"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones del pago..."
          title="Notas adicionales del pago"
          rows={2}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} title="Cancelar pago">
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={loading} title="Confirmar pago">
          {loading ? 'Registrando...' : 'Confirmar pago'}
        </Button>
      </div>
    </form>
  );
}
