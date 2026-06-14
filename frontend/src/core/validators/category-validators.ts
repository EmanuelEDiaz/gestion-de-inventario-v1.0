import { z } from 'zod';
import { categoryName, categorySortOrder } from './fields/core/category-fields';

export const createCategorySchema = z.object({
  name: categoryName(),
  parentId: z.string().optional().nullable(),
  sortOrder: categorySortOrder().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
