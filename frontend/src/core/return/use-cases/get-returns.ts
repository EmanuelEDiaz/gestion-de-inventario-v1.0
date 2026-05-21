import type { Return, ReturnType, ReturnStatus } from '@/core/return/entities/return';
import type { IReturnRepository } from '@/core/return/ports/IReturnRepository';

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
