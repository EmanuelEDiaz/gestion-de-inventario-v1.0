'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Dialog, TooltipWrapper } from '@/presentation/shared/components/ui';
import type { User } from '@/core/user/entities/user';

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

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setError('');
    await onSave(user.id, password);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Cambiar contraseña" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <TooltipWrapper content="Cancelar">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} title="Cancelar">Cancelar</Button>
          </TooltipWrapper>
          <TooltipWrapper content="Cambiar contraseña del usuario">
            <Button size="sm" type="submit" disabled={isSaving} title="Cambiar contraseña">
              {isSaving ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </TooltipWrapper>
        </div>
      </form>
    </Dialog>
  );
}
