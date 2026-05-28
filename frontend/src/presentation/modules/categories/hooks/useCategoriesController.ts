/**
 * useCategoriesController - Controller for categories module
 */

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Category, CreateCategoryData } from '@/core/category/entities/category';
import { GetCategoriesUseCase } from '@/core/category/use-cases/GetCategoriesUseCase';
import { SaveCategoryUseCase } from '@/core/category/use-cases/SaveCategoryUseCase';
import { DeleteCategoryUseCase } from '@/core/category/use-cases/DeleteCategoryUseCase';
import { categoryRepository } from '@/infrastructure/repositories/category/CategoryRepository';

interface UseCategoriesControllerState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  showForm: boolean;
  editingCategory: Category | null;
}

const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
const saveCategoryUseCase = new SaveCategoryUseCase(categoryRepository);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);

export function useCategoriesController() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UseCategoriesControllerState>({
    categories: [],
    isLoading: true,
    error: null,
    showForm: false,
    editingCategory: null,
  });

  const fetchCategories = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const categories = await getCategoriesUseCase.execute();
      setState((prev) => ({ ...prev, categories, isLoading: false }));
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar las categorías',
      }));
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openForm = useCallback((category?: Category) => {
    setState((prev) => ({
      ...prev,
      showForm: true,
      editingCategory: category ?? null,
    }));
  }, []);

  const closeForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showForm: false,
      editingCategory: null,
    }));
  }, []);

  const saveCategory = useCallback(async (data: CreateCategoryData) => {
    try {
      await saveCategoryUseCase.execute(data, state.editingCategory?.id);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeForm();
      fetchCategories();
    } catch {
      setState((prev) => ({ ...prev, error: 'Error al guardar la categoría' }));
    }
  }, [state.editingCategory, closeForm, fetchCategories, queryClient]);

  const deleteCategory = useCallback(async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }
    try {
      await deleteCategoryUseCase.execute(category.id);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      fetchCategories();
    } catch (err: unknown) {
      const message = getDeleteErrorMessage(err);
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [fetchCategories, queryClient]);

  const deleteManyCategories = useCallback(async (ids: string[]) => {
    if (!confirm(`¿Eliminar ${ids.length} categoría(s) seleccionadas?`)) return;
    try {
      await categoryRepository.deleteAll(ids);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      fetchCategories();
    } catch {
      setState((prev) => ({ ...prev, error: 'Error al eliminar las categorías seleccionadas' }));
    }
  }, [fetchCategories, queryClient]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    openForm,
    closeForm,
    saveCategory,
    deleteCategory,
    deleteManyCategories,
    refresh: fetchCategories,
    clearError,
  };
}

function getDeleteErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { status: number } };
    if (axiosErr.response?.status === 409) {
      return 'No se puede eliminar una categoría que tiene productos';
    }
  }
  return 'Error al eliminar la categoría';
}
