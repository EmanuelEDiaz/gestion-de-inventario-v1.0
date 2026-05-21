import type { Currency, CreateCurrencyInput, UpdateCurrencyInput } from '../entities/currency';

export interface ICurrencyRepository {
  getAll(): Promise<Currency[]>;
  create(data: CreateCurrencyInput): Promise<Currency>;
  update(code: string, data: UpdateCurrencyInput, version?: number): Promise<Currency>;
}
