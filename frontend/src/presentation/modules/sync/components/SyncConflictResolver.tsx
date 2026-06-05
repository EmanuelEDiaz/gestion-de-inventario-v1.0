'use client';

import { useState, useCallback } from 'react';
import type { SyncIncident } from '@/core/settings/entities/sync-incident';
import { useResolveSyncIncident } from '../hooks/useResolveSyncIncident';
import { FieldDiffTable, type FieldResolution } from './FieldDiffTable';

interface Props {
  incident: SyncIncident;
  onClose: () => void;
}

/**
 * Políticas de conflicto por entidad:
 * - PRODUCT: last-write-wins (excepto cambios de precio — revisión manual)
 * - CUSTOMER: preferir servidor para contacto/dirección
 * - SALE: revisión manual obligatoria (impacto financiero)
 * - TRANSFER: preferir servidor (integridad de inventario)
 * - ADJUSTMENT: revisión manual (impacto en inventario)
 */
export function SyncConflictResolver({ incident, onClose }: Props) {
  const { resolve, ignore } = useResolveSyncIncident(incident.id);
  const [, setResolution] = useState<FieldResolution | null>(null);

  const handleFieldResolution = useCallback((res: FieldResolution) => {
    setResolution(res);
    if (res.action === 'use-server') {
      resolve.mutate({ resolution: 'use-server' }, { onSuccess: onClose });
    } else if (res.action === 'use-client') {
      resolve.mutate({ resolution: 'use-client' }, { onSuccess: onClose });
    } else if (res.action === 'merge') {
      resolve.mutate({ resolution: 'merge', payload: res.mergedPayload }, { onSuccess: onClose });
    } else if (res.action === 'delete-local') {
      resolve.mutate({ resolution: 'delete-local' }, { onSuccess: onClose });
    }
  }, [resolve, onClose]);

  const handleIgnore = () => {
    ignore.mutate(undefined, { onSuccess: onClose });
  };

  const parsePayload = (payload: unknown): Record<string, unknown> | null => {
    if (!payload) return null;
    if (typeof payload === 'string') {
      try { return JSON.parse(payload); } catch { return null; }
    }
    if (typeof payload === 'object') return payload as Record<string, unknown>;
    return null;
  };

  const serverPayload = parsePayload(incident.serverPayload);
  const clientPayload = parsePayload(incident.myPayload);
  const isPending = resolve.isPending || ignore.isPending;

  return (
    <tr>
      <td colSpan={7} className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Conflicto en {incident.entityType}: {incident.entityId}
            </p>
            <button
              onClick={handleIgnore}
              disabled={isPending}
              className="min-h-11 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Ignorar este incidente y mantener el estado actual"
            >
              Ignorar
            </button>
          </div>

          <FieldDiffTable
            serverPayload={serverPayload}
            clientPayload={clientPayload}
            errorCode={incident.errorCode}
            errorMessage={incident.error}
            onResolve={handleFieldResolution}
          />
        </div>
      </td>
    </tr>
  );
}
