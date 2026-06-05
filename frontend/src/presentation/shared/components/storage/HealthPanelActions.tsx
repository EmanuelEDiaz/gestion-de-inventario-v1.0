'use client';

import { useCallback, useState } from 'react';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { Badge } from '@/presentation/shared/components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
} from '@/presentation/shared/components/ui/icon-mapping';
import { runLocalDiagnostic, type DiagnosticResult, type DiagnosticCheck } from './runDiagnostic';

const STATUS_VARIANT: Record<DiagnosticCheck['status'], 'default' | 'secondary' | 'destructive'> = {
  pass: 'default',
  warn: 'secondary',
  fail: 'destructive',
};

const STATUS_LABEL: Record<DiagnosticCheck['status'], string> = {
  pass: 'Pasa',
  warn: 'Advertencia',
  fail: 'Falla',
};

export function DiagnosticResultView({ result }: { result: DiagnosticResult }) {
  return (
    <div data-testid="diagnostic-result" className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        Ejecutado: {new Date(result.ranAt).toLocaleString('es-CU')}
      </p>
      <ul className="flex flex-col gap-1.5">
        {result.checks.map((check) => (
          <li
            key={check.id}
            data-testid={`diagnostic-${check.id}`}
            className="flex items-start justify-between gap-2 rounded border border-gray-200 p-2"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">{check.label}</span>
              <span className="text-xs text-gray-600">{check.message}</span>
            </div>
            <Badge variant={STATUS_VARIANT[check.status]}>
              <span className="flex items-center gap-1">
                {check.status === 'pass' && <CheckCircle className="h-3 w-3" />}
                {check.status === 'fail' && <AlertCircle className="h-3 w-3" />}
                {STATUS_LABEL[check.status]}
              </span>
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HealthPanelActions({
  data,
  isOnline,
  isSyncing,
  onResync,
  onRefresh,
}: {
  data: import('./useHealthData').HealthData;
  isOnline: boolean;
  isSyncing: boolean;
  onResync: () => Promise<void> | void;
  onRefresh: () => void;
}) {
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  const handleRunDiagnostic = useCallback(async () => {
    setDiagnosticLoading(true);
    setDiagnosticOpen(true);
    try {
      const result = await runLocalDiagnostic(data);
      setDiagnosticResult(result);
    } catch (err) {
      appLogger.error('[HealthPanel] diagnostic failed', err, {
        errorCode: 'ERR_HEALTHPANEL_DIAGNOSTIC',
      });
      setDiagnosticResult({
        checks: [
          {
            id: 'diagnostic',
            label: 'Diagnóstico',
            status: 'fail',
            message: err instanceof Error ? err.message : String(err),
          },
        ],
        ranAt: Date.now(),
      });
    } finally {
      setDiagnosticLoading(false);
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          onClick={handleRunDiagnostic}
          isLoading={diagnosticLoading}
          className="min-h-11 flex-1"
          data-testid="run-diagnostic"
        >
          Ejecutar diagnóstico local
        </Button>
        <TooltipHint
          title="Corre una auditoría completa del estado local"
          description="Verifica IDB, cuota, integridad del mapa, outbox y tasks. Resultado en este diálogo."
          variant="info"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="default"
          onClick={async () => {
            await onResync();
            onRefresh();
          }}
          disabled={!isOnline || isSyncing}
          isLoading={isSyncing}
          className="min-h-11 flex-1"
          data-testid="force-resync"
        >
          {isSyncing ? 'Sincronizando…' : 'Forzar resync'}
        </Button>
        <TooltipHint
          title={isOnline ? 'Sincroniza todos los catálogos pendientes' : 'No disponible sin conexión'}
          description="Empuja outbox al servidor y descarga catálogos faltantes. Necesita conexión."
          variant="tip"
        />
      </div>

      <Dialog
        open={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        title="Resultado del diagnóstico"
        description="Verificación local del estado de la aplicación."
        size="lg"
      >
        {diagnosticLoading ? (
          <p data-testid="diagnostic-loading" className="text-sm text-gray-500">
            Ejecutando auditoría…
          </p>
        ) : diagnosticResult ? (
          <DiagnosticResultView result={diagnosticResult} />
        ) : null}
      </Dialog>
    </div>
  );
}
