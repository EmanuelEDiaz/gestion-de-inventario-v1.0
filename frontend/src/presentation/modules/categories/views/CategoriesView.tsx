'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
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
import { toast } from '@/presentation/shared/components/ui/toast';
import { SaveCategoryUseCase } from '@/core/category/use-cases/SaveCategoryUseCase';
import { categoryRepository } from '@/infrastructure/repositories/category/CategoryRepository';
import { useQueryClient } from '@tanstack/react-query';
const saveCategoryUC = new SaveCategoryUseCase(categoryRepository);

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
  const queryClient = useQueryClient();
  const {
    categories, isLoading, error, showForm, editingCategory,
    openForm, closeForm, saveCategory, deleteCategory, deleteManyCategories, clearError, refresh,
  } = useCategoriesController();

  const actions: TableAction<Category>[] = [
    { icon: Pencil, title: 'Editar categoría', onClick: openForm },
    { icon: Trash2, title: 'Eliminar categoría', onClick: deleteCategory,
      confirmMessage: (r) => `¿Estás seguro de eliminar la categoría "${r.name}"? Las subcategorías también se eliminarán.` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Categorías" description="Organiza los productos en categorías"
        actions={!showForm && <TooltipWrapper content="Crear nueva categoría" side="top"><Button onClick={() => openForm()}>+ Nueva Categoría</Button></TooltipWrapper>}
      />
      {error && <AlertMessage message={error} onDismiss={clearError} />}
      {showForm && (
        <CategoryForm categories={categories} editingCategory={editingCategory}
          onSubmit={saveCategory}
          onContinue={async (data) => {
            try {
              await saveCategoryUC.execute(data, undefined);
              queryClient.invalidateQueries({ queryKey: ['categories'] });
              refresh();
              toast.success('Categoría creada. Puedes seguir agregando.');
            } catch { toast.error('Error al crear la categoría'); }
          }}
          onCancel={closeForm} />
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
