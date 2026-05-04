import type { Return, ReturnType, ReturnStatus } from '@/core/entities/return';
import type { IReturnRepository } from '@/core/interfaces/IReturnRepository';

export class GetReturnsUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(): Promise<Return[]> {
    return this.repository.findAll();
  }
}

export class GetReturnByIdUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(id: string): Promise<Return | null> {
    return this.repository.findById(id);
  }
}

export class GetReturnsByTypeUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(type: ReturnType): Promise<Return[]> {
    return this.repository.findByType(type);
  }
}

export class GetReturnsByStatusUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(status: ReturnStatus): Promise<Return[]> {
    return this.repository.findByStatus(status);
  }
}
