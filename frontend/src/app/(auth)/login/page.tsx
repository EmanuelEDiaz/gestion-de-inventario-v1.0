'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, toast } from '@/presentation/shared/components/ui';
import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';
import { useNetworkHealth, checkBackendHealth } from '@/presentation/shared/hooks/useNetworkHealth';
import { WifiOff } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, hasHydrated } = useAuthStore();
  const { backendStatus } = useNetworkHealth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [hasNavigated, setHasNavigated] = useState(false);
  
  const isBackendOffline = backendStatus === 'disconnected';
  
  // Redirigir si ya está autenticado AL CARGAR (no después de login)
  // Solo para usuarios que llegan a /login mientras ya están logueados
  useEffect(() => {
    if (hasHydrated && isAuthenticated && !hasNavigated) {
      // Solo redirigir si no estamos en proceso de login (form vacío)
      if (!username && !password) {
        setHasNavigated(true);
        router.replace('/dashboard');
      }
    }
  }, [hasHydrated, isAuthenticated, hasNavigated, username, password, router]);
  
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
    
    if (!validateForm()) {
      return;
    }

    // Verify backend connectivity before attempting login
    const isReachable = await checkBackendHealth();
    if (!isReachable) {
      toast.error('Sin conexión al servidor', {
        description: 'Debes estar conectado al servidor para iniciar sesión.',
        duration: 5000,
      });
      return;
    }
    
    try {
      await login({ username: username.trim(), password });
      toast.success('¡Bienvenido!', { description: 'Iniciando sesión...', duration: 2000 });
      setHasNavigated(true);
      router.replace('/dashboard');
    } catch (err) {
      // Determinar el tipo de error
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          // Error de conexión (no hay respuesta del servidor)
          toast.error('Error de conexión', { 
            description: 'No se pudo conectar con el servidor. Verifica tu conexión.',
            duration: 6000 
          });
        } else if (err.response.status === 401) {
          // Credenciales incorrectas
          toast.error('Credenciales inválidas', { 
            description: 'Usuario o contraseña incorrectos.',
            duration: 5000 
          });
        } else if (err.response.status === 403) {
          // Usuario deshabilitado
          toast.error('Acceso denegado', { 
            description: 'Tu cuenta ha sido deshabilitada.',
            duration: 5000 
          });
        } else {
          // Otro error del servidor
          toast.error('Error del servidor', { 
            description: `Error ${err.response.status}: Intenta de nuevo más tarde.`,
            duration: 5000 
          });
        }
      } else {
        // Error desconocido
        toast.error('Error inesperado', { 
          description: 'Ocurrió un error. Por favor intenta de nuevo.',
          duration: 5000 
        });
      }
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
      
      {/* Offline Banner */}
      {isBackendOffline && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Sin conexión al servidor. Necesitas estar conectado para iniciar sesión.</span>
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
          disabled={isLoading || isBackendOffline}
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
