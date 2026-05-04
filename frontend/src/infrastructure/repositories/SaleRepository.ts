import { apiClient } from '@/presentation/shared/lib/api-client';
import { ISaleRepository } from '@/core/interfaces/ISaleRepository';
import { Sale, SaleFilter, CreateSaleInput } from '@/core/entities/sale';

export class SaleRepository implements ISaleRepository {
  private basePath = '/api/v1/sales';

  async getById(id: string): Promise<Sale | null> {
    try {
      const response = await apiClient.get<Sale>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getByNumber(saleNumber: string): Promise<Sale | null> {
    try {
      const response = await apiClient.get<Sale>(`${this.basePath}/number/${saleNumber}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getAll(filter?: SaleFilter): Promise<Sale[]> {
    const response = await apiClient.get<Sale[]>(this.basePath, { params: filter });
    return response.data;
  }

  async create(input: CreateSaleInput): Promise<Sale> {
    const response = await apiClient.post<Sale>(this.basePath, input);
    return response.data;
  }

  async confirm(id: string): Promise<Sale> {
    const response = await apiClient.post<Sale>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async deliver(id: string): Promise<Sale> {
    const response = await apiClient.post<Sale>(`${this.basePath}/${id}/deliver`);
    return response.data;
  }

  async cancel(id: string): Promise<Sale> {
    const response = await apiClient.post<Sale>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export const saleRepository = new SaleRepository();
