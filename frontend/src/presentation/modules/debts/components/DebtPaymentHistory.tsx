'use client';
import type { ReactNode } from 'react';

interface DebtPaymentHistoryProps {
  showPayForm: boolean;
  showEditForm: boolean;
  payForm: ReactNode;
  editForm: ReactNode;
}

export function DebtPaymentHistory({ showPayForm, showEditForm, payForm, editForm }: DebtPaymentHistoryProps) {
  return (
    <>
      {showPayForm && payForm}
      {showEditForm && editForm}
    </>
  );
}
