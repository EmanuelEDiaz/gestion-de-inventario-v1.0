import type { ICurrencyRepository } from '../ports/ICurrencyRepository';
import type { Currency, CreateCurrencyInput } from '../entities/currency';

export class CreateCurrencyUseCase {
  constructor(private repository: ICurrencyRepository) {}
  async execute(data: CreateCurrencyInput): Promise<Currency> {
    return this.repository.create(data);
  }
}
