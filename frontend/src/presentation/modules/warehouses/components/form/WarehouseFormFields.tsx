/**
 * WarehouseFormFields - Form fields for warehouse create/edit
 */

import { Input } from '@/presentation/shared/components/ui';
import { FormField } from '@/presentation/shared/components/form/FormField';
import { Textarea } from '@/presentation/shared/components/form/Textarea';

export interface WarehouseFormData {
  code: string;
  name: string;
  address: string;
}

interface WarehouseFormFieldsProps {
  data: WarehouseFormData;
  onChange: (field: keyof WarehouseFormData, value: string) => void;
}

export function WarehouseFormFields({ data, onChange }: WarehouseFormFieldsProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Código del Almacén"
        value={data.code}
        onChange={(e) => onChange('code', e.target.value.toUpperCase())}
        required
        placeholder="Ej: ALM-01"
      />
      <Input
        label="Nombre del Almacén"
        value={data.name}
        onChange={(e) => onChange('name', e.target.value)}
        required
        placeholder="Ej: Almacén Principal"
      />
      <FormField label="Dirección (opcional)">
        <Textarea
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          rows={2}
          placeholder="Dirección del almacén..."
        />
      </FormField>
    </div>
  );
}
