import type { IUserRepository } from '../../interfaces/IUserRepository';
import type { ChangePasswordData } from '../../entities/user';

export class ChangePasswordUseCase {
  constructor(private repository: IUserRepository) {}
  async execute(id: string, data: ChangePasswordData): Promise<void> {
    return this.repository.changePassword(id, data);
  }
}
