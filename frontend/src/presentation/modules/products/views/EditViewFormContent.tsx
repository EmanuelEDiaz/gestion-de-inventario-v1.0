'use client';

import { Card } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import type { Category } from '@/core/category/entities/category';

interface EditViewFormContentProps {
  formData: ProductFormData;
  categories: Category[];
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: keyof ProductFormData, value: string) => void;
  onCancel: () => void;
}

export function EditViewFormContent({
  formData, categories, isSaving, onSubmit, onChange, onCancel,
}: EditViewFormContentProps) {
  return (
    <Card className="border-0 bg-white/85 backdrop-blur-sm shadow-xl">
      <form onSubmit={onSubmit} className="space-y-6">
        <ProductFormFields data={formData} categories={categories} onChange={onChange} />
        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="secondary" onClick={onCancel} title="Cancelar edición">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} title="Guardar cambios del producto">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
