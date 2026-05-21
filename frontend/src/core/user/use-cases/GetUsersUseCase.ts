import type { IUserRepository } from '../ports/IUserRepository';
import type { User } from '../entities/user';

export class GetUsersUseCase {
  constructor(private repository: IUserRepository) {}
  async execute(): Promise<User[]> {
    return this.repository.getAll();
  }
}
