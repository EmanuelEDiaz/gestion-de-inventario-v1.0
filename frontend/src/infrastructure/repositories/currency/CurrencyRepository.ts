import { apiClient } from '@/infrastructure/api/client';
import type { ICurrencyRepository } from '@/core/currency/ports/ICurrencyRepository';
import type { Currency, CreateCurrencyInput, UpdateCurrencyInput } from '@/core/currency/entities/currency';
import { readWithCache, isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedCurrencies } from '@/infrastructure/storage/db';

export class CurrencyRepository implements ICurrencyRepository {
  private readonly basePath = '/api/v1/currencies';

  async getAll(): Promise<Currency[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Currency[]>(this.basePath);
        return response.data;
      },
      async () => getCachedCurrencies() as unknown as Currency[],
    );
  }

  async create(data: CreateCurrencyInput): Promise<Currency> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para crear monedas');
    }
    const response = await apiClient.post<Currency>(this.basePath, data);
    return response.data;
  }

  async update(code: string, data: UpdateCurrencyInput, version?: number): Promise<Currency> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para actualizar monedas');
    }
    const headers: Record<string, string> = {};
    if (version !== undefined) {
      headers['If-Match'] = `W/"${version}"`;
    }
    const response = await apiClient.patch<Currency>(`${this.basePath}/${code}`, data, { headers });
    return response.data;
  }
}

export const currencyRepository = new CurrencyRepository();
