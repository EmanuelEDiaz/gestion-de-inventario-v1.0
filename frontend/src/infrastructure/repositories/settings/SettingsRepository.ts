import axios from 'axios';
import { apiClient } from '@/infrastructure/api/client';
import type { ISettingsRepository } from '@/core/settings/ports/ISettingsRepository';
import type { AppSettings, UpdateSettingsInput } from '@/core/settings/entities/app-settings';

/** Extrae el mensaje descriptivo de una respuesta application/problem+json. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    if (typeof data.title === 'string' && data.title.trim()) return data.title;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export class SettingsRepository implements ISettingsRepository {
  private readonly basePath = '/api/v1/settings';

  async get(): Promise<AppSettings> {
    try {
      const response = await apiClient.get<AppSettings>(this.basePath);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'No se pudo obtener la configuración del sistema'));
    }
  }

  async update(data: UpdateSettingsInput, version: number): Promise<AppSettings> {
    try {
      const response = await apiClient.patch<AppSettings>(this.basePath, data, {
        headers: { 'If-Match': `W/"${version}"` },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const msg = extractErrorMessage(error,
          'La configuración fue modificada por otro usuario. Actualiza la página e intenta nuevamente.');
        const conflictError = new Error(msg);
        conflictError.name = 'SettingsVersionConflict';
        throw conflictError;
      }
      throw new Error(extractErrorMessage(error, 'No se pudo guardar la configuración'));
    }
  }
}

export const settingsRepository = new SettingsRepository();
