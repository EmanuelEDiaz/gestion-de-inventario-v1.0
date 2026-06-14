'use client';

import { useState, type ReactNode } from 'react';
import { useAppLoaderStore, getAvailabilityLabel } from '@/core/loading/appLoaderStore';
import { useReadyComplete } from '@/core/loading/backgroundTasksStore';
import { type NetworkMode } from '@/infrastructure/storage/networkStore';
import {
  ChevronDown,
  ChevronRight,
} from '@/presentation/shared/components/ui/icon-mapping';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import type { HealthData } from './useHealthData';
import {
  QuotaSection,
  IDBSection,
  NetworkSection,
  SessionSection,
  AuditSection,
  MapSection,
  BackgroundTasksSection,
} from './HealthPanelSectionViews';

export function SummaryBanner({ loading, error }: { loading: boolean; error: string | null }) {
  const availability = useAppLoaderStore((s) => s.availability);
  const phase = useAppLoaderStore((s) => s.phase);
  const progress = useAppLoaderStore((s) => s.progress);
  const errorMsg = useAppLoaderStore((s) => s.error);
  const isReadyComplete = useReadyComplete();

  const label = getAvailabilityLabel(availability);

  return (
    <section
      data-testid="health-summary"
      className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <Badge variant={availability === 'error' ? 'destructive' : isReadyComplete ? 'default' : 'secondary'}>
          {phase}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{progress}%</span>
      </div>
      {errorMsg && (
        <p data-testid="loader-error" className="text-xs text-red-600">
          {errorMsg}
        </p>
      )}
      {loading && (
        <p data-testid="data-loading" className="text-xs text-gray-500">
          Cargando diagnóstico…
        </p>
      )}
      {error && (
        <p data-testid="data-error" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

export function HealthSection({
  id,
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  hint?: { title: string; description?: string };
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      data-testid={`section-${id}`}
      className="rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`section-${id}-content`}
          className="flex min-h-11 flex-1 items-center gap-2 text-left hover:bg-gray-50"
        >
          {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </button>
        {hint && <TooltipHint title={hint.title} description={hint.description} variant="info" />}
      </div>
      {open && (
        <div
          id={`section-${id}-content`}
          data-testid={`section-${id}-content`}
          className="border-t border-gray-200 p-3"
        >
          {children}
        </div>
      )}
    </section>
  );
}

export function KvRow({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  return (
    <div
      data-testid={testId}
      className="flex items-start justify-between gap-3 py-1 text-xs"
    >
      <span className="text-gray-600">{label}</span>
      <span className="font-mono text-right text-gray-900 break-all">{value}</span>
    </div>
  );
}

export function HealthSections({
  data,
  isAuthenticated,
  userName,
  networkMode,
  outboxCount,
  lastSyncAt,
}: {
  data: HealthData;
  isAuthenticated: boolean;
  userName: string | null;
  networkMode: NetworkMode;
  outboxCount: number;
  lastSyncAt: number | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <HealthSection id="cuota" title="Cuota" hint={{ title: 'Almacenamiento concedido por el navegador.' }}>
        <QuotaSection quota={data.quota} />
      </HealthSection>
      <HealthSection id="idb" title="Almacenamiento local (IDB)">
        <IDBSection storeCounts={data.storeCounts} totalEntries={data.totalEntries} />
      </HealthSection>
      <HealthSection id="red" title="Red">
        <NetworkSection networkMode={networkMode} />
      </HealthSection>
      <HealthSection id="session" title="Sesión">
        <SessionSection
          isAuthenticated={isAuthenticated}
          userName={userName}
          outboxCount={outboxCount}
          lastSyncAt={lastSyncAt}
        />
      </HealthSection>
      <HealthSection id="auditoria" title="Auditoría de boot">
        <AuditSection audit={data.lastBootAudit} />
      </HealthSection>
      <HealthSection id="mapa" title="Mapa offline">
        <MapSection mapMeta={data.mapMeta} />
      </HealthSection>
      <HealthSection id="background" title="Tareas en segundo plano">
        <BackgroundTasksSection />
      </HealthSection>
    </div>
  );
}
