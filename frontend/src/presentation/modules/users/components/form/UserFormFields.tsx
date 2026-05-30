'use client';

import { useState } from 'react';
import type { CreateUserData } from '@/core/user/entities/user';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { useRoles } from '@/presentation/modules/roles/hooks/useRoles';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';

interface UserFormFieldsProps {
  onSubmit: (data: CreateUserData) => void;
  onContinue?: (data: CreateUserData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function UserFormFields({ onSubmit, onContinue, isSubmitting, onCancel }: UserFormFieldsProps) {
  const { data: roles = [], isLoading: loadingRoles } = useRoles();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [shouldContinue, setShouldContinue] = useState(false);

  const resetForm = () => {
    setUsername('');
    setDisplayName('');
    setEmail('');
    setPassword('');
    setRoleId('');
  };

  const getData = (): CreateUserData => ({
    username, displayName, email: email || undefined, password, roleId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = getData();
    if (shouldContinue && onContinue) {
      resetForm();
      onContinue(data);
    } else {
      onSubmit(data);
    }
    setShouldContinue(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">Usuario</label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="juanperez" required title="Nombre de usuario para iniciar sesión" />
        </div>
        <div className="space-y-1">
          <label htmlFor="displayName" className="text-sm font-medium">Nombre Completo</label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Juan Pérez" required title="Nombre que se mostrará en la aplicación" />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email (opcional)</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@empresa.com" title="Dirección de correo electrónico del usuario" />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            <span className="inline-flex items-center gap-1">Contraseña<TooltipHint title="Contraseña" description="Mínimo 8 caracteres, incluir mayúscula y número" /></span>
          </label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" required minLength={8} title="Contraseña de al menos 8 caracteres" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="roleId" className="text-sm font-medium">
          <span className="inline-flex items-center gap-1">Rol<TooltipHint title="Rol" description="Define los permisos del usuario en el sistema" /></span>
        </label>
        <select id="roleId" value={roleId} onChange={(e) => setRoleId(e.target.value)}
          required title="Rol del usuario en el sistema"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50">
          <option value="" disabled>{loadingRoles ? 'Cargando roles...' : 'Seleccionar rol'}</option>
          {roles.filter((r) => r.isActive).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !roleId}>
          {isSubmitting ? 'Creando...' : 'Crear Usuario'}
        </Button>
        {onContinue && (
          <Button type="submit" variant="outline" disabled={isSubmitting || !roleId}
            onClick={() => setShouldContinue(true)}>
            {isSubmitting ? 'Creando...' : 'Crear y Continuar'}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel} title="Cancelar">Cancelar</Button>
      </div>
    </form>
  );
}
