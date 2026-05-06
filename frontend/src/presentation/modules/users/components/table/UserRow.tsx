'use client';

import type { User } from '@/core/entities/user';
import { Badge, TooltipWrapper } from '@/presentation/shared/components/ui';
import { Pencil, KeyRound } from 'lucide-react';

interface UserRowProps {
  user: User;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
}

export function UserRow({ user, onToggle, onEdit, onChangePassword }: UserRowProps) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-3">
        <div className="flex items-center gap-2">
          {user.avatarUrl && (
            <img src={user.avatarUrl} alt={user.displayName} className="h-8 w-8 rounded-full object-cover" />
          )}
          <span className="font-medium">{user.displayName}</span>
        </div>
      </td>
      <td className="p-3 text-muted-foreground">{user.username}</td>
      <td className="p-3 text-muted-foreground">{user.email ?? '—'}</td>
      <td className="p-3">
        <Badge variant={user.role.code === 'ADMIN' ? 'default' : 'secondary'}>
          {user.role.name}
        </Badge>
      </td>
      <td className="p-3">
        <Badge variant={user.isActive ? 'default' : 'destructive'}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <TooltipWrapper content="Editar usuario">
            <button onClick={() => onEdit(user)} title="Editar usuario"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
              <Pencil className="h-4 w-4" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Cambiar contraseña">
            <button onClick={() => onChangePassword(user)} title="Cambiar contraseña"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
              <KeyRound className="h-4 w-4" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}>
            <button onClick={() => onToggle(user.id, !user.isActive)}
              className="text-sm text-primary hover:underline" title={user.isActive ? 'Desactivar' : 'Activar'}>
              {user.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </TooltipWrapper>
        </div>
      </td>
    </tr>
  );
}
