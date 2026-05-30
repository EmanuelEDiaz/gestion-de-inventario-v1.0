import { apiClient } from '@/infrastructure/api/client';
import type { IUserRepository } from '@/core/user/ports/IUserRepository';
import type { User, CreateUserData, UpdateUserData, ChangePasswordData } from '@/core/user/entities/user';

export class UserRepository implements IUserRepository {
  private readonly basePath = '/api/v1/users';

  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>(this.basePath);
    return response.data;
  }

  async getById(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async create(data: CreateUserData): Promise<User> {
    const response = await apiClient.post<User>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateUserData, version?: number): Promise<User> {
    const headers: Record<string, string> = {};
    if (version !== undefined) {
      headers['If-Match'] = `W/"${version}"`;
    }
    const response = await apiClient.patch<User>(`${this.basePath}/${id}`, data, { headers });
    return response.data;
  }

  async changePassword(id: string, data: ChangePasswordData): Promise<void> {
    await apiClient.patch(`${this.basePath}/${id}/password`, data);
  }

  async uploadAvatar(id: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post(
      `${this.basePath}/${id}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return `/api/v1/users/${id}/avatar`;
  }

  async deleteAvatar(id: string): Promise<void> {
    const response = await apiClient.get(`${this.basePath}/${id}/images`);
    const image = response.data as { id?: string } | null;
    if (image?.id) {
      await apiClient.delete(`${this.basePath}/${id}/images/${image.id}`);
    }
  }
}

export const userRepository = new UserRepository();
