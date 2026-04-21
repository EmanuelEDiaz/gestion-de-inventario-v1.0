# AGENTS.md — Guía de Código para Agentes

> Leer este archivo antes de escribir código en este repositorio.

## 1. Comandos de Build / Lint / Test

### Frontend (en `frontend/` - usar pnpm)

```bash
# Desarrollo
cd frontend && pnpm dev          # Dev server en localhost:3000
cd frontend && pnpm build        # Build de producción
cd frontend && pnpm start        # Servidor de producción

# Linting
cd frontend && pnpm lint         # Ejecutar ESLint
cd frontend && pnpm lint --fix   # Auto-corregir errores

# Testing
cd frontend && pnpm test         # Vitest en modo watch
cd frontend && pnpm test:run     # Vitest ejecutar una vez
cd frontend && pnpm test:coverage # Con coverage

# Ejecutar un solo test
cd frontend && pnpm vitest run src/core/entities/product.test.ts
cd frontend && pnpm vitest run --related src/presentation/modules/products/

# E2E Testing (requiere servidor corriendo)
cd frontend && npx playwright test
```

## 2. Estándares de Código

### TypeScript
- **Target**: ES2017 | **Strict**: true | **Module Resolution**: bundler
- **Path Alias**: `@/*` → `./src/*`
- Nunca usar `any` sin justificación

### Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-------------|---------|
| Archivos TS | kebab-case | `product-repository.ts` |
| Archivos TSX | PascalCase | `ProductTable.tsx` |
| Interfaces/Types | PascalCase | `Product`, `IProductRepository` |
| Funciones/Hooks | camelCase | `getProducts`, `useProducts` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |

### Orden de Imports

```typescript
// 1. Externos
import { useState } from 'react';
import axios from 'axios';

// 2. Core domain
import type { Product } from '@/core/entities/product';
import { GetProductsUseCase } from '@/core/use-cases/product';

// 3. Interfaces
import type { IProductRepository } from '@/core/interfaces/IProductRepository';

// 4. Infraestructura
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';

// 5. Presentación (relativo)
import { ProductTable } from '@/presentation/modules/products/components/ProductTable';
import { cn } from '@/presentation/shared/lib/utils';
```

### Estructura de Archivos (Clean Architecture)

```
src/
  core/              # Domain - TS puro, sin deps
    entities/        # Modelos
    interfaces/      # Puertos (contratos)
    use-cases/       # Lógica de negocio
  infrastructure/   # Adaptadores
    api/             # Clientes HTTP
    repositories/    # Implementaciones
    storage/         # IndexedDB
  presentation/      # UI
    shared/
      components/ui/ # Componentes base shadcn/ui
      hooks/         # Hooks globales
      lib/           # Utils (cn, formatCurrency)
    modules/         # Módulos por feature
      products/
        components/
        hooks/       # Controller hooks
        views/       # Composiciones de vista
```

### Patrones de Componentes

```typescript
// Correcto: props explícitas con interface
interface ProductRowProps {
  product: Product;
  onEdit: (id: string) => void;
}
export function ProductRow({ product, onEdit }: ProductRowProps) { }

// Incorrecto: tipo any
export function ProductRow(props: any) { }
```

### Manejo de Errores

```typescript
class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}

try {
  await productRepository.delete(id);
} catch (error) {
  if (error instanceof ProductNotFoundError) {
    return { success: false, error: error.message };
  }
  throw error;
}
```

### Gestión de Estado
- **Estado Servidor**: TanStack Query (`@tanstack/react-query`)
- **Estado Cliente**: Zustand (`zustand`)
- **NO usar Redux**

### CSS & Estilos
- Tailwind CSS v4 con utility classes
- Usar `cn()` para clases condicionales:

```typescript
import { cn } from '@/presentation/shared/lib/utils';

<div className={cn('rounded p-4', isActive && 'bg-blue-100')} />
```

## 3. Reglas Offline-First
- IndexedDB para persistencia offline
- Patrón outbox para cola de sync
- Operaciones idempotentes (seguro reintentar)
- Actualizaciones optimistas (UI primero, luego sync)

## 4. Seguridad
- Nunca commitear secrets/API keys
- Usar variables de entorno
- JWT: 15min access / 7 días refresh

## 5. Lista de Verificación Pre-Código

1. Leer `CLAUDE.md` primero (documentación de arquitectura)
2. Revisar `.claude/skills/` para patrones relevantes
3. Revisar entidades en `src/core/entities/`
4. Revisar interfaces en `src/core/interfaces/`

## 6. Patrones Prohibidos

- ❌ Fuentes/imágenes externas (usar locales en `/public`)
- ❌ CDNs o scripts remotos
- ❌ Tipo `any` sin justificación
- ❌ Console.log en producción
- ❌ Error handling sin tipar (`catch (e) {}`)
- ❌ Estado React directo para datos servidor (usar TanStack Query)

## 7. Next.js 16

Este proyecto usa Next.js 16 con breaking changes. Verificar APIs en `node_modules/next/dist/docs/` antes de usar.

## 8. Guías de Testing

- Archivos de test usan extensión `.test.ts` o `.spec.ts`
- Ubicar tests junto al código (mismo directorio)
- Usar `@testing-library/react` para tests de componentes
- Mockear dependencias externas (API calls, IndexedDB)
- Seguir patrón AAA: Arrange, Act, Assert
