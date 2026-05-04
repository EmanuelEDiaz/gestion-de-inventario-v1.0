import type { ICurrencyRepository } from '../../interfaces/ICurrencyRepository';
import type { Currency } from '../../entities/currency';

export class GetCurrenciesUseCase {
  constructor(private repository: ICurrencyRepository) {}
  async execute(): Promise<Currency[]> {
    return this.repository.getAll();
  }
}
