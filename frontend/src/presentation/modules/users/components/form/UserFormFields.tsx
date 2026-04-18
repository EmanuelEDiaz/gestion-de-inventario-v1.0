'use client';

import { useState } from 'react';
import type { CreateUserData, RoleCode } from '@/core/entities/user';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';

interface UserFormFieldsProps {
  onSubmit: (data: CreateUserData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const ROLES: { id: string; code: RoleCode; label: string }[] = [
  { id: 'admin', code: 'ADMIN', label: 'Administrador' },
  { id: 'seller', code: 'SELLER', label: 'Vendedor' },
];

export function UserFormFields({ onSubmit, isSubmitting, onCancel }: UserFormFieldsProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(ROLES[1].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      displayName,
      email: email || undefined,
      password,
      roleId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">Usuario</label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="juanperez"
            required
            title="Nombre de usuario para iniciar sesión"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="displayName" className="text-sm font-medium">Nombre Completo</label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Juan Pérez"
            required
            title="Nombre que se mostrará en la aplicación"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email (opcional)</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@empresa.com"
            title="Dirección de correo electrónico del usuario"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            title="Contraseña de al menos 8 caracteres"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Rol</label>
        <div className="flex gap-4">
          {ROLES.map((role) => (
            <label key={role.id} className="flex items-center gap-2 cursor-pointer" title={`Asignar rol de ${role.label}`}>
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={roleId === role.id}
                onChange={() => setRoleId(role.id)}
                className="h-4 w-4"
              />
              <span className="text-sm">{role.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Usuario'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
