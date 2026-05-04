'use client';

import { useState } from 'react';
import { useSupplierSocialLinks } from '../hooks/useSupplierSocialLinks';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import {
  SOCIAL_PLATFORM_LABELS,
  type SocialPlatform,
} from '@/core/entities/supplier-social-link';

const PLATFORMS: SocialPlatform[] = [
  'WHATSAPP', 'TELEGRAM', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WEBSITE', 'OTHER',
];

interface SupplierSocialLinksProps {
  supplierId: string;
}

export function SupplierSocialLinks({ supplierId }: SupplierSocialLinksProps) {
  const { links, isLoading, add, remove } = useSupplierSocialLinks(supplierId);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>('INSTAGRAM');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) return;
    try {
      await add.mutateAsync({ platform, url: url.trim(), label: label.trim() || undefined });
      toast.success('Red social agregada');
      setUrl('');
      setLabel('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar red social');
    }
  };

  const handleRemove = async (linkId: string) => {
    try {
      await remove.mutateAsync(linkId);
      toast.success('Red social eliminada');
    } catch {
      toast.error('Error al eliminar red social');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{links.length} enlace(s)</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)} title="Agregar red social">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-3 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="platform-select">
                Plataforma
              </label>
              <select
                id="platform-select"
                className="rounded-md border px-3 py-2 text-sm"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                title="Seleccionar plataforma de red social"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{SOCIAL_PLATFORM_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <Input
              label="Etiqueta (opcional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ej: Contacto principal"
              title="Etiqueta descriptiva para este enlace"
            />
          </div>
          <Input
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://wa.me/..."
            title="URL completa del perfil o contacto"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} title="Cancelar">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!url.trim() || add.isPending}
              title="Guardar enlace"
            >
              {add.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}

      {links.length === 0 && !showForm && <EmptyState message="Sin redes sociales registradas" />}

      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-500 uppercase w-20 shrink-0">
                {SOCIAL_PLATFORM_LABELS[link.platform]}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm truncate hover:underline"
                title={link.url}
              >
                {link.label || link.url}
              </a>
              <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
            </div>
            <button
              className="ml-2 p-1 rounded hover:bg-red-50"
              onClick={() => handleRemove(link.id)}
              title="Eliminar enlace"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
