'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useUsersController } from '../hooks/useUsersController';
import { UserTable } from '../components/table/UserTable';
import { UserFormFields } from '../components/form/UserFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function UsersView() {
  const { users, isLoading, error, create, update, isCreating } = useUsersController();
  const [showForm, setShowForm] = useState(false);

  const handleToggle = (id: string, isActive: boolean) => {
    update({ id, data: { isActive } });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Usuario</CardTitle></CardHeader>
          <CardContent>
            <UserFormFields
              onSubmit={async (data) => {
                try {
                  await create(data);
                  setShowForm(false);
                  toast.success('Usuario creado correctamente');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Error al crear usuario');
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
          <CardTitle>Usuarios</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo usuario">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <UserTable users={users} onToggle={handleToggle} />
        </CardContent>
      </Card>
    </div>
  );
}
