'use client';

import { useState } from 'react';
import type { User } from '@/core/entities/user';
import { useUsersController } from '../hooks/useUsersController';
import { UserTable } from '../components/table/UserTable';
import { UserFormFields } from '../components/form/UserFormFields';
import { EditUserDialog } from '../components/dialogs/EditUserDialog';
import { ChangePasswordDialog } from '../components/dialogs/ChangePasswordDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function UsersView() {
  const { users, isLoading, error, create, update, changeUserPassword, isCreating, isUpdating, isChangingPassword } = useUsersController();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogType, setDialogType] = useState<'edit' | 'password' | null>(null);

  const handleToggle = (id: string, isActive: boolean) => update({ id, data: { isActive } });
  const handleEdit = (user: User) => { setSelectedUser(user); setDialogType('edit'); };
  const handleChangePassword = (user: User) => { setSelectedUser(user); setDialogType('password'); };
  const closeDialog = () => { setSelectedUser(null); setDialogType(null); };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Usuario</CardTitle></CardHeader>
          <CardContent>
            <UserFormFields
              onSubmit={async (data) => { await create(data); setShowForm(false); }}
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
          <UserTable users={users} onToggle={handleToggle} onEdit={handleEdit} onChangePassword={handleChangePassword} />
        </CardContent>
      </Card>

      {selectedUser && (
        <EditUserDialog
          open={dialogType === 'edit'}
          user={selectedUser}
          onSave={(id, data) => update({ id, data })}
          onClose={closeDialog}
          isSaving={isUpdating}
        />
      )}
      {selectedUser && (
        <ChangePasswordDialog
          open={dialogType === 'password'}
          user={selectedUser}
          onSave={(id, password) => changeUserPassword({ id, data: { newPassword: password } })}
          onClose={closeDialog}
          isSaving={isChangingPassword}
        />
      )}
    </div>
  );
}
