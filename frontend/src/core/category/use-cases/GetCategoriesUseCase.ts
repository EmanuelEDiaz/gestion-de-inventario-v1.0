/**
 * GetCategoriesUseCase - Retrieves all categories
 */

import type { ICategoryRepository } from '../ports/ICategoryRepository';
import type { Category } from '../entities/category';

export class GetCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(activeOnly = false): Promise<Category[]> {
    const categories = await this.categoryRepo.getAll(activeOnly);
    // Sort by path for hierarchical display
    return categories.sort((a, b) => a.path.localeCompare(b.path));
  }
}
