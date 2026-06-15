'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import { getFailedOutbox } from '@/infrastructure/storage/outbox';
import { getDB, getFromEntityStore, putToEntityStore, type OutboxEntry } from '@/infrastructure/storage/db';
import { toast } from '@/presentation/shared/components/ui/toast';

interface RepairDialogProps {
  open: boolean;
  onClose: () => void;
}

function buildFieldsFromPayload(payload: Record<string, unknown>): EntityFormField[] {
  return Object.entries(payload).map(([key, value]) => ({
    name: key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    type: typeof value === 'number' ? 'number' as const : 'text' as const,
  }));
}

function buildSchemaFromPayload(payload: Record<string, unknown>): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'number') {
      shape[key] = z.coerce.number().optional();
    } else {
      shape[key] = z.string().optional();
    }
  }
  return z.object(shape);
}

export function RepairDialog({ open, onClose }: RepairDialogProps) {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<OutboxEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const failed = await getFailedOutbox();
      setEntries(failed);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleRepair = useCallback(async (values: Record<string, string>) => {
    if (!selectedEntry) return;
    setSaving(true);
    try {
      const db = await getDB();
      const payload = selectedEntry.payload as Record<string, unknown>;

      const updatedPayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        const original = payload[key];
        if (typeof original === 'number') {
          updatedPayload[key] = value === '' ? undefined : Number(value);
        } else {
          updatedPayload[key] = value;
        }
      }

      const entityId = selectedEntry.isTempId ? undefined : selectedEntry.entityId;
      if (entityId) {
        const existing = await getFromEntityStore(db, selectedEntry.entityType, entityId);
        const storeData = existing
          ? { ...existing, ...updatedPayload, cachedAt: Date.now() }
          : { id: entityId, ...updatedPayload, cachedAt: Date.now() };
        await putToEntityStore(db, selectedEntry.entityType, storeData);
      }

      if (selectedEntry.id !== undefined) {
        const entry = await db.get('outbox', selectedEntry.id);
        if (entry) {
          await db.put('outbox', {
            ...entry,
            payload: updatedPayload,
            status: 'pending' as const,
            fieldErrors: undefined,
            fieldErrorsAt: undefined,
            retryCount: 0,
            nextRetryAt: Date.now(),
            lastError: undefined,
          });
        }
      }

      toast.success('Corrección guardada', {
        description: 'Se sincronizará automáticamente cuando haya conexión.',
      });
      setSelectedEntry(null);
      await load();
    } catch (err) {
      toast.error('Error al guardar', {
        description: String(err),
      });
    } finally {
      setSaving(false);
    }
  }, [selectedEntry, load]);

  const handleCancelRepair = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  const entryCount = entries.length;

  return (
    <Dialog open={open} onClose={onClose} title="Entradas pendientes de reparación" size="lg">
      {selectedEntry ? (
        <RepairForm
          entry={selectedEntry}
          onSave={handleRepair}
          onCancel={handleCancelRepair}
          saving={saving}
        />
      ) : (
        <div className="space-y-4">
          {entryCount === 0 ? (
            <p className="text-sm text-gray-500">No hay entradas pendientes de reparación.</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full text-left hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{entry.entityType}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-sm text-gray-600">{entry.action}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-xs text-gray-400 font-mono">{entry.entityId.slice(0, 8)}...</span>
                      </div>
                      {entry.lastError && (
                        <span className="text-xs text-red-500 truncate max-w-[200px]" title={entry.lastError}>
                          {entry.lastError}
                        </span>
                      )}
                    </div>
                    {entry.fieldErrors && entry.fieldErrors.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.fieldErrors.map((fe, i) => (
                          <span key={i} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                            {fe.field}: {fe.message}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  );
}

interface RepairFormProps {
  entry: OutboxEntry;
  onSave: (values: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function RepairForm({ entry, onSave, onCancel, saving }: RepairFormProps) {
  const payload = entry.payload as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  if (entry.fieldErrors) {
    for (const fe of entry.fieldErrors) {
      fieldErrors[fe.field] = fe.message;
    }
  }

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      initial[key] = String(value ?? '');
    }
    return initial;
  });

  const fields = buildFieldsFromPayload(payload);
  const schema = buildSchemaFromPayload(payload);

  const onChange = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <EntityForm
      title={`Reparar ${entry.entityType}`}
      description={`Corrige los errores de validación para reenviar al servidor.`}
      fields={fields}
      values={values}
      onChange={onChange}
      onSubmitAction={onSave}
      onCancel={onCancel}
      isSubmitting={saving}
      createSchema={schema}
      updateSchema={schema}
      storageKey={`repair-${entry.entityType}-${entry.entityId}`}
      persistCreateValues={false}
      externalFieldErrors={fieldErrors}
      submitLabel="Guardar y Reintentar"
      submitLoadingLabel="Guardando..."
    />
  );
}
