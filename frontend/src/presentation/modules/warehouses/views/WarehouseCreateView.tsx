/**
 * WarehouseCreateView - Composition view for warehouse create page
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/presentation/shared/components/ui';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { Card } from '@/presentation/shared/components/ui/card';
import { WarehouseFormFields, type WarehouseFormData } from '../components/form/WarehouseFormFields';
import { useWarehouseFormController } from '../hooks/useWarehouseFormController';

const INITIAL_FORM_DATA: WarehouseFormData = {
  code: '',
  name: '',
  address: '',
};

export function WarehouseCreateView() {
  const { isLoading, error, handleSubmit, clearError, goBack } = useWarehouseFormController();
  const [formData, setFormData] = useState<WarehouseFormData>(INITIAL_FORM_DATA);

  const handleFieldChange = useCallback((field: keyof WarehouseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit({
        code: formData.code,
        name: formData.name,
        address: formData.address || undefined,
      });
    },
    [formData, handleSubmit]
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Almacén</h1>
        <p className="text-gray-600">Ingresa la información del nuevo almacén</p>
      </div>

      {error && <AlertMessage message={error} onDismiss={clearError} />}

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <WarehouseFormFields data={formData} onChange={handleFieldChange} />
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={goBack}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Crear Almacén'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
