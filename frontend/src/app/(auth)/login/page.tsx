'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/presentation/shared/components/ui';
import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';
import { getErrorMessage } from '@/infrastructure/api/client';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, setError } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  
  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      errors.username = 'El usuario es requerido';
    }
    if (!password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    try {
      await login({ username: username.trim(), password });
      router.push('/dashboard');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Logo/Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-8 h-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Sistema de Inventario</h1>
        <p className="text-gray-600 mt-1">Inicia sesión para continuar</p>
      </div>
      
      {/* Error global */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Usuario"
          type="text"
          placeholder="Ingresa tu usuario"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (fieldErrors.username) {
              setFieldErrors((prev) => ({ ...prev, username: undefined }));
            }
          }}
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
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          error={fieldErrors.password}
          disabled={isLoading}
          autoComplete="current-password"
        />
        
        <Button 
          type="submit" 
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Iniciar Sesión
        </Button>
      </form>
      
      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Sistema de Inventario
      </p>
    </div>
  );
}
