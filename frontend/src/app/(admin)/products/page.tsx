'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/presentation/shared/components/ui';
import { apiClient } from '@/infrastructure/api/client';

interface Product {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryName: string | null;
  status: string;
  standardCost: number | null;
  salePrice: number | null;
  currencyCode: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Product[]>('/api/v1/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.get<Product[]>(`/api/v1/products/search?q=${encodeURIComponent(searchQuery)}`);
      setProducts(response.data);
    } catch (err) {
      setError('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: currency === 'CUP' ? 'CUP' : currency,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona el catálogo de productos</p>
        </div>
        <Link href="/products/new">
          <Button>+ Nuevo Producto</Button>
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o código de barras..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button variant="secondary" onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Tabla de productos */}
      {!loading && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  SKU / Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Precio Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay productos registrados
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{product.sku || '-'}</div>
                      {product.barcode && (
                        <div className="text-xs text-gray-400">{product.barcode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.categoryName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatPrice(product.standardCost, product.currencyCode)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(product.salePrice, product.currencyCode)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          product.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.status === 'ACTIVE' ? 'Activo' : 'Archivado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </Link>
                      <span className="mx-2 text-gray-300">|</span>
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
