'use client';

import { useMemo, useState } from 'react';
import { KeyRound, Pencil, Power } from '@/presentation/shared/components/ui/icon-mapping';
import type { User } from '@/core/user/entities/user';
import { useUsersController } from '../hooks/useUsersController';
import { UserFormFields } from '../components/form/UserFormFields';
import { EditUserDialog } from '../components/dialogs/EditUserDialog';
import { ChangePasswordDialog } from '../components/dialogs/ChangePasswordDialog';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { statusBadge } from '@/presentation/shared/lib/colors';

const COLUMNS: Column<User>[] = [
  {
    key: 'displayName', label: 'Usuario',
    render: (_, r) => (
      <div className="flex items-center gap-2" title={`Usuario: ${r.username}`}>
        {r.avatarUrl
          ? <img src={r.avatarUrl} alt={r.displayName} className="h-8 w-8 rounded-full object-cover" />
          : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{r.displayName.charAt(0).toUpperCase()}</span>
        }
        <div>
          <p className="font-medium text-sm">{r.displayName}</p>
          <p className="text-xs text-muted-foreground">@{r.username}</p>
        </div>
      </div>
    ),
  },
  { key: 'email', label: 'Email', render: (_, r) => <span title="Correo electrónico">{r.email ?? '—'}</span> },
  { key: 'role', label: 'Rol', render: (_, r) => <span title={`Rol: ${r.role.name}`} className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-info/10 text-info">{r.role.name}</span> },
  {
    key: 'isActive', label: 'Estado',
    render: (_, r) => (
      <span title={r.isActive ? 'Usuario activo' : 'Usuario inactivo'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.isActive)}`}>
        {r.isActive ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export function UsersView() {
  const { users, isLoading, error, create, update, changeUserPassword, isCreating, isUpdating, isChangingPassword } = useUsersController();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogType, setDialogType] = useState<'edit' | 'password' | null>(null);

  const handleEdit = (user: User) => { setSelectedUser(user); setDialogType('edit'); };
  const handleChangePassword = (user: User) => { setSelectedUser(user); setDialogType('password'); };
  const closeDialog = () => { setSelectedUser(null); setDialogType(null); };

  const actions = useMemo<TableAction<User>[]>(() => [
    { icon: Pencil, title: 'Editar usuario', onClick: handleEdit },
    { icon: KeyRound, title: 'Cambiar contraseña', onClick: handleChangePassword },
    { icon: Power, title: 'Activar/desactivar usuario', onClick: (r) => update({ id: r.id, data: { isActive: !r.isActive } }) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [update]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" description="Gestiona los usuarios del sistema"
        actions={!showForm && <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo usuario">+ Nuevo Usuario</Button>}
      />
      {showForm && (
        <UserFormFields onSubmit={async (data) => { await create(data); setShowForm(false); }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)} />
      )}
      <GenericTable data={users} columns={COLUMNS} actions={actions} emptyMessage="No hay usuarios registrados" />
      {selectedUser && <EditUserDialog open={dialogType === 'edit'} user={selectedUser}
        onSave={(id, data) => update({ id, data })} onClose={closeDialog} isSaving={isUpdating} />}
      {selectedUser && <ChangePasswordDialog open={dialogType === 'password'} user={selectedUser}
        onSave={(id, password) => changeUserPassword({ id, data: { newPassword: password } })} onClose={closeDialog} isSaving={isChangingPassword} />}
    </div>
  );
}

