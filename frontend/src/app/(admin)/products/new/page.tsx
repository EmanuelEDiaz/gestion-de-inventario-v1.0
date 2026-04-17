'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/presentation/shared/components/ui';
import { apiClient } from '@/infrastructure/api/client';

interface Category {
  id: string;
  name: string;
  level: number;
  path: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    standardCost: '',
    salePrice: '',
    reorderPoint: '',
    taxRate: '0',
    unitOfMeasure: 'UNIT',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<Category[]>('/api/v1/categories?activeOnly=true');
      setCategories(response.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        description: formData.description || null,
        categoryId: formData.categoryId || null,
        standardCost: formData.standardCost ? parseFloat(formData.standardCost) : null,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : null,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
        unitOfMeasure: formData.unitOfMeasure,
      };

      await apiClient.post('/api/v1/products', payload);
      router.push('/products');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (axiosError.response?.status === 409) {
          setError('Ya existe un producto con ese SKU o código de barras');
        } else {
          setError('Error al crear el producto');
        }
      } else {
        setError('Error al crear el producto');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-gray-600">Ingresa la información del nuevo producto</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        {/* Información básica */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Información Básica</h2>
          
          <Input
            label="Nombre del Producto"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Aceite de Motor 5W-30"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Ej: ACE-5W30-1L"
            />
            <Input
              label="Código de Barras"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Ej: 7501234567890"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Descripción del producto..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sin categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {'─'.repeat(cat.level)} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Precios */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="font-semibold text-gray-900">Precios e Inventario</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Costo Estándar"
              name="standardCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.standardCost}
              onChange={handleChange}
              placeholder="0.00"
            />
            <Input
              label="Precio de Venta"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Punto de Reorden"
              name="reorderPoint"
              type="number"
              step="1"
              min="0"
              value={formData.reorderPoint}
              onChange={handleChange}
              placeholder="10"
            />
            <Input
              label="Tasa de Impuesto (%)"
              name="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={handleChange}
              placeholder="0"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Unidad de Medida
              </label>
              <select
                name="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="UNIT">Unidad</option>
                <option value="KG">Kilogramo</option>
                <option value="L">Litro</option>
                <option value="M">Metro</option>
                <option value="M2">Metro cuadrado</option>
                <option value="BOX">Caja</option>
                <option value="PACK">Paquete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 border-t pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
