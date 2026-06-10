import { apiClient } from '@/infrastructure/api/client';
import type { IExchangeRateRepository } from '@/core/exchange-rate/ports/IExchangeRateRepository';
import type { ExchangeRate, CreateExchangeRateInput, UpdateExchangeRateInput } from '@/core/exchange-rate/entities/exchange-rate';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';

export class ExchangeRateRepository implements IExchangeRateRepository {
  private readonly basePath = '/api/v1/exchange-rates';

  async getAll(): Promise<ExchangeRate[]> {
    const db = await getDB();
    return (await db.getAll('exchangeRates')) as unknown as ExchangeRate[];
  }

  async getLatest(baseCode: string, quoteCode: string): Promise<ExchangeRate | null> {
    const db = await getDB();
    const all = (await db.getAll('exchangeRates')) as Array<{ baseCode: string; quoteCode: string; rate: number }>;
    const match = all.find((r) => r.baseCode === baseCode && r.quoteCode === quoteCode);
    if (!match) return null;
    return { ...match, id: `${baseCode}-${quoteCode}`, rateType: 'MARKET', validFrom: '', createdBy: null, createdAt: '' } as unknown as ExchangeRate;
  }

  async create(data: CreateExchangeRateInput): Promise<ExchangeRate> {
    const id = `temp_${crypto.randomUUID()}`;
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<ExchangeRate>(this.basePath, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('exchangeRates', { ...response.data, cachedAt: Date.now() } as any);
        }, 'ExchangeRateRepository.create');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'EXCHANGE_RATE', entityId: id,
      action: 'CREATE', payload: data,
    });
    return { id, ...data } as unknown as ExchangeRate;
  }

  async update(id: string, data: UpdateExchangeRateInput): Promise<ExchangeRate> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.put<ExchangeRate>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('exchangeRates', { ...response.data, cachedAt: Date.now() } as any);
        }, 'ExchangeRateRepository.update');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'EXCHANGE_RATE', entityId: id,
      action: 'UPDATE', payload: { id, ...data },
    });
    return { id, ...data } as unknown as ExchangeRate;
  }

  async delete(id: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('exchangeRates', id);
        }, 'ExchangeRateRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'EXCHANGE_RATE', entityId: id,
      action: 'DELETE', payload: { id },
    });
  }
}

export const exchangeRateRepository = new ExchangeRateRepository();
