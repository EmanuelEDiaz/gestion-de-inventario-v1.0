import type { IUserRepository } from '../ports/IUserRepository';
import type { User, CreateUserData } from '../entities/user';

export class CreateUserUseCase {
  constructor(private repository: IUserRepository) {}
  async execute(data: CreateUserData): Promise<User> {
    return this.repository.create(data);
  }
}
