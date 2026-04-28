# AGENTS.md — Guía de Código para Agentes

> **LEER ESTE ARCHIVO ANTES DE ESCRIBIR CÓDIGO EN ESTE REPOSITORIO**
> 
> Este proyecto es un sistema de gestión de inventario **offline-first** con Spring Boot WebFlux + Next.js 16 PWA.
> 
> ** Skills se cargan automáticamente al inicio de cada conversación (auto-load: true)**

---

## 1. Comandos de Build / Lint / Test

### Frontend (usar pnpm en `frontend/`)

```bash
# Desarrollo
cd frontend && pnpm dev          # Dev server en localhost:3000
cd frontend && pnpm build        # Build de producción
cd frontend && pnpm start        # Servidor de producción

# Linting
cd frontend && pnpm lint         # Ejecutar ESLint
cd frontend && pnpm lint --fix   # Auto-corregir errores

# Testing unitario
cd frontend && pnpm test         # Vitest en modo watch
cd frontend && pnpm test:run     # Vitest ejecutar una vez
cd frontend && pnpm test:coverage # Con coverage

# Ejecutar un solo test
cd frontend && pnpm vitest run src/core/entities/product.test.ts
cd frontend && pnpm vitest run --related src/presentation/modules/products/

# E2E Testing (requiere servidor corriendo)
cd frontend && npx playwright test
```

### Backend (usar maven en `backend/inventory-app`)

```bash
cd backend/inventory-app && ./mvnw spring-boot:run
cd backend/inventory-app && ./mvnw compile
```

---

## 2. Reglas Obligatorias del Proyecto

### Idioma y Comportamiento
- **Idioma**: Español en respuestas, nunca inglés salvo que el usuario lo pida
- **Mobile-first**: Toda UI debe funcionar en móvil
- **Análisis previo**: Revisar existentes (backend/frontend) antes de crear
- **Pedir confirmación**: Nunca ejecutar sin OK del usuario

### Pre-Flight Checklist
Antes de escribir código:
1. ✅ Cargar skills relevantes (`senior-frontend`, `hexagonal`, `react-best-practices`)
2. ✅ Revisar entidades en `src/core/entities/`
3. ✅ Revisar interfaces en `src/core/interfaces/`
4. ✅ Componente ≤ 100 líneas?
5. ✅ Usar TanStack Query para datos servidor?

---

## 3. Estándares de Código

### TypeScript
- **Target**: ES2017 | **Strict**: true | **Module Resolution**: bundler
- **Path Alias**: `@/*` → `./src/*`
- **Nunca usar `any` sin justificación**

### Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-------------|---------|
| Archivos TS | kebab-case | `product-repository.ts` |
| Archivos TSX | PascalCase | `ProductTable.tsx` |
| Interfaces/Types | PascalCase | `Product`, `IProductRepository` |
| Funciones/Hooks | camelCase | `getProducts`, `useProducts` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |

### Orden de Imports (5 grupos)

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

### Límites de Tamaño (OBLIGATORIO)
- **Max 100 líneas por archivo de componente**
- **Un componente por archivo**
- **Hooks max 150 líneas**
- Exceder → dividir en sub-componentes

---

## 4. Arquitectura Hexagonal

```
src/
├── core/                    # DOMINIO - TypeScript puro, sin deps
│   ├── entities/            # Modelos (Product, Category, User...)
│   ├── interfaces/          # Puertos (contratos IProductRepository)
│   └── use-cases/           # Lógica de negocio (GetProductsUseCase...)
├── infrastructure/          # ADAPTERS
│   ├── api/                 # Clientes HTTP (Axios)
│   ├── repositories/        # Implementaciones de puertos
│   └── storage/             # IndexedDB, localStorage
└── presentation/            # UI
    ├── shared/
    │   ├── components/ui/   # shadcn/ui base
    │   ├── hooks/           # Hooks globales (useAuth, useCart)
    │   └── lib/             # Utils (cn, formatCurrency)
    └── modules/             # Módulos por dominio
        └── products/
            ├── components/  # Componentes del módulo
            │   ├── form/     # Formularios
            │   ├── table/    # Tablas
            │   └── filters/  # Filtros
            ├── hooks/       # Controllers (useProductController)
            └── views/       # Vistas (ProductsView)
```

---

## 5. Gestión de Estado

| Tipo | Herramienta | Cuándo usarla |
|------|-------------|---------------|
| **Servidor** | TanStack Query | Datos que vienen del API |
| **Cliente** | Zustand | Estado global UI (theme, sidebar) |
| **NO USAR** | Redux | Prohibido en este proyecto |

---

## 6. CSS & Estilos

- **Tailwind CSS v4** con utility classes
- Usar `cn()` para clases condicionales:

