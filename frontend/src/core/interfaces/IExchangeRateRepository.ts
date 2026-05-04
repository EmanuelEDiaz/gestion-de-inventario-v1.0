import type { ExchangeRate, CreateExchangeRateInput, ExchangeRateFilter } from '../entities/exchange-rate';

export interface IExchangeRateRepository {
  getAll(filter?: ExchangeRateFilter): Promise<ExchangeRate[]>;
  getLatest(baseCode: string, quoteCode: string): Promise<ExchangeRate | null>;
  create(data: CreateExchangeRateInput): Promise<ExchangeRate>;
}
