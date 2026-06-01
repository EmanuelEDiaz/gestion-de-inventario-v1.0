import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Category, CreateCategoryData } from '@/core/category/entities/category';
import { EntityForm } from '@/presentation/shared/components/form/EntityForm';
import type { EntityFormField } from '@/presentation/shared/components/form/EntityForm';

interface CategoryFormProps {
  categories: Category[];
  editingCategory: Category | null;
  onSubmit: (data: CreateCategoryData) => void;
  onContinue?: (data: CreateCategoryData) => void;
  onCancel: () => void;
}

export function CategoryForm({ categories, editingCategory, onSubmit, onContinue, onCancel }: CategoryFormProps) {
  const [values, setValues] = useState({
    name: editingCategory?.name ?? 'Nueva Categoría',
    parentId: editingCategory?.parentId ?? '',
    sortOrder: (editingCategory?.sortOrder ?? 0).toString(),
  });

  useEffect(() => {
    setValues({
      name: editingCategory?.name ?? 'Nueva Categoría',
      parentId: editingCategory?.parentId ?? '',
      sortOrder: (editingCategory?.sortOrder ?? 0).toString(),
    });
  }, [editingCategory]);

  const parentOptions = useMemo(
    () => categories
      .filter((c) => c.id !== editingCategory?.id)
      .map((c) => ({
        value: c.id,
        label: '─'.repeat(c.level) + ' ' + c.name,
      })),
    [categories, editingCategory?.id]
  );

  const fields: EntityFormField[] = useMemo(() => [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre de la categoría',
      hint: 'Nombre de la categoría',
      hintDescription: 'Máximo 100 caracteres. Se muestra en listados, filtros y breadcrumbs.',
      validate: (v) => !v.trim() ? 'El nombre es obligatorio' : undefined,
    },
    {
      name: 'parentId',
      label: 'Categoría Padre',
      type: 'select',
      placeholder: 'Ninguna (raíz)',
      hint: 'Jerarquía',
      hintDescription: 'Si se selecciona una categoría padre, esta categoría será una subcategoría. Las categorías pueden tener hasta 3 niveles de anidación.',
      options: parentOptions,
    },
    {
      name: 'sortOrder',
      label: 'Orden',
      type: 'number',
      placeholder: '0',
      hint: 'Orden de visualización',
      hintDescription: 'Número que determina la posición en listados. Menor número = mayor prioridad. Si no se especifica, se asigna 0.',
    },
  ], [parentOptions]);

  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const buildData = useCallback((): CreateCategoryData => ({
    name: values.name,
    parentId: values.parentId || undefined,
    sortOrder: parseInt(values.sortOrder) || 0,
  }), [values]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(buildData());
  }, [buildData, onSubmit]);

  const handleContinue = useCallback(() => {
    if (!onContinue) return;
    onContinue(buildData());
    setValues({ name: '', parentId: '', sortOrder: '0' });
  }, [onContinue, buildData]);

  return (
    <EntityForm
      title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      onContinue={onContinue ? handleContinue : undefined}
      isEditing={!!editingCategory}
      submitLabel={editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
      continueLabel="Crear y Continuar"
    />
  );
}
