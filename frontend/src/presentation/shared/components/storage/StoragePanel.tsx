'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapIcon, Download, Trash2, HardDrive, X, CheckCircle2, AlertTriangle } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Card } from '@/presentation/shared/components/ui/card';
import { getMapMeta, setMapMeta, clearMapMeta } from '@/infrastructure/maps/opfs-utils';
import type { MapMetadata } from '@/infrastructure/maps/opfs-utils';
import { sha256Hex } from '@/infrastructure/maps/sha256-utils';

const MAP_FILENAME = 'cuba.pmtiles';
const MAP_TEMP_FILENAME = 'cuba.pmtiles.tmp';

export function StoragePanel() {
  const [mapMeta, setMapMetaState] = useState<MapMetadata | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const refreshMeta = useCallback(async () => {
    const meta = await getMapMeta();
    setMapMetaState(meta);
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  const handleDownload = useCallback(async () => {
    const abortController = new AbortController();
    abortRef.current = abortController;
    setIsDownloading(true);
    setProgress(0);
    setStatusMessage('Descargando mapa...');

    try {
      const res = await fetch('/api/v1/maps/cuba.pmtiles', {
        signal: abortController.signal,
      });
      if (!res.ok || !res.body) throw new Error('ERR_MAP_PMTILES_DOWNLOAD');

      const contentLength = Number(res.headers.get('content-length') ?? 0);
      const root = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle(MAP_TEMP_FILENAME, { create: true });
      const writable = await handle.createWritable();
      const reader = res.body.getReader();
      let received = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writable.write(value);
          received += value.length;
          if (contentLength > 0) {
            const pct = Math.round((received / contentLength) * 100);
            setProgress(pct);
          }
        }
        await writable.close();

        setStatusMessage('Verificando integridad...');
        const file = await handle.getFile();
        const buf = await file.arrayBuffer();
        const clientChecksum = await sha256Hex(buf);

        const metaRes = await fetch('/api/v1/maps/cuba.pmtiles.meta.json', {
          signal: abortController.signal,
        });
        if (metaRes.ok) {
          const serverMeta = await metaRes.json() as { sha256?: string; version?: string; sizeBytes?: number };
          if (serverMeta.sha256 && serverMeta.sha256 !== clientChecksum) {
            await root.removeEntry(MAP_TEMP_FILENAME).catch(() => {});
            throw new Error('ERR_MAP_CHECKSUM_MISMATCH');
          }

          const destHandle = await root.getFileHandle(MAP_FILENAME, { create: true });
          const destWritable = await destHandle.createWritable();
          const reader2 = file.stream().getReader();
          while (true) {
            const { done, value } = await reader2.read();
            if (done) break;
            await destWritable.write(value);
          }
          await destWritable.close();
          await root.removeEntry(MAP_TEMP_FILENAME).catch(() => {});

          await setMapMeta({
            key: 'map-pmtiles',
            filename: MAP_FILENAME,
            version: serverMeta.version ?? '1.0',
            serverChecksum: serverMeta.sha256 ?? clientChecksum,
            clientChecksum,
            sizeBytes: serverMeta.sizeBytes ?? file.size,
            installedAt: Date.now(),
          });
        }

        setStatusMessage('Mapa descargado correctamente');
        await refreshMeta();
      } catch (err) {
        await writable.abort().catch(() => {});
        await root.removeEntry(MAP_TEMP_FILENAME).catch(() => {});
        throw err;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatusMessage('Descarga cancelada');
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(MAP_TEMP_FILENAME).catch(() => {});
      } else {
        setStatusMessage(`Error: ${(err as Error).message}`);
      }
    } finally {
      setIsDownloading(false);
    }
  }, [refreshMeta, abortRef]);

  const handleCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  const handleDelete = useCallback(async () => {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(MAP_FILENAME).catch(() => {});
    await clearMapMeta();
    setMapMetaState(null);
    setStatusMessage('Mapa eliminado');
  }, []);

  const totalMB = mapMeta?.sizeBytes ? (mapMeta.sizeBytes / (1024 * 1024)).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapIcon className="h-5 w-5" />
        <h3 className="text-lg font-medium">Almacenamiento</h3>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <HardDrive className="h-4 w-4" />
          <span>Mapa offline: {mapMeta ? `${totalMB} MB` : 'No instalado'}</span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {mapMeta ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {mapMeta ? 'Mapa instalado' : 'Mapa no instalado'}
              </p>
              {mapMeta && (
                <p className="text-xs text-muted-foreground mt-1">
                  Versión: {mapMeta.version} · {totalMB} MB · {new Date(mapMeta.installedAt).toLocaleDateString()}
                </p>
              )}
              {!mapMeta && (
                <p className="text-xs text-muted-foreground mt-1">
                  Descarga el mapa para usarlo sin conexión
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isDownloading ? (
              <TooltipWrapper content="Cancelar descarga">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </TooltipWrapper>
            ) : mapMeta ? (
              <TooltipWrapper content="Eliminar mapa descargado">
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </TooltipWrapper>
            ) : (
              <TooltipWrapper content="Descargar mapa de Cuba para uso offline">
                <Button variant="default" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Descargar mapa
                </Button>
              </TooltipWrapper>
            )}
          </div>
        </div>

        {isDownloading && (
          <div className="mt-4 space-y-1">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}

        {statusMessage && !isDownloading && (
          <p className="text-xs text-muted-foreground mt-2">{statusMessage}</p>
        )}
      </Card>
    </div>
  );
}
