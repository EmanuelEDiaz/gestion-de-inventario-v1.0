'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/presentation/shared/components/ui';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { useNetworkHealth, checkBackendHealth } from '@/presentation/shared/hooks/storage/useNetworkHealth';
import axios from 'axios';
import { LoginHeader } from './LoginHeader';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, hasHydrated } = useAuthStore();
  const { backendStatus } = useNetworkHealth();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isBackendOffline = backendStatus === 'disconnected';

  useEffect(() => {
    if (hasHydrated && isAuthenticated && !hasSubmitted) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, hasSubmitted, router]);

  const handleSubmit = async (username: string, password: string) => {
    const isReachable = await checkBackendHealth();
    if (!isReachable) {
      toast.error('Sin conexión al servidor', { description: 'Debes estar conectado al servidor para iniciar sesión.', duration: 5000 });
      return;
    }
    try {
      await login({ username: username.trim(), password });
      toast.success('¡Bienvenido!', { description: 'Iniciando sesión...', duration: 2000 });
      setHasSubmitted(true);
      router.replace('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401) toast.error('Credenciales inválidas', { description: 'Usuario o contraseña incorrectos.', duration: 5000 });
        else if (err.response.status === 403) toast.error('Acceso denegado', { description: 'Tu cuenta ha sido deshabilitada.', duration: 5000 });
        else toast.error('Error del servidor', { description: `Error ${err.response.status}: Intenta de nuevo más tarde.`, duration: 5000 });
      } else if (axios.isAxiosError(err)) {
        toast.error('Error de conexión', { description: 'No se pudo conectar con el servidor. Verifica tu conexión.', duration: 6000 });
      } else {
        toast.error('Error inesperado', { description: 'Ocurrió un error. Por favor intenta de nuevo.', duration: 5000 });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <LoginHeader />
      <LoginForm
        isLoading={isLoading}
        isBackendOffline={isBackendOffline}
        onSubmit={handleSubmit}
      />
      <p className="mt-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Sistema de Inventario
      </p>
    </div>
  );
}
