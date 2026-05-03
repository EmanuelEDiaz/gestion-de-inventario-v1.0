# AGENTS.md — Guía para Agentes

> **LEER ANTES DE ESCRIBIR CÓDIGO**
> Sistema de inventario offline-first: Spring Boot WebFlux + Next.js 16 PWA

---

## 1. Comandos de Build / Lint / Test

### Frontend (`cd frontend`, usar pnpm)

```bash
pnpm dev          # Dev server localhost:3000
pnpm build        # Build producción
pnpm start        # Servidor producción
pnpm lint         # ESLint
pnpm lint --fix   # Auto-corregir

# Testing
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest una vez
pnpm test:coverage

# Ejecutar un solo test (IMPORTANTE)
pnpm vitest run src/core/entities/product.test.ts
pnpm vitest run --related src/presentation/modules/products/
```

### Backend (`cd backend/inventory-app`, maven)

```bash
./mvnw spring-boot:run
./mvnw compile
```

---

## 2. Reglas Obligatorias

- **Idioma**: Español en respuestas
- **Skills obligatorios**: Antes de cualquier tarea, cargar el skill `senior-frontend` o `senior-fullstack` según corresponda. Si la tarea es de un dominio específico (UI/UX, testing, seguridad, etc.), cargar también el skill apropiado de `.claude/skills/`.
- **Mobile-first**: UI debe funcionar en móvil
- **Pre-check**: Revisar entidades en `src/core/entities/`, interfaces en `src/core/interfaces/`
- **Componente ≤ 100 líneas**, **Hook ≤ 150 líneas**
- **TanStack Query** para datos servidor, **Zustand** para estado UI (NO Redux)

---

## 3. Estándares de Código

### TypeScript
- Target ES2017, Strict true, Module Resolution bundler
- Path alias: `@/*` → `./src/*`
- **Nunca usar `any` sin justificación**

### Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-------------|---------|
| Archivos TS | kebab-case | `product-repository.ts` |
| Archivos TSX | PascalCase | `ProductTable.tsx` |
| Interfaces/Types | PascalCase | `Product` |
| Funciones/Hooks | camelCase | `useProducts` |
| Constantes | UPPER_SNAKE | `API_BASE_URL` |

### Orden de Imports (5 grupos)
```typescript
// 1. Externos
import { useState } from 'react';

// 2. Core domain
import type { Product } from '@/core/entities/product';

// 3. Interfaces
import type { IProductRepository } from '@/core/interfaces/IProductRepository';

// 4. Infraestructura
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';

// 5. Presentación (relativo)
import { ProductTable } from '@/presentation/modules/products/components/ProductTable';
```

---

## 4. Arquitectura Hexagonal

```
src/
├── core/          # DOMINIO (TypeScript puro)
│   ├── entities/  # Modelos
│   ├── interfaces/ # Puertos
│   └── use-cases/ # Lógica de negocio
├── infrastructure/# ADAPTERS (API, repositories, IndexedDB)
└── presentation/  # UI (shared + modules)
```

---

## 5. Manejo de Errores (OBLIGATORIO)

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

**Prohibido**: `catch (e) {}` sin tipar, `console.log` en producción

---

## 6. Testing

- Tests junto al código con extensión `.test.ts` o `.spec.ts`
- Usar `@testing-library/react`
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

## 7. Patrones Prohibidos

- ❌ `any` sin justificación
- ❌ Console.log en producción
- ❌ `catch (e) {}` sin tipar
- ❌ Estado React directo para datos servidor
- ❌ Componentes > 100 líneas
- ❌ Hooks > 150 líneas

---

## 8. Stack

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3.4 + WebFlux + Java 21 |
| DB | PostgreSQL 17 + R2DBC |
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Estado | TanStack Query + Zustand |
| Offline | IndexedDB (idb) + Service Worker |

---

## 9. Documentación

- Arquitectura: `CLAUDE.md`
- Contratos DB: `docs/contracts/database-schema.md`
- Endpoints: `docs/contracts/endpoints.md`
- Offline: `docs/design/offline-strategy.md`