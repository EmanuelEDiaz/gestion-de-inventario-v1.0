'use client';

import { Fragment, useState } from 'react';
import type { SyncIncidentType } from '@/core/entities/sync-incident';
import { SYNC_INCIDENT_TYPE_LABELS } from '@/core/entities/sync-incident';
import { useSyncIncidents } from '../hooks/useSyncIncidents';
import { SyncIncidentRow } from '../components/SyncIncidentRow';
import { SyncConflictResolver } from '../components/SyncConflictResolver';

const ALL_TYPES = ['all', 'STOCK_CONFLICT', 'ENTITY_DUPLICATE', 'VERSION_MISMATCH', 'CHECKSUM_ERROR'] as const;
type FilterType = typeof ALL_TYPES[number];

export function SyncIncidentsView() {
  const { data: incidents = [], isLoading } = useSyncIncidents();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered =
    filter === 'all'
      ? incidents
      : incidents.filter((i) => i.incidentType === filter);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-gray-900">Incidentes de sincronización</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Filtrar incidentes por tipo"
        >
          <option value="all">Todos los tipos</option>
          {(['STOCK_CONFLICT', 'ENTITY_DUPLICATE', 'VERSION_MISMATCH', 'CHECKSUM_ERROR'] as SyncIncidentType[]).map(
            (t) => (
              <option key={t} value={t}>
                {SYNC_INCIDENT_TYPE_LABELS[t]}
              </option>
            )
          )}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Cargando incidentes…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No hay incidentes</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2 text-xs font-medium text-gray-500">ID</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Tipo</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Entidad</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">ID Entidad</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Hace</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500 text-center" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <Fragment key={incident.id}>
                  <SyncIncidentRow
                    incident={incident}
                    expanded={expandedId === incident.id}
                    onToggle={() =>
                      setExpandedId(expandedId === incident.id ? null : incident.id)
                    }
                  />
                  {expandedId === incident.id && (
                    <SyncConflictResolver
                      incident={incident}
                      onClose={() => setExpandedId(null)}
                    />
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
