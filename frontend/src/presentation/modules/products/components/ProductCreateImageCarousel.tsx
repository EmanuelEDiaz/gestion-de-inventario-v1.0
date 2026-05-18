'use client';

import { useEffect, useMemo } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { toast } from '@/presentation/shared/components/ui/toast';

const MAX_IMAGES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProductCreateImageCarouselProps {
  files: File[];
  primaryIndex: number;
  onChange: (files: File[], primaryIndex: number) => void;
}

export function ProductCreateImageCarousel({ files, primaryIndex, onChange }: ProductCreateImageCarouselProps) {
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(event.target.files ?? []);
    if (inputFiles.length === 0) return;

    const validFiles = inputFiles.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Formato no permitido: ${file.name}`);
        return false;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`El archivo ${file.name} supera 5MB`);
        return false;
      }
      return true;
    });

    const combined = [...files, ...validFiles].slice(0, MAX_IMAGES);
    if (combined.length < files.length + validFiles.length) {
      toast.error('Máximo 8 imágenes por producto');
    }
    onChange(combined, Math.min(primaryIndex, Math.max(combined.length - 1, 0)));
    event.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    const nextFiles = files.filter((_, idx) => idx !== indexToRemove);
    const nextPrimary =
      indexToRemove === primaryIndex
        ? 0
        : indexToRemove < primaryIndex
          ? primaryIndex - 1
          : primaryIndex;
    onChange(nextFiles, Math.max(0, Math.min(nextPrimary, Math.max(nextFiles.length - 1, 0))));
  };

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Imágenes del producto</h3>
        <span className="text-xs text-slate-500">{files.length}/{MAX_IMAGES}</span>
      </div>

      {previews.length === 0 ? (
        <label
          htmlFor="create-product-images"
          title="Selecciona imágenes para el carrusel del producto"
          className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
        >
          <ImagePlus className="h-6 w-6" />
          <p className="text-sm">Selecciona hasta 8 imágenes (jpg, png, webp)</p>
        </label>
      ) : (
        <div className="space-y-3">
          <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-black/5">
            <img
              src={previews[primaryIndex]?.url}
              alt="Vista principal del producto"
              className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
              Principal
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {previews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200"
              >
                <img src={preview.url} alt={`Imagen ${index + 1}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end justify-between bg-linear-to-t from-black/65 via-black/10 to-transparent p-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    title="Definir como imagen principal"
                    onClick={() => onChange(files, index)}
                    className="rounded bg-white/90 p-1 text-amber-600 hover:bg-white"
                  >
                    <Star className="h-3.5 w-3.5" fill={index === primaryIndex ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar esta imagen"
                    onClick={() => removeImage(index)}
                    className="rounded bg-white/90 p-1 text-danger hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {files.length < MAX_IMAGES && (
              <label
                htmlFor="create-product-images"
                title="Agregar más imágenes"
                className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
              >
                <ImagePlus className="h-5 w-5" />
              </label>
            )}
          </div>
        </div>
      )}

      <input
        id="create-product-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        title="Seleccionar imágenes del producto"
        className="hidden"
        onChange={handleFilesSelected}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          title="Limpiar imágenes seleccionadas"
          onClick={() => onChange([], 0)}
          disabled={files.length === 0}
        >
          Limpiar imágenes
        </Button>
      </div>
    </section>
  );
}
