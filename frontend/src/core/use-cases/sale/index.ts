import { ISaleRepository } from '../../interfaces/ISaleRepository';
import { Sale, SaleFilter, CreateSaleInput } from '../../entities/sale';

export class GetSaleByIdUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(id: string): Promise<Sale | null> {
    return this.repository.getById(id);
  }
}

export class GetAllSalesUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(filter?: SaleFilter): Promise<Sale[]> {
    return this.repository.getAll(filter);
  }
}

export class CreateSaleUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(input: CreateSaleInput): Promise<Sale> {
    return this.repository.create(input);
  }
}

export class ConfirmSaleUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(id: string): Promise<Sale> {
    return this.repository.confirm(id);
  }
}

export class DeliverSaleUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(id: string): Promise<Sale> {
    return this.repository.deliver(id);
  }
}

export class CancelSaleUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(id: string): Promise<Sale> {
    return this.repository.cancel(id);
  }
}

export class DeleteSaleUseCase {
  constructor(private repository: ISaleRepository) {}
  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
