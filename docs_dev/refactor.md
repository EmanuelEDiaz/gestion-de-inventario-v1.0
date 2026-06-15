# Plan: Validación por Campo + Errores Estructurados

> Created: 2026-06-14 | v2 — refactorizado tras auditoría del codebase real. EntityForm es el centro: schema Zod + fieldErrors del backend + reparación de outbox fallido.
>
> ⚠️ **Extiende `task_plan.md`**: no lo reemplaza. Reglas, principios y convenciones de `task_plan.md` se aplican aquí. Fase J.

---

## Problema

El flujo actual es:
```
Form → EntityForm.handleSubmit() → onSubmit(values) → repository.create()
  → apiClient.post() → error 400 (validación backend)
  → catch {} vacío en repo → outbox (producto "pending sync")
  → SyncService.processOutbox() → POST → error 400 otra vez
  → retry → error → retry → ... → dead letter (sin fieldErrors guardados)
```

3 problemas concretos:

1. **Backend**: `GlobalExceptionHandler.handleValidation()` concatena errores en un string (`"name: El nombre es obligatorio; salePrice: ..."`). No envía `fieldErrors` estructurados.
2. **Frontend repos**: 11 repos tienen `catch {}` vacío que traga errores 4xx y cae al outbox. El error nunca llega al form. Si hay red, el producto se guarda localmente como si OK pero nunca se sincroniza.
3. **Frontend EntityForm**: No tiene conexión con Zod ni con `fieldErrors` del backend. Los forms duplican validación manual (`FIELD_VALIDATORS`) que no escala a 6+ entidades.

### Principios violados

| Principio | Impacto |
|-----------|---------|
| **P3. Trabajo offline indefinido** | Outbox acumula entidades que jamás se sincronizarán (error de validación). El usuario no sabe que falló. |
| **Escritura Tipo A (task_plan)** | "Guardado local inmediato" sin validación previa puede cachear datos corruptos en IDB. |
| **P5. Sync no destructivo** | Dead letter no guarda `fieldErrors`, no se puede reparar. La entidad se pierde. |

---

## Objetivos

| Meta | Indicador |
|------|-----------|
| Backend devuelve `fieldErrors` por campo en toda respuesta 4xx | `handleValidation()` produce `fieldErrors: [{ field, message }]` |
| `ConflictException` incluye `field` para mostrar error bajo el campo exacto | SKU duplicado → error bajo el campo SKU |
| EntityForm acepta `createSchema`/`updateSchema` y valida client-side antes de submit | `createSchema={createProductSchema}` bloquea submit si hay error Zod |
| EntityForm captura errores del submit y muestra `fieldErrors` del backend bajo cada campo | Sin try/catch en forms hijos |
| EntityForm usa schema explícito según `isEditing` (sin auto-partial) | `isEditing=true` usa `updateSchema`, si no usa `createSchema` |
| Repositorios propagan errores 4xx en vez de tragarlos | `create()`/`update()` re-lanzan validation/conflict |
| Outbox/DeadLetter guarda `fieldErrors` estructurados | `OutboxEntry.fieldErrors: Array<{field, message}>` |
| UI muestra badge de entradas fallidas + RepairDialog con EntityForm para reparar | `SyncFailedBadge` + `RepairDialog` reusa EntityForm |
| Zod schemas sincronizados con validación backend | Cada `@NotBlank`/`@Size`/`@PositiveOrZero` del backend tiene su equivalente Zod en `core/validators/` |
| `storageKey` obligatorio con persistencia automática default | Todos los forms en create mode cachean en localStorage; `persistCreateValues={false}` para opt-out |

---

## Arquitectura de la Solución

```
EntityForm.handleSubmit()
  │
  ├─ 1. Zod schema.safeParse(rawValues)
  │     └─ errores Zod → fieldErrors internos → render bajo cada campo
  │
  ├─ 2. onSubmitAction(values) → repository.create(data)
  │     └─ try/catch en EntityForm:
  │           ├─ 4xx con fieldErrors → externalFieldErrors → render bajo cada campo
  │           └─ otro error → setError() global
  │
  └─ 3. [Post-sync] SyncService recibe fieldErrors del backend
        └─ los guarda en OutboxEntry / DeadLetterEntry
        └─ SyncFailedBadge → RepairDialog reusa EntityForm con el schema de la entidad
```

### Formato de error backend (nuevo)

```
400 Validation Error:
{ fieldErrors: [{ field: "name", message: "El nombre es obligatorio" }] }

409 Conflict (SKU duplicado):
{ fieldErrors: [{ field: "sku", message: "SKU ya existe: ACE-5W30" }] }
```

---

## Reglas de Ejecución (adicionales a task_plan.md)

- **EntityForm es el responsable de mostrar errores**: los forms hijos (ProductFormFields, etc.) NO manejan try/catch propio — EntityForm lo hace internamente.
- **Validación cliente obligatoria antes de escribir en IDB**: si Zod falla, no hay submit. Si el repositorio está offline, igual se validó antes de encolar.
- **Repos propaga 4xx**: `isClientError()` → re-lanzar. Solo network/5xx → outbox.
- **Zod vive en `core/validators/`**: `core/` no depende de React/HTTP. Los schemas se importan desde `presentation/`.
- **Sin `any`**: tipar Zod schema como `z.ZodType<unknown, z.ZodTypeDef, unknown>`.
- **Errores del backend ganan sobre errores Zod** si hay ambos para el mismo campo.
- **`storageKey` es obligatorio en EntityForm**: identifica la clave de `localStorage` para persistir datos del form en create mode. Se ignora en edit mode.
- **`persistCreateValues` default `true`**: desactivar explícitamente (`{false}`) cuando se usa prefill/duplicación para no pisar los valores iniciales.

---

## Diagnóstico: Estado Actual

### OutboxEntry existente (db.ts:19-36)
```typescript
{
  id?, operationId, entityType, entityId, action, payload,
  status: 'pending' | 'syncing' | 'accepted' | 'rejected',
  priority, retryCount, maxRetries, nextRetryAt, expiresAt,
  lastError?: string,
  createdAt, skip?, isTempId?
}
```
Ya tiene `status: 'rejected'` y `lastError`. **Solo falta `fieldErrors`**.

### DeadLetterEntry existente (db.ts:38-48)
Ya tiene `error: string` y `payload`. Solo falta `fieldErrors`.

### SyncService existente (SyncService.ts:419-510)
`processOutbox()` ya maneja:
- `navigator.locks` cross-tab
- Retry con backoff (3 intentos, luego `rejected`)
- `lastError` en cada intento fallido
- Incidents para conflictos OPTIMISTIC_LOCK

**Lo que falta**: extraer `fieldErrors` del backend y guardarlos en la entry.

### EntityForm actual (EntityForm.tsx:75-356)
- `onSubmit: (e: React.FormEvent) => void` — síncrono, no captura errores
- `externalFieldErrors?: Record<string, string>` — existe pero debe poblarlo el padre
- `fields[].validate?: (value, allValues) => string | undefined` — validación inline manual

### Repos que tragan errores (11)

| Patrón A (inline catch {}) | Patrón B (tryOrOutbox helper) |
|---|---|
| ProductRepository, CategoryRepository, WarehouseRepository, CurrencyRepository, ExchangeRateRepository, CustomerDebtRepository | CustomerRepository, SupplierRepository, SaleRepository, PurchaseRepository, TransferRepository, AdjustmentRepository, ReturnRepository |

---

## Fases de Implementación

### Fase J.1 — Backend: `fieldErrors` en ProblemDetail

**Skills**: `clean-code`, `layered-architecture`

#### J.1.1 — FieldErrorDetail.java (nuevo)
`backend/.../adapters/web/dto/FieldErrorDetail.java`
```java
public record FieldErrorDetail(String field, String message) {}
```

#### J.1.2 — ProblemDetail.java: + fieldErrors
Agregar `List<FieldErrorDetail> fieldErrors` como campo nullable. Nuevo factory method.

