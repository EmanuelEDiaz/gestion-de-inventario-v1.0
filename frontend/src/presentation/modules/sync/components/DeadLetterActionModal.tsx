'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { Button } from '@/presentation/shared/components/ui/Button';
import type { DeadLetterEntry } from '@/infrastructure/storage/db';

interface DeadLetterActionModalProps {
  open: boolean;
  onClose: () => void;
  deadLetter: DeadLetterEntry | null;
  mode: 'view' | 'edit';
  onSave?: (operationId: string, newPayload: unknown) => Promise<void>;
}

export function DeadLetterActionModal({ open, onClose, deadLetter, mode, onSave }: DeadLetterActionModalProps) {
  const [editedJson, setEditedJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deadLetter && mode === 'edit') {
      setEditedJson(JSON.stringify(deadLetter.payload, null, 2));
      setError('');
    }
  }, [deadLetter, mode]);

  if (!deadLetter) return null;

  const title = mode === 'view' ? 'Ver payload' : 'Editar y reintentar';
  const description = mode === 'view'
    ? 'Contenido de la operación fallida'
    : 'Modifique el payload antes de reintentar';

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    setError('');
    try {
      const parsed = JSON.parse(editedJson);
      await onSave(deadLetter.operationId, parsed);
      onClose();
    } catch (e) {
      setError(e instanceof SyntaxError ? 'JSON inválido' : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size="lg">
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
          <p><span className="font-medium text-gray-700">Entidad:</span> <span className="text-gray-600">{deadLetter.entityType}</span></p>
          <p><span className="font-medium text-gray-700">Acción:</span> <span className="text-gray-600">{deadLetter.action}</span></p>
          <p><span className="font-medium text-gray-700">Error:</span> <span className="text-red-600">{deadLetter.error}</span></p>
        </div>

        {mode === 'view' ? (
          <pre className="max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
            {JSON.stringify(deadLetter.payload, null, 2)}
          </pre>
        ) : (
          <div className="space-y-3">
            <textarea
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              spellCheck={false}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} isLoading={saving}>Guardar y reintentar</Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
