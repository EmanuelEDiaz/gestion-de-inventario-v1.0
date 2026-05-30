import { apiClient } from '@/infrastructure/api/client';
import type { IExchangeRateRepository } from '@/core/exchange-rate/ports/IExchangeRateRepository';
import type { ExchangeRate, CreateExchangeRateInput, ExchangeRateFilter } from '@/core/exchange-rate/entities/exchange-rate';
import { readWithCache, isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedExchangeRates } from '@/infrastructure/storage/db';

export class ExchangeRateRepository implements IExchangeRateRepository {
  private readonly basePath = '/api/v1/exchange-rates';

  async getAll(filter?: ExchangeRateFilter): Promise<ExchangeRate[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<ExchangeRate[]>(this.basePath, { params: filter });
        return response.data;
      },
      async () => getCachedExchangeRates() as unknown as ExchangeRate[],
    );
  }

  async getLatest(baseCode: string, quoteCode: string): Promise<ExchangeRate | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<ExchangeRate>(`${this.basePath}/latest`, {
            params: { baseCode, quoteCode },
          });
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const rates = await getCachedExchangeRates();
        return rates.find(
          (r) => r.fromCurrency === baseCode && r.toCurrency === quoteCode,
        ) as unknown as ExchangeRate ?? null;
      },
    );
  }

  async create(data: CreateExchangeRateInput): Promise<ExchangeRate> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para crear tasas de cambio');
    }
    const response = await apiClient.post<ExchangeRate>(this.basePath, data);
    return response.data;
  }
}

export const exchangeRateRepository = new ExchangeRateRepository();