#### J.1.3 — GlobalExceptionHandler.handleValidation()
Reemplazar concatenación por `fieldErrors` con cada `FieldError` de Spring.

#### J.1.4 — ConflictException.java: + getField()
```java
public class ConflictException extends DomainException {
    private final String field;
    public ConflictException(String field, String value) { ... this.field = field; }
    public String getField() { return field; }
}
```

En `handleDomainException()`, si `ex instanceof ConflictException ce && ce.getField() != null`, incluir `fieldErrors`.

#### Archivos: 1 nuevo + 3 modificados
| Archivo | Cambio |
|---------|--------|
| `dto/FieldErrorDetail.java` | Nuevo |
| `dto/ProblemDetail.java` | + fieldErrors |
| `controller/GlobalExceptionHandler.java` | handleValidation + handleDomainException |
| `errors/ConflictException.java` | + getField |

> ✅ **J.1 completado** — `db18ae5` — Backend devuelve `fieldErrors` estructurados en toda respuesta 4xx. ConflictException incluye `getField()`.

---

### Fase J.2 — Frontend: API helpers

**Skills**: `clean-code`, `hexagonal-architecture`

#### J.2.1 — client.ts: + getFieldErrors + isClientError

```typescript
export function getFieldErrors(error: unknown): Array<{ field: string; message: string }> {
  return isApiError(error) ? error.response?.data.fieldErrors ?? [] : [];
}

export function isClientError(error: unknown): boolean {
  if (isApiError(error)) {
    const status = error.response?.status ?? 0;
    return status >= 400 && status < 500 && status !== 401 && status !== 403;
  }
  return false;
}
```

#### Archivos: 1 modificado
| Archivo | Cambio |
|---------|--------|
| `infrastructure/api/client.ts` | + getFieldErrors, + isClientError |

> ✅ **J.2 completado** — `5c9e9b9` — `getFieldErrors()` extrae fieldErrors estructurados del backend. `isClientError()` detecta 4xx (excluyendo 401/403).

---

### Fase J.3 — Frontend: repositorios propagan 4xx

**Skills**: `senior-frontend`, `clean-code`

#### J.3.1 — Helper compartido `tryApiOrOutbox()`

`frontend/src/infrastructure/repositories/shared/api-or-outbox.ts`

```typescript
export async function tryApiOrOutbox<T>(
  operation: () => Promise<{ data: T }>,
  outboxConfig: { entityType: string; entityId: string; action: string; payload: unknown },
): Promise<T> {
  const mode = getNetworkMode();
  if (mode === 'online-direct' || mode === 'online-degraded') {
    try {
      const response = await operation();
      return response.data;
    } catch (err) {
      if (isClientError(err)) throw err;
      // network error / 5xx → outbox
    }
  }
  // En CREATE, generar entityId local + marcarlo como temp
  const isCreate = outboxConfig.action === 'CREATE';
  const entityId = outboxConfig.entityId || (isCreate ? crypto.randomUUID() : outboxConfig.entityId);
  await addToOutbox({
    operationId: crypto.randomUUID(),
    ...outboxConfig,
    entityId,
    isTempId: isCreate ? true : outboxConfig.isTempId,
  });
  return { ...outboxConfig.payload, id: entityId, isTempId: isCreate } as T;
```

> ⚠️ **Nota**: Cuando está offline y es CREATE, se genera un `entityId` UUID local y se pasa `isTempId: true` para que `SyncService.updateTempIdMappings()` pueda reemplazarlo con el ID real post-sync. Para UPDATE, se usa el `entityId` existente. El caller recibe un objeto con `id` temporal — consistente con el patrón `tempId` que el código ya maneja.
>
> ⚠️ **Guard para payload no objeto**: Si `payload` no es un objeto (ej: string, null), el spread `{ ...payload }` rompe. Añadir chequeo:
> ```typescript
> const resultPayload = typeof payload === 'object' && payload !== null
>   ? { ...payload, id: entityId, isTempId: isCreate }
>   : payload;
> ```

#### J.3.2 — Refactorizar 11 repos

**Pattern A** (inline catch): Reemplazar try/catch por `tryApiOrOutbox()`.
- ProductRepository, CategoryRepository, WarehouseRepository, CurrencyRepository, ExchangeRateRepository, CustomerDebtRepository

**Pattern B** (tryOrOutbox helper interno): Agregar `isClientError()` check.
- CustomerRepository, SupplierRepository, SaleRepository, PurchaseRepository, TransferRepository, AdjustmentRepository, ReturnRepository

#### Archivos: 1 nuevo + hasta 13 modificados
| Archivo | Cambio |
|---------|--------|
| `repositories/shared/api-or-outbox.ts` | Nuevo |
| 6 repos Pattern A | Usar tryApiOrOutbox |
| 7 repos Pattern B | + isClientError check en tryOrOutbox |

> ✅ **J.3 completado** — `17d2a0b` — Nuevo helper `tryApiOrOutbox()` en `api-or-outbox.ts`. 6 repos Pattern A refactorizados. 7 repos Pattern B con `isClientError()`. 4xx se propagan a EntityForm; network/5xx caen al outbox.

---

### Fase J.4 — Frontend: EntityForm con Zod + fieldErrors interno

**Skills**: `senior-frontend`, `clean-code`
**Objetivo**: EntityForm es el centro de validación y error display. Los forms hijos no manejan errores.

#### J.4.1 — EntityFormProps: `onSubmitAction` + `createSchema`/`updateSchema` + `storageKey` requerido

**Estrategia de migración gradual**: `onSubmitAction` se añade como prop opcional NUEVO. El `onSubmit` existente se mantiene como deprecated. `EntityForm` detecta cuál usar.

**Rollback**: Cada form migrado mantiene `onSubmit` legacy funcional. Si un form migrado falla en producción, se restaura su versión anterior individualmente (git revert del form + su validador) sin afectar al resto. No hay dependencias cruzadas entre forms.

`storageKey` pasa de opcional a **obligatorio**: cada EntityForm debe definir una key única para persistir datos del formulario en `localStorage`. Se usa solo en create mode (ignorado si `isEditing=true`). Para desactivar la persistencia (ej: duplicación de producto), se usa `persistCreateValues={false}`.

```typescript
export interface EntityFormProps {
  // REQUERIDO: key única para cachear datos del form en localStorage
  storageKey: string;
  // Opt-out: false desactiva la persistencia (duplicación, prefill)
  persistCreateValues?: boolean;       // default: true

  // onSubmit actual (síncrono, legacy) — se mantiene durante migración
  onSubmit?: (e: React.FormEvent) => void;
  // NUEVO: onSubmitAction reemplaza a onSubmit progresivamente
  onSubmitAction?: (values: Record<string, string>) => Promise<void>;
  // Schemas explícitos: create (obligatorio si hay schema) y update (opcional)
  createSchema?: z.ZodType<unknown, z.ZodTypeDef, unknown>;
  updateSchema?: z.ZodType<unknown, z.ZodTypeDef, unknown>;
  // isEditing indica cuál schema usar
  isEditing?: boolean;
}
```

Comportamiento de `storageKey` + `persistCreateValues`:

| Modo | storageKey | persistCreateValues | Qué pasa |
|------|-----------|-------------------|----------|
| **Create** | `"product-create"` | `true` (default) | En mount: restaura valores previos desde localStorage. En submit: guarda valores actuales. |
| **Create con prefill** | `"product-create"` | `false` | Cache desactivado. Los valores iniciales vienen de `initialValues` (duplicación), no se pisotean. |
| **Edit** | `"product-create"` | cualquier valor | Ignorado completamente (`!isEditing` lo blinda). Los datos vienen de la entidad vía `initialData`. |

`onSubmitAction` recibe los valores (strings) y retorna Promise. EntityForm:
1. Valida con Zod (si `createSchema` o `updateSchema` existe)
2. Si pasa y hay `onSubmitAction`, llama `onSubmitAction(values)`
3. Si `persistCreateValues && !isEditing`, guarda en `localStorage.setItem(storageKey, JSON.stringify(values))`
4. Captura errores → extrae `fieldErrors` → display inline
5. Si no hay fieldErrors → `setError()` global

