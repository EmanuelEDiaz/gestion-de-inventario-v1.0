'use client';

import type { CacheModule } from '@/presentation/shared/hooks/useCacheProgress';
import { Check, Loader2 } from 'lucide-react';

interface CacheProgressBarProps {
  modules: CacheModule[];
  overallPercent: number;
  isComplete: boolean;
}

export function CacheProgressBar({ modules, overallPercent, isComplete }: CacheProgressBarProps) {
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
      {/* Module breakdown */}
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
        <p className="text-xs font-medium text-success">
          Seguro desconectarse del servidor
        </p>
      )}
    </div>
  );
}
