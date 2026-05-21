import { apiClient } from '@/infrastructure/api/client';
import type { IExchangeRateRepository } from '@/core/exchange-rate/ports/IExchangeRateRepository';
import type { ExchangeRate, CreateExchangeRateInput, ExchangeRateFilter } from '@/core/exchange-rate/entities/exchange-rate';

export class ExchangeRateRepository implements IExchangeRateRepository {
  private readonly basePath = '/api/v1/exchange-rates';

  async getAll(filter?: ExchangeRateFilter): Promise<ExchangeRate[]> {
    const response = await apiClient.get<ExchangeRate[]>(this.basePath, { params: filter });
    return response.data;
  }

  async getLatest(baseCode: string, quoteCode: string): Promise<ExchangeRate | null> {
    try {
      const response = await apiClient.get<ExchangeRate>(`${this.basePath}/latest`, {
        params: { baseCode, quoteCode },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  async create(data: CreateExchangeRateInput): Promise<ExchangeRate> {
    const response = await apiClient.post<ExchangeRate>(this.basePath, data);
    return response.data;
  }
}

export const exchangeRateRepository = new ExchangeRateRepository();
