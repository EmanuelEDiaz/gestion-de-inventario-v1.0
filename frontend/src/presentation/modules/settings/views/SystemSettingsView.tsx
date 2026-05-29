'use client';

import { useState } from 'react';
import { useSystemSettingsController } from '../hooks/useSystemSettingsController';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import type { SystemSetting } from '@/core/system-settings/entities/system-setting';

function SettingRow({
  setting,
  onSave,
  isUpdating,
}: {
  setting: SystemSetting;
  onSave: (key: string, value: string) => void;
  isUpdating: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(setting.value);

  const handleSave = () => {
    onSave(setting.key, value);
    setEditing(false);
  };

  const inputType = setting.valueType === 'integer' ? 'number' : 'text';
  const typeLabel: Record<string, string> = {
    integer: 'Número entero',
    boolean: 'Sí/No',
    string: 'Texto',
    cron: 'Expresión Cron',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-1.5">
          <code className="text-xs font-mono text-muted-foreground truncate">{setting.key}</code>
          <TooltipHint title={setting.description} variant="info" />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {typeLabel[setting.valueType] ?? setting.valueType}
          {setting.isPublic && ' · Público'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <Input
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32 h-8 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm font-mono">{setting.value}</span>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function SystemSettingsView() {
  const { settings, isLoading, error, update, isUpdating } = useSystemSettingsController();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        {settings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay parámetros de sistema configurados.</p>
        ) : (
          <div>
            {settings.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                onSave={(key, value) => update({ key, input: { value } })}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
