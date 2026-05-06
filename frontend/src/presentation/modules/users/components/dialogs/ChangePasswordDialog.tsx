'use client';

import { useState, useEffect } from 'react';
import { Close } from '@material-symbols-svg/react';
import { Button, Input } from '@/presentation/shared/components/ui';
import type { User } from '@/core/entities/user';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (id: string, newPassword: string) => Promise<void>;
  isSaving: boolean;
}

export function ChangePasswordDialog({ open, user, onClose, onSave, isSaving }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setPassword(''); setConfirm(''); setError(''); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setError('');
    await onSave(user.id, password);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Cambiar contraseña"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Cambiar contraseña</h2>
          <button onClick={onClose} title="Cerrar" className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <Close className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">Usuario: <strong>{user.displayName}</strong></p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nueva contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} placeholder="••••••••" title="Nueva contraseña (mínimo 8 caracteres)" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Confirmar contraseña</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required minLength={8} placeholder="••••••••" title="Confirmar la nueva contraseña" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} title="Cancelar">Cancelar</Button>
            <Button size="sm" type="submit" disabled={isSaving} title="Cambiar contraseña">
              {isSaving ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
