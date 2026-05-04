/**
 * DeleteCategoryUseCase - Deletes a category
 */

import type { ICategoryRepository } from '../../interfaces/ICategoryRepository';

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new Error('ID de la categoría es requerido');
    return this.categoryRepo.delete(id);
  }
}
