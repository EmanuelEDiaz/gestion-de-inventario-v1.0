import { apiClient } from '@/infrastructure/api/client';
import type { ICurrencyRepository } from '@/core/interfaces/ICurrencyRepository';
import type { Currency, CreateCurrencyInput, UpdateCurrencyInput } from '@/core/entities/currency';

export class CurrencyRepository implements ICurrencyRepository {
  private readonly basePath = '/api/v1/currencies';

  async getAll(): Promise<Currency[]> {
    const response = await apiClient.get<Currency[]>(this.basePath);
    return response.data;
  }

  async create(data: CreateCurrencyInput): Promise<Currency> {
    const response = await apiClient.post<Currency>(this.basePath, data);
    return response.data;
  }

  async update(code: string, data: UpdateCurrencyInput, version?: number): Promise<Currency> {
    const headers: Record<string, string> = {};
    if (version !== undefined) {
      headers['If-Match'] = `W/"${version}"`;
    }
    const response = await apiClient.patch<Currency>(`${this.basePath}/${code}`, data, { headers });
    return response.data;
  }
}

export const currencyRepository = new CurrencyRepository();
