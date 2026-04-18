import type { IExchangeRateRepository } from '../../interfaces/IExchangeRateRepository';
import type { ExchangeRate, ExchangeRateFilter } from '../../entities/exchange-rate';

export class GetExchangeRatesUseCase {
  constructor(private repository: IExchangeRateRepository) {}
  async execute(filter?: ExchangeRateFilter): Promise<ExchangeRate[]> {
    return this.repository.getAll(filter);
  }
}
