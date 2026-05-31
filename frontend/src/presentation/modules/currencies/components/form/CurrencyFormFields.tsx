'use client';

import { useState, useMemo } from 'react';
import type { CreateCurrencyInput, Currency } from '@/core/currency/entities/currency';
import { EntityForm } from '@/presentation/shared/components/form/EntityForm';

interface CurrencyFormFieldsProps {
  initialData?: Currency;
  initialValues?: Partial<CreateCurrencyInput>;
  onSubmit: (data: CreateCurrencyInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function CurrencyFormFields({ initialData, initialValues, onSubmit, isSubmitting, onCancel }: CurrencyFormFieldsProps) {
  const isEditing = !!initialData;

  const [code, setCode] = useState(initialData?.code ?? initialValues?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? initialValues?.name ?? '');
  const [symbol, setSymbol] = useState(initialData?.symbol ?? initialValues?.symbol ?? '');

  const values = { code, name, symbol };
  const onChange = (field: string, value: string) => {
    if (field === 'code') setCode(value.toUpperCase());
    else if (field === 'name') setName(value);
    else if (field === 'symbol') setSymbol(value);
  };

  const fieldConfigs = useMemo(() => [
    {
      name: 'code', label: 'Código ISO', type: 'text' as const, required: true,
      placeholder: 'USD', maxLength: 3, disabled: isEditing,
      hint: 'Código ISO de 3 letras',
      hintDescription: 'Ej: CUP, USD, EUR. No se puede modificar después de crear.',
    },
    {
      name: 'name', label: 'Nombre', type: 'text' as const, required: true,
      placeholder: 'Dólar estadounidense',
      hint: 'Nombre completo de la moneda',
    },
    {
      name: 'symbol', label: 'Símbolo', type: 'text' as const,
      placeholder: '$', maxLength: 5,
      hint: 'Símbolo que se muestra junto a los montos',
    },
  ], [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ code: code.toUpperCase(), name, symbol: symbol || undefined });
  };

  return (
    <EntityForm
      title={isEditing ? 'Editar Moneda' : 'Nueva Moneda'}
      fields={fieldConfigs}
      values={values}
      onChange={onChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      isEditing={isEditing}
      submitLabel={isEditing ? 'Actualizar Moneda' : 'Crear Moneda'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Guardando...'}
      initialValues={isEditing ? undefined : initialValues}
      storageKey="currency-create"
    />
  );
}
