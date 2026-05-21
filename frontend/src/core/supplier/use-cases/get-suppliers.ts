import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/supplier/entities/supplier';
import type { ISupplierRepository } from '@/core/supplier/ports/ISupplierRepository';

export class GetSuppliersUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(): Promise<Supplier[]> {
    return this.repository.findAll();
  }
}

export class GetSupplierByIdUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(id: string): Promise<Supplier | null> {
    return this.repository.findById(id);
  }
}

export class GetSuppliersByStatusUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(active: boolean): Promise<Supplier[]> {
    return this.repository.findByActive(active);
  }
}

export class SearchSuppliersUseCase {
  constructor(private repository: ISupplierRepository) {}
  async execute(query: string): Promise<Supplier[]> {
    return this.repository.search(query);
  }
}
