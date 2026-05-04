/**
 * CategoryList - List of categories with hierarchical display
 */

import type { Category } from '@/core/entities/category';
import { CategoryListItem } from './CategoryListItem';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  return (
    <div className="rounded-lg bg-white shadow">
      <ul className="divide-y divide-gray-200">
        {categories.map((category) => (
          <CategoryListItem
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}