Los forms se migran uno por uno en J.6. Hasta entonces, `onSubmit` legacy sigue funcionando.

#### J.4.2.a — Restore desde localStorage en mount

```typescript
// Se ejecuta UNA vez al montar el form en create mode
const storageRestored = useRef(false);

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
```

- **Solo create mode**: `isEditing` lo blinda.
- **Solo si persistCreateValues es true**: si es false (duplicación), no restaura.
- **Una sola vez**: `storageRestored.current` evita re-ejecuciones.

#### J.4.2.b — handleSubmit interno (dual path)

```typescript
const activeSchema = useMemo(() => {
  if (!createSchema && !updateSchema) return undefined;
  return isEditing ? (updateSchema ?? createSchema) : createSchema;
}, [createSchema, updateSchema, isEditing]);

const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  const errors: Record<string, string> = {};
  let hasErrors = false;

  // 1. Validación Zod (si hay schema activo)
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

  // 2. Validación inline legacy (fields[].validate) — soporte durante migración
  for (const field of fields) {
    if (field.type === 'section-header') continue;
    if (field.validate) {
      const err = field.validate(values[field.name] ?? '', values);
      if (err && !errors[field.name]) { errors[field.name] = err; hasErrors = true; }
    }
  }

  setFieldErrors(errors);
  if (hasErrors) return;

  // 3. Persistir en localStorage (solo create + persistCreateValues activo)
  if (persistCreateValues && !isEditing) {
    try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch {}
  }

  // 4. onSubmitAction (nuevo) → async con try/catch
  if (onSubmitAction) {
    try {
      await onSubmitAction(values);
    } catch (err) {
      const fieldResp = getFieldErrors(err);
      if (fieldResp.length > 0) {
        const mapped: Record<string, string> = {};
        for (const fe of fieldResp) mapped[fe.field] = fe.message;
        setExternalFieldErrors(mapped);
      } else {
        setError(getErrorMessage(err));
      }
    }
    return;
  }

  // 5. onSubmit legacy (síncrono, deprecated)
  if (onSubmit) {
    onSubmit(e);
  }
}, [fields, values, activeSchema, onSubmitAction, onSubmit, storageKey, persistCreateValues, isEditing]);
```

Lo mismo aplica a `handleContinue` (misma guarda `persistCreateValues && !isEditing`).

#### J.4.3 — Create vs Update schema (explícito, sin auto-partial)

**NO usar `schema.partial()` automático**. Razones:
- Schemas con `.refine()` o `.transform()` no son `z.ZodObject` puros → `instanceof` falla.
- Los schemas de update pueden tener reglas distintas (campos read-only, requeridos diferentes).
- El codebase ya exporta `updateProductSchema = createProductSchema.partial().extend({...})`.

**Regla**: Cada validador exporta DOS schemas (`create{Entity}Schema` + `update{Entity}Schema`).
`EntityForm` recibe ambos como props separadas:

```typescript
createSchema?: z.ZodType<unknown, z.ZodTypeDef, unknown>;
updateSchema?: z.ZodType<unknown, z.ZodTypeDef, unknown>;
```

El schema activo se elige por `isEditing`:

```typescript
const activeSchema = useMemo(() => {
  if (!createSchema && !updateSchema) return undefined;
  return isEditing ? (updateSchema ?? createSchema) : createSchema;
}, [createSchema, updateSchema, isEditing]);
```

Si una entidad no necesita distinción create/update, el caller pasa el mismo schema en ambos props.

#### J.4.4 — actualizar `buildRawValuesForSchema`

```typescript
function buildRawValuesForSchema(
  fields: EntityFormField[], values: Record<string, string>
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'section-header') continue;
    const v = values[field.name] ?? '';
    // Consistencia: todo campo vacío → undefined (Zod lo trata como ausente)
    // El schema con z.coerce.number() convierte el string al tipo correcto
    raw[field.name] = v === '' ? undefined : v;
  }
  return raw;
}
```

Simplificado respecto a v1: ahora TODOS los campos vacíos pasan como `undefined` (no solo number). Esto es consistente con Zod: `undefined` significa "no enviado", mientras que `""` significa "string vacío".

> **Nota sobre tipos futuros**: Si se agregan más tipos, extender aquí.

Los schemas Zod deben usar `z.coerce.number()` (no `z.number()`) para parcear el string que llega del input. Ver J.6.6 para la sincronización.

#### J.4.5 — Error display en defaultRender para todos los tipos de campo

EntityForm.defaultRender debe pasar `fieldError` a todos los tipos de campo que renderiza:

```typescript
// defaultRender — cada tipo recibe error automáticamente
switch (field.type) {
  case 'select':
    return <ComboboxSelect error={fieldError} ... />;  // J.5
  case 'date':
    return <input type="date" ... />;                    // error via wrapper div
  case 'text':
  case 'number':
  case 'email':
  default:
    return <input ... />;                                // error via wrapper div
}
```

Campos custom (arrays dinámicos, geo-selects, etc.) se renderizan vía `renderField` y reciben `fieldError` — ver J.4.6.

#### J.4.6 — `renderField` recibe `fieldError`

Para campos que necesitan renderizado custom (MapPickerModal, GeoFields, DynamicArrayLines), EntityForm debe pasar `fieldError` al callback:

```typescript
export interface EntityFormProps {
  // ...
  renderField?: (props: {
    field: EntityFormField;
    value: string;
    fieldError?: string;
    onChange: (name: string, value: string) => void;
    allErrors: Record<string, string>;
  }) => ReactNode;
}
```

Así, cualquier custom render puede mostrar el error del campo:
```typescript
renderField={({ field, fieldError, onChange, value }) => (
  <div>
    <CustomComponent onChange={v => onChange(field.name, v)} value={value} />
    {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
  </div>
)}
```

#### Archivos: 1 modificado
| Archivo | Cambio |
|---------|--------|
| `shared/components/form/EntityForm.tsx` | onSubmitAction, schema, handleSubmit async, buildRawValuesForSchema, create/update switch, error en todos los tipos, renderField con fieldError |

> ✅ **J.4 completado** — `7e54e00` — EntityForm refactorizado con `onSubmitAction`, `createSchema`/`updateSchema`, `storageKey` obligatorio, `persistCreateValues`, `backendFieldErrors` local, `renderField` con nueva firma. Fix a CategoryForm, ExchangeRateFormFields, ProductFormFields, ProductCreateView, ProductEditView.

---

### Fase J.5 — Frontend: error prop en ComboboxSelect

**Skills**: `ui-design-system`, `tailwind-patterns`

EntityForm renderiza solo estos tipos nativamente: `text`, `number`, `date`, `select` (ComboboxSelect), `radio-group`, `textarea`, `section-header`. El único componente compartido que necesita error prop es `ComboboxSelect`, ya que los inputs HTML nativos se envuelven en un div con error.

```typescript
export interface ComboboxSelectProps {
  error?: string;
}

// + red border + mensaje inline
<div className={cn('relative', error && 'border-red-500 rounded-lg')}>
  <ComboboxButton ... />
  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
</div>
```

Para tipos que EntityForm no soporta nativamente (checkbox, file) o tipos complejos (arrays dinámicos, geo), el error se maneja vía `renderCustomField` que recibe `fieldError` — ver J.4.6. Cada form custom es responsable de mostrar su propio error.

Si el patrón `{error && <p className="text-xs text-red-500">` se repite en +5 lugares del proyecto, extraer a un componente `<FieldError>` compartido.

#### Archivos: 1 modificado (+ opcional)
| Archivo | Cambio |
|---------|--------|
| `shared/components/form/ComboboxSelect.tsx` | + error prop + styling |
| `shared/components/form/FieldError.tsx` | **Nuevo** (opcional, si hay repetición) |

