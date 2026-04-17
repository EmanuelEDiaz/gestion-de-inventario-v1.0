'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/presentation/shared/components/ui';
import { apiClient } from '@/infrastructure/api/client';

export default function NewWarehousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        address: formData.address || null,
      };

      await apiClient.post('/api/v1/warehouses', payload);
      router.push('/warehouses');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (axiosError.response?.status === 409) {
          setError('Ya existe un almacén con ese código');
        } else {
          setError('Error al crear el almacén');
        }
      } else {
        setError('Error al crear el almacén');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Almacén</h1>
        <p className="text-gray-600">Ingresa la información del nuevo almacén</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
        <Input
          label="Código del Almacén"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          placeholder="Ej: ALM-01"
          className="uppercase"
        />

        <Input
          label="Nombre del Almacén"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Ej: Almacén Principal"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Dirección (opcional)
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Dirección del almacén..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Almacén'}
          </Button>
        </div>
      </form>
    </div>
  );
}
