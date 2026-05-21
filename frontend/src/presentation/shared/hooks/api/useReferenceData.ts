import { useState, useEffect } from 'react';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import type { Customer } from '@/core/customer/entities/customer';
import type { Supplier } from '@/core/supplier/entities/supplier';
import { GetWarehousesUseCase } from '@/core/warehouse/use-cases/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/product/use-cases/GetProductsUseCase';
import { GetCustomersUseCase } from '@/core/customer/use-cases/get-customers';
import { GetSuppliersUseCase } from '@/core/supplier/use-cases/get-suppliers';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { CustomerRepository } from '@/infrastructure/repositories/customer/CustomerRepository';
import { SupplierRepository } from '@/infrastructure/repositories/supplier/SupplierRepository';

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
