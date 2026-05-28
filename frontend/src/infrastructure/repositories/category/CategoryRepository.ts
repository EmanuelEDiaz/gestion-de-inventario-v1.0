/**
 * CategoryRepository - Adapter implementation of ICategoryRepository
 */

import { apiClient } from '../../api/client';
import type { ICategoryRepository } from '@/core/category/ports/ICategoryRepository';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/core/category/entities/category';

export class CategoryRepository implements ICategoryRepository {
  private readonly basePath = '/api/v1/categories';

  async getAll(activeOnly = false): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(
      `${this.basePath}?activeOnly=${activeOnly}`
    );
    return response.data;
  }

  async getById(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const response = await apiClient.post<Category>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const response = await apiClient.put<Category>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}

export const categoryRepository = new CategoryRepository();
