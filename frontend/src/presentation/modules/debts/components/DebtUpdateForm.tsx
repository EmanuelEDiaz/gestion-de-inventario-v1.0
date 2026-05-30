'use client';

import { useState } from 'react';
import type { CustomerDebt, UpdateDebtData } from '@/core/customer/entities/customer-debt';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/form/Textarea';

interface DebtUpdateFormProps {
  debt: CustomerDebt;
  onSubmit: (data: UpdateDebtData) => Promise<void>;
  onCancel: () => void;
}

export function DebtUpdateForm({ debt, onSubmit, onCancel }: DebtUpdateFormProps) {
  const [description, setDescription] = useState(debt.description ?? '');
  const [dueDate, setDueDate] = useState(debt.dueDate?.slice(0, 10) ?? '');
  const [notes, setNotes] = useState(debt.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        description: description || undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-3">
      <Input
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción de la deuda"
        title="Descripción corta de la deuda"
      />
      <Input
        label="Fecha de vencimiento"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        title="Fecha límite para el pago de la deuda"
      />
      <Textarea
        label="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas adicionales..."
        rows={2}
        title="Observaciones adicionales sobre la deuda"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <TooltipWrapper content="Guardar cambios en la deuda">
          <Button type="submit" disabled={loading} title="Guardar cambios en la deuda">
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Cancelar edición">
          <Button type="button" variant="outline" onClick={onCancel} title="Cancelar edición">
            Cancelar
          </Button>
        </TooltipWrapper>
      </div>
    </form>
  );
}
