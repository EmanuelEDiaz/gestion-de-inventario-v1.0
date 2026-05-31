import type { Role, Permission, CreateRoleData, UpdateRoleData } from '../entities/user';

export interface IRoleRepository {
  getAll(): Promise<Role[]>;
  getById(id: string): Promise<Role | null>;
  create(data: CreateRoleData): Promise<Role>;
  update(id: string, data: UpdateRoleData): Promise<Role>;
  deactivate(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  removeMany(ids: string[]): Promise<void>;
}

export interface IPermissionRepository {
  getAll(): Promise<Permission[]>;
}
