'use client';

import { cn } from '@/presentation/shared/lib/utils';

interface EditViewTabsProps {
  activeTab: 'form' | 'images';
  onTabChange: (tab: 'form' | 'images') => void;
}

export function EditViewTabs({ activeTab, onTabChange }: EditViewTabsProps) {
  return (
    <div className="flex gap-0 border-b">
      <button
        type="button"
        title="Editar datos del producto"
        onClick={() => onTabChange('form')}
        className={cn(
          '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'form'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        Datos
      </button>
      <button
        type="button"
        title="Gestionar imágenes del producto"
        onClick={() => onTabChange('images')}
        className={cn(
          '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'images'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        Imágenes
      </button>
    </div>
  );
}
