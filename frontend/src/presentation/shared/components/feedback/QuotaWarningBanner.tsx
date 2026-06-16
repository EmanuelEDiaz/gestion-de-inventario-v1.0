'use client';

import { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle } from '@/presentation/shared/components/ui/icon-mapping';
import { checkStorageQuota } from '@/infrastructure/storage/db';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function QuotaWarningBanner() {
  const [quotaState, setQuotaState] = useState<'ok' | 'warn' | 'critical' | 'unknown'>('unknown');
  const [percentFree, setPercentFree] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const result = await checkStorageQuota();
      if (!mounted || !result) return;
      const free = 100 - result.percentUsed;
      setPercentFree(free);
      if (free < 5) {
        setQuotaState('critical');
      } else if (free < 20) {
        setQuotaState('warn');
      } else {
        setQuotaState('ok');
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (quotaState === 'ok' || quotaState === 'unknown') return null;

  return (
    <div className={`border-b px-4 py-2 ${
      quotaState === 'critical'
        ? 'border-red-200 bg-red-50'
        : 'border-amber-200 bg-amber-50'
    }`}>
      <div className="flex items-center gap-2 text-xs">
        {quotaState === 'critical' ? (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        ) : (
          <HardDrive className="h-4 w-4 text-amber-600" />
        )}
        <span className={quotaState === 'critical' ? 'text-red-700 font-medium' : 'text-amber-700'}>
          {quotaState === 'critical'
            ? `Almacenamiento crítico: ${percentFree.toFixed(0)}% libre. Libera espacio para evitar problemas.`
            : `Almacenamiento casi lleno: ${percentFree.toFixed(0)}% libre. Considera limpiar datos antiguos.`}
        </span>
      </div>
    </div>
  );
}
