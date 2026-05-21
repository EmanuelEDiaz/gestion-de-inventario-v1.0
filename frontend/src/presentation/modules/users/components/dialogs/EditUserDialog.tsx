'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Dialog } from '@/presentation/shared/components/ui';
import { useRoles } from '@/presentation/modules/roles/hooks/useRoles';
import type { User, UpdateUserData } from '@/core/user/entities/user';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (id: string, data: UpdateUserData) => Promise<void>;
  isSaving: boolean;
}

export function EditUserDialog({ open, user, onClose, onSave, isSaving }: Props) {
  const { data: roles = [] } = useRoles();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email ?? '');
      setRoleId(user.role.id);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(user.id, { displayName, email: email || undefined, roleId });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Editar usuario" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nombre completo</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            required title="Nombre que se mostrará en la aplicación" placeholder="Juan Pérez" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Email (opcional)</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            title="Dirección de correo electrónico" placeholder="juan@empresa.com" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Rol</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}
            title="Rol del usuario en el sistema"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} title="Cancelar">Cancelar</Button>
          <Button size="sm" type="submit" disabled={isSaving} title="Guardar cambios">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
