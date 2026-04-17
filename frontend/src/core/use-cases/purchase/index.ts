import { IPurchaseRepository } from '../../interfaces/IPurchaseRepository';
import { Purchase, PurchaseFilter, CreatePurchaseInput } from '../../entities/purchase';

export class GetPurchaseByIdUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(id: string): Promise<Purchase | null> {
    return this.repository.getById(id);
  }
}

export class GetAllPurchasesUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(filter?: PurchaseFilter): Promise<Purchase[]> {
    return this.repository.getAll(filter);
  }
}

export class CreatePurchaseUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(input: CreatePurchaseInput): Promise<Purchase> {
    return this.repository.create(input);
  }
}

export class ConfirmPurchaseUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(id: string): Promise<Purchase> {
    return this.repository.confirm(id);
  }
}

export class ReceivePurchaseUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(id: string, receivedDate?: string): Promise<Purchase> {
    return this.repository.receive(id, receivedDate);
  }
}

export class CancelPurchaseUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(id: string): Promise<Purchase> {
    return this.repository.cancel(id);
  }
}

export class DeletePurchaseUseCase {
  constructor(private repository: IPurchaseRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
