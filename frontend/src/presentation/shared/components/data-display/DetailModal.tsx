'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/presentation/shared/lib/utils';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { DetailField } from './DetailField';
import { JsonView } from './JsonView';

interface DetailSection {
  title?: string;
  fields: {
    label: string;
    value: ReactNode;
    tooltip?: string;
  }[];
}

interface DetailJsonSection {
  title: string;
  data: string | null | undefined;
  label: string;
}

interface DetailModalImage {
  url: string;
  alt?: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: DetailSection[];
  jsonSections?: DetailJsonSection[];
  actions?: ReactNode;
  maxWidth?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  images?: DetailModalImage[];
}

export function DetailModal({
  isOpen, onClose, title, sections, jsonSections, actions, maxWidth = 'max-w-2xl',
  imageUrl, imageAlt, images,
}: DetailModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allImages: DetailModalImage[] = images ?? (imageUrl ? [{ url: imageUrl, alt: imageAlt }] : []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex !== null) {
      if (e.key === 'Escape') { setLightboxIndex(null); return; }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => prev !== null ? (prev - 1 + allImages.length) % allImages.length : null);
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => prev !== null ? (prev + 1) % allImages.length : null);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [lightboxIndex, allImages.length, onClose]);

  useEffect(() => {
    if (isOpen || lightboxIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, lightboxIndex, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className={cn(
            'bg-white rounded-xl shadow-2xl w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200',
            maxWidth,
          )}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 rounded-t-xl">
            <h2 className="text-base font-semibold text-gray-900 truncate pr-2">{title}</h2>
            <TooltipWrapper content="Cerrar">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </TooltipWrapper>
          </div>

          <div className="px-5 py-4 space-y-5">
            {allImages.length > 0 && (
              <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                {allImages.length === 1 ? (
                  <div
                    className="aspect-video relative flex items-center justify-center bg-gray-50 cursor-zoom-in group"
                    onClick={() => setLightboxIndex(0)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={allImages[0].url}
                      alt={allImages[0].alt ?? title}
                      className="max-h-full max-w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
                    <span className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                      Click para ampliar
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1">
                    {allImages.map((img, i) => (
                      <div
                        key={i}
                        className="aspect-video relative flex items-center justify-center bg-gray-50 cursor-zoom-in rounded overflow-hidden group"
                        onClick={() => setLightboxIndex(i)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.alt ?? `${title} ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sections.map((section, si) => (
              <div key={si}>
                {section.title && (
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-3.5 rounded-full bg-primary shrink-0" />
                    {section.title}
                  </h3>
                )}
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {section.fields.map((field, fi) => (
                      <DetailField key={fi} label={field.label} value={field.value} tooltip={field.tooltip} />
                    ))}
                  </dl>
                </div>
              </div>
            ))}

            {jsonSections?.map((js, ji) => (
              <div key={ji}>
                <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{js.title}</h3>
                <JsonView data={js.data} />
              </div>
            ))}
          </div>

          <div className={cn(
            'flex items-center gap-2 px-5 py-3 border-t border-gray-100',
            actions ? 'justify-between' : 'justify-end'
          )}>
            {actions}
            <TooltipWrapper content="Cerrar detalle">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg min-h-[44px] transition-colors"
              >
                Cerrar
              </button>
            </TooltipWrapper>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar vista ampliada"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev !== null ? (prev - 1 + allImages.length) % allImages.length : null); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Imagen anterior"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev !== null ? (prev + 1) % allImages.length : null); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Imagen siguiente"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all',
                      i === lightboxIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'
                    )}
                    aria-label={`Ir a imagen ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <div
            className="relative max-w-[90vw] max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allImages[lightboxIndex]!.url}
              alt={allImages[lightboxIndex]!.alt ?? title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg animate-in fade-in zoom-in-95 duration-200"
            />
          </div>
        </div>
      )}
    </>
  );
}