```typescript
import { cn } from '@/presentation/shared/lib/utils';

<div className={cn('rounded p-4', isActive && 'bg-blue-100')} />
```

---

## 7. Offline-First

- **IndexedDB** para persistencia local (paquete `idb`)
- **Patrón outbox** para cola de sync
- **Operaciones idempotentes** (seguro reintentar)
- **Actualizaciones optimistas** (UI primero, luego sync)
- Auto-sync cada 30 segundos

---

## 8. Seguridad

- **JWT**: 15min access / 7 días refresh (HS256)
- **RBAC**: ADMIN, MANAGER, SELLER
- **bcrypt**: cost 12
- **Nunca commitear secrets/API keys**
- Usar variables de entorno (.env)

---

## 9. Manejo de Errores

```typescript
// Clases de error custom
class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}

// Uso con tipado correcto
try {
  await productRepository.delete(id);
} catch (error) {
  if (error instanceof ProductNotFoundError) {
    return { success: false, error: error.message };
  }
  throw error;  // Re-lanzar errores desconocidos
}
```

---

## 10. Testing

- Archivos de test usan extensión `.test.ts` o `.spec.ts`
- Ubicar tests junto al código (mismo directorio)
- Usar `@testing-library/react` para tests de componentes
- Mockear dependencias externas (API calls, IndexedDB)
- **Pattern AAA**: Arrange, Act, Assert

```typescript
describe('ProductRepository', () => {
  it('should get all products', async () => {
    // Arrange
    const mockProducts = [{ id: '1', name: 'Test' }];
    
    // Act
    const result = await repository.getAll();
    
    // Assert
    expect(result).toEqual(mockProducts);
  });
});
```

---

## 11. Formularios y Validación

- **Validación en Frontend**: Regex para emails, números, campos requeridos
- **Tooltips obligatorios**: Todo campo, input, botón requiere `title` explicativo en español
- **Mensajes de error claros**: Cerca del campo problemático

---

## 12. Reutilización de Componentes

- Si se usa **> 2 veces** → componente global en `src/presentation/shared/components/ui/`
- **Verificar existente** antes de crear nuevo

---

## 13. Patrones Prohibidos

- ❌ Fuentes/imágenes externas (usar locales en `/public`)
- ❌ CDNs o scripts remotos en runtime
- ❌ Tipo `any` sin justificación
- ❌ Console.log en producción
- ❌ Error handling sin tipar (`catch (e) {}`)
- ❌ Estado React directo para datos servidor (usar TanStack Query)
- ❌ Componentes > 100 líneas
- ❌ Hooks > 150 líneas

---

## 14. Next.js 16

> **WARNING**: Este proyecto usa **Next.js 16** con breaking changes.
> 
> Las APIs, convenciones y estructura de archivos pueden diferir de versiones anteriores.
> 
> Antes de escribir código, verificar APIs en `node_modules/next/dist/docs/`.

---

## 15. Documentación de Referencia

| Documento | Ubicación |
|-----------|-----------|
| Arquitectura | `CLAUDE.md` |
| Contratos DB | `docs/contracts/database-schema.md` |
| Endpoints API | `docs/contracts/endpoints.md` |
| DTOs | `docs/contracts/dtos.md` |
| Offline Strategy | `docs/design/offline-strategy.md` |
| Glosario | `docs/design/glossary.md` |

---

## 16. Skills Recomendados (Auto-Load)

> **IMPORTANTE**: Estos skills se cargan automáticamente al inicio de cada conversación.
> 
> Antes de escribir código, siempre cargar los skills relevantes para la tarea.

| Skill | Cuándo usarlo | Auto-load |
|-------|---------------|-----------|
| `agents-rules` | Siempre (reglas obligatorias) | ✅ Sí |
| `senior-frontend` | Desarrollo frontend general | ✅ Sí |
| `react-best-practices` | Performance React/Next.js | ✅ Sí |
| `hexagonal` | Arquitectura frontend | - |
| `senior-backend` | Desarrollo backend Spring | - |
| `shadcn` | Componentes UI | - |
| `tailwind-patterns` | Estilos Tailwind | - |
| `webapp-testing` | Tests E2E con Playwright | - |
| `senior-security` | Seguridad JWT/RBAC | - |
| `planning` | Tareas complejas > 5 pasos | - |
| `brainstorming` | Conflictos de diseño | - |
| `error-resolver` | Errores y debugging | - |

---

## 17. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.4 + WebFlux + Java 21 |
| DB | PostgreSQL 17 + R2DBC |
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Estado | TanStack Query + Zustand |
| Offline | IndexedDB (idb) + Service Worker |
| Auth | JWT HS256 + bcrypt cost 12 |

---

*Última actualización: Abril 2026*