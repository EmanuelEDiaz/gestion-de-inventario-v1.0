import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/supplier/entities/supplier';
import type { ISupplierRepository } from '@/core/supplier/ports/ISupplierRepository';

export class CreateSupplierUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(data: CreateSupplierData): Promise<Supplier> {
    return this.repository.create(data);
  }
}

export class UpdateSupplierUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(id: string, data: UpdateSupplierData): Promise<Supplier> {
    return this.repository.update(id, data);
  }
}

export class ActivateSupplierUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(id: string): Promise<Supplier> {
    return this.repository.activate(id);
  }
}

export class DeactivateSupplierUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(id: string): Promise<Supplier> {
    return this.repository.deactivate(id);
  }
}

export class DeleteSupplierUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
