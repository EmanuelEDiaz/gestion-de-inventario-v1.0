import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/entities/customer';

export interface ICustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByActive(active: boolean): Promise<Customer[]>;
  findByCode(code: string): Promise<Customer | null>;
  search(query: string): Promise<Customer[]>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  activate(id: string): Promise<Customer>;
  deactivate(id: string): Promise<Customer>;
  delete(id: string): Promise<void>;
}
