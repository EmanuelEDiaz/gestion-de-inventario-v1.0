'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/presentation/shared/lib/utils';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { LabelWithHint } from '@/presentation/shared/components/form/LabelWithHint';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { TooltipWrapper } from '@/presentation/shared/components/ui';

export interface EntityFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'radio-group' | 'textarea' | 'section-header';
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  step?: string;
  min?: number;
  max?: number;
  rows?: number;
  autoSelect?: boolean;
  disabled?: boolean;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  radioOptions?: Array<{ value: string; label: string }>;
  autoSelectFirst?: boolean;
  excludeByField?: string;
  autoFillSource?: string;
  emptyMessage?: string;
  hint?: string;
  hintDescription?: string;
  labelSuffix?: React.ReactNode;
  validate?: (value: string, allValues: Record<string, string>) => string | undefined;
}

export interface AutoFillSource {
  data: unknown[];
  matchFields: string[];
  valueField: string;
}

interface EntityFormProps {
  title: string;
  description?: string;
  fields: EntityFormField[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onContinue?: (e: React.MouseEvent) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  submitLoadingLabel?: string;
  continueLabel?: string;
  autoFillSources?: Record<string, AutoFillSource>;
  afterFields?: React.ReactNode;
  continueAfterFields?: React.ReactNode;
  renderField?: (
    field: EntityFormField,
    defaultRender: (f: EntityFormField) => React.ReactNode,
  ) => React.ReactNode | null;
  error?: string | null;
  externalFieldErrors?: Record<string, string>;
  onClearExternalFieldError?: (field: string) => void;
  className?: string;
  initialValues?: Record<string, unknown>;
  storageKey?: string;
}

export function EntityForm({
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  onCancel,
  onContinue,
  isSubmitting = false,
  isEditing = false,
  submitDisabled = false,
  submitLabel,
  submitLoadingLabel,
  continueLabel,
  autoFillSources,
  afterFields,
  continueAfterFields,
  renderField,
  error,
  externalFieldErrors,
  onClearExternalFieldError,
  className,
  initialValues,
  storageKey,
}: EntityFormProps) {
  const autoSelected = useRef(new Set<string>());
  const initialValuesApplied = useRef(false);
  const storageRestored = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const getFilteredOptions = useCallback(
    (field: EntityFormField) => {
      if (!field.excludeByField || !field.options) return field.options;
      const excludeValue = values[field.excludeByField];
      if (!excludeValue) return field.options;
      return field.options.filter((o) => o.value !== excludeValue);
    },
    [values],
  );

  useEffect(() => {
    if (isEditing) return;
    for (const field of fields) {
      if (!field.autoSelectFirst) continue;
      if (autoSelected.current.has(field.name)) continue;
      const opts = getFilteredOptions(field);
      if (opts && opts.length > 0 && !values[field.name]) {
        autoSelected.current.add(field.name);
        onChange(field.name, opts[0].value);
      }
    }
  }, [fields, values, isEditing, getFilteredOptions, onChange]);

  useEffect(() => {
    if (isEditing || !autoFillSources) return;
    for (const field of fields) {
      if (!field.autoFillSource) continue;
      const source = autoFillSources[field.autoFillSource];
      if (!source) continue;
      const depsValues = source.matchFields.map((d) => values[d]);
      if (depsValues.some((v) => !v)) continue;
      const match = source.data.find((item: unknown) =>
        source.matchFields.every(
          (dep, i) => (item as Record<string, unknown>)[dep] === depsValues[i],
        ),
      );
      if (!match) continue;
      const newVal = String((match as Record<string, unknown>)[source.valueField] ?? '');
      if (newVal !== values[field.name]) {
        onChange(field.name, newVal);
      }
    }
  }, [fields, values, autoFillSources, isEditing, onChange]);

  useEffect(() => {
    if (isEditing || !initialValues || initialValuesApplied.current) return;
    initialValuesApplied.current = true;
    for (const [key, value] of Object.entries(initialValues)) {
      if (value != null && !values[key]) {
        onChange(key, String(value));
      }
    }
  }, [initialValues, isEditing, values, onChange]);

  useEffect(() => {
    if (isEditing || !storageKey || storageRestored.current) return;
    storageRestored.current = true;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      for (const [key, value] of Object.entries(parsed)) {
        if (value != null) {
          onChange(key, String(value));
        }
      }
    } catch {}
  }, [storageKey, isEditing, values, onChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === 'section-header') continue;
      const value = values[field.name] ?? '';
      if (field.validate) {
        const validationError = field.validate(value, values);
        if (validationError) {
          errors[field.name] = validationError;
        }
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit(e);
    if (storageKey && !isEditing) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {}
    }
  }, [fields, values, onSubmit, storageKey, isEditing]);

  const handleContinue = useCallback((e: React.MouseEvent) => {
    if (storageKey && !isEditing) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {}
    }
    onContinue?.(e);
  }, [onContinue, storageKey, isEditing, values]);

  const defaultRender = useCallback(
    (field: EntityFormField) => {
      const filteredOptions = getFilteredOptions(field);
      const value = values[field.name] ?? '';
      const fieldError = fieldErrors[field.name] ?? externalFieldErrors?.[field.name];
      const handleChange = (v: string) => {
        if (fieldErrors[field.name]) {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field.name];
            return next;
          });
        }
        if (externalFieldErrors?.[field.name]) {
          onClearExternalFieldError?.(field.name);
        }
        onChange(field.name, v);
      };

      if (field.type === 'section-header') {
        return (
          <section key={field.name} className="col-span-full space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
            <h2 className="font-semibold text-gray-900">{field.label}</h2>
          </section>
        );
      }

      return (
        <div key={field.name} className={cn(field.type === 'radio-group' ? 'space-y-2' : 'space-y-1', field.className ? field.className : 'col-span-full sm:col-span-1')}>
            <LabelWithHint
              htmlFor={field.type !== 'radio-group' ? field.name : undefined}
              label={field.label}
              required={field.required}
              hint={field.hint}
              hintDescription={field.hintDescription}
            />
            {field.labelSuffix}
          
          {field.type === 'select' && (
            <ComboboxSelect
              options={filteredOptions ?? []}
              value={value}
              onChange={handleChange}
              placeholder={field.placeholder ?? 'Seleccionar...'}
              disabled={field.disabled ?? false}
              emptyMessage={field.emptyMessage}
            />
          )}
          {field.type === 'radio-group' && field.radioOptions && (
            <div className="flex gap-4">
              {field.radioOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio" name={field.name} value={opt.value}
                    checked={value === opt.value}
                    onChange={() => handleChange(opt.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
          {field.type === 'textarea' && (
            <Textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              rows={field.rows ?? 3}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
            />
          )}
          {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
            <Input
              id={field.name}
              type={field.type === 'number' ? 'text' : field.type}
              inputMode={field.type === 'number' ? 'decimal' : undefined}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              step={field.step}
              min={field.min}
              max={field.max}
              autoSelect={field.autoSelect}
            />
          )}

          {fieldError && (
            <p className="text-xs text-red-500">{fieldError}</p>
          )}
        </div>
      );
    },
    [getFilteredOptions, values, onChange, fieldErrors, externalFieldErrors, onClearExternalFieldError],
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {fields.map((field) => {
              if (renderField) {
                const custom = renderField(field, defaultRender);
                if (custom === null) return null;
                return custom;
              }
              return defaultRender(field);
            })}
          </div>

          {afterFields}

          {error && (
            <p className="text-sm text-red-500" role="alert">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            {onContinue && !isEditing && (
              <TooltipWrapper content="Guardar y continuar agregando más">
                <Button type="button" variant="outline" disabled={isSubmitting || submitDisabled} onClick={handleContinue}>
                  {continueLabel ?? 'Crear y Continuar'}
                </Button>
              </TooltipWrapper>
            )}
            <TooltipWrapper content={isEditing ? 'Guardar cambios' : 'Crear nuevo registro'}>
              <Button type="submit" disabled={isSubmitting || submitDisabled}>
                {isSubmitting ? (submitLoadingLabel ?? (isEditing ? 'Actualizando...' : 'Guardando...')) : (submitLabel ?? (isEditing ? 'Actualizar' : 'Crear'))}
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Descartar cambios y volver">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </TooltipWrapper>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
