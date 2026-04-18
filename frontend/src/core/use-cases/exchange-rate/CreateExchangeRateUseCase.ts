import type { IExchangeRateRepository } from '../../interfaces/IExchangeRateRepository';
import type { ExchangeRate, CreateExchangeRateInput } from '../../entities/exchange-rate';

export class CreateExchangeRateUseCase {
  constructor(private repository: IExchangeRateRepository) {}
  async execute(data: CreateExchangeRateInput): Promise<ExchangeRate> {
    return this.repository.create(data);
  }
}
