'use client';

import { useState } from 'react';
import { useSupplierSocialLinks } from '../hooks/useSupplierSocialLinks';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Plus } from '@/presentation/shared/components/ui/icon-mapping';
import { SocialLinkItem } from './SocialLinkItem';
import { SocialLinkForm } from './SocialLinkForm';

interface SupplierSocialLinksProps {
  supplierId: string;
}

export function SupplierSocialLinks({ supplierId }: SupplierSocialLinksProps) {
  const { links, isLoading, add, remove } = useSupplierSocialLinks(supplierId);
  const [showForm, setShowForm] = useState(false);

  const handleRemove = async (linkId: string) => {
    try {
      await remove.mutateAsync(linkId);
      toast.success('Red social eliminada');
    } catch {
      toast.error('Error al eliminar red social');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{links.length} enlace(s)</span>
        <TooltipWrapper content="Agregar red social">
          <Button size="sm" onClick={() => setShowForm(!showForm)} title="Agregar red social">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </TooltipWrapper>
      </div>

      {showForm && (
        <SocialLinkForm
          onSave={async ({ platform, url, label }) => {
            await add.mutateAsync({ platform, url: url.trim(), label: label.trim() || undefined });
            toast.success('Red social agregada');
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {links.length === 0 && !showForm && <EmptyState message="Sin redes sociales registradas" />}

      <ul className="space-y-2">
        {links.map((link) => (
          <SocialLinkItem key={link.id} link={link} onRemove={handleRemove} />
        ))}
      </ul>
    </div>
  );
}
