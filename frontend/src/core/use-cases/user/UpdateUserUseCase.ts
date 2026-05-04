import type { IUserRepository } from '../../interfaces/IUserRepository';
import type { User, UpdateUserData } from '../../entities/user';

export class UpdateUserUseCase {
  constructor(private repository: IUserRepository) {}
  async execute(id: string, data: UpdateUserData, version?: number): Promise<User> {
    return this.repository.update(id, data, version);
  }
}
