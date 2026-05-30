'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Input, Dialog, TooltipWrapper } from '@/presentation/shared/components/ui';
import { useRoles } from '@/presentation/modules/roles/hooks/useRoles';
import type { User, UpdateUserData } from '@/core/user/entities/user';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (id: string, data: UpdateUserData) => Promise<void>;
  isSaving: boolean;
  onUploadAvatar: (id: string, file: File) => Promise<string>;
  onDeleteAvatar: (id: string) => Promise<void>;
}

export function EditUserDialog({ open, user, onClose, onSave, isSaving, onUploadAvatar, onDeleteAvatar }: Props) {
  const { data: roles = [] } = useRoles();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email ?? '');
      setRoleId(user.role.id);
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!user) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    setIsUploadingAvatar(true);
    try {
      await onUploadAvatar(user.id, selectedFile);
      setPreviewUrl(null);
      setSelectedFile(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    await onDeleteAvatar(user.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(user.id, { displayName, email: email || undefined, roleId });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Editar usuario" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            {previewUrl || user.avatarUrl ? (
              <img
                src={previewUrl || user.avatarUrl || ''}
                alt={user.displayName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                hidden
                ref={fileInputRef}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                  {user.avatarUrl ? 'Cambiar Foto' : 'Subir Foto'}
                </Button>
                {selectedFile && (
                  <Button variant="outline" size="sm" type="button" disabled={isUploadingAvatar} onClick={handleUploadAvatar}>
                    {isUploadingAvatar ? 'Subiendo...' : 'Guardar'}
                  </Button>
                )}
                {user.avatarUrl && (
                  <Button variant="ghost" size="sm" type="button" onClick={handleDeleteAvatar}>
                    Eliminar
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">JPG, PNG o WebP. Máx 2MB.</p>
            </div>
          </div>
        </div>
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
          <TooltipWrapper content="Cancelar">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} title="Cancelar">Cancelar</Button>
          </TooltipWrapper>
          <TooltipWrapper content="Guardar cambios">
            <Button size="sm" type="submit" disabled={isSaving} title="Guardar cambios">
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </TooltipWrapper>
        </div>
      </form>
    </Dialog>
  );
}
