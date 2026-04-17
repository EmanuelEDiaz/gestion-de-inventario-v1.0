'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/presentation/shared/components/ui';
import { apiClient } from '@/infrastructure/api/client';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  active: boolean;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, [showInactive]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Warehouse[]>(
        `/api/v1/warehouses?activeOnly=${!showInactive}`
      );
      setWarehouses(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los almacenes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (warehouse: Warehouse) => {
    try {
      const endpoint = warehouse.active
        ? `/api/v1/warehouses/${warehouse.id}/deactivate`
        : `/api/v1/warehouses/${warehouse.id}/activate`;
      await apiClient.post(endpoint);
      fetchWarehouses();
    } catch (err) {
      setError('Error al cambiar el estado del almacén');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almacenes</h1>
          <p className="text-gray-600">Gestiona los almacenes del sistema</p>
        </div>
        <Link href="/warehouses/new">
          <Button>+ Nuevo Almacén</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostrar inactivos
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Lista de almacenes */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.length === 0 ? (
            <div className="col-span-full rounded-lg bg-white p-8 text-center text-gray-500 shadow">
              No hay almacenes registrados
            </div>
          ) : (
            warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className={`rounded-lg bg-white p-6 shadow ${
                  !warehouse.active ? 'opacity-60' : ''
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                    <p className="text-sm text-gray-500">Código: {warehouse.code}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      warehouse.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {warehouse.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                {warehouse.address && (
                  <p className="mb-4 text-sm text-gray-600">{warehouse.address}</p>
                )}

                <div className="flex gap-2">
                  <Link href={`/warehouses/${warehouse.id}/edit`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => handleToggleActive(warehouse)}
                    className={warehouse.active ? 'text-red-600' : 'text-green-600'}
                  >
                    {warehouse.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
