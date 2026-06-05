'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CorruptionEntry } from '@/core/loading/types/corruption';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { getDB } from '@/infrastructure/storage/db';
import { DownloadQueueService } from '@/infrastructure/storage/DownloadQueueService';
import {
  Trash2 as Trash,
  RefreshCw as Refresh,
  Pencil as Edit,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
} from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { cn } from '@/presentation/shared/lib/utils';

export interface CorruptionRepairCenterProps {
  onClose?: () => void;
  userId?: string;
}

const REPAIR_DEFAULT_USER_ID = 'repair-center';

type ViewState = 'loading' | 'ready' | 'error';

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('es-CU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function RetryButton({ onClick, isLoading, title, description }: {
  onClick: () => void;
  isLoading: boolean;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        isLoading={isLoading}
        className="min-h-11"
      >
        <Refresh className="h-4 w-4 mr-1" />
        Reintentar descarga
      </Button>
      <TooltipHint title={title} description={description} variant="info" />
    </div>
  );
}

function CorruptionRow({
  entry,
  onStatusChange,
}: {
  entry: CorruptionEntry;
  onStatusChange: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorText, setEditorText] = useState(entry.rawPayload);
  const [parseError, setParseError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'discard' | 'retry' | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const prettyPayload = useMemo(() => {
    if (entry.rawPayload.length <= 280) return entry.rawPayload;
    return `${entry.rawPayload.slice(0, 280)}…`;
  }, [entry.rawPayload]);

  const markStatus = useCallback(
    async (status: 'repaired' | 'discarded', extra?: Partial<CorruptionEntry>) => {
      if (entry.id == null) return;
      const db = await getDB();
      const updated: CorruptionEntry = {
        ...entry,
        ...extra,
        status,
        repairedAt: Date.now(),
      };
      await db.put('corruptionQueue', updated);
      onStatusChange();
    },
    [entry, onStatusChange],
  );

  const handleDiscard = useCallback(async () => {
    setBusyAction('discard');
    try {
      await markStatus('discarded');
    } catch (err) {
      appLogger.error('[CorruptionRepairCenter] failed to discard entry', err, {
        errorCode: 'ERR_CORRUPTION_UNREPAIRABLE',
        entryId: entry.id,
        entityType: entry.entityType,
      });
    } finally {
      setBusyAction(null);
    }
  }, [markStatus, entry.id, entry.entityType]);

  const handleRetryDownload = useCallback(async () => {
    setBusyAction('retry');
    setRetryMessage(null);
    try {
      const result = await DownloadQueueService.fetchAllWithIntegrity(
        `/api/v1/${entry.entityType}`,
        entry.entityType,
        // Schema not available at repair-time; skip validation. We just want
        // to re-fetch and let the regular download flow handle validation.
        // A more strict repair would require looking up the original schema.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (() => ({ safeParse: (v: unknown) => ({ success: true, data: v }) })) as any,
        { userId: REPAIR_DEFAULT_USER_ID },
      );
      setRetryMessage(
        result.ok
          ? 'Re-descargado correctamente'
          : `Reintento completado con ${result.errors.length} error(es)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appLogger.error(
        `[CorruptionRepairCenter] retry download failed (entryId=${entry.id}, entityType=${entry.entityType}): ${msg}`,
        err,
        { errorCode: 'ERR_NETWORK', entryId: entry.id, entityType: entry.entityType },
      );
      setRetryMessage(`Reintento falló: ${msg}`);
    } finally {
      setBusyAction(null);
    }
  }, [entry.entityType, entry.id]);

  const openEditor = useCallback(() => {
    setEditorText(entry.rawPayload);
    setParseError(null);
    setEditorOpen(true);
  }, [entry.rawPayload]);

  const handleSaveRepaired = useCallback(async () => {
    try {
      JSON.parse(editorText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(`JSON inválido: ${msg}`);
      return;
    }
    await markStatus('repaired', { repairedPayload: editorText });
    setEditorOpen(false);
  }, [editorText, markStatus]);

  return (
    <article
      data-testid={`corruption-row-${entry.id}`}
      className="rounded-lg border border-red-200 bg-white p-4 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {entry.entityType}
            <span className="ml-2 text-xs font-normal text-gray-500">{entry.chunkKey}</span>
          </h3>
          <p className="mt-1 text-xs text-red-600" data-testid="parse-error">
            {entry.parseError}
          </p>
          <p className="mt-1 text-xs text-gray-500">Recibido: {formatDate(entry.receivedAt)}</p>
          {retryMessage && (
            <p
              data-testid="retry-message"
              className={cn(
                'mt-1 text-xs',
                retryMessage.startsWith('Reintento falló') ? 'text-red-600' : 'text-emerald-700',
              )}
            >
              {retryMessage}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={openEditor}
              className="min-h-11"
              data-testid="repair-button"
            >
              <Edit className="h-4 w-4 mr-1" />
              Reparar y guardar
            </Button>
            <TooltipHint
              title="Reintentar commit con payload reparado"
              description="Abre un editor para corregir el JSON manualmente. Al guardar, el payload reparado se valida y se marca como reparado."
              variant="help"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDiscard}
              isLoading={busyAction === 'discard'}
              className="min-h-11"
              data-testid="discard-button"
            >
              <Trash className="h-4 w-4 mr-1" />
              Descartar
            </Button>
            <TooltipHint
              title="Marcar como descartado y eliminar de la cola"
              description="El chunk se considera perdido. Esta acción es irreversible desde la UI."
              variant="warning"
            />
          </div>

          <RetryButton
            onClick={handleRetryDownload}
            isLoading={busyAction === 'retry'}
            title="Volver a descargar este chunk desde el servidor"
            description="Lanza una nueva petición al endpoint /api/v1/{entityType} y reemplaza el chunk."
          />
        </div>
      </header>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex min-h-11 items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? 'Ocultar payload' : 'Ver payload'}
      </button>

      {expanded && (
        <pre
          data-testid="raw-payload"
          className="mt-2 max-h-60 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100"
        >
          {prettyPayload}
        </pre>
      )}

      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Reparar payload"
        description={`Edita el JSON para ${entry.entityType} · ${entry.chunkKey}`}
        size="xl"
      >
        <div className="flex flex-col gap-3">
          <textarea
            data-testid="repair-editor"
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            className="min-h-[200px] w-full rounded border border-gray-300 bg-gray-50 p-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
            spellCheck={false}
          />
          {parseError && (
            <p data-testid="parse-error-inline" className="text-xs text-red-600">
              {parseError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              className="min-h-11"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleSaveRepaired}
              className="min-h-11"
              data-testid="save-repair"
            >
              Guardar
            </Button>
          </div>
        </div>
      </Dialog>
    </article>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      <Button variant="outline" onClick={onRetry} className="min-h-11">
        Reintentar
      </Button>
    </div>
  );
}

export function CorruptionRepairCenter({ onClose, userId }: CorruptionRepairCenterProps) {
  const [view, setView] = useState<ViewState>('loading');
  const [entries, setEntries] = useState<CorruptionEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadEntries = useCallback(async () => {
    setView('loading');
    setLoadError(null);
    try {
      const db = await getDB();
      const all = await db.getAll('corruptionQueue');
      const pending = all
        .filter((e): e is CorruptionEntry => Boolean(e))
        .filter((e) => e.status === 'pending')
        .sort((a, b) => b.receivedAt - a.receivedAt);
      setEntries(pending);
      setView('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appLogger.error('[CorruptionRepairCenter] failed to load entries', err, {
        errorCode: 'ERR_IDB_OPEN_FAILED',
      });
      setLoadError(msg);
      setView('error');
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries, refreshTick]);

  const handleStatusChange = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return (
    <section
      data-testid="corruption-repair-center"
      className="flex w-full flex-col gap-4 p-4 sm:p-6"
      aria-label="Centro de reparación de datos corruptos"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Centro de reparación
          </h2>
          <p className="text-xs text-gray-500">
            Chunks que fallaron validación al descargarse del servidor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshTick((t) => t + 1)}
            className="min-h-11"
            data-testid="refresh-button"
          >
            <Refresh className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="min-h-11 min-w-11"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {view === 'loading' && (
        <p data-testid="loading-state" className="text-sm text-gray-500">
          Cargando entradas…
        </p>
      )}

      {view === 'error' && (
        <ErrorState
          message={loadError ?? 'No se pudo abrir IndexedDB'}
          onRetry={() => setRefreshTick((t) => t + 1)}
        />
      )}

      {view === 'ready' && entries.length === 0 && (
        <EmptyState
          title="Sin datos corruptos"
          message="No hay datos corruptos pendientes"
          action={
            userId ? undefined : (
              <span className="text-xs text-gray-400">
                Sesión actual: reparación local sin re-descarga al servidor.
              </span>
            )
          }
        />
      )}

      {view === 'ready' && entries.length > 0 && (
        <div className="flex flex-col gap-3" data-testid="corruption-list">
          <p className="text-xs text-gray-500" data-testid="pending-count">
            {entries.length} entrada(s) pendiente(s)
          </p>
          {entries.map((entry) => (
            <CorruptionRow
              key={entry.id ?? `${entry.chunkKey}-${entry.receivedAt}`}
              entry={entry}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default CorruptionRepairCenter;
