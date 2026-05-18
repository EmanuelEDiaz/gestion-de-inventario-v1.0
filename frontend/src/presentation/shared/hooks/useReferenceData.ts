import { useState, useEffect } from 'react';
import type { Warehouse } from '@/core/entities/warehouse';
import type { Product } from '@/core/entities/product';
import type { Customer } from '@/core/entities/customer';
import type { Supplier } from '@/core/entities/supplier';
import { GetWarehousesUseCase } from '@/core/use-cases/warehouse/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/use-cases/product/GetProductsUseCase';
import { GetCustomersUseCase } from '@/core/use-cases/customer/get-customers';
import { GetSuppliersUseCase } from '@/core/use-cases/supplier/get-suppliers';
import { WarehouseRepository } from '@/infrastructure/repositories/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { CustomerRepository } from '@/infrastructure/repositories/CustomerRepository';
import { SupplierRepository } from '@/infrastructure/repositories/SupplierRepository';

interface ReferenceData {
  warehouses: Warehouse[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
}

export function useReferenceData(options?: {
  withCustomers?: boolean;
  withSuppliers?: boolean;
}): ReferenceData {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    new GetWarehousesUseCase(new WarehouseRepository()).execute().then(setWarehouses).catch(() => {});
    new GetProductsUseCase(new ProductRepository()).execute({ size: 200 }).then((r) => setProducts(r?.content ?? [])).catch(() => {});
    if (options?.withCustomers) {
      new GetCustomersUseCase(new CustomerRepository()).execute().then(setCustomers).catch(() => {});
    }
    if (options?.withSuppliers) {
      new GetSuppliersUseCase(new SupplierRepository()).execute().then(setSuppliers).catch(() => {});
    }
  }, [options?.withCustomers, options?.withSuppliers]);

  return { warehouses, products, customers, suppliers };
}
