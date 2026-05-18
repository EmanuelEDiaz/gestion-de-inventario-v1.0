'use client';

import type { SyncIncident } from '@/core/entities/sync-incident';
import {
  SYNC_INCIDENT_TYPE_LABELS,
  SYNC_INCIDENT_STATUS_LABELS,
} from '@/core/entities/sync-incident';
import { cn } from '@/presentation/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  incident: SyncIncident;
  expanded: boolean;
  onToggle: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  IGNORED: 'bg-gray-100 text-gray-600',
};

const TYPE_COLORS: Record<string, string> = {
  STOCK_CONFLICT: 'bg-danger/10 text-danger',
  ENTITY_DUPLICATE: 'bg-orange-100 text-orange-800',
  VERSION_MISMATCH: 'bg-info/10 text-info',
  CHECKSUM_ERROR: 'bg-purple-100 text-purple-800',
};

export function SyncIncidentRow({ incident, expanded, onToggle }: Props) {
  const timeAgo = formatDistanceToNow(new Date(incident.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <tr
      onClick={onToggle}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      title="Clic para ver detalles del incidente"
    >
      <td className="px-3 py-2 text-sm text-gray-600 font-mono">{incident.id.slice(0, 8)}…</td>
      <td className="px-3 py-2">
        <span
          className={cn(
            'inline-block px-2 py-0.5 rounded text-xs font-medium',
            TYPE_COLORS[incident.incidentType] ?? 'bg-gray-100 text-gray-800'
          )}
        >
          {SYNC_INCIDENT_TYPE_LABELS[incident.incidentType]}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-gray-700">{incident.entityType}</td>
      <td className="px-3 py-2 text-sm text-gray-500 font-mono">{incident.entityId.slice(0, 8)}…</td>
      <td className="px-3 py-2">
        <span
          className={cn(
            'inline-block px-2 py-0.5 rounded text-xs font-medium',
            STATUS_COLORS[incident.status] ?? 'bg-gray-100 text-gray-800'
          )}
        >
          {SYNC_INCIDENT_STATUS_LABELS[incident.status]}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-gray-400">{timeAgo}</td>
      <td className="px-3 py-2 text-center text-gray-400">
        {expanded ? '▲' : '▼'}
      </td>
    </tr>
  );
}
