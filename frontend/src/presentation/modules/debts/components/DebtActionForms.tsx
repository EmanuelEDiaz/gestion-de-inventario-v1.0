'use client';
import type { ReactNode } from 'react';

interface DebtActionFormsProps {
  showPayForm: boolean;
  showEditForm: boolean;
  payForm: ReactNode;
  editForm: ReactNode;
}

export function DebtActionForms({ showPayForm, showEditForm, payForm, editForm }: DebtActionFormsProps) {
  return (
    <>
      {showPayForm && payForm}
      {showEditForm && editForm}
    </>
  );
}
