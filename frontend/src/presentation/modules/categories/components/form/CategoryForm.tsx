/**
 * CategoryForm - Inline form for create/edit category
 */

import { useState, useCallback, useEffect } from 'react';
import type { Category, CreateCategoryData } from '@/core/entities/category';
import { Button } from '@/presentation/shared/components/ui';
import { Input } from '@/presentation/shared/components/ui';
import { FormField } from '@/presentation/shared/components/FormField';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';

interface CategoryFormProps {
  categories: Category[];
  editingCategory: Category | null;
  onSubmit: (data: CreateCategoryData) => void;
  onCancel: () => void;
}

export function CategoryForm({ categories, editingCategory, onSubmit, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    sortOrder: '0',
  });

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        parentId: editingCategory.parentId ?? '',
        sortOrder: editingCategory.sortOrder.toString(),
      });
    } else {
      setFormData({ name: '', parentId: '', sortOrder: '0' });
    }
  }, [editingCategory]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        name: formData.name,
        parentId: formData.parentId || undefined,
        sortOrder: parseInt(formData.sortOrder) || 0,
      });
    },
    [formData, onSubmit]
  );

  const parentOptions = categories
    .filter((c) => c.id !== editingCategory?.id)
    .map((c) => ({
      value: c.id,
      label: '─'.repeat(c.level) + ' ' + c.name,
    }));

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 font-semibold text-gray-900">
        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          required
          placeholder="Nombre de la categoría"
        />
        <FormField label="Categoría Padre">
          <ComboboxSelect
            value={formData.parentId}
            onChange={(val) => setFormData((p) => ({ ...p, parentId: val }))}
            options={parentOptions}
            placeholder="Ninguna (raíz)"
            searchPlaceholder="Buscar categoría..."
          />
        </FormField>
        <Input
          label="Orden"
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData((p) => ({ ...p, sortOrder: e.target.value }))}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
}
