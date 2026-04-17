'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/presentation/shared/components/ui';
import { apiClient } from '@/infrastructure/api/client';

interface Category {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  level: number;
  sortOrder: number;
  active: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    sortOrder: '0',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Category[]>('/api/v1/categories');
      // Ordenar por path para mostrar jerarquía
      const sorted = response.data.sort((a, b) => a.path.localeCompare(b.path));
      setCategories(sorted);
      setError(null);
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        name: formData.name,
        parentId: formData.parentId || null,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      if (editingCategory) {
        await apiClient.put(`/api/v1/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post('/api/v1/categories', payload);
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', parentId: '', sortOrder: '0' });
      fetchCategories();
    } catch (err) {
      setError('Error al guardar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId || '',
      sortOrder: category.sortOrder.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/categories/${category.id}`);
      fetchCategories();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (axiosError.response?.status === 409) {
          setError('No se puede eliminar una categoría que tiene productos');
        } else {
          setError('Error al eliminar la categoría');
        }
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', parentId: '', sortOrder: '0' });
  };

  const getRootCategories = () => categories.filter(c => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600">Organiza los productos en categorías</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Nueva Categoría</Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 font-semibold text-gray-900">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nombre de la categoría"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Categoría Padre
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Ninguna (raíz)</option>
                {categories
                  .filter(c => c.id !== editingCategory?.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'─'.repeat(cat.level)} {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Orden
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Lista de categorías */}
      {!loading && (
        <div className="rounded-lg bg-white shadow">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay categorías registradas
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 ${
                    !category.active ? 'opacity-60' : ''
                  }`}
                  style={{ paddingLeft: `${1.5 + category.level * 1.5}rem` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {category.level > 0 ? '└─' : ''}
                    </span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {!category.active && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
