'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';

interface EditViewTabsProps {
  activeTab: 'form' | 'images';
  onTabChange: (tab: 'form' | 'images') => void;
}

export function EditViewTabs({ activeTab, onTabChange }: EditViewTabsProps) {
  return (
    <div className="flex gap-0 border-b">
      <TooltipWrapper content="Editar datos del producto" side="top">
        <button
          type="button"
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
      </TooltipWrapper>
      <TooltipWrapper content="Gestionar imágenes del producto" side="top">
        <button
          type="button"
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
      </TooltipWrapper>
    </div>
  );
}
