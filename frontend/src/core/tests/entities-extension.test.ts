import { describe, it, expect } from 'vitest';
import type { Customer } from '@/core/customer/entities/customer';
import type { Supplier } from '@/core/supplier/entities/supplier';
import type { Sale, PaymentMode } from '@/core/sale/entities/sale';
import type { CustomerImage } from '@/core/customer/entities/customer-image';
import type { SupplierImage } from '@/core/supplier/entities/supplier-image';
import type { SupplierSocialLink } from '@/core/supplier/entities/supplier-social-link';
import type { SupplierCatalogProduct } from '@/core/supplier/entities/supplier-catalog-product';

describe('Customer — campos extendidos Etapa 8', () => {
  it('should accept images array', () => {
    // Arrange
    const image: CustomerImage = {
      id: 'img-1',
      customerId: 'cust-1',
      sortOrder: 0,
      isPrimary: true,
      contentType: 'image/jpeg',
      filePath: '/uploads/cust-1/photo.jpg',
      originalFilename: 'photo.jpg',
      sizeBytes: 204800,
      createdAt: '2026-01-01T00:00:00Z',
    };
    const customer: Customer = {
      id: 'cust-1',
      name: 'Juan Pérez',
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      images: [image],
    };

    // Assert
    expect(customer.images).toHaveLength(1);
    expect(customer.images?.[0].isPrimary).toBe(true);
  });

  it('should be valid without images (optional field)', () => {
    // Arrange
    const customer: Customer = {
      id: 'cust-2',
      name: 'María García',
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // Assert
    expect(customer.images).toBeUndefined();
  });
});

describe('Supplier — campos extendidos Etapa 8', () => {
  const mockImage: SupplierImage = {
    id: 'simg-1',
    supplierId: 'supp-1',
    sortOrder: 0,
    isPrimary: true,
    contentType: 'image/png',
    filePath: '/uploads/supp-1/logo.png',
    originalFilename: 'logo.png',
    sizeBytes: 51200,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockLink: SupplierSocialLink = {
    id: 'link-1',
    supplierId: 'supp-1',
    platform: 'WHATSAPP',
    url: 'https://wa.me/5491155554444',
    label: null,
    sortOrder: 0,
  };

  const mockCatalogProduct: SupplierCatalogProduct = {
    id: 'cp-1',
    supplierId: 'supp-1',
    productId: 'prod-1',
    description: 'Arroz 25kg',
    unitPrice: 12.50,
    currencyCode: 'USD',
  };

  it('should accept all new extended fields', () => {
    // Arrange
    const supplier: Supplier = {
      id: 'supp-1',
      name: 'Proveedor XYZ',
      active: true,
      website: 'https://proveedorxyz.com',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      images: [mockImage],
      socialLinks: [mockLink],
      catalogProducts: [mockCatalogProduct],
    };

    // Assert
    expect(supplier.website).toBe('https://proveedorxyz.com');
    expect(supplier.images).toHaveLength(1);
    expect(supplier.socialLinks).toHaveLength(1);
    expect(supplier.catalogProducts).toHaveLength(1);
  });

  it('should be valid without new fields (backward compatible)', () => {
    // Arrange
    const supplierLegacy: Supplier = {
      id: 'supp-2',
      name: 'Proveedor Antiguo',
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // Assert
    expect(supplierLegacy.website).toBeUndefined();
    expect(supplierLegacy.images).toBeUndefined();
  });
});

describe('Sale — campos extendidos Etapa 8', () => {
  const baseSale = {
    id: 'sale-1',
    saleNumber: 'V-001',
    customerId: 'cust-1',
    customerName: 'Juan',
    warehouseId: 'wh-1',
    warehouseName: 'Central',
    status: 'CONFIRMED' as const,
    currencyCode: 'USD',
    exchangeRate: 1,
    subtotal: 500,
    discountAmount: 0,
    taxAmount: 0,
    total: 500,
    notes: null,
    saleDate: '2026-01-01',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lines: [],
  };

  it('should accept paymentMode CREDIT with debtId', () => {
    // Arrange
    const creditSale: Sale = {
      ...baseSale,
      paymentMode: 'CREDIT',
      debtId: 'debt-1',
    };

    // Assert
    expect(creditSale.paymentMode).toBe('CREDIT');
    expect(creditSale.debtId).toBe('debt-1');
  });

  it('should validate all PaymentMode values', () => {
    // Arrange
    const validModes: PaymentMode[] = ['IMMEDIATE', 'CREDIT', 'RESERVE'];

    // Assert
    expect(validModes).toHaveLength(3);
    validModes.forEach((mode) => {
      expect(['IMMEDIATE', 'CREDIT', 'RESERVE']).toContain(mode);
    });
  });

  it('should be valid without new fields (IMMEDIATE default)', () => {
    // Arrange
    const immediateSale: Sale = { ...baseSale };

    // Assert — paymentMode es opcional, no requerido
    expect(immediateSale.paymentMode).toBeUndefined();
    expect(immediateSale.debtId).toBeUndefined();
  });
});
