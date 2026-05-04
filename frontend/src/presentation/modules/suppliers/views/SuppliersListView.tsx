'use client';

import { useState } from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierFormFields } from '../components/form/SupplierFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function SuppliersListView() {
  const { suppliers, loading, error, create, activate, deactivate, remove } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Proveedor</CardTitle></CardHeader>
          <CardContent>
            <SupplierFormFields
              onSubmit={async (data) => {
                setIsCreating(true);
                try {
                  await create(data);
                  toast.success('Proveedor creado');
                  setShowForm(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Error al crear proveedor');
                } finally {
                  setIsCreating(false);
                }
              }}
              isSubmitting={isCreating}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proveedores</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo proveedor">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <SupplierTable
            suppliers={suppliers}
            onActivate={activate}
            onDeactivate={deactivate}
            onDelete={remove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
