'use client';

import React from 'react';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';

interface MessageRecipientSelectorProps {
  targetUserId: string;
  onChange: (value: string) => void;
  loadingUsers: boolean;
  userOptions: { value: string; label: string }[];
}

export function MessageRecipientSelector({
  targetUserId,
  onChange,
  loadingUsers,
  userOptions,
}: MessageRecipientSelectorProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="msg-to">
        Destinatario
      </label>
      <ComboboxSelect
        options={userOptions}
        value={targetUserId}
        onChange={onChange}
        placeholder={loadingUsers ? 'Cargando usuarios...' : 'Seleccionar usuario'}
        searchPlaceholder="Buscar usuario..."
        disabled={loadingUsers}
      />
    </div>
  );
}
