import { apiClient } from '@/presentation/shared/lib/api-client';
import type { Role, Permission, CreateRoleData, UpdateRoleData } from '@/core/entities/user';
import type { IRoleRepository, IPermissionRepository } from '@/core/interfaces/IRoleRepository';

export class RoleRepository implements IRoleRepository {
  private readonly basePath = '/api/v1/roles';

  async getAll(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>(this.basePath);
    return response.data;
  }

  async getById(id: string): Promise<Role | null> {
    try {
      const response = await apiClient.get<Role>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async create(data: CreateRoleData): Promise<Role> {
    const response = await apiClient.post<Role>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await apiClient.patch<Role>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export class PermissionRepository implements IPermissionRepository {
  async getAll(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/api/v1/permissions');
    return response.data;
  }
}

export const roleRepository = new RoleRepository();
export const permissionRepository = new PermissionRepository();