> ✅ **J.5 completado** — `f30b4cb` — ComboboxSelect y ComboboxButton soportan `error` prop con borde rojo, ring rojo al focus, y mensaje inline. EntityForm pasa `fieldError` a ComboboxSelect.

---

### Fase J.6 — Frontend: Zod schemas por entidad + migrar forms + storageKey obligatorio

**Skills**: `senior-frontend`, `clean-code`

#### J.6.0 — Diagnóstico: inventario completo de forms y validators

**12 entidades con formularios de creación** en total. Se clasifican en 3 grupos según la migración requerida:

##### Fase A — Ya usan EntityForm (migrar onSubmit + Zod + storageKey)
| Entidad | Form | createSchema | updateSchema | storageKey | Prioridad |
|---------|------|:------------:|:------------:|:-----------|:---------:|
| **Product** | `ProductFormFields.tsx` | ✅ existe | ✅ existe | `"product-create"` | 🔴 Alta |
| **Category** | `CategoryForm.tsx` | ❌ falta | ❌ falta | ❌ falta | 🔴 Alta |
| **Currency** | `CurrencyFormFields.tsx` | ❌ falta | ❌ falta | `"currency-create"` | 🔴 Alta |
| **ExchangeRate** | `ExchangeRateFormFields.tsx` | ❌ falta | ❌ falta | `"exchange-rate-create"` | 🔴 Alta |
| **Role** | `RoleFormFields.tsx` | ❌ falta | ❌ falta | `"role-create"` | 🔴 Alta |

##### Fase B — Raw forms simples (migrar a EntityForm + Zod + storageKey)
| Entidad | Form | createSchema | updateSchema | storageKey | Prioridad |
|---------|------|:------------:|:------------:|:-----------|:---------:|
| **Warehouse** | `WarehouseFormFields.tsx` | ✅ | ✅ | ✅ `"warehouse-create"` | 🟡 Media — completado J.6.3-B.2 |
| **User** | `UserFormFields.tsx` | ✅ | ✅ | ✅ `"user-create"` | 🟡 Media — completado J.6.3-B.3 |

##### Fase C — Raw forms con geo o arrays dinámicos (migrar a EntityForm + Zod + storageKey)
| Entidad | Form | createSchema | updateSchema | storageKey | Prioridad |
|---------|------|:------------:|:------------:|:-----------|:---------:|
| **Customer** | `CustomerFormFields.tsx` | ✅ existe | ✅ existe | ❌ falta | 🟢 Baja |
| **Supplier** | `SupplierFormFields.tsx` | ✅ existe | ✅ existe | ❌ falta | 🟢 Baja |
| **Sale** | `SaleFormFields.tsx` | ✅ existe | ❌ falta | ❌ falta | 🟢 Baja |
| **Purchase** | `PurchaseFormFields.tsx` | ❌ falta | ❌ falta | ❌ falta | 🟢 Baja |
| **Transfer** | `TransferFormFields.tsx` | ❌ falta | ❌ falta | ❌ falta | 🟢 Baja |
| **Adjustment** | `AdjustmentFormFields.tsx` | ❌ falta | ❌ falta | ❌ falta | 🟢 Baja |
| **Return** | `ReturnFormFields.tsx` | ❌ falta | ❌ falta | ❌ falta | 🟢 Baja |

> **Scope del plan**: Las 5 entidades **Fase A** se migran completamente. **Fase B** (Warehouse, User) se migran a EntityForm — son forms simples sin sub-componentes complejos. **Fase C** (Customer, Supplier, y las 5 con arrays dinámicos) se migran también, pero requieren extender EntityForm para soportar geo-cascade selects (provincia/municipio) y/o arrays dinámicos de líneas. Ver plan detallado por fase más abajo.

#### J.6.1 — Schemas en `core/validators/` (12 entidades)

Cada entidad exporta **dos schemas**: `create{Entity}Schema` + `update{Entity}Schema`.
- **Todos los campos numéricos usan `z.coerce.number()`** (no `z.number()`).
- EntityForm recibe ambos como props separadas: `createSchema` y `updateSchema`.

##### J.6.1.1 — Shared field definitions (`core/validators/fields/`)

Para evitar duplicación entre form validators y response validators (`core/loading/validators/`), las **reglas base** de cada campo viven en `fields/`. Los validators de form y response las importan:

```
core/validators/
  fields/
    core/         → product-fields, category-fields, currency-fields, exchange-rate-fields, role-fields, warehouse-fields, user-fields
    commerce/     → customer-fields, supplier-fields, sale-fields, purchase-fields, transfer-fields, adjustment-fields, return-fields
  core/           → validators de entidades core (importan de fields/)
  commerce/       → validators de entidades commerce (importan de fields/)
  shared/         → validate-and-submit.ts

core/loading/validators/
  *-response.ts   → response validators (importan de fields/ en vez de definir sus propias reglas)
```

Cada archivo `fields/*.ts` exporta:
- **Validation primitives**: `z.string().min(1).max(200)` — la regla base sin nullable/optional
- **Enums compartidos**: `ACTIVE|ARCHIVED`, `UNIT|KG|L...`, `OFFICIAL|MARKET|CUSTOM`, etc.
- **Solo la regla**: no decide si el campo es nullable u optional — eso lo hace cada consumer

Ejemplo:
```typescript
// fields/core/product-fields.ts
export const productName = () => z.string().min(1).max(200);
export const productSku = () => z.string().max(50);
export const productBarcode = () => z.string().max(50);
export const productStandardCost = () => z.coerce.number().min(0);
export const unitOfMeasure = z.enum(['UNIT', 'KG', 'L', 'M', 'M2', 'BOX', 'PACK']);
export const productStatus = z.enum(['ACTIVE', 'ARCHIVED']);
export const costMethod = z.enum(['INHERIT', 'STANDARD', 'WAC', 'FIFO']);
```

```typescript
// core/product-validators.ts  — usa fields
import { productName, productSku, productBarcode, unitOfMeasure } from '../fields/core/product-fields';
export const createProductSchema = z.object({
  name: productName(),
  sku: productSku().nullable().optional(),
  barcode: productBarcode().nullable().optional(),
  unitOfMeasure: unitOfMeasure.optional(),
  // ...
});
```

```typescript
// loading/validators/product-response.ts — usa los mismos fields
import { productName, productSku, unitOfMeasure, productStatus, costMethod } from '@/core/validators/fields/core/product-fields';
export const productResponseSchema = z.object({
  id: z.string(),
  name: productName(),
  sku: productSku().nullable().optional().default(null),
  unitOfMeasure: unitOfMeasure,
  status: productStatus,
  costMethod: costMethod,
  // ...
});
```

**Regla**: Si la regla base cambia (ej: name pasa de max(200) a max(300)), se cambia **en un solo lugar** (`fields/`).

**Existentes — ajustar**:
| Archivo | Entidad | Cambios |
|---------|---------|---------|
| `core/product-validators.ts` | Product | `z.number()` → `z.coerce.number()`, quitar `.int()` de reorderPoint |
| `commerce/customer-validators.ts` | Customer | `z.number()` → `z.coerce.number()`, agregar `.max()` en name(200)/code(50)/contactName(100)/phone(30)/email(100)/address(300), agregar campos geo (province/municipality/street/locality/zipCode/lat/lng) |
| `commerce/supplier-validators.ts` | Supplier | Ídem Customer + website `.url()` |
| `commerce/sale-validators.ts` | Sale | Agregar `updateSaleSchema` + `z.coerce.number()` en quantity/unitPrice/discount |

