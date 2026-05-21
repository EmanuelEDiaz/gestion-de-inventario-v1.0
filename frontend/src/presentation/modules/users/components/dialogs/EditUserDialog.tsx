'use client';

import { useState, useEffect } from 'react';
import { Close } from '@material-symbols-svg/react';
import { Button, Input } from '@/presentation/shared/components/ui';
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(user.id, { displayName, email: email || undefined, roleId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Editar usuario"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Editar usuario</h2>
          <button onClick={onClose} title="Cerrar" className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <Close className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
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
      </div>
    </div>
  );
}
