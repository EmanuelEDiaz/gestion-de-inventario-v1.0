'use client';

import { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerTable } from '../components/CustomerTable';
import { CustomerFormFields } from '../components/form/CustomerFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function CustomersListView() {
  const { customers, loading, error, create, activate, deactivate, remove } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Cliente</CardTitle></CardHeader>
          <CardContent>
            <CustomerFormFields
              onSubmit={async (data) => {
                setIsCreating(true);
                try {
                  await create(data);
                  toast.success('Cliente creado');
                  setShowForm(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Error al crear cliente');
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
          <CardTitle>Clientes</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo cliente">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <CustomerTable
            customers={customers}
            onActivate={activate}
            onDeactivate={deactivate}
            onDelete={remove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
