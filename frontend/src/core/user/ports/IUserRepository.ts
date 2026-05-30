import type { User, CreateUserData, UpdateUserData, ChangePasswordData } from '../entities/user';

export interface IUserRepository {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData, version?: number): Promise<User>;
  changePassword(id: string, data: ChangePasswordData): Promise<void>;
  uploadAvatar(id: string, file: File): Promise<string>;
  deleteAvatar(id: string): Promise<void>;
}
