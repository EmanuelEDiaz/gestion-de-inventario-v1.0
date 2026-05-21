'use client';

import { useState } from 'react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from '@/core/supplier/entities/supplier-social-link';

const PLATFORMS: SocialPlatform[] = [
  'WHATSAPP', 'TELEGRAM', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WEBSITE', 'OTHER',
];

interface SocialLinkFormProps {
  onSave: (data: { platform: SocialPlatform; url: string; label: string }) => Promise<void>;
  onCancel: () => void;
}

export function SocialLinkForm({ onSave, onCancel }: SocialLinkFormProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('INSTAGRAM');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) return;
    setIsPending(true);
    try {
      await onSave({ platform, url, label });
      setUrl('');
      setLabel('');
      setPlatform('INSTAGRAM');
    } catch {
      // error handled by parent
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-3 bg-gray-50">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="platform-select">
            Plataforma
          </label>
          <ComboboxSelect
            options={PLATFORMS.map((p) => ({ value: p, label: SOCIAL_PLATFORM_LABELS[p] }))}
            value={platform}
            onChange={(val) => setPlatform(val as SocialPlatform)}
            placeholder="Seleccionar..."
          />
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
        <Button size="sm" variant="ghost" onClick={onCancel} title="Cancelar">
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!url.trim() || isPending}
          title="Guardar enlace"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
