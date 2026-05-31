'use client';

import React from 'react';
import { Input, TooltipWrapper } from '@/presentation/shared/components/ui';

interface MessageComposerProps {
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}

export function MessageComposer({
  title,
  body,
  onTitleChange,
  onBodyChange,
}: MessageComposerProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="msg-title">
          Asunto
        </label>
        <TooltipWrapper content="Asunto del mensaje">
          <Input
            id="msg-title"
            placeholder="Ej: Consulta sobre stock"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={120}
          />
        </TooltipWrapper>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="msg-body">
          Mensaje
        </label>
        <TooltipWrapper content="Cuerpo del mensaje">
          <textarea
            id="msg-body"
            placeholder="Escribe tu mensaje aquí..."
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </TooltipWrapper>
        <p className="mt-0.5 text-right text-xs text-gray-400">{body.length}/1000</p>
      </div>
    </>
  );
}
