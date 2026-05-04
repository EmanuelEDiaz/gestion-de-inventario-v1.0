'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductImage } from '@/core/entities/product-image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ImageLightboxProps {
  images: ProductImage[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && current > 0) setCurrent(c => c - 1);
      if (e.key === 'ArrowRight' && current < images.length - 1) setCurrent(c => c + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, images.length, onClose]);

  const image = images[current];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-lg z-10"
      >
        <X className="h-8 w-8" />
      </button>
      
      {current > 0 && (
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrent(c => c - 1); }}
          className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-lg"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>
      )}
      {current < images.length - 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrent(c => c + 1); }}
          className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-lg"
        >
          <ChevronRight className="h-10 w-10" />
        </button>
      )}
      
      <div className="max-w-[90vw] max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <img 
          src={`${API_URL}/media${image.filePath}`} 
          alt={image.originalFilename || 'Imagen producto'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <div className="text-center text-white mt-4">
          <p className="font-medium">{image.originalFilename || 'Sin nombre'}</p>
          {image.isPrimary && <span className="text-yellow-400 text-sm"> · Principal</span>}
          <span className="text-gray-400 text-sm ml-2">{current + 1} / {images.length}</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {images.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full ${i === current ? 'bg-white' : 'bg-white/40'}`} 
          />
        ))}
      </div>
    </div>
  );
}