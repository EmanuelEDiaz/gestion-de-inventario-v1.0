'use client';

import { useEffect, useRef } from 'react';
import { useAppLoaderStore } from '@/core/loading/appLoaderStore';
import { MaintenanceService } from '@/infrastructure/storage/MaintenanceService';

export function useMaintenance(): void {
  const availability = useAppLoaderStore(s => s.availability);
  const serviceRef = useRef<MaintenanceService | null>(null);

  useEffect(() => {
    if (availability !== 'ready_partial' && availability !== 'ready_complete') return;
    if (serviceRef.current) return;

    const service = new MaintenanceService();
    service.start();
    serviceRef.current = service;

    return () => {
      service.stop();
      serviceRef.current = null;
    };
  }, [availability]);
}
