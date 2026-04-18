# AGENTS.md — Agentic Coding Guidelines

> Read this file before writing code in this repository.

## 1. Build / Lint / Test Commands

### Frontend (in `frontend/` - use pnpm)

```bash
# Development
cd frontend && pnpm dev          # Dev server at localhost:3000
cd frontend && pnpm build        # Production build
cd frontend && pnpm start        # Production server

# Linting
cd frontend && pnpm lint        # Run ESLint
cd frontend && pnpm lint --fix   # Auto-fix lint errors

# Testing
cd frontend && pnpm test        # Run Vitest in watch mode
cd frontend && pnpm test:run    # Run Vitest once
cd frontend && pnpm test:coverage # Run with coverage

# E2E Testing (requires dev server running)
cd frontend && npx playwright test  # Run Playwright tests
```

## 2. Code Style Guidelines

### TypeScript
- **Target**: ES2017 | **Strict**: true | **Module Resolution**: bundler
- **Path Alias**: `@/*` → `./src/*`

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| TS files | kebab-case | `product-repository.ts` |
| TSX files | PascalCase | `ProductTable.tsx` |
| Interfaces/Types | PascalCase | `Product`, `IProductRepository` |
| Functions/Hooks | camelCase | `getProducts`, `useProducts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

### Imports Order

```typescript
// 1. External
import { useState } from 'react';
import axios from 'axios';

// 2. Core domain
import type { Product } from '@/core/entities/product';
import { GetProductsUseCase } from '@/core/use-cases/product';

// 3. Interfaces
import type { IProductRepository } from '@/core/interfaces/IProductRepository';

// 4. Infrastructure
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';

// 5. Presentation (relative)
import { ProductTable } from '@/presentation/modules/products/components/ProductTable';
import { cn } from '@/presentation/shared/lib/utils';
```

### File Structure (Clean Architecture)

```
src/
  core/           # Domain - pure TS, no deps
    entities/     # Models
    interfaces/   # Ports (contracts)
    use-cases/    # Business logic
  infrastructure/ # Adapters
    api/          # HTTP clients
    repositories/ # Implementations
    storage/      # IndexedDB
  presentation/   # UI
    shared/
      components/ui/  # shadcn/ui base
      hooks/         # Global hooks
      lib/           # Utils (cn, formatCurrency)
    modules/       # Feature modules
      products/
        components/
        hooks/     # Controller hooks
        views/     # Page compositions
```

### Component Patterns

```typescript
// Good: Explicit props
interface ProductRowProps {
  product: Product;
  onEdit: (id: string) => void;
}
export function ProductRow({ product, onEdit }: ProductRowProps) { ... }

// Bad: any type
export function ProductRow(props: any) { ... }
```

### Error Handling

```typescript
class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product ${productId} not found`);
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

### State Management
- **Server State**: TanStack Query (`@tanstack/react-query`)
- **Client State**: Zustand (`zustand`)
- **No Redux**

### CSS & Styling
- Tailwind CSS v4 with utility classes
- Use `cn()` utility for conditional classes:

```typescript
import { cn } from '@/presentation/shared/lib/utils';

<div className={cn('rounded p-4', isActive && 'bg-blue-100')} />
```

### Offline-First Rules
- IndexedDB for offline persistence
- Outbox pattern for sync queue
- Idempotent operations (safe to retry)
- Optimistic updates (update UI first, then sync)

### Security
- Never commit secrets/API keys
- Use environment variables
- JWT: 15min access / 7 days refresh

## 3. Pre-Flight Checklist

Before writing code:
1. Read `CLAUDE.md` first
2. Check `.claude/skills/` for relevant patterns
3. Review domain entities in `src/core/entities/`
4. Review interfaces in `src/core/interfaces/`

## 4. Prohibited Patterns

- ❌ External fonts/images (use local in `/public`)
- ❌ Remote CDNs or scripts
- ❌ `any` type without justification
- ❌ Console.log in production
- ❌ Untyped error handling (`catch (e) {}`)
- ❌ Direct React state for server data (use TanStack Query)

## 5. Next.js 16

This project uses Next.js 16 with breaking changes. Verify APIs in `node_modules/next/dist/docs/` before use.

## 6. Documentation

- No unnecessary comments - code should be self-documenting
- Use JSDoc only for public APIs and complex interfaces
- Document **why**, not **what**