**Nuevos**:
| Archivo | Entidad | createSchema reglas clave | updateSchema |
|---------|---------|--------------------------|-------------|
| `core/category-validators.ts` | Category | name min(1) max(100), parentId nullable, sortOrder coerce int min(0) | createSchema.partial() |
| `core/currency-validators.ts` | Currency | code length(3) uppercase, name min(1) max(100), symbol min(1) max(10) optional, isActive optional default true | createSchema.partial() |
| `core/exchange-rate-validators.ts` | ExchangeRate | baseCode string min(1), quoteCode string min(1), rate coerce positive, rateType enum (OFFICIAL\|MARKET\|CUSTOM), validFrom coerce date optional | createSchema.partial() |
| `core/role-validators.ts` | Role | code min(1) max(100) uppercase, name min(1) max(200), description max(500) optional, isActive optional default true | createSchema.partial() |
| `core/warehouse-validators.ts` | Warehouse | code min(1) max(20), name min(1) max(100), address max(500) optional | createSchema.partial() |
| `core/user-validators.ts` | User | username min(3) max(100), displayName min(1) max(200), email email() max(255) optional, password min(8), roleId string min(1) | createSchema.partial() |
| `commerce/purchase-validators.ts` | Purchase | warehouseId string min(1), supplierId string optional, currencyCode string length(3) optional, purchaseDate coerce date optional, exchangeRate coerce positive optional, notes max(1000) optional, lines array min(1) | createSchema.partial() |
| `commerce/transfer-validators.ts` | Transfer | fromWarehouseId string min(1), toWarehouseId string min(1) distinto de from, notes max(1000) optional, transferDate coerce date optional, lines array min(1) | createSchema.partial() |
| `commerce/adjustment-validators.ts` | Adjustment | warehouseId string min(1), type enum (COUNT\|DAMAGE\|LOSS\|FOUND\|CORRECTION\|OTHER), reason max(500) optional, notes max(1000) optional, adjustmentDate coerce date optional, lines array min(1) | createSchema.partial() |
| `commerce/return-validators.ts` | Return | type enum (SALE_RETURN\|PURCHASE_RETURN), warehouseId string min(1), reason max(500) optional, notes max(1000) optional, originalDocumentId string optional, lines array min(1) | createSchema.partial() |

---

#### J.6.2 — Fase A: migrar 5 forms EntityForm existentes

**Forms**: ProductFormFields, CategoryForm, CurrencyFormFields, ExchangeRateFormFields, RoleFormFields

Ya están integrados con EntityForm. Solo requieren los cambios del refactor:

| Paso | Acción | Depende de |
|------|--------|-----------|
| 1 | `storageKey` requerido en EntityForm. Pasar la key correspondiente. | J.4.1 |
| 2 | Si aplica (duplicación), pasar `persistCreateValues={false}` | J.4.1 |
| 3 | Añadir `onSubmitAction` con el handleSubmit existente envuelto en async | J.4.1 |
| 4 | Pasar `createSchema` y `updateSchema` | J.6.1 |
| 5 | Eliminar `FIELD_VALIDATORS` (Zod reemplaza) | — |
| 6 | Eliminar `mapBackendErrorToField` (EntityForm maneja fieldErrors) | — |
| 7 | Eliminar `externalFieldErrors` state local | — |
| 8 | Eliminar `setError` state local | — |
| 9 | Eliminar try/catch del handleSubmit local | — |
| 10 | Eliminar `onSubmit` prop legacy | — |

**storageKey por form**:

| Form | storageKey | persistCreateValues |
|------|-----------|-------------------|
| ProductFormFields | `"product-create"` | Pasado desde `ProductCreateView`: `!prefillId` |
| CategoryForm | `"category-create"` ← **nuevo** | default `true` |
| CurrencyFormFields | `"currency-create"` | default `true` |
| ExchangeRateFormFields | `"exchange-rate-create"` | default `true` |
| RoleFormFields | `"role-create"` | default `true` |

**Estado de migración** (actualizar al completar):

| Form | storageKey | onSubmitAction | createSchema | updateSchema | FIELD_VALIDATORS | mapBackendErrorToField | Status |
|------|-----------|---------------|--------------|--------------|------------------|----------------------|--------|
| ProductFormFields | `"product-create"` ✅ | ✅ | ✅ | ✅ | ❌ eliminado | ❌ eliminado | ✅ Completado (J.6 A) |
| CategoryForm | `"category-create"` ✅ | ✅ | ✅ | ✅ | ❌ eliminado | ❌ eliminado | ✅ Completado (J.6 A) |
| CurrencyFormFields | `"currency-create"` ✅ | ✅ | ✅ | ✅ | ❌ eliminado | ❌ eliminado | ✅ Completado (J.6 A) |
| ExchangeRateFormFields | `"exchange-rate-create"` ✅ | ✅ | ✅ | ✅ | ❌ eliminado | ❌ eliminado | ✅ Completado (J.6 A) |
| RoleFormFields | `"role-create"` ✅ | ✅ | ✅ | ✅ | ❌ eliminado | ❌ eliminado | ✅ Completado (J.6 A) |

Ejemplo ProductFormFields post-migración (aplica igual a los otros 4):
```typescript
export function ProductFormFields({ categories, initialData, storageKey, persistCreateValues, ... }: ProductFormFieldsProps) {
  // ELIMINADO: FIELD_VALIDATORS, mapBackendErrorToField, externalFieldErrors, setError, try/catch

  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    await onSubmit(values as ProductFormData);
  }, [onSubmit]);

  return (
    <EntityForm
      storageKey={storageKey}
      persistCreateValues={persistCreateValues}
      createSchema={createProductSchema}
      updateSchema={updateProductSchema}
      onSubmitAction={handleSubmit}
    />
  );
}
```

```typescript
// ProductCreateView.tsx
<ProductFormFields
  key={prefillId || 'create'}
  storageKey={STORAGE_KEY}
  persistCreateValues={!prefillId}
  initialData={initialData}
  initialValues={initialValues}
/>
```

---

#### J.6.3 — Fase B: migrar Warehouse + User a EntityForm

> ✅ **J.6.3 Fase B completada** — Warehouse y User migrados a EntityForm con Zod schemas, storageKey, onSubmitAction.

Forms simples (3 y 5 campos, sin arrays dinámicos, sin geo) que actualmente usan raw `<form>`. Se migran COMPLETAMENTE a EntityForm.

**Pasos para cada form**:
1. Crear el validador Zod en `core/validators/` (J.6.1)
2. Reemplazar `useState` individuales por `values: Record<string, string>` + `onChange`
3. Reemplazar raw `<form>` + botones por `<EntityForm>`
4. Definir `fields: EntityFormField[]` declarativo
5. Pasar `storageKey` (ej: `"warehouse-create"`, `"user-create"`)
6. Pasar `createSchema`/`updateSchema`
7. Pasar `onSubmitAction` que llama al repository hook
8. Si el form vive en un modal/dialog inline: adaptar el parent (`WarehousesListView`/`UsersListView`) para pasar las props de EntityForm

**Estado actual**:

| Sub-fase | Entidad | Status |
|----------|---------|--------|
| B.1 | Field definitions + validators | ✅ Completado `b205c6c` |
| B.2 | WarehouseFormFields → EntityForm | ✅ Completado `b205c6c` |
| B.3 | UserFormFields → EntityForm | ✅ Completado |

**Diferencias por form**:

| Aspecto | WarehouseFormFields ✅ | UserFormFields ✅ |
|---------|----------------------|-------------------|
| Líneas actuales | ~40 (migrado) | ~150 (migrado) |
| Campos | 3 (code, name, address) | 5 (username, displayName, email, password, roleId) |
| Sub-componentes | Ninguno | Ninguno |
| View pattern | Página dedicada (`WarehouseCreateView`) | Modal inline (`UsersListView`) |
| storageKey | `"warehouse-create"` | `"user-create"` |
| Particularidad | `code` tiene `.toUpperCase()` | `roleId` usa `useRoles` hook |

---

#### J.6.4 — Fase C: migrar Customer + Supplier a EntityForm (con geo-select)

**Forms**: `CustomerFormFields.tsx`, `SupplierFormFields.tsx`

Forms con campos de geolocalización (provincia/municipio en cascada, `MapPickerModal`). Supplier además tiene 3 sub-componentes.

**Componente reutilizable `<GeoFields>`**: Customer y Supplier comparten la lógica de provincia/municipio cascade + MapPickerModal. Crear un componente compartido:

