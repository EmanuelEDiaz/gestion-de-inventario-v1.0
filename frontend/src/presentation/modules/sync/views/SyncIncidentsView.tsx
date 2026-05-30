'use client';

import { Fragment, useState } from 'react';
import type { SyncIncidentType } from '@/core/settings/entities/sync-incident';
import { SYNC_INCIDENT_TYPE_LABELS } from '@/core/settings/entities/sync-incident';
import { useSyncIncidents } from '../hooks/useSyncIncidents';
import { SyncIncidentRow } from '../components/SyncIncidentRow';
import { SyncConflictResolver } from '../components/SyncConflictResolver';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/presentation/shared/components/ui/tabs';
import { DeadLetterList } from '../components/DeadLetterList';

const ALL_TYPES = ['all', 'STOCK_CONFLICT', 'ENTITY_DUPLICATE', 'VERSION_MISMATCH', 'CHECKSUM_ERROR'] as const;
type FilterType = typeof ALL_TYPES[number];

export function SyncIncidentsView() {
  const { data: incidents = [], isLoading } = useSyncIncidents();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [tab, setTab] = useState('server');

  const filtered =
    filter === 'all'
      ? incidents
      : incidents.filter((i) => i.incidentType === filter);

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Incidentes de sincronización</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="server">Servidor</TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <ComboboxSelect
              options={[
                { value: 'all', label: 'Todos los tipos' },
                ...(['STOCK_CONFLICT', 'ENTITY_DUPLICATE', 'VERSION_MISMATCH', 'CHECKSUM_ERROR'] as SyncIncidentType[]).map(
                  (t) => ({ value: t, label: SYNC_INCIDENT_TYPE_LABELS[t] })
                ),
              ]}
              value={filter}
              onChange={(val) => setFilter(val as FilterType)}
              className="w-48"
            />
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">Cargando incidentes…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No hay incidentes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">ID</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Entidad</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">ID Entidad</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Estado</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Hace</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500" />
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
        </TabsContent>

        <TabsContent value="local">
          <DeadLetterList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
