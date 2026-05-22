'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from '@/presentation/shared/components/ui/icon-mapping';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';

interface ImagePreviewProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreview({ src, alt, isOpen, onClose }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Cerrar vista previa"
      >
        <X className="h-8 w-8" />
      </button>

      <div 
        className="relative max-w-[90vw] max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="lg" className="text-white" />
          </div>
        )}

        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-[85vh] object-contain rounded-lg transition-all duration-300 ${
            isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}