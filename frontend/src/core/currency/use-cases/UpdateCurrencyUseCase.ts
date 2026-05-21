import type { ICurrencyRepository } from '../ports/ICurrencyRepository';
import type { Currency, UpdateCurrencyInput } from '../entities/currency';

export class UpdateCurrencyUseCase {
  constructor(private repository: ICurrencyRepository) {}
  async execute(code: string, data: UpdateCurrencyInput, version?: number): Promise<Currency> {
    return this.repository.update(code, data, version);
  }
}
