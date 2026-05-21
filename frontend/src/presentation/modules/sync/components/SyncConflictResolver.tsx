'use client';

import { useState } from 'react';
import type { SyncIncident } from '@/core/settings/entities/sync-incident';
import { useResolveSyncIncident } from '../hooks/useResolveSyncIncident';

interface Props {
  incident: SyncIncident;
  onClose: () => void;
}

export function SyncConflictResolver({ incident, onClose }: Props) {
  const { resolve, ignore } = useResolveSyncIncident(incident.id);
  const [resolution, setResolution] = useState('');

  const handleResolve = () => {
    if (!resolution.trim()) return;
    resolve.mutate({ resolution }, { onSuccess: onClose });
  };

  const handleIgnore = () => {
    ignore.mutate(undefined, { onSuccess: onClose });
  };

  const isPending = resolve.isPending || ignore.isPending;

  return (
    <tr>
      <td colSpan={7} className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {incident.myPayload && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Payload local</p>
                <pre className="bg-white border rounded p-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                  {incident.myPayload}
                </pre>
              </div>
            )}
            {incident.serverPayload && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Payload servidor</p>
                <pre className="bg-white border rounded p-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                  {incident.serverPayload}
                </pre>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`res-${incident.id}`} className="text-sm font-medium text-gray-700">
              Resolución
            </label>
            <textarea
              id={`res-${incident.id}`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
              placeholder="Descripción de cómo se resolvió el conflicto…"
              title="Escribe la resolución del conflicto de sincronización"
              className="border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResolve}
              disabled={!resolution.trim() || isPending}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              title="Marcar este incidente como resuelto con la resolución indicada"
            >
              Resolver
            </button>
            <button
              onClick={handleIgnore}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              title="Ignorar este incidente sin resolverlo"
            >
              Ignorar
            </button>
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Cerrar el panel de resolución"
            >
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
