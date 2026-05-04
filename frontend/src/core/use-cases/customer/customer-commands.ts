import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/entities/customer';
import type { ICustomerRepository } from '@/core/interfaces/ICustomerRepository';

export class CreateCustomerUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(data: CreateCustomerData): Promise<Customer> {
    return this.repository.create(data);
  }
}

export class UpdateCustomerUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(id: string, data: UpdateCustomerData): Promise<Customer> {
    return this.repository.update(id, data);
  }
}

export class ActivateCustomerUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(id: string): Promise<Customer> {
    return this.repository.activate(id);
  }
}

export class DeactivateCustomerUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(id: string): Promise<Customer> {
    return this.repository.deactivate(id);
  }
}

export class DeleteCustomerUseCase {
  constructor(private repository: ICustomerRepository) {}
  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