```typescript
// shared/components/form/GeoFields.tsx
interface GeoFieldsProps {
  province: string;
  municipality: string;
  street: string;
  latitude?: number;
  longitude?: number;
  errors?: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

// Usa useProvinces()/useMunicipalities() internamente
// Renderiza selects en cascada + MapPickerModal
// Cada campo muestra su error via errors[field]
```

**Pasos** (además de los de Fase B):
1. `<GeoFields>` se integra vía `renderField` en EntityForm, recibiendo `fieldError` de cada campo geo
2. El `MapPickerModal` se integra dentro de `<GeoFields>`
3. Supplier sub-componentes (`SupplierBasicInfo`, `SupplierContactFields`, `SupplierAddressFields`): migrar sus fields al array declarativo de EntityForm. Usar `renderField` donde el layout existente sea muy custom

| Aspecto | CustomerFormFields | SupplierFormFields |
|---------|-------------------|-------------------|
| Líneas actuales | 190 | 158 |
| Campos | ~15 (incluye geo) | ~13 (incluye geo) |
| Sub-componentes | Ninguno | 3 (BasicInfo, ContactFields, AddressFields) |
| View pattern | Modal inline (`CustomersListView`) | Modal inline (`SuppliersListView`) |
| Geo hooks | `useProvinces()`, `useMunicipalities()` | `useProvinces()`, `useMunicipalities()` |
| storageKey | `"customer-create"` | `"supplier-create"` |

---

#### J.6.5 — Fase C: migrar Sale, Purchase, Transfer, Adjustment, Return a EntityForm (con arrays dinámicos)

**Forms**: `SaleFormFields.tsx`, `PurchaseFormFields.tsx`, `TransferFormFields.tsx`, `AdjustmentFormFields.tsx`, `ReturnFormFields.tsx`

Forms complejos con **arrays dinámicos de líneas** (productId + cantidad + precio + descuento). EntityForm actualmente NO soporta arrays dinámicos — requiere extensión.

**Extensión necesaria en EntityForm** (pre-requisito):
- Añadir soporte para `field.type === 'dynamic-array'` o similar
- O migrar estos forms manteniendo su layout actual pero usando EntityForm para la sección de header + delegar el array a `renderField`

**Alternativa pragmática** (recomendada): Estos forms mantienen su estructura actual (raw `<form>` para el wrapper + secciones) pero:
1. Adoptan el validador Zod de J.6.1 para validar TODO el formulario (header + líneas) en el submit
2. Adoptan `storageKey` para persistir el draft completo
3. Manejan `fieldErrors` del backend estructurados
4. NO se migran a EntityForm como wrapper — sería muy disruptivo

Esta alternativa les da los beneficios del refactor (validación Zod, fieldErrors, storageKey) sin reescribir la capa de presentación completa.

**Helper `validateAndSubmit`** — maneja Zod errors con paths anidados (ej: `lines[0].quantity`):

```typescript
function setNestedError(errors: Record<string, string>, path: (string | number)[], message: string) {
  // lines[0].quantity → "lines.0.quantity": message
  const key = path.join('.');
  if (!errors[key]) errors[key] = message;
}

export async function validateAndSubmit<T>(
  schema: z.ZodType<T>,
  rawValues: Record<string, unknown>,
  apiCall: () => Promise<T>,
): Promise<T> {
  const result = schema.safeParse(rawValues);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      setNestedError(fieldErrors, issue.path, issue.message);
    }
    throw { fieldErrors, isZodError: true };
  }
  try {
    return await apiCall();
  } catch (err) {
    const fieldResp = getFieldErrors(err);
    if (fieldResp.length > 0) {
      const mapped: Record<string, string> = {};
      for (const fe of fieldResp) mapped[fe.field] = fe.message;
      throw { fieldErrors: mapped };
    }
    throw err;
  }
}
```

**Componente reutilizable `<DynamicArrayLines>`**: Sale, Purchase, Transfer, Adjustment, Return comparten el patrón de tabla de líneas (productId + quantity + price ± discount). Extraerlo:

```typescript
// shared/components/form/DynamicArrayLines.tsx
interface DynamicArrayLinesProps {
  lines: ArrayLine[];
  products: Product[];
  fieldErrors?: Record<string, string>;  // "lines.0.quantity": "error"
  onChange: (lines: ArrayLine[]) => void;
  // ... config de columnas visibles (quantity, price, discount según entidad)
}
```

Renderiza:
- Tabla con filas dinámicas (añadir/eliminar)
- Cada celda muestra su error vía `fieldErrors[`lines.${index}.${field}`]`
- Selector de producto (ComboboxSelect con error de línea)

Cada form llama `validateAndSubmit(schema, rawValues, () => repo.create(data))` en su handleSubmit y pasa `fieldErrors` a `<DynamicArrayLines>`.

| Form | storageKey | Observación |
|------|-----------|-------------|
| SaleFormFields | `"sale-create"` | Tiene `createSaleSchema` existente |
| PurchaseFormFields | `"purchase-create"` | Sin validator hoy |
| TransferFormFields | `"transfer-create"` | Sin validator hoy |
| AdjustmentFormFields | `"adjustment-create"` | Sin validator hoy |
| ReturnFormFields | `"return-create"` | Sin validator hoy |

---

#### J.6.6 — Sincronizar Zod con backend

> ⚠️ **Importante**: Todos los schemas existentes que usan `z.number()` deben migrarse a `z.coerce.number()` porque `buildRawValuesForSchema` pasa strings desde inputs HTML.

| Entity | Campo | Backend | Zod |
|--------|-------|---------|-----|
| Product | name | `@NotBlank @Size(max=200)` | `z.string().min(1).max(200)` |
| Product | sku | `@Size(max=50)` | `z.string().max(50).optional().nullable()` |
| Product | barcode | `@Size(max=50)` | `z.string().max(50).regex(/^\d*$/).optional().nullable()` |
| Product | standardCost | `@PositiveOrZero` | `z.coerce.number().min(0).optional().nullable()` |
| Product | salePrice | `@PositiveOrZero` | `z.coerce.number().min(0).optional().nullable()` |
| Product | reorderPoint | — | `z.coerce.number().min(0).optional().nullable()` |
| Product | taxRate | — | `z.coerce.number().min(0).max(100).optional()` |
| Product | description | `@Size(max=2000)` | `z.string().max(2000).optional().nullable()` |
| Category | name | `@NotBlank @Size(max=100)` | `z.string().min(1).max(100)` |
| Category | parentId | FK nullable | `z.string().optional().nullable()` |
| Category | sortOrder | — | `z.coerce.number().int().min(0).optional()` |
| Warehouse | code | `@NotBlank @Size(max=20)` | `z.string().min(1).max(20)` |
| Warehouse | name | `@NotBlank @Size(max=100)` | `z.string().min(1).max(100)` |
| Warehouse | address | `@Size(max=500)` | `z.string().max(500).optional()` |

> ⚠️ **Nota**: Para Customer, Supplier y entidades commerce (Sale, Purchase, etc.), los límites exactos están en los DTOs Java. Ver `CreateCustomerRequest`, `CreateSupplierRequest`, etc. en `backend/.../application/dto/`.

> ⚠️ **Campos opcionales y `undefined`**: `buildRawValuesForSchema` pasa `undefined` para campos vacíos. Los schemas Zod deben usar `.optional()` en campos opcionales, de lo contrario Zod rechazará `undefined`. Los campos obligatorios (`z.string().min(1)`) reciben bien el string del input. Los campos opcionales numéricos deben ser `z.coerce.number().optional().nullable()` para aceptar tanto `undefined` (vacío) como `null` (backend nullable).

Si el backend no tiene `@NotBlank` en algún campo obligatorio (Category.name, Currency.code, etc.), agregarlo al DTO Java.

