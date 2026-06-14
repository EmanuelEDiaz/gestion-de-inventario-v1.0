'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WarehouseFormFields } from '../components/form/WarehouseFormFields';
import { CreateWarehouseUseCase } from '@/core/warehouse/use-cases/CreateWarehouseUseCase';
import { warehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';

const createWarehouseUseCase = new CreateWarehouseUseCase(warehouseRepository);

export function WarehouseCreateView() {
  const router = useRouter();

  const handleSubmit = useCallback(async (data: { code: string; name: string; address?: string | null }) => {
    await createWarehouseUseCase.execute(data);
    router.push('/warehouses');
  }, [router]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Almacén</h1>
        <p className="text-gray-600">Ingresa la información del nuevo almacén</p>
      </div>
      <WarehouseFormFields
        storageKey="warehouse-create"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
