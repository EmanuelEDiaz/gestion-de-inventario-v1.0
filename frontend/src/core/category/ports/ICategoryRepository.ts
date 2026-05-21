/**
 * ICategoryRepository - Port for category data access
 */

import type { Category, CreateCategoryData, UpdateCategoryData } from '../entities/category';

export interface ICategoryRepository {
  getAll(activeOnly?: boolean): Promise<Category[]>;
  getById(id: string): Promise<Category>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
}