> ### 🐛 Bugs de backend detectados durante la auditoría
>
> **1. Tabla `returns` no existe en Flyway** — `ReturnEntity.java` y `ReturnLineEntity.java` en `adapters/persistence/adapter/entity/` mapean a `@Table("returns")` y `@Table("return_lines")`, pero **ningún migration crea estas tablas**. Solo existe `V8__return_sequences.sql` para secuencias de números de devolución. La entidad es huérfana — crear migration `V_add_returns_table`.
>
> **2. `AdjustmentEntity.@Column("type")` incorrecto** — En `AdjustmentEntity.java`, el campo `type` mapea como `@Column("type")` pero la columna en DB (V5) se llama `adjustment_type`. Corregir a `@Column("adjustment_type")`.

#### Archivos Fase J.6 — Resumen

| Archivo | Cambio | Fase |
|---------|--------|:----:|
| `core/validators/core/product-validators.ts` | `z.number()` → `z.coerce.number()` | A |
| `core/validators/core/category-validators.ts` | **Nuevo** (create + update) | A |
| `core/validators/core/currency-validators.ts` | **Nuevo** (create + update) | A |
| `core/validators/core/exchange-rate-validators.ts` | **Nuevo** (create + update) | A |
| `core/validators/core/role-validators.ts` | **Nuevo** (create + update) | A |
| `core/validators/core/warehouse-validators.ts` | **Nuevo** (create + update) | B |
| `core/validators/core/user-validators.ts` | **Nuevo** (create + update) | B |
| `core/validators/commerce/customer-validators.ts` | +`.max()` en 6 campos + campos geo (province/municipality/street/locality/zipCode/lat/lng) | C |
| `core/validators/commerce/supplier-validators.ts` | Ídem Customer + website | C |
| `core/validators/commerce/sale-validators.ts` | + `z.coerce.number()` en quantity/unitPrice/discount + `updateSaleSchema` | C |
| `core/validators/commerce/purchase-validators.ts` | **Nuevo** (create + update) | C |
| `core/validators/commerce/transfer-validators.ts` | **Nuevo** (create + update) | C |
| `core/validators/commerce/adjustment-validators.ts` | **Nuevo** (create + update) | C |
| `core/validators/commerce/return-validators.ts` | **Nuevo** (create + update) | C |
| `core/validators/shared/validate-and-submit.ts` | **Nuevo** helper para Fase C | C |
| `core/validators/fields/core/product-fields.ts` | **Nuevo** — field definitions compartidos | A |
| `core/validators/fields/core/category-fields.ts` | **Nuevo** — field definitions | A |
| `core/validators/fields/core/currency-fields.ts` | **Nuevo** — field definitions | A |
| `core/validators/fields/core/exchange-rate-fields.ts` | **Nuevo** — field definitions | A |
| `core/validators/fields/core/role-fields.ts` | **Nuevo** — field definitions | A |
| `core/validators/fields/core/warehouse-fields.ts` | **Nuevo** — field definitions | B |
| `core/validators/fields/core/user-fields.ts` | **Nuevo** — field definitions | B |
| `core/validators/fields/commerce/customer-fields.ts` | **Nuevo** — field definitions | C |
| `core/validators/fields/commerce/supplier-fields.ts` | **Nuevo** — field definitions | C |
| `core/validators/fields/commerce/sale-fields.ts` | **Nuevo** — field definitions | C |
| `core/validators/fields/commerce/purchase-fields.ts` | **Nuevo** — field definitions | C |
| `core/validators/fields/commerce/transfer-fields.ts` | **Nuevo** — field definitions | C |
| `core/validators/fields/commerce/adjustment-fields.ts` | **Nuevo** — field definitions | C |
| `core/validators/fields/commerce/return-fields.ts` | **Nuevo** — field definitions | C |
| `core/loading/validators/product-response.ts` | Migrar a shared fields (importar de fields/) | A |
| `core/loading/validators/category-response.ts` | Migrar a shared fields | A |
| `core/loading/validators/warehouse-response.ts` | Migrar a shared fields | B |
| `core/loading/validators/currency-response.ts` | Migrar a shared fields | A |
| `core/loading/validators/exchange-rate-response.ts` | Migrar a shared fields | A |
| `core/loading/validators/customer-response.ts` | Migrar a shared fields | C |
| `core/loading/validators/supplier-response.ts` | Migrar a shared fields | C |
| `core/loading/validators/customer-debt-response.ts` | Migrar a shared fields | C |
| `core/loading/validators/stock-response.ts` | Sin cambios (no entity de dominio) | — |
| `shared/components/form/EntityForm.tsx` | `storageKey` requerido + `persistCreateValues` | A/B/C |
| `shared/components/form/GeoFields.tsx` | **Nuevo** — cascade provincia/municipio + MapPickerModal | C |
| `shared/components/form/DynamicArrayLines.tsx` | **Nuevo** — tabla dinámica de líneas con errores anidados | C |
| `components/form/ProductFormFields.tsx` | Migrar a onSubmitAction + createSchema + storageKey | A |
| `components/form/CategoryForm.tsx` | Migrar a onSubmitAction + createSchema + storageKey | A |
| `components/form/CurrencyFormFields.tsx` | Migrar a onSubmitAction + createSchema + storageKey | A |
| `components/form/ExchangeRateFormFields.tsx` | Migrar a onSubmitAction + createSchema + storageKey | A |
| `components/form/RoleFormFields.tsx` | Migrar a onSubmitAction + createSchema + storageKey | A |
| `components/form/WarehouseFormFields.tsx` | Migrar a EntityForm completo | B |
| `components/form/UserFormFields.tsx` | Migrar a EntityForm completo | B |
| `components/form/CustomerFormFields.tsx` | Migrar a EntityForm + geo-select | C |
| `components/form/SupplierFormFields.tsx` | Migrar a EntityForm + geo-select + sub-componentes | C |
| `components/form/SaleFormFields.tsx` | Adoptar Zod + storageKey (sin EntityForm wrapper) | C |
| `components/form/PurchaseFormFields.tsx` | Adoptar Zod + storageKey (sin EntityForm wrapper) | C |
| `components/form/TransferFormFields.tsx` | Adoptar Zod + storageKey (sin EntityForm wrapper) | C |
| `components/form/AdjustmentFormFields.tsx` | Adoptar Zod + storageKey (sin EntityForm wrapper) | C |
| `components/form/ReturnFormFields.tsx` | Adoptar Zod + storageKey (sin EntityForm wrapper) | C |
| `views/ProductCreateView.tsx` | Pasar `storageKey` + `persistCreateValues={!prefillId}` | A |
| `views/WarehouseCreateView.tsx` | Adaptar a EntityForm (pasa `<form>` ownership) | B |
| `views/CustomersListView.tsx` | Pasar props de EntityForm (modal inline) | C |
| `views/SuppliersListView.tsx` | Pasar props de EntityForm (modal inline) | C |
| Vistas de Sale/Purchase/Transfer/Adjustment/Return | Sin cambios (no adoptan EntityForm wrapper) | C |

---

### Fase J.7 — Sync error recovery: reparar entidades fallidas

**Skills**: `senior-fullstack`, `clean-code`

#### J.7.1 — OutboxEntry + DeadLetterEntry: + fieldErrors

**Archivo**: `frontend/src/infrastructure/storage/db.ts`

```typescript
export interface OutboxEntry {
  // ... existing fields ...
  fieldErrors?: Array<{ field: string; message: string }>;
  fieldErrorsAt?: number;
}

export interface DeadLetterEntry {
  // ... existing fields ...
  fieldErrors?: Array<{ field: string; message: string }>;
}
```

#### J.7.2 — SyncService: guardar fieldErrors

**Archivo**: `frontend/src/infrastructure/storage/SyncService.ts`

En `processOutbox()`, al recibir error del backend:

```typescript
// después de entry.lastError = String(err);
const fieldResp = getFieldErrors(err);
if (fieldResp.length > 0) {
  entry.fieldErrors = fieldResp;
  entry.fieldErrorsAt = Date.now();
  // Resetear estado a rejected (detener reintentos)
  entry.status = 'rejected';
  // NO incrementar retryCount: los errores 4xx son del cliente,
  // reintentar no tiene sentido. Solo los errores de red/5xx
  // deben contar para el backoff y eventual dead letter.
}
// guardar entry con db.put('outbox', entry)
```

