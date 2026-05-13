# Plan de Reestructuración del Proyecto - Gestión de Inventario

> Created: 2026-05-11

## Objetivo
Crear un plan completo de reestructuración y buenas prácticas para el proyecto de gestión de inventario (Frontend TypeScript/Next.js + Backend Java/Spring).

---

## Resumen Ejecutivo de Auditoría

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| **Arquitectura** | ✅ Hexagonal/Clean | ✅ Core/Infra/Presentation |
| **Archivos** | 432 `.java` | 258 `.ts` + 194 `.tsx` |
| **Patrón Repository** | ✅ adapters + ports | ✅ interfaces + impl |
| **Use Cases** | ✅ command/query | ✅ core/use-cases |
| **Tests** | ⚠️ Solo 5 | ✅ 25 |

---

## Problemas Identificados

### 🔴 Alta Prioridad

| # | Problema | Ubicación |
|---|----------|-----------|
| 1 | Componentes >100 líneas (42 archivos) | Frontend/presentation/ |
| 2 | Hooks >150 líneas (4 archivos) | Frontend/presentation/shared/hooks/ |
| 3 | Errores personalizados TS faltantes (0 implementados) | Frontend/core/ |
| 4 | Tests backend insuficientes (5 vs 25 frontend) | Backend/src/test/ |
| 5 | Carpetas con demasiados archivos sin categorizar | Ambos |

### 🟡 Media Prioridad

