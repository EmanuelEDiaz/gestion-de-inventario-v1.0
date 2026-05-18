'use client';

import { useState } from 'react';
import { Input, Button } from '@/presentation/shared/components/ui';
import { WifiOff } from 'lucide-react';

interface LoginFormProps {
  isLoading: boolean;
  isBackendOffline: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function LoginForm({ isLoading, isBackendOffline, onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = 'El usuario es requerido';
    if (!password) errors.password = 'La contraseña es requerida';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(username, password);
  };

  return (
    <>
      {isBackendOffline && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Sin conexión al servidor. Necesitas estar conectado para iniciar sesión.</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Usuario"
          type="text"
          placeholder="Ingresa tu usuario"
          value={username}
          onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined })); }}
          error={fieldErrors.username}
          disabled={isLoading}
          autoComplete="username"
          autoFocus
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
          error={fieldErrors.password}
          disabled={isLoading}
          autoComplete="current-password"
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          disabled={isLoading || isBackendOffline}
        >
          Iniciar Sesión
        </Button>
      </form>
    </>
  );
}
