'use client';

import { Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { LoadingOverlay } from '@/presentation/shared/components/form/LoadingSpinner';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { CategoryForm } from '../components/form/CategoryForm';
import { useCategoriesController } from '../hooks/useCategoriesController';
import type { Category } from '@/core/category/entities/category';
import { statusBadge } from '@/presentation/shared/lib/colors';

const COLUMNS: Column<Category>[] = [
  {
    key: 'name',
    label: 'Nombre',
    render: (_, row) => (
      <span style={{ paddingLeft: `${row.level * 1.25}rem` }} title={`Ruta: ${row.path}`}>
        {row.level > 0 && <span className="text-gray-400 mr-1">└─</span>}
        {row.name}
      </span>
    ),
  },
  {
    key: 'active',
    label: 'Estado',
    render: (_, row) => (
      <span title={row.active ? 'Categoría activa' : 'Categoría inactiva'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(row.active)}`}>
        {row.active ? 'Activa' : 'Inactiva'}
      </span>
    ),
  },
];

export function CategoriesView() {
  const {
    categories, isLoading, error, showForm, editingCategory,
    openForm, closeForm, saveCategory, deleteCategory, deleteManyCategories, clearError,
  } = useCategoriesController();

  const actions: TableAction<Category>[] = [
    { icon: Pencil, title: 'Editar categoría', onClick: openForm },
    { icon: Trash2, title: 'Eliminar categoría', onClick: deleteCategory },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Categorías" description="Organiza los productos en categorías"
        actions={!showForm && <Button onClick={() => openForm()} title="Crear nueva categoría">+ Nueva Categoría</Button>}
      />
      {error && <AlertMessage message={error} onDismiss={clearError} />}
      {showForm && (
        <CategoryForm categories={categories} editingCategory={editingCategory}
          onSubmit={saveCategory} onCancel={closeForm} />
      )}
      {isLoading && <LoadingOverlay />}
      {!isLoading && (
        <GenericTable
          data={categories} columns={COLUMNS} actions={actions}
          selectable onDeleteSelected={deleteManyCategories}
          emptyMessage="No hay categorías registradas"
        />
      )}
    </div>
  );
}
