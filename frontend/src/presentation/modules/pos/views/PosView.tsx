'use client';

import { useState, useEffect } from 'react';
import { usePosCart } from '../hooks/usePosCart';
import { FiarButton } from '../components/FiarButton';
import { CustomerSelector } from '../components/CustomerSelector';
import { SaleConfirmSheet } from '../components/SaleConfirmSheet';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Trash2, Plus, ShoppingCart } from 'lucide-react';

const warehouseRepo = new WarehouseRepository();
const productRepo = new ProductRepository();

export function PosView() {
  const cart = usePosCart();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    Promise.all([
      warehouseRepo.getAll().catch(() => [] as Warehouse[]),
      productRepo.getAll().then((r) => r.content || []).catch(() => [] as Product[]),
    ]).then(([ws, ps]) => {
      setWarehouses(ws);
      setProducts(ps);
      if (ws.length > 0 && !cart.warehouseId) cart.setWarehouse(ws[0].id);
    }).finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = productSearch.trim().length >= 2
    ? products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
      ).slice(0, 12)
    : [];

  if (loadingData) return <LoadingSpinner />;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Panel izquierdo — búsqueda de productos */}
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ComboboxSelect
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={cart.warehouseId}
            onChange={cart.setWarehouse}
            placeholder="Seleccionar almacén..."
            className="w-48"
          />

          <FiarButton
            paymentMode={cart.paymentMode}
            customerName={cart.customer?.name}
            hasCustomer={cart.customer !== null}
            onChange={cart.setPaymentMode}
          />
        </div>

        {(cart.paymentMode === 'CREDIT' || cart.paymentMode === 'RESERVE') && (
          <CustomerSelector
            value={cart.customer}
            onChange={cart.setCustomer}
          />
        )}

        <Input
          label=""
          placeholder="Buscar producto por nombre o SKU..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          title="Buscar producto para agregar al carrito"
        />

        {filteredProducts.length > 0 && (
          <ul className="rounded-lg border divide-y max-h-64 overflow-y-auto">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex justify-between"
                  onClick={() => {
                    cart.addLine({
                      productId: p.id,
                      productName: p.name,
                      quantity: 1,
                      unitPrice: p.salePrice ?? 0,
                      discount: 0,
                    });
                    setProductSearch('');
                  }}
                  title={`Agregar ${p.name} al carrito`}
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="ml-2 text-gray-500 shrink-0">
                    {formatCurrency(p.salePrice ?? 0, 'USD')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {productSearch.trim().length >= 2 && filteredProducts.length === 0 && (
          <EmptyState message="Sin resultados para la búsqueda" />
        )}
      </div>

      {/* Panel derecho — carrito */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-700 flex items-center gap-1">
          <ShoppingCart className="h-4 w-4" />
          Carrito
        </h2>

        {cart.lines.length === 0 && (
          <EmptyState message="Agrega productos para comenzar" />
        )}

        <ul className="space-y-2">
          {cart.lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-2 rounded-lg border px-2 py-2">
              <span className="flex-1 text-sm truncate" title={l.productName}>{l.productName}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="w-6 h-6 rounded border text-sm font-bold hover:bg-gray-100"
                  onClick={() => l.quantity > 1 ? cart.updateQty(l.productId, l.quantity - 1) : cart.removeLine(l.productId)}
                  title="Reducir cantidad"
                >-</button>
                <span className="w-6 text-center text-sm">{l.quantity}</span>
                <button
                  type="button"
                  className="w-6 h-6 rounded border text-sm font-bold hover:bg-gray-100"
                  onClick={() => cart.updateQty(l.productId, l.quantity + 1)}
                  title="Aumentar cantidad"
                >+</button>
              </div>
              <span className="text-sm font-medium w-16 text-right shrink-0">
                {formatCurrency(l.quantity * l.unitPrice, 'USD')}
              </span>
              <button
                type="button"
                className="p-1 rounded hover:bg-red-50"
                onClick={() => cart.removeLine(l.productId)}
                title="Quitar producto del carrito"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </li>
          ))}
        </ul>

        {cart.lines.length > 0 && (
          <div className="mt-auto space-y-2">
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(cart.total, 'USD')}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => setShowConfirm(true)}
              disabled={!cart.warehouseId}
              title="Abrir panel de confirmación"
            >
              <Plus className="h-4 w-4 mr-1" />
              Confirmar venta
            </Button>
          </div>
        )}
      </div>

      <SaleConfirmSheet
        open={showConfirm}
        lines={cart.lines}
        total={cart.total}
        paymentMode={cart.paymentMode}
        customerName={cart.customer?.name}
        canFiar={cart.canFiar}
        isSubmitting={cart.isSubmitting}
        onConfirm={async () => {
          const ok = await cart.confirm();
          if (ok) setShowConfirm(false);
        }}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  );
}
