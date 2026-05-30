'use client';

import type { CacheModule, StorageUsage } from '@/presentation/shared/hooks/storage/useCacheProgress';
import { useCacheProgress } from '@/presentation/shared/hooks/storage/useCacheProgress';
import { Check, Loader2 } from '@/presentation/shared/components/ui/icon-mapping';

interface CacheProgressBarProps {
  modules: CacheModule[];
  overallPercent: number;
  isComplete: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

interface StorageBarProps {
  usage: StorageUsage;
}

function StorageBar({ usage }: StorageBarProps) {
  if (!usage.isSupported) return null;
  const color = usage.isCritical ? 'bg-red-500'
    : usage.isWarning ? 'bg-yellow-500'
    : 'bg-green-500';
  const text = usage.isCritical ? `${(usage.percentUsed * 100).toFixed(0)}% usado — Liberar espacio`
    : usage.isWarning ? `${(usage.percentUsed * 100).toFixed(0)}% usado — Almacenamiento casi lleno`
    : `${(usage.percentUsed * 100).toFixed(0)}% usado — Suficiente espacio`;

  return (
    <div className="space-y-1 pt-2 border-t">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Almacenamiento local</span>
        <span className="font-medium">{formatBytes(usage.usageBytes)} / {formatBytes(usage.quotaBytes)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(usage.percentUsed * 100, 100)}%` }}
        />
      </div>
      <p className={`text-xs ${usage.isCritical ? 'text-red-600' : usage.isWarning ? 'text-yellow-600' : 'text-gray-500'}`}>
        {text}
      </p>
      {usage.readyForOffline && (
        <p className="text-xs font-medium text-green-600">Seguro desconectarse</p>
      )}
    </div>
  );
}

export function CacheProgressBar({ modules, overallPercent, isComplete }: CacheProgressBarProps) {
  const { storageUsage } = useCacheProgress();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>App cargada</span>
        <span className="font-medium">{overallPercent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${overallPercent}%` }}
        />
      </div>
      <ul className="space-y-1">
        <li className="flex items-center gap-1.5 text-xs text-gray-500">
          <Check size={12} className="text-green-500" />
          <span>App shell</span>
        </li>
        {modules.map((mod) => (
          <li key={mod.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            {mod.loaded
              ? <Check size={12} className="text-green-500" />
              : <Loader2 size={12} className="animate-spin text-gray-400" />
            }
            <span>{mod.name}</span>
            {mod.loaded && <span className="text-gray-400">({mod.count})</span>}
          </li>
        ))}
      </ul>
      {isComplete && (
        <p className="text-xs font-medium text-green-600">
          Seguro desconectarse del servidor
        </p>
      )}
      <StorageBar usage={storageUsage} />
    </div>
  );
}