Precauciones adicionales:
- Si `entry.status` estaba en `'syncing'` y se guarda fieldErrors, asegurar que pase a `'rejected'` explícitamente.
- **No incrementar `retryCount`** en errores 4xx — si se incrementa y `maxRetries = 3`, la entry se movería a dead letter prematuramente. Los 4xx son errores de validación del payload, no transitorios.
- No reemplazar `payload` — el payload original se necesita para el RepairDialog.
- `fieldErrorsAt` sirve para ordenar las entradas fallidas por antigüedad en la UI.

En `pushOutbox()`, mismo patrón en el catch + en el manejo de resultados no aceptados.

#### J.7.3 — getFailedOutbox(): query para UI

**Archivo**: `frontend/src/infrastructure/storage/outbox.ts`

```typescript
export async function getFailedOutbox(): Promise<OutboxEntry[]> {
  const db = await getDB();
  const all = await db.getAll('outbox');
  return all.filter(e => e.status === 'rejected' && e.fieldErrors && e.fieldErrors.length > 0);
}
```

#### J.7.4 — SyncFailedBadge (nuevo)

`frontend/src/presentation/shared/components/sync/SyncFailedBadge.tsx`

Badge en navbar/header que muestra conteo de entradas `status='rejected'` con `fieldErrors.length > 0`. Al click, abre RepairDialog.

Usar componente existente `Badge` de `presentation/shared/components/ui/`. Tooltip con "X entradas requieren reparación".

#### J.7.5 — RepairDialog (nuevo)

`frontend/src/presentation/shared/components/sync/RepairDialog.tsx`

Modal que:
1. Recibe `outboxEntry: OutboxEntry`
2. Carga la entidad local desde IDB:
   - Si existe → usar como `initialData`
   - Si **no existe** (usuario borró la entidad localmente) → usar `outboxEntry.payload` como `initialData`
3. Renderiza EntityForm con `createSchema`/`updateSchema` de la entidad + `initialData` (de IDB o fallback a payload)
4. Pasa `externalFieldErrors` desde `outboxEntry.fieldErrors` (los errores del backend)
5. Usuario corrige y confirma → handleSubmit en EntityForm valida con Zod → llama al callback
6. **Callback**: Guarda/actualiza la entidad local en IDB (insert si no existe, update si existe) — sobreescribe los datos corregidos en la tabla de la entidad, no solo en el outbox
7. **Luego**: Reemplaza la entry de outbox: `payload` actualizado, `status` → `pending`, `fieldErrors` limpiado, `fieldErrorsAt` eliminado
8. Toast: "Corrección guardada. Se sincronizará automáticamente."

> ⚠️ **Orden crítico**: Primero IDB local, luego outbox. Si el sync falla de nuevo, la entidad local ya tiene el valor corregido. Sin este paso, la UI seguiría mostrando el dato incorrecto hasta que el sync complete.

> ⚠️ **Payload structure**: El outbox guarda el payload en el formato que el repositorio envía al backend (DTO). El EntityForm trabaja con `Record<string, string>`. Verificar que los nombres de campo coincidan. Si hay transformación (ej: backend espera `productName` y form usa `name`), el RepairDialog debe mapear: `outboxEntry.payload → form values → onSubmit → nuevo payload`. Por ahora, la convención es que coincidan; si una entidad se desvía, documentarlo en su repositorio.

**Entity-to-form map**: el RepairDialog necesita saber qué EntityForm renderizar según `entityType`.

```typescript
const entityFormMap: Record<string, React.ComponentType<EntityFormRepairProps>> = {
  PRODUCT: ProductFormFields,
  CATEGORY: CategoryForm,
  CURRENCY: CurrencyFormFields,
  EXCHANGE_RATE: ExchangeRateFormFields,
  ROLE: RoleFormFields,
  WAREHOUSE: WarehouseFormFields,       // 🆕 Fase B
  USER: UserFormFields,                 // 🆕 Fase B
  CUSTOMER: CustomerFormFields,         // 🆕 Fase C
  SUPPLIER: SupplierFormFields,         // 🆕 Fase C
};
```

Cada form debe aceptar `initialData`, `createSchema`, `updateSchema`, `storageKey` y `onSubmitAction`. Compatible con los forms migrados en J.6.2/3/4.

#### J.7.6 — RepairDialog: manejar entidades sin form específico

Si `entityType` no está en `entityFormMap`, mostrar un fallback:
- Lista de campos del payload (JSON)
- Errores del backend lado a lado
- Input genérico para corregir valores
- Botón "Reintentar" que reenvía con el payload corregido

#### Archivos: 2 nuevos + 2 modificados
| Archivo | Cambio |
|---------|--------|
| `infrastructure/storage/db.ts` | + fieldErrors en OutboxEntry + DeadLetterEntry |
| `infrastructure/storage/SyncService.ts` | Guardar fieldErrors en catch |
| `infrastructure/storage/outbox.ts` | + getFailedOutbox() |
| `shared/components/sync/SyncFailedBadge.tsx` | Nuevo |
| `shared/components/sync/RepairDialog.tsx` | Nuevo |

> ✅ **J.7 completado** — `09bb752` — OutboxEntry/DeadLetterEntry con fieldErrors. SyncService guarda fieldErrors y no reintenta 4xx. getFailedOutbox() para UI. SyncFailedBadge + RepairDialog con EntityForm genérico para reparar payload.

---

### Fase J.8 — Verificación

> ✅ **J.8 completado** — `...` (próximo commit) — Backend 102 tests pass con fieldErrors. Frontend: 5 tests files nuevos (client, api-or-outbox, SyncService, EntityForm, product-fields). Lint 0, tsc 0, tests 274/274. Fix-003 (unused import) y Fix-004 (4 catch blocks documentados).

---

## Resumen de Archivos

| Fase | Nuevos | Modificados | Total |
|------|--------|-------------|-------|
| J.1 Backend fieldErrors | 1 | 3 | 4 |
| J.2 API helpers | 0 | 1 | 1 |
| J.3 Repos propagan 4xx | 1 | 13 | 14 |
| J.4 EntityForm Zod | 0 | 1 | 1 |
| J.5 Error prop en ComboboxSelect | 0 | 1 | 1 |
| **J.6 Fase A** (5 forms EntityForm) | 5 fields + 4 validators | 1 existing validator + 5 forms + 1 view + 4 response validators | 20 |
| **J.6 Fase B** (Warehouse + User) ✅ | 2 fields + 2 validators | 2 forms + 2 views + 1 response validator | 9 |
| **J.6 Fase C** (Customer, Supplier, 5 arrays) | 7 fields + 4 validators + 1 helper + 2 shared components | 3 existing validators + 7 forms + 2 views + 3 response validators | 29 |
| **J.6 Total** | **27** | **31** | **58** |
| J.7 Sync recovery | 2 | 3 | 5 |
| J.8 Tests unitarios | 4 | 0 | 4 |
| **Total** | **35** | **53** | **88** |

---

## Política de Error UI (post-refactor)

| Escenario | Canal UX | Quién maneja |
|-----------|----------|-------------|
| Error Zod pre-submit | Bajo el campo (inline rojo) | EntityForm.handleSubmit |
| Error backend 4xx post-submit | Bajo el campo (inline rojo) | EntityForm catch → externalFieldErrors |
| Conflicto unique | Bajo el campo + toast | EntityForm catch |
| Error de red / servidor caído | Toast + outbox | Repositorio (catch → outbox) |
| Error 500 inesperado | Toast genérico | EntityForm catch → setError |
| Sync falló por validación | Badge + RepairDialog | SyncService guarda fieldErrors |
| Sync falló por conflicto | Badge + RepairDialog | SyncService guarda fieldErrors |
