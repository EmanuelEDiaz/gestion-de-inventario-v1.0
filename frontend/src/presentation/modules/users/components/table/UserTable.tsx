'use client';

import { useMemo } from 'react';
import { Pencil, KeyRound, ToggleLeft } from 'lucide-react';
import type { User } from '@/core/user/entities/user';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { Badge } from '@/presentation/shared/components/ui/badge';

interface UserTableProps {
  users: User[];
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
}

const COLUMNS: Column<User>[] = [
  {
    key: 'displayName', label: 'Nombre',
    render: (_, r) => (
      <div className="flex items-center gap-2">
        {r.avatarUrl && (
          <img src={r.avatarUrl} alt={r.displayName} className="h-8 w-8 rounded-full object-cover" />
        )}
        <span className="font-medium">{r.displayName}</span>
      </div>
    ),
  },
  { key: 'username', label: 'Usuario', render: (_, r) => <span className="text-muted-foreground">{r.username}</span> },
  { key: 'email', label: 'Email', render: (_, r) => <span className="text-muted-foreground">{r.email ?? '—'}</span> },
  {
    key: 'role', label: 'Rol',
    render: (_, r) => <Badge variant={r.role.code === 'ADMIN' ? 'default' : 'secondary'}>{r.role.name}</Badge>,
  },
  {
    key: 'isActive', label: 'Estado',
    render: (_, r) => <Badge variant={r.isActive ? 'default' : 'destructive'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge>,
  },
];

export function UserTable({ users, onToggle, onEdit, onChangePassword }: UserTableProps) {
  const actions = useMemo<TableAction<User>[]>(() => [
    { icon: Pencil, title: 'Editar', onClick: (r) => onEdit(r) },
    { icon: KeyRound, title: 'Cambiar contraseña', onClick: (r) => onChangePassword(r) },
    { icon: ToggleLeft, title: 'Desactivar', onClick: (r) => onToggle(r.id, false), hidden: (r) => !r.isActive },
    { icon: ToggleLeft, title: 'Activar', onClick: (r) => onToggle(r.id, true), hidden: (r) => r.isActive },
  ], [onToggle, onEdit, onChangePassword]);

  return (
    <GenericTable data={users} columns={COLUMNS} actions={actions}
      emptyMessage="No hay usuarios registrados" />
  );
}
