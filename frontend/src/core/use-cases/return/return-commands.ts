import type { Return, CreateReturnData, UpdateReturnData } from '@/core/entities/return';
import type { IReturnRepository } from '@/core/interfaces/IReturnRepository';

export class CreateReturnUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(data: CreateReturnData): Promise<Return> {
    return this.repository.create(data);
  }
}

export class UpdateReturnUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(id: string, data: UpdateReturnData): Promise<Return> {
    return this.repository.update(id, data);
  }
}

export class ConfirmReturnUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(id: string): Promise<Return> {
    return this.repository.confirm(id);
  }
}

export class CancelReturnUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(id: string): Promise<Return> {
    return this.repository.cancel(id);
  }
}

export class DeleteReturnUseCase {
  constructor(private repository: IReturnRepository) {}
  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
