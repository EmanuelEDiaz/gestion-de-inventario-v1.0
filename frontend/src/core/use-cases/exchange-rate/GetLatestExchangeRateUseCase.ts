import type { IExchangeRateRepository } from '../../interfaces/IExchangeRateRepository';
import type { ExchangeRate } from '../../entities/exchange-rate';

export class GetLatestExchangeRateUseCase {
  constructor(private repository: IExchangeRateRepository) {}
  async execute(baseCode: string, quoteCode: string): Promise<ExchangeRate | null> {
    return this.repository.getLatest(baseCode, quoteCode);
  }
}
