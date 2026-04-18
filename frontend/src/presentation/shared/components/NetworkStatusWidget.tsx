'use client';

import { useState } from 'react';
import { useNetworkHealth } from '@/presentation/shared/hooks/useNetworkHealth';
import { useSyncStatus } from '@/presentation/shared/hooks/useSyncStatus';
import { useCacheProgress } from '@/presentation/shared/hooks/useCacheProgress';
import { NetworkIcon, getStatusColor, getStatusLabel } from './network-status/NetworkIcon';
import { CacheProgressBar } from './network-status/CacheProgressBar';
import { SyncProgressBar } from './network-status/SyncProgressBar';
import { X } from 'lucide-react';

export function NetworkStatusWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { backendStatus } = useNetworkHealth();
  const { status: syncStatus, lastSync, pendingCount, sync } = useSyncStatus();
  const { modules, overallPercent, isComplete } = useCacheProgress();

  const borderColor = getStatusColor(backendStatus, syncStatus, pendingCount);
  const label = getStatusLabel(backendStatus, syncStatus, pendingCount);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border-2 shadow-lg transition-all hover:scale-105 ${borderColor}`}
        title={label}
      >
        <div className="flex flex-col items-center">
          <NetworkIcon backendStatus={backendStatus} syncStatus={syncStatus} pendingCount={pendingCount} size={14} />
          <span className="text-[8px] font-bold leading-tight text-gray-700">{overallPercent}%</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-72 rounded-xl border-2 bg-white shadow-xl ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <NetworkIcon backendStatus={backendStatus} syncStatus={syncStatus} pendingCount={pendingCount} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 p-3">
        <CacheProgressBar modules={modules} overallPercent={overallPercent} isComplete={isComplete} />
        <div className="border-t pt-3">
          <SyncProgressBar
            pendingCount={pendingCount}
            syncStatus={syncStatus}
            backendStatus={backendStatus}
            lastSync={lastSync}
            onSync={sync}
          />
        </div>
      </div>
    </div>
  );
}
