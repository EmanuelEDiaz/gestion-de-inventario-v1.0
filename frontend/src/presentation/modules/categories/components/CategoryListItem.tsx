/**
 * CategoryListItem - Single category item in list
 */

import type { Category } from '@/core/entities/category';

interface CategoryListItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryListItem({ category, onEdit, onDelete }: CategoryListItemProps) {
  return (
    <li
      className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 ${
        !category.active ? 'opacity-60' : ''
      }`}
      style={{ paddingLeft: `${1.5 + category.level * 1.5}rem` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{category.level > 0 ? '└─' : ''}</span>
        <span className="font-medium text-gray-900">{category.name}</span>
        {!category.active && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            Inactiva
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(category)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(category)}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
