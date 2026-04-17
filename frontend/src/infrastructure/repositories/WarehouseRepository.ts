/**
 * WarehouseRepository - Adapter implementation of IWarehouseRepository
 */

import { apiClient } from '../api/client';
import type { IWarehouseRepository } from '@/core/interfaces/IWarehouseRepository';
import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '@/core/entities/warehouse';

export class WarehouseRepository implements IWarehouseRepository {
  private readonly basePath = '/api/v1/warehouses';

  async getAll(activeOnly = true): Promise<Warehouse[]> {
    const response = await apiClient.get<Warehouse[]>(
      `${this.basePath}?activeOnly=${activeOnly}`
    );
    return response.data;
  }

  async getById(id: string): Promise<Warehouse> {
    const response = await apiClient.get<Warehouse>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(data: CreateWarehouseData): Promise<Warehouse> {
    const response = await apiClient.post<Warehouse>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
    const response = await apiClient.put<Warehouse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async activate(id: string): Promise<Warehouse> {
    const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/activate`);
    return response.data;
  }

  async deactivate(id: string): Promise<Warehouse> {
    const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/deactivate`);
    return response.data;
  }
}

export const warehouseRepository = new WarehouseRepository();
