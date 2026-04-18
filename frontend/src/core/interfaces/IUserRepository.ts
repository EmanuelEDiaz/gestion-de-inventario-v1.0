import type { User, CreateUserData, UpdateUserData } from '../entities/user';

export interface IUserRepository {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData, version?: number): Promise<User>;
  uploadAvatar(id: string, file: File): Promise<string>;
}
