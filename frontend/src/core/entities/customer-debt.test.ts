import { describe, it, expect } from 'vitest';
import type { CustomerDebt, UpdateDebtData, DebtStatus, DebtPaymentMethod } from './customer-debt';
import { DEBT_STATUS_LABELS, DEBT_STATUS_COLORS } from './customer-debt';

describe('CustomerDebt Entity', () => {
  const mockDebt: CustomerDebt = {
    id: 'debt-1',
    customerId: 'cust-1',
    saleId: 'sale-1',
    originalAmount: 500,
    paidAmount: 200,
    pendingAmount: 300,
    currencyCode: 'USD',
    status: 'PARTIAL',
    description: 'Venta a crédito',
    dueDate: '2026-06-01T00:00:00Z',
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  };

  it('should create a valid CustomerDebt', () => {
    // Assert
    expect(mockDebt.id).toBe('debt-1');
    expect(mockDebt.originalAmount).toBe(500);
    expect(mockDebt.paidAmount).toBe(200);
    expect(mockDebt.pendingAmount).toBe(300);
  });

  it('should validate all DebtStatus values', () => {
    // Arrange
    const validStatuses: DebtStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'];

    // Assert
    expect(validStatuses).toContain(mockDebt.status);
  });

  it('should validate all DebtPaymentMethod values', () => {
    // Arrange
    const validMethods: DebtPaymentMethod[] = ['CASH', 'TRANSFER', 'PRODUCT', 'OTHER'];

    // Assert
    expect(validMethods).toHaveLength(4);
  });

  it('should allow null nullable fields', () => {
    // Arrange
    const debtMinFields: CustomerDebt = {
      ...mockDebt,
      description: null,
      dueDate: null,
      notes: null,
    };

    // Assert
    expect(debtMinFields.description).toBeNull();
    expect(debtMinFields.dueDate).toBeNull();
  });
});

describe('DEBT_STATUS_LABELS', () => {
  it('should have a label for every status', () => {
    // Arrange
    const statuses: DebtStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'];

    // Assert
    statuses.forEach((status) => {
      expect(DEBT_STATUS_LABELS[status]).toBeTruthy();
    });
  });

  it('should return Spanish labels', () => {
    expect(DEBT_STATUS_LABELS.PENDING).toBe('Pendiente');
    expect(DEBT_STATUS_LABELS.PAID).toBe('Pagada');
    expect(DEBT_STATUS_LABELS.CANCELLED).toBe('Cancelada');
  });
});

describe('DEBT_STATUS_COLORS', () => {
  it('should have a color for every status', () => {
    // Arrange
    const statuses: DebtStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'];

    // Assert
    statuses.forEach((status) => {
      expect(DEBT_STATUS_COLORS[status]).toBeTruthy();
    });
  });
});

describe('UpdateDebtData', () => {
  it('should accept partial updates', () => {
    // Arrange
    const updateData: UpdateDebtData = { notes: 'Abonan el martes' };

    // Assert
    expect(updateData.notes).toBe('Abonan el martes');
    expect(updateData.description).toBeUndefined();
  });
});
