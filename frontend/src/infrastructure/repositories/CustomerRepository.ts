import { apiClient } from '@/infrastructure/api/client';
import type { ICustomerRepository } from '@/core/interfaces/ICustomerRepository';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/entities/customer';

export class CustomerRepository implements ICustomerRepository {
  private readonly basePath = '/api/v1/customers';

  async findAll(): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(this.basePath);
    return response.data;
  }

  async findById(id: string): Promise<Customer | null> {
    try {
      const response = await apiClient.get<Customer>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async findByActive(active: boolean): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(`${this.basePath}?active=${active}`);
    return response.data;
  }

  async findByCode(code: string): Promise<Customer | null> {
    try {
      const response = await apiClient.get<Customer>(`${this.basePath}/code/${code}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(`${this.basePath}/search?q=${query}`);
    return response.data;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const response = await apiClient.post<Customer>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const response = await apiClient.put<Customer>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async activate(id: string): Promise<Customer> {
    const response = await apiClient.post<Customer>(`${this.basePath}/${id}/activate`);
    return response.data;
  }

  async deactivate(id: string): Promise<Customer> {
    const response = await apiClient.post<Customer>(`${this.basePath}/${id}/deactivate`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}
