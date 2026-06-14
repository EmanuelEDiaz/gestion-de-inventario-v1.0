'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { z } from 'zod';
import { cn } from '@/presentation/shared/lib/utils';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { LabelWithHint } from '@/presentation/shared/components/form/LabelWithHint';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { getFieldErrors, getErrorMessage } from '@/infrastructure/api/client';

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
  renderCustomField?: (props: {
    field: EntityFormField;
    value: string;
    fieldError?: string;
    onChange: (name: string, value: string) => void;
    allErrors: Record<string, string>;
  }) => React.ReactNode;
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
  onSubmit?: (e: React.FormEvent) => void;
  onSubmitAction?: (values: Record<string, string>) => Promise<void>;
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
  renderField?: (props: {
    field: EntityFormField;
    value: string;
    fieldError?: string;
    onChange: (name: string, value: string) => void;
    allErrors: Record<string, string>;
    defaultRender: (f: EntityFormField) => React.ReactNode;
  }) => React.ReactNode | null;
  error?: string | null;
  externalFieldErrors?: Record<string, string>;
  onClearExternalFieldError?: (field: string) => void;
  className?: string;
  initialValues?: Record<string, unknown>;
  storageKey: string;
  createSchema?: z.ZodType;
  updateSchema?: z.ZodType;
  persistCreateValues?: boolean;
}

export function EntityForm({
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  onSubmitAction,
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
  renderField,
  error: globalError,
  externalFieldErrors,
  onClearExternalFieldError,
  className,
  initialValues,
  storageKey,
  createSchema,
  updateSchema,
  persistCreateValues = true,
}: EntityFormProps) {
  const autoSelected = useRef(new Set<string>());
  const initialValuesApplied = useRef(false);
  const storageRestored = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [backendFieldErrors, setBackendFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeSchema = useMemo(() => {
    if (!createSchema && !updateSchema) return undefined;
    return isEditing ? (updateSchema ?? createSchema) : createSchema;
  }, [createSchema, updateSchema, isEditing]);

  function buildRawValuesForSchema(
    fields: EntityFormField[], values: Record<string, string>
  ): Record<string, unknown> {
    const raw: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === 'section-header') continue;
      const v = values[field.name] ?? '';
      raw[field.name] = v === '' ? undefined : v;
    }
    return raw;
  }

  const allFieldErrors = { ...fieldErrors, ...backendFieldErrors, ...externalFieldErrors };

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
    if (isEditing || !persistCreateValues || storageRestored.current) return;
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
  }, [storageKey, isEditing, persistCreateValues, values, onChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError(null);
    setBackendFieldErrors({});

    const errors: Record<string, string> = {};
    let hasErrors = false;

    if (activeSchema) {
      const rawValues = buildRawValuesForSchema(fields, values);
      const result = activeSchema.safeParse(rawValues);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const fieldName = issue.path[0] as string;
          if (!errors[fieldName]) errors[fieldName] = issue.message;
        }
        hasErrors = true;
      }
    }

    for (const field of fields) {
      if (field.type === 'section-header') continue;
      if (field.validate) {
        const err = field.validate(values[field.name] ?? '', values);
        if (err && !errors[field.name]) { errors[field.name] = err; hasErrors = true; }
      }
    }

    setFieldErrors(errors);
    if (hasErrors) return;

    if (persistCreateValues && !isEditing) {
      try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch {}
    }

    if (onSubmitAction) {
      try {
        await onSubmitAction(values);
      } catch (err) {
        const fieldResp = getFieldErrors(err);
        if (fieldResp.length > 0) {
          const mapped: Record<string, string> = {};
          for (const fe of fieldResp) mapped[fe.field] = fe.message;
          setBackendFieldErrors(mapped);
        } else {
          setSubmitError(getErrorMessage(err));
        }
      }
      return;
    }

    if (onSubmit) {
      onSubmit(e);
    }
  }, [fields, values, activeSchema, onSubmitAction, onSubmit, storageKey, persistCreateValues, isEditing]);

  const handleContinue = useCallback((e: React.MouseEvent) => {
    if (persistCreateValues && !isEditing) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {}
    }
    onContinue?.(e);
  }, [onContinue, storageKey, persistCreateValues, isEditing, values]);

  const defaultRender = useCallback(
    (field: EntityFormField) => {
      const filteredOptions = getFilteredOptions(field);
      const value = values[field.name] ?? '';
      const fieldError = allFieldErrors[field.name];
      const handleChange = (v: string) => {
        if (fieldErrors[field.name]) {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field.name];
            return next;
          });
        }
        if (backendFieldErrors[field.name]) {
          setBackendFieldErrors((prev) => {
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

      if (field.renderCustomField) {
        return (
          <div key={field.name} className={cn('space-y-1', field.className ? field.className : 'col-span-full sm:col-span-1')}>
            {field.renderCustomField({
              field,
              value,
              fieldError,
              onChange: handleChange,
              allErrors: allFieldErrors,
            })}
            {fieldError && (
              <p className="text-xs text-red-500">{fieldError}</p>
            )}
          </div>
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
    [getFilteredOptions, values, onChange, fieldErrors, backendFieldErrors, externalFieldErrors, onClearExternalFieldError, allFieldErrors],
  );

  const displayError = submitError ?? globalError;

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
                const custom = renderField({
                  field,
                  value: values[field.name] ?? '',
                  fieldError: allFieldErrors[field.name],
                  onChange: (name, v) => {
                    if (allFieldErrors[name]) {
                      if (fieldErrors[name]) {
                        setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
                      }
                      if (backendFieldErrors[name]) {
                        setBackendFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
                      }
                      if (externalFieldErrors?.[name]) {
                        onClearExternalFieldError?.(name);
                      }
                    }
                    onChange(name, v);
                  },
                  allErrors: allFieldErrors,
                  defaultRender,
                });
                if (custom === null) return null;
                return custom;
              }
              return defaultRender(field);
            })}
          </div>

          {afterFields}

          {displayError && (
            <p className="text-sm text-red-500" role="alert">{displayError}</p>
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
