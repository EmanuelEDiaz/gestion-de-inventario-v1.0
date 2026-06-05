'use client';

import { useBackgroundTasksStore, type BackgroundTaskProgress } from '@/core/loading/backgroundTasksStore';
import { type NetworkMode } from '@/infrastructure/storage/networkStore';
import { DB_NAME, DB_VERSION } from '@/infrastructure/storage/db';
import {
  CheckCircle,
  AlertCircle,
  CloudOff,
  Download,
} from '@/presentation/shared/components/ui/icon-mapping';
import { Badge } from '@/presentation/shared/components/ui/badge';
import type { HealthData } from './useHealthData';
import { KvRow } from './HealthPanelSections';
import { formatBytes, formatDate, formatNumber } from './healthPanelFormat';

const NETWORK_MODE_LABEL: Record<NetworkMode, string> = {
  'online-direct': 'Conectado',
  'online-degraded': 'Conectado (degradado)',
  'offline': 'Sin conexión',
};

const NETWORK_MODE_BADGE: Record<NetworkMode, 'default' | 'secondary' | 'destructive'> = {
  'online-direct': 'default',
  'online-degraded': 'secondary',
  'offline': 'destructive',
};

export function QuotaSection({ quota }: { quota: HealthData['quota'] }) {
  return (
    <div data-testid="quota-content">
      {quota ? (
        <>
          <KvRow label="Usado" value={formatBytes(quota.usage)} testId="quota-usage" />
          <KvRow label="Cuota estimada" value={formatBytes(quota.quota)} testId="quota-total" />
          <KvRow label="Porcentaje usado" value={`${quota.percentUsed.toFixed(2)}%`} testId="quota-percent" />
          <KvRow
            label="Persistencia"
            value={
              <span className="flex items-center gap-1">
                {quota.persistent ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                )}
                {quota.persistent ? 'Concedida' : 'No concedida'}
              </span>
            }
            testId="quota-persistent"
          />
        </>
      ) : (
        <p className="text-xs text-gray-500">No disponible en este navegador.</p>
      )}
    </div>
  );
}

export function IDBSection({ storeCounts, totalEntries }: { storeCounts: Record<string, number>; totalEntries: number }) {
  return (
    <div data-testid="idb-content">
      <KvRow label="Base de datos" value={DB_NAME} testId="idb-name" />
      <KvRow label="Versión" value={DB_VERSION} testId="idb-version" />
      <KvRow label="Total entradas" value={formatNumber(totalEntries)} testId="idb-total" />
      <div className="mt-2 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
        {Object.entries(storeCounts).map(([store, count]) => (
          <KvRow
            key={store}
            label={store}
            value={formatNumber(count)}
            testId={`idb-count-${store}`}
          />
        ))}
      </div>
    </div>
  );
}

export function NetworkSection({ networkMode }: { networkMode: NetworkMode }) {
  return (
    <div data-testid="network-content">
      <KvRow
        label="Modo de red"
        value={
          <span className="flex items-center gap-1">
            {networkMode === 'offline' && <CloudOff className="h-3.5 w-3.5 text-red-600" />}
            <Badge variant={NETWORK_MODE_BADGE[networkMode]}>{NETWORK_MODE_LABEL[networkMode]}</Badge>
          </span>
        }
        testId="network-mode"
      />
      <KvRow label="Valor crudo" value={networkMode} />
    </div>
  );
}

export function SessionSection({
  isAuthenticated,
  userName,
  outboxCount,
  lastSyncAt,
}: {
  isAuthenticated: boolean;
  userName: string | null;
  outboxCount: number;
  lastSyncAt: number | null;
}) {
  return (
    <div data-testid="session-content">
      <KvRow
        label="Autenticado"
        value={
          isAuthenticated ? (
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" /> Sí
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> No
            </span>
          )
        }
        testId="session-auth"
      />
      <KvRow label="Usuario" value={userName ?? '—'} testId="session-user" />
      <KvRow label="Outbox pendiente" value={formatNumber(outboxCount)} testId="session-outbox" />
      <KvRow label="Última sync" value={lastSyncAt ? formatDate(lastSyncAt) : 'Nunca'} testId="session-lastsync" />
    </div>
  );
}

export function AuditSection({ audit }: { audit: HealthData['lastBootAudit'] }) {
  return (
    <div data-testid="audit-content">
      {audit ? (
        <>
          <KvRow label="Fecha" value={formatDate(audit.at)} testId="audit-at" />
          <KvRow label="Errores críticos" value={formatNumber(audit.critical)} testId="audit-critical" />
          <KvRow label="Diagnósticos" value={formatNumber(audit.diagnostic)} testId="audit-diagnostic" />
        </>
      ) : (
        <p className="text-xs text-gray-500">Sin auditoría registrada.</p>
      )}
    </div>
  );
}

export function MapSection({ mapMeta }: { mapMeta: HealthData['mapMeta'] }) {
  return (
    <div data-testid="map-content">
      {mapMeta ? (
        <>
          <KvRow
            label="Instalado"
            value={
              <span className="flex items-center gap-1 text-emerald-700">
                <Download className="h-3.5 w-3.5" /> Sí
              </span>
            }
            testId="map-installed"
          />
          <KvRow label="Archivo" value={mapMeta.filename} testId="map-filename" />
          <KvRow label="Versión local" value={mapMeta.version} testId="map-version" />
          {mapMeta.latestKnownVersion && (
            <KvRow label="Versión servidor" value={mapMeta.latestKnownVersion} testId="map-latest" />
          )}
          <KvRow label="Tamaño" value={formatBytes(mapMeta.sizeBytes)} testId="map-size" />
          <KvRow label="Checksum local" value={mapMeta.clientChecksum.slice(0, 12)} testId="map-checksum" />
          <KvRow label="Checksum servidor" value={mapMeta.serverChecksum.slice(0, 12)} testId="map-server-checksum" />
          {mapMeta.serverNewer && (
            <p data-testid="map-server-newer" className="mt-1 text-xs text-amber-700">
              Nueva versión disponible en el servidor.
            </p>
          )}
        </>
      ) : (
        <p data-testid="map-empty" className="text-xs text-gray-500">No descargado.</p>
      )}
    </div>
  );
}

const TASK_STATUS_VARIANT: Record<BackgroundTaskProgress['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  done: 'default',
  running: 'secondary',
  idle: 'outline',
  failed: 'destructive',
  skipped: 'destructive',
};

const TASK_STATUS_LABEL: Record<BackgroundTaskProgress['status'], string> = {
  done: 'Completada',
  running: 'En curso',
  idle: 'En espera',
  failed: 'Fallida',
  skipped: 'Omitida',
};

export function BackgroundTasksSection() {
  const tasks = useBackgroundTasksStore((s) => s.tasks);

  return (
    <div data-testid="bg-tasks-content" className="flex flex-col gap-1.5">
      {Object.values(tasks).map((task) => (
        <div
          key={task.id}
          data-testid={`bg-task-${task.id}`}
          className="flex flex-col gap-0.5 rounded border border-gray-200 bg-gray-50 p-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-900">
              {task.label || task.id}
            </span>
            <Badge variant={TASK_STATUS_VARIANT[task.status]}>
              {TASK_STATUS_LABEL[task.status]}
            </Badge>
          </div>
          {task.status === 'running' && task.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.round((task.completed / task.total) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-gray-600">
                {task.completed}/{task.total}
              </span>
            </div>
          )}
          {task.error && (
            <p data-testid={`bg-task-${task.id}-error`} className="text-[10px] text-red-600">
              {task.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
