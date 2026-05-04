/**
 * CategoriesView - Composition view for categories page
 */

'use client';

import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { LoadingOverlay } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { CategoryList } from '../components/CategoryList';
import { CategoryForm } from '../components/form/CategoryForm';
import { useCategoriesController } from '../hooks/useCategoriesController';

export function CategoriesView() {
  const {
    categories,
    isLoading,
    error,
    showForm,
    editingCategory,
    openForm,
    closeForm,
    saveCategory,
    deleteCategory,
    clearError,
  } = useCategoriesController();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Organiza los productos en categorías"
        actions={
          !showForm && <Button onClick={() => openForm()}>+ Nueva Categoría</Button>
        }
      />

      {error && <AlertMessage message={error} onDismiss={clearError} />}

      {showForm && (
        <CategoryForm
          categories={categories}
          editingCategory={editingCategory}
          onSubmit={saveCategory}
          onCancel={closeForm}
        />
      )}

      {isLoading && <LoadingOverlay />}

      {!isLoading && categories.length === 0 && (
        <EmptyState
          message="No hay categorías registradas"
          action={<Button onClick={() => openForm()}>Crear primera categoría</Button>}
        />
      )}

      {!isLoading && categories.length > 0 && (
        <CategoryList
          categories={categories}
          onEdit={openForm}
          onDelete={deleteCategory}
        />
      )}
    </div>
  );
}
