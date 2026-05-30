'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Button } from '@/presentation/shared/components/ui/Button';

interface CatalogAddFormProps {
  description: string;
  unitPrice: string;
  currencyCode: string;
  onDescriptionChange: (v: string) => void;
  onUnitPriceChange: (v: string) => void;
  onCurrencyCodeChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CatalogAddForm({
  description,
  unitPrice,
  currencyCode,
  onDescriptionChange,
  onUnitPriceChange,
  onCurrencyCodeChange,
  onSave,
  onCancel,
  isPending,
}: CatalogAddFormProps) {
  return (
    <div className="rounded-lg border p-3 space-y-3 bg-gray-50">
      <Input
        label="Descripción del producto"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="ej: Tornillos M6 x 20mm"
        title="Nombre o descripción del producto en el catálogo del proveedor"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Precio unitario (opcional)"
          type="number"
          min="0"
          step="0.01"
          value={unitPrice}
          onChange={(e) => onUnitPriceChange(e.target.value)}
          placeholder="0.00"
          title="Precio unitario ofrecido por el proveedor"
        />
        <Input
          label="Moneda (opcional)"
          value={currencyCode}
          onChange={(e) => onCurrencyCodeChange(e.target.value)}
          placeholder="USD"
          maxLength={3}
          title="Código de moneda (ej: USD, PEN, EUR)"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <TooltipWrapper content="Cancelar">
          <Button size="sm" variant="ghost" onClick={onCancel} title="Cancelar">Cancelar</Button>
        </TooltipWrapper>
        <TooltipWrapper content="Guardar producto en catálogo">
          <Button size="sm" onClick={onSave} disabled={!description.trim() || isPending} title="Guardar producto en catálogo">
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </TooltipWrapper>
      </div>
    </div>
  );
}
