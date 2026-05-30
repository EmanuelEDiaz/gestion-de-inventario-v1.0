'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { buildShareLinks, type ShareablePlace } from '@/core/shared/utils/locationShare';

interface LocationShareButtonProps {
  place: ShareablePlace;
  variant?: 'icon' | 'button';
}

export function LocationShareButton({ place, variant = 'button' }: LocationShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const links = buildShareLinks(place);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(links.copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [links.copyText]);

  if (variant === 'icon') {
    return (
      <TooltipWrapper content="Compartir ubicación">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground min-h-11 min-w-11"
          aria-label="Compartir ubicación"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
        </button>
      </TooltipWrapper>
    );
  }

  return (
    <div className="relative inline-block">
      <TooltipWrapper content="Compartir ubicación">
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
          Compartir
        </Button>
      </TooltipWrapper>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
            <TooltipWrapper content="Abrir en Google Maps" side="left">
              <a
                href={links.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                🗺️ Google Maps
              </a>
            </TooltipWrapper>
            <TooltipWrapper content="Abrir en Waze" side="left">
              <a
                href={links.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                🚗 Waze
              </a>
            </TooltipWrapper>
            <TooltipWrapper content="Compartir por WhatsApp" side="left">
              <a
                href={links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                💬 WhatsApp
              </a>
            </TooltipWrapper>
            <div className="my-1 border-t" />
            <TooltipWrapper content="Copiar ubicación al portapapeles" side="left">
              <button
                type="button"
                onClick={() => { handleCopy(); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                {copied ? '✅ Copiado' : '📋 Copiar ubicación'}
              </button>
            </TooltipWrapper>
          </div>
        </>
      )}
    </div>
  );
}
