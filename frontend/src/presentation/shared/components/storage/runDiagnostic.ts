import { getCachedCount, getDB } from '@/infrastructure/storage/db';
import type { HealthData } from './useHealthData';

export type DiagnosticStatus = 'pass' | 'fail' | 'warn';

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: DiagnosticStatus;
  message: string;
}

export interface DiagnosticResult {
  checks: DiagnosticCheck[];
  ranAt: number;
}

async function checkIdbAccess(): Promise<DiagnosticCheck> {
  try {
    await getDB();
    return { id: 'idb', label: 'IndexedDB', status: 'pass', message: 'IndexedDB accesible' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { id: 'idb', label: 'IndexedDB', status: 'fail', message: `IndexedDB: ${msg}` };
  }
}

function checkQuota(quota: HealthData['quota']): DiagnosticCheck {
  if (!quota) {
    return {
      id: 'quota',
      label: 'Cuota de almacenamiento',
      status: 'warn',
      message: 'No disponible en este navegador',
    };
  }
  const used = quota.percentUsed;
  if (used > 90) {
    return { id: 'quota', label: 'Cuota de almacenamiento', status: 'fail', message: `Uso crítico: ${used.toFixed(1)}%` };
  }
  if (used > 70) {
    return { id: 'quota', label: 'Cuota de almacenamiento', status: 'warn', message: `Uso elevado: ${used.toFixed(1)}%` };
  }
  return { id: 'quota', label: 'Cuota de almacenamiento', status: 'pass', message: `${used.toFixed(2)}% usado` };
}

function checkPersistence(quota: HealthData['quota']): DiagnosticCheck {
  return {
    id: 'persistence',
    label: 'Persistencia',
    status: quota?.persistent ? 'pass' : 'warn',
    message: quota?.persistent ? 'Concedida' : 'No concedida (datos pueden ser evictados)',
  };
}

async function checkCorruption(): Promise<DiagnosticCheck> {
  const count = await getCachedCount('corruptionQueue');
  return {
    id: 'corruption',
    label: 'Cola de corrupción',
    status: count > 0 ? 'warn' : 'pass',
    message: count > 0 ? `${count} entrada(s) pendiente(s)` : 'Sin entradas',
  };
}

function checkMap(mapMeta: HealthData['mapMeta']): DiagnosticCheck {
  if (!mapMeta) {
    return { id: 'map', label: 'Mapa offline', status: 'warn', message: 'No descargado' };
  }
  const ok = mapMeta.serverChecksum === mapMeta.clientChecksum;
  return {
    id: 'map',
    label: 'Mapa offline',
    status: ok ? 'pass' : 'fail',
    message: ok
      ? `v${mapMeta.version} íntegro`
      : `v${mapMeta.version} checksum local no coincide con servidor`,
  };
}

function checkOutbox(outboxCount: number): DiagnosticCheck {
  return {
    id: 'outbox',
    label: 'Outbox',
    status: outboxCount > 100 ? 'warn' : 'pass',
    message: `${outboxCount} pendiente(s)`,
  };
}

export async function runLocalDiagnostic(data: HealthData): Promise<DiagnosticResult> {
  const checks: DiagnosticCheck[] = [
    await checkIdbAccess(),
    checkQuota(data.quota),
    checkPersistence(data.quota),
    await checkCorruption(),
    checkMap(data.mapMeta),
    checkOutbox(data.outboxCount),
  ];
  return { checks, ranAt: Date.now() };
}
