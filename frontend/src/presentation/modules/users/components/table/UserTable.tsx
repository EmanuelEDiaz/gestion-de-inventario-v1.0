'use client';

import type { User } from '@/core/entities/user';
import { UserRow } from './UserRow';
import { EmptyState } from '@/presentation/shared/components/EmptyState';

interface UserTableProps {
  users: User[];
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
}

export function UserTable({ users, onToggle, onEdit, onChangePassword }: UserTableProps) {
  if (users.length === 0) {
    return <EmptyState message="No hay usuarios registrados" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Nombre</th>
            <th className="p-3 text-left font-medium">Usuario</th>
            <th className="p-3 text-left font-medium">Email</th>
            <th className="p-3 text-left font-medium">Rol</th>
            <th className="p-3 text-left font-medium">Estado</th>
            <th className="p-3 text-left font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} onToggle={onToggle} onEdit={onEdit} onChangePassword={onChangePassword} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
