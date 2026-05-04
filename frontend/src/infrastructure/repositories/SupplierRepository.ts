import { apiClient } from '@/presentation/shared/lib/api-client';
import type { ISupplierRepository } from '@/core/interfaces/ISupplierRepository';
import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/entities/supplier';

export class SupplierRepository implements ISupplierRepository {
  private readonly basePath = '/api/v1/suppliers';

  async findAll(): Promise<Supplier[]> {
    const response = await apiClient.get<Supplier[]>(this.basePath);
    return response.data;
  }

  async findById(id: string): Promise<Supplier | null> {
    try {
      const response = await apiClient.get<Supplier>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async findByActive(active: boolean): Promise<Supplier[]> {
    const response = await apiClient.get<Supplier[]>(`${this.basePath}?active=${active}`);
    return response.data;
  }

  async findByCode(code: string): Promise<Supplier | null> {
    try {
      const response = await apiClient.get<Supplier>(`${this.basePath}/code/${code}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<Supplier[]> {
    const response = await apiClient.get<Supplier[]>(`${this.basePath}/search?q=${query}`);
    return response.data;
  }

  async create(data: CreateSupplierData): Promise<Supplier> {
    const response = await apiClient.post<Supplier>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateSupplierData): Promise<Supplier> {
    const response = await apiClient.put<Supplier>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async activate(id: string): Promise<Supplier> {
    const response = await apiClient.post<Supplier>(`${this.basePath}/${id}/activate`);
    return response.data;
  }

  async deactivate(id: string): Promise<Supplier> {
    const response = await apiClient.post<Supplier>(`${this.basePath}/${id}/deactivate`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}
