import type { ICurrencyRepository } from '../ports/ICurrencyRepository';

export class DeleteCurrencyUseCase {
  constructor(private repository: ICurrencyRepository) {}
  async execute(code: string): Promise<void> {
    return this.repository.delete(code);
  }
}