| # | Problema | Ubicación |
|---|----------|-----------|
| 6 | Imports en orden incorrecto | Varios .tsx |
| 7 | Archivos `.ts` que deberían ser `.tsx` (71 archivos) | Varios |
| 8 | Uso de `any` sin justificación (12 usos) | hooks de notificaciones |
| 9 | Validación de formularios básica (sin Zod) | Frontend/modules/* |
| 10 | Tooltips inconsistentes en formularios | Varios |

---

## Fase 1: Reestructuración de Carpetas (Critical)

### 1.1 Frontend - Estructura Propuesta

**Problema actual**: Carpetas con +15 archivos sin subcategorización

```
src/ (actual)
├── core/use-cases/ (59 archivos mezclados)
├── infrastructure/repositories/ (42 archivos sin dominio)
├── presentation/shared/components/ (44 archivos)
├── presentation/shared/hooks/ (62 archivos)
└── presentation/modules/products/ (19 archivos)
```

**Estructura nueva propuesta**:

```
src/
├── core/
│   ├── domain/
│   │   ├── product/        # Entidades + use-cases de producto
│   │   ├── sale/
│   │   ├── purchase/
│   │   ├── customer/
│   │   ├── supplier/
│   │   ├── warehouse/
│   │   └── inventory/
│   ├── errors/            # Errores personalizados (NUEVO)
│   └── validators/       # Schemas Zod (NUEVO)
│
├── infrastructure/
│   ├── repositories/
│   │   ├── product/
│   │   ├── sale/
│   │   └── ...
│   └── api/
│       ├── product/
│       └── ...
│
└── presentation/
    ├── modules/
    │   ├── products/
    │   │   ├── components/
    │   │   │   ├── table/
    │   │   │   ├── form/
    │   │   │   └── filters/
    │   │   ├── hooks/
    │   │   └── views/
    │   └── ...
    └── shared/
        ├── ui/                    # Componentes genéricos (Button, Modal)
        ├── business/             # Hooks de negocio compartidos
        └── utils/
```

### 1.2 Backend - Estructura Propuesta

**Problema actual**: 38 entidades en `domain/model/` sin categorización

```
src/main/java/com/inventory/ (actual)
├── domain/model/ (38 archivos mezclados)
├── application/dto/ (50 archivos)
├── adapters/persistence/repository/ (37 archivos)
└── domain/ports/in/ (44 archivos)
```

**Estructura nueva propuesta**:

```
src/main/java/com/inventory/
├── domain/
│   ├── product/
│   │   ├── model/
│   │   ├── ports/
│   │   └── services/
│   ├── sale/
│   ├── purchase/
│   ├── customer/
│   └── shared/              # Errores base, ValueObjects compartidos
│
├── application/
│   ├── product/
│   │   ├── usecase/
│   │   │   ├── command/
│   │   │   └── query/
│   │   ├── dto/
│   │   └── mapper/
│   └── sale/
│
└── adapters/
    ├── persistence/
    │   ├── product/
    │   │   ├── repository/
    │   │   ├── entity/
    │   │   └── mapper/
    │   └── sale/
    └── web/
        ├── product/
        │   ├── controller/
        │   ├── dto/
        │   └── mapper/
        └── sale/
```

---

## Fase 2: Refactorización de Componentes >100 líneas

### Archivos a refactorizar

| Archivo | Líneas | Propuesta de División |
|---------|--------|----------------------|
| `PreferencesPanel.tsx` | 297 | CategoryToggles, DeliveryChannels, QuietHoursForm, ScheduleEditor |
| `ProductImageGallery.tsx` | 237 | useImageUpload hook, ImageCarousel, UploadDropzone |
| `PosView.tsx` | 202 | usePosData hook, CartSummary, ProductGrid, ProductSearch |
| `NotificationPanel.tsx` | 195 | NotificationFilters, NotificationList, NotificationActions |
| `SettingsFormFields.tsx` | 240 | GeneralSettings, NotificationSettings, AppearanceSettings |

### Comando para identificar

```bash
cd frontend/src && for f in $(find . -name "*.tsx" -type f); do lines=$(wc -l < "$f"); if [ "$lines" -gt 100 ]; then echo "$lines $f"; fi; done | sort -rn
```

---

## Fase 3: Refactorización de Hooks >150 líneas

### Hooks a dividir

| Hook | Líneas | División propuesta |
|------|--------|-------------------|
| `useNotificationPreferences.ts` | 367 | useNotificationPreferences (~120) + useQuietHours (~80) + useNotificationSchedule (~70) |
| `useSystemNotifications.ts` | 351 | useSystemNotifications (~150) + useNotificationActions (~100) |
| `useUserNotifications.ts` | 346 | useUserNotifications (~150) + useUserNotificationActions (~100) |
| `useNotificationToasts.ts` | 176 | Revisar, posible reducir a 150 |

### Comando para identificar

```bash
cd frontend/src && for f in $(find . -name "*.ts" -path "*/hooks/*" -type f); do lines=$(wc -l < "$f"); if [ "$lines" -gt 150 ]; then echo "$lines $f"; fi; done | sort -rn
```

---

## Fase 4: Errores Personalizados TypeScript (NUEVO)

### Estructura propuesta

```
frontend/src/core/errors/
├── index.ts                 # Export centralizado
├── ProductErrors.ts
├── CategoryErrors.ts
├── WarehouseErrors.ts
├── AuthErrors.ts
├── CustomerErrors.ts
└── ValidationErrors.ts
```

### Ejemplo de implementación

```typescript
// core/errors/ProductErrors.ts
export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductNameRequiredError extends Error {
  constructor() {
    super('El nombre del producto es requerido');
    this.name = 'ProductNameRequiredError';
  }
}
```

### Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `core/use-cases/product/CreateProductUseCase.ts` | Reemplazar Error con ProductErrors |
| `core/use-cases/product/UpdateProductUseCase.ts` | Reemplazar Error con ProductErrors |
| `core/use-cases/category/DeleteCategoryUseCase.ts` | Reemplazar Error con CategoryErrors |
| `core/use-cases/warehouse/ToggleWarehouseStatusUseCase.ts` | Reemplazar Error con WarehouseErrors |
| `core/use-cases/auth/LoginUseCase.ts` | Reemplazar Error con AuthErrors |

---

## Fase 5: Validación de Formularios con Zod (NUEVO)

### Instalación

```bash
cd frontend && pnpm add zod
```

### Estructura propuesta

```
frontend/src/core/validators/
├── auth-validators.ts
├── product-validators.ts
├── customer-validators.ts
├── supplier-validators.ts
└── index.ts
```

### Ejemplo de implementación

```typescript
// core/validators/auth-validators.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const emailSchema = z.string().email('Email inválido');

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  price: z.number().positive('El precio debe ser positivo'),
  categoryId: z.string().uuid('ID de categoría inválido'),
});
```

---

## Fase 6: Tests

### Backend - Tests a crear

| Tipo | Cantidad sugerida |
|------|------------------|
| Controller tests | 10-15 |
| Service tests | 15-20 |
| Integration tests | 5-10 |

### Comando para ejecutar tests

```bash
# Backend
cd backend/inventory-app && ./mvnw test

# Frontend
cd frontend && pnpm test:run
```

---

## Fase 7: Limpieza y Convenciones

### 7.1 Imports - Orden correcto

```typescript
// 1. Externos (react, libs)
import { useState, useCallback } from 'react';
import { z } from 'zod';

// 2. Core domain (entities, interfaces)
import type { Product } from '@/core/entities/product';
import type { IProductRepository } from '@/core/interfaces/IProductRepository';

// 3. Use cases
import { CreateProductUseCase } from '@/core/use-cases/product';

// 4. Infrastructure (repositories, api)
import { ProductRepository } from '@/infrastructure/repositories';

// 5. Presentation (components, hooks)
import { ProductForm } from '../components/form';
```

### 7.2 Naming Conventions

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Archivos TS | kebab-case | `product-repository.ts` |
| Archivos TSX | PascalCase | `ProductTable.tsx` |
| Hooks | camelCase + use | `useProductSearch.ts` |
| Interfaces | PascalCase + I | `IProductRepository.ts` |
| Constantes | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Clases Java | PascalCase | `ProductService.java` |
| Paquetes Java | lowercase | `com.inventory.domain.model` |

### 7.3 Tooltips obligatorios

Todo campo de formulario debe tener `title` o `tooltip`:

```tsx
<Input
  name="email"
  type="email"
  title="Ingrese su correo electrónico. Ej: usuario@dominio.com"
  placeholder="correo@ejemplo.com"
/>
```

---

## Plan de Ejecución Sugerido

### Mes 1: Fundamentos
- [ ] 1.1 Crear estructura de carpetas por dominio
- [ ] 1.2 Implementar errores personalizados TypeScript
- [ ] 1.3 Instalar y configurar Zod

### Mes 2: Refactorización
- [ ] 2.1 Dividir componentes >100 líneas
- [ ] 2.2 Dividir hooks >150 líneas
- [ ] 2.3 Corregir imports

### Mes 3: Tests y Limpieza
- [ ] 3.1 Aumentar tests backend
- [ ] 3.2 Agregar validación Zod a formularios
- [ ] 3.3 Estandarizar tooltips

---

## Comandos de Verificación

```bash
# Frontend - Encontrar componentes grandes
cd frontend/src && find . -name "*.tsx" -exec wc -l {} \; | awk '$1 > 100 {print}'

# Frontend - Encontrar hooks grandes
cd frontend/src && find . -name "*.ts" -path "*/hooks/*" -exec wc -l {} \; | awk '$1 > 150 {print}'

# Frontend - Buscar any sin justificación
cd frontend/src && rg ": any" --glob "*.ts"

# Frontend - Lint
cd frontend && pnpm lint

# Frontend - Build
cd frontend && pnpm build

# Backend - Compilar
cd backend/inventory-app && ./mvnw compile

# Backend - Tests
cd backend/inventory-app && ./mvnw test
```

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Componentes >100 líneas | 42 | 0 |
| Hooks >150 líneas | 4 | 0 |
| Errores personalizados TS | 0 | 20+ |
| Tests backend | 5 | 30+ |
| Carpetas con +15 archivos | 8 | 0 |

---

## Notas

- El backend ya tiene DomainException implementado ✅
- El frontend usa correctamente TanStack Query y Zustand ✅
- La estructura de carpetas necesita reorganización por dominio
- Los patrones de diseño están correctamente implementados (Repository, Use Cases, Ports)