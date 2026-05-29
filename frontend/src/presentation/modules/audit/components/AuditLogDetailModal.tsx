'use client';

import type { AuditLogEntry } from '@/core/audit/entities/audit-log';
import { formatDate } from '@/presentation/shared/lib/utils';
import { useMemo } from 'react';

interface AuditLogDetailModalProps {
  entry: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDetailModal({ entry, isOpen, onClose }: AuditLogDetailModalProps) {
  const parsedBefore = useMemo(() => {
    if (!entry?.beforeData) return null;
    try { return JSON.stringify(JSON.parse(entry.beforeData), null, 2); } catch { return entry.beforeData; }
  }, [entry?.beforeData]);

  const parsedAfter = useMemo(() => {
    if (!entry?.afterData) return null;
    try { return JSON.stringify(JSON.parse(entry.afterData), null, 2); } catch { return entry.afterData; }
  }, [entry?.afterData]);

  if (!isOpen || !entry) return null;

  const actionLabels: Record<string, { label: string; color: string }> = {
    CREATE: { label: 'Creación', color: 'text-green-600 bg-green-50' },
    UPDATE: { label: 'Actualización', color: 'text-blue-600 bg-blue-50' },
    DELETE: { label: 'Eliminación', color: 'text-red-600 bg-red-50' },
    ARCHIVE: { label: 'Archivado', color: 'text-yellow-600 bg-yellow-50' },
    ACTIVATE: { label: 'Activación', color: 'text-purple-600 bg-purple-50' },
  };

  const actionInfo = actionLabels[entry.action] || { label: entry.action, color: 'text-gray-600 bg-gray-50' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalle del Cambio</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Actor</span>
              <p className="font-medium">{entry.actorName}</p>
            </div>
            <div>
              <span className="text-gray-500">Acción</span>
              <p><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}>{actionInfo.label}</span></p>
            </div>
            <div>
              <span className="text-gray-500">Entidad</span>
              <p className="font-medium">{entry.entityType}</p>
            </div>
            <div>
              <span className="text-gray-500">ID Entidad</span>
              <p className="font-mono text-xs">{entry.entityId}</p>
            </div>
            <div>
              <span className="text-gray-500">IP</span>
              <p className="font-mono text-xs">{entry.ipAddress || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Fecha</span>
              <p>{formatDate(entry.createdAt)}</p>
            </div>
          </div>

          {parsedBefore && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Estado anterior (beforeData)</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-48">{parsedBefore}</pre>
            </div>
          )}

          {parsedAfter && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Estado posterior (afterData)</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-48">{parsedAfter}</pre>
            </div>
          )}

          {!parsedBefore && !parsedAfter && (
            <p className="text-sm text-gray-400 italic">No hay datos JSON asociados a este registro.</p>
          )}
        </div>

        <div className="flex justify-end p-4 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
