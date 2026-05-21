/**
 * SaveCategoryUseCase - Creates or updates a category
 */

import type { ICategoryRepository } from '../ports/ICategoryRepository';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../entities/category';
import { CategoryValidationError } from '../../errors/CategoryErrors';

export class SaveCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(data: CreateCategoryData, id?: string): Promise<Category> {
    if (!data.name?.trim()) throw new CategoryValidationError('El nombre de la categoría es requerido');

    if (id) {
      return this.categoryRepo.update(id, data as UpdateCategoryData);
    }
    return this.categoryRepo.create(data);
  }
}
