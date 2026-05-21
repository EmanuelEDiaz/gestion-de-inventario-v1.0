import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/supplier/entities/supplier';

export interface ISupplierRepository {
  findAll(): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  findByActive(active: boolean): Promise<Supplier[]>;
  findByCode(code: string): Promise<Supplier | null>;
  search(query: string): Promise<Supplier[]>;
  create(data: CreateSupplierData): Promise<Supplier>;
  update(id: string, data: UpdateSupplierData): Promise<Supplier>;
  activate(id: string): Promise<Supplier>;
  deactivate(id: string): Promise<Supplier>;
  delete(id: string): Promise<void>;
}
