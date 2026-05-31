import type { IExchangeRateRepository } from '../ports/IExchangeRateRepository';
import type { ExchangeRate, UpdateExchangeRateInput } from '../entities/exchange-rate';

export class UpdateExchangeRateUseCase {
  constructor(private repository: IExchangeRateRepository) {}
  async execute(id: string, data: UpdateExchangeRateInput): Promise<ExchangeRate> {
    return this.repository.update(id, data);
  }
}
