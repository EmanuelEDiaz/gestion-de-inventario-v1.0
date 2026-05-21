'use client';

import { useState, useEffect } from 'react';
import { usePosCart } from '../hooks/usePosCart';
import { SaleConfirmSheet } from '../components/SaleConfirmSheet';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { PosHeader } from './PosHeader';
import { PosProductGrid } from './PosProductGrid';
import { PosCartPanel } from './PosCartPanel';
import { PosPaymentSection } from './PosPaymentSection';

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

  const handleConfirm = async () => { const ok = await cart.confirm(); if (ok) setShowConfirm(false); };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 space-y-3">
        <PosHeader
          warehouses={warehouses} warehouseId={cart.warehouseId}
          onWarehouseChange={cart.setWarehouse} paymentMode={cart.paymentMode}
          customerName={cart.customer?.name} hasCustomer={cart.customer !== null}
          onPaymentModeChange={cart.setPaymentMode} customer={cart.customer}
          onCustomerChange={cart.setCustomer} productSearch={productSearch}
          onProductSearchChange={setProductSearch}
        />
        <PosProductGrid
          filteredProducts={filteredProducts} productSearch={productSearch}
          onAddProduct={(p) => cart.addLine({ productId: p.id, productName: p.name, quantity: 1, unitPrice: p.salePrice ?? 0, discount: 0 })}
          onClearSearch={() => setProductSearch('')}
        />
      </div>
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <PosCartPanel lines={cart.lines} onUpdateQty={cart.updateQty} onRemoveLine={cart.removeLine} />
        {cart.lines.length > 0 && (
          <PosPaymentSection total={cart.total} warehouseId={cart.warehouseId} onConfirm={() => setShowConfirm(true)} />
        )}
      </div>
      <SaleConfirmSheet
        open={showConfirm} lines={cart.lines} total={cart.total}
        paymentMode={cart.paymentMode} customerName={cart.customer?.name}
        canFiar={cart.canFiar} isSubmitting={cart.isSubmitting}
        onConfirm={handleConfirm} onClose={() => setShowConfirm(false)}
      />
    </div>
  );
}
