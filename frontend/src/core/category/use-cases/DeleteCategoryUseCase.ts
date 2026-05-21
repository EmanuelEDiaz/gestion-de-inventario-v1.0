/**
 * DeleteCategoryUseCase - Deletes a category
 */

import type { ICategoryRepository } from '../ports/ICategoryRepository';
import { CategoryValidationError, CategoryNotFoundError } from '../../errors/CategoryErrors';

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new CategoryValidationError('ID de la categoría es requerido');
    try {
      await this.categoryRepo.delete(id);
    } catch (e) {
      if (e instanceof CategoryNotFoundError) throw e;
      throw new CategoryNotFoundError(id);
    }
  }
}
