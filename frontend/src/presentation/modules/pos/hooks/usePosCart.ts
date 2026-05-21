'use client';

import { useState, useCallback } from 'react';
import { saleRepository } from '@/infrastructure/repositories/sale/SaleRepository';
import { CreateSaleUseCase } from '@/core/sale/use-cases';
import type { PaymentMode } from '@/core/sale/entities/sale';
import type { Customer } from '@/core/customer/entities/customer';
import { toast } from '@/presentation/shared/components/ui/toast';

export interface CartLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface PosCartState {
  warehouseId: string;
  lines: CartLine[];
  paymentMode: PaymentMode;
  customer: Customer | null;
  notes: string;
  isSubmitting: boolean;
}

const createUseCase = new CreateSaleUseCase(saleRepository);

const EMPTY: PosCartState = {
  warehouseId: '',
  lines: [],
  paymentMode: 'IMMEDIATE',
  customer: null,
  notes: '',
  isSubmitting: false,
};

export function usePosCart() {
  const [state, setState] = useState<PosCartState>(EMPTY);

  const setWarehouse = useCallback((warehouseId: string) => {
    setState((p) => ({ ...p, warehouseId }));
  }, []);

  const setPaymentMode = useCallback((paymentMode: PaymentMode) => {
    setState((p) => ({ ...p, paymentMode }));
    if (paymentMode === 'IMMEDIATE') {
      setState((p) => ({ ...p, customer: null, paymentMode }));
    }
  }, []);

  const setCustomer = useCallback((customer: Customer | null) => {
    setState((p) => ({ ...p, customer }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setState((p) => ({ ...p, notes }));
  }, []);

  const addLine = useCallback((line: CartLine) => {
    setState((p) => {
      const existing = p.lines.findIndex((l) => l.productId === line.productId);
      if (existing >= 0) {
        const lines = [...p.lines];
        lines[existing] = { ...lines[existing], quantity: lines[existing].quantity + line.quantity };
        return { ...p, lines };
      }
      return { ...p, lines: [...p.lines, line] };
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setState((p) => ({ ...p, lines: p.lines.filter((l) => l.productId !== productId) }));
  }, []);

  const updateQty = useCallback((productId: string, quantity: number) => {
    setState((p) => ({
      ...p,
      lines: p.lines.map((l) => l.productId === productId ? { ...l, quantity } : l),
    }));
  }, []);

  const clearCart = useCallback(() => setState(EMPTY), []);

  const total = state.lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discount / 100),
    0,
  );

  const canFiar =
    (state.paymentMode === 'CREDIT' || state.paymentMode === 'RESERVE') &&
    state.customer !== null;

  const confirm = useCallback(async (): Promise<boolean> => {
    if (!state.warehouseId || state.lines.length === 0) return false;
    if ((state.paymentMode === 'CREDIT' || state.paymentMode === 'RESERVE') && !state.customer) {
      toast.error('Selecciona un cliente para usar Fiado o Reserva');
      return false;
    }

    setState((p) => ({ ...p, isSubmitting: true }));
    try {
      await createUseCase.execute({
        warehouseId: state.warehouseId,
        customerId: state.customer?.id,
        paymentMode: state.paymentMode,
        notes: state.notes || undefined,
        lines: state.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
        })),
      });
      toast.success('Venta registrada correctamente');
      clearCart();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar venta');
      setState((p) => ({ ...p, isSubmitting: false }));
      return false;
    }
  }, [state, clearCart]);

  return {
    ...state,
    total,
    canFiar,
    setWarehouse,
    setPaymentMode,
    setCustomer,
    setNotes,
    addLine,
    removeLine,
    updateQty,
    clearCart,
    confirm,
  };
}
