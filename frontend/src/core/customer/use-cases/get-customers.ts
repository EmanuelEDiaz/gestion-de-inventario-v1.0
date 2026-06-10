import type { Customer } from '@/core/customer/entities/customer';
import type { ICustomerRepository } from '@/core/customer/ports/ICustomerRepository';

export class GetCustomersUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(): Promise<Customer[]> {
    return this.repository.findAll();
  }
}

export class GetCustomerByIdUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(id: string): Promise<Customer | null> {
    return this.repository.findById(id);
  }
}

export class GetCustomersByStatusUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(active: boolean): Promise<Customer[]> {
    return this.repository.findByActive(active);
  }
}

export class SearchCustomersUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(query: string): Promise<Customer[]> {
    return this.repository.search(query);
  }
}
