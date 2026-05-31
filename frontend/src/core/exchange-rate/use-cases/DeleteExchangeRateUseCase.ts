import type { IExchangeRateRepository } from '../ports/IExchangeRateRepository';

export class DeleteExchangeRateUseCase {
  constructor(private repository: IExchangeRateRepository) {}
  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
