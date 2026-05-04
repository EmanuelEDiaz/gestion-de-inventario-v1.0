'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DashboardStats, LowStockItem } from '@/core/entities/dashboard';
import { DashboardRepository } from '@/infrastructure/repositories/DashboardRepository';
import { GetDashboardStatsUseCase, GetLowStockItemsUseCase } from '@/core/use-cases/dashboard/get-dashboard';

const repo = new DashboardRepository();
const getStats = new GetDashboardStatsUseCase(repo);
const getLowStock = new GetLowStockItemsUseCase(repo);

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, lowStockData] = await Promise.all([
        getStats.execute(),
        getLowStock.execute()
      ]);
      setStats(statsData);
      setLowStockItems(lowStockData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { stats, lowStockItems, loading, error, refresh: fetchData };
}
