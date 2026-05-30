import { getSyncMeta, setSyncMeta } from './db';
import { apiClient } from '@/infrastructure/api/client';

export interface PersistedAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export async function persistAuthTokens(auth: PersistedAuth): Promise<void> {
  await setSyncMeta('auth_tokens', auth);
}

export async function getPersistedAuth(): Promise<PersistedAuth | null> {
  const result = await getSyncMeta('auth_tokens');
  return result as PersistedAuth | null;
}

export async function clearPersistedAuth(): Promise<void> {
  await setSyncMeta('auth_tokens', null);
}

export async function tryRefreshTokenOnReconnect(): Promise<boolean> {
  const auth = await getPersistedAuth();
  if (!auth) return false;

  if (Date.now() < auth.expiresAt) return true;

  try {
    const response = await apiClient.post('/api/v1/auth/refresh', {
      refreshToken: auth.refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken, expiresAt, tokenType } = response.data;
    const newAuth: PersistedAuth = {
      accessToken,
      refreshToken: newRefreshToken ?? auth.refreshToken,
      expiresAt: expiresAt ?? Date.now() + 3600_000,
      tokenType: tokenType ?? auth.tokenType,
    };

    await persistAuthTokens(newAuth);

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', newAuth.accessToken);
      localStorage.setItem('refresh_token', newAuth.refreshToken);
    }

    apiClient.defaults.headers.common['Authorization'] = `${newAuth.tokenType} ${newAuth.accessToken}`;

    return true;
  } catch {
    return false;
  }
}
