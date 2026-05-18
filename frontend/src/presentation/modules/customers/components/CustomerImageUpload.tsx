'use client';

import { Button } from '@/presentation/shared/components/ui/Button';

interface CustomerImageUploadProps {
  selectedFile: File | null;
  uploading: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onCancel: () => void;
}

export function CustomerImageUpload({ selectedFile, uploading, onFileChange, onUpload, onCancel }: CustomerImageUploadProps) {
  return (
    <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
      <label className="block text-sm font-medium text-gray-700" htmlFor="customer-image-file">
        Imagen local
      </label>
      <input
        id="customer-image-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        title="Selecciona una imagen local para subir al servidor"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-gray-700"
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel} title="Cancelar">
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={onUpload}
          disabled={uploading || !selectedFile}
          title="Subir imagen seleccionada"
        >
          {uploading ? 'Subiendo...' : 'Subir'}
        </Button>
      </div>
    </div>
  );
}
