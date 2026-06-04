import { apiClient } from '@/infrastructure/api/client';
import type { ICurrencyRepository } from '@/core/currency/ports/ICurrencyRepository';
import type { Currency, CreateCurrencyInput, UpdateCurrencyInput } from '@/core/currency/entities/currency';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';

export class CurrencyRepository implements ICurrencyRepository {
  private readonly basePath = '/api/v1/currencies';

  async getAll(): Promise<Currency[]> {
    const db = await getDB();
    return (await db.getAll('currencies')) as unknown as Currency[];
  }

  async create(data: CreateCurrencyInput): Promise<Currency> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Currency>(this.basePath, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('currencies', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CurrencyRepository.create');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CURRENCY', entityId: data.code,
      action: 'CREATE', payload: data,
    });
    return { ...data } as unknown as Currency;
  }

  async update(code: string, data: UpdateCurrencyInput, version?: number): Promise<Currency> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const headers: Record<string, string> = {};
        if (version !== undefined) {
          headers['If-Match'] = `W/"${version}"`;
        }
        const response = await apiClient.patch<Currency>(`${this.basePath}/${code}`, data, { headers });
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('currencies', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CurrencyRepository.update');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CURRENCY', entityId: code,
      action: 'UPDATE', payload: { code, ...data },
    });
    return { code, ...data } as unknown as Currency;
  }

  async delete(code: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${code}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('currencies', code);
        }, 'CurrencyRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CURRENCY', entityId: code,
      action: 'DELETE', payload: { code },
    });
  }
}

export const currencyRepository = new CurrencyRepository();
