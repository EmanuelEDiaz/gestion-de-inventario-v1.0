'use client';

import { useState, useMemo, useCallback } from 'react';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import { createWarehouseSchema, updateWarehouseSchema } from '@/core/validators/core/warehouse-validators';
import type { CreateWarehouseData } from '@/core/warehouse/entities/warehouse';

const FIELDS: EntityFormField[] = [
  { name: 'code', label: 'Código del Almacén', type: 'text', required: true, placeholder: 'Ej: ALM-01' },
  { name: 'name', label: 'Nombre del Almacén', type: 'text', required: true, placeholder: 'Ej: Almacén Principal' },
  { name: 'address', label: 'Dirección', type: 'textarea', required: false, placeholder: 'Dirección del almacén...' },
];

const INITIAL_VALUES: CreateWarehouseData = {
  code: '',
  name: '',
  address: '',
};

interface WarehouseFormFieldsProps {
  initialData?: CreateWarehouseData;
  initialValues?: Record<string, unknown>;
  storageKey: string;
  isEditing?: boolean;
  persistCreateValues?: boolean;
  onSubmit: (data: CreateWarehouseData) => Promise<void>;
  onCancel: () => void;
}

export function WarehouseFormFields({
  initialData, initialValues, storageKey, isEditing,
  persistCreateValues, onSubmit, onCancel,
}: WarehouseFormFieldsProps) {
  const mergedInitial = useMemo(() => {
    const base = { ...INITIAL_VALUES, ...initialData };
    if (initialValues) {
      for (const [key, value] of Object.entries(initialValues)) {
        if (value != null && key in INITIAL_VALUES) {
          (base as Record<string, string>)[key] = String(value);
        }
      }
    }
    return base;
  }, [initialData, initialValues]);

  const [code, setCode] = useState(mergedInitial.code);
  const [name, setName] = useState(mergedInitial.name);
  const [address, setAddress] = useState(mergedInitial.address ?? '');

  const values: Record<string, string> = useMemo(() => ({
    code, name, address,
  }), [code, name, address]);

  const onChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      code: setCode,
      name: setName,
      address: setAddress,
    };
    setters[field]?.(value);
  }, []);

  const handleSubmitAction = useCallback(async (formValues: Record<string, string>) => {
    await onSubmit({
      code: formValues.code,
      name: formValues.name,
      address: formValues.address || undefined,
    });
  }, [onSubmit]);

  return (
    <EntityForm
      title={isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
      description={isEditing ? 'Modifica los datos del almacén' : 'Completa los datos del almacén'}
      fields={FIELDS}
      values={values}
      onChange={onChange}
      onSubmitAction={handleSubmitAction}
      onCancel={onCancel}
      isEditing={isEditing}
      createSchema={createWarehouseSchema}
      updateSchema={updateWarehouseSchema}
      storageKey={storageKey}
      persistCreateValues={persistCreateValues}
      initialValues={initialValues}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Almacén'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Guardando...'}
    />
  );
}
