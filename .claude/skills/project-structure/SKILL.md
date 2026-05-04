# Project Structure Skill

## Overview
This skill defines the mandatory folder structure for the project following Clean Architecture + Hexagonal Architecture + SOLID principles.

## Mandatory Structure

```
src/
├── core/                           # DOMAIN (Business Logic)
│   ├── entities/                   # Pure TypeScript interfaces
│   ├── interfaces/                 # Ports (contracts)
│   └── use-cases/                  # Business use cases (1 action = 1 file)
│
├── infrastructure/                 # ADAPTERS (implementations)
│   ├── api/                        # HTTP client (Axios)
│   ├── repositories/              # Repository implementations
│   └── storage/                   # LocalStorage, cookies
│
└── presentation/                   # UI LAYER
    ├── shared/                     # GLOBAL SHARED
    │   ├── components/
    │   │   └── ui/                # shadcn/ui components
    │   ├── hooks/                  # Global hooks (useAuth, useCart)
    │   └── lib/                   # Utils, constants
    │
    └── modules/                    # FEATURE MODULES
        └── [module-name]/
            ├── components/         # Module-specific components
            │   ├── form/           # Form components (MUST)
            │   ├── table/         # Table components (MUST)
            │   ├── filters/       # Filter components (MUST)
            │   └── common/        # Common module components
            ├── hooks/              # Controllers (MUST use *Controller.ts)
            └── views/             # View compositions
```

## Component Organization Rules (MANDATORY)

### Rule 1: Subfolder by Type
When a component category has more than 3 files, create a subfolder:
- `components/form/` - Forms and fields
- `components/table/` - Tables, rows, pagination
- `components/filters/` - Filters, search
- `components/image-selector/` - Complex image components

### Rule 2: One Component Per File
NEVER put multiple components in one file.

### Rule 3: Parent-Child Co-location
If ProductForm uses ProductFormFields, both go in `components/form/`:
```
form/
├── ProductForm.tsx
└── ProductFormFields.tsx   # NOT in a separate folder
```

### Rule 4: No Component Exceeds 100 Lines
If a component grows beyond 100 lines, decompose into smaller sub-components.

## Hook Organization Rules (MANDATORY)

### Rule 1: GLOBAL Hooks (presentation/hooks/)
Hooks que son REUTILIZABLES entre múltiples módulos van en `presentation/hooks/`:
- `useAuth.ts` - Autenticación global
- `useCart.ts` - Carrito de compras
- `useIsMounted.ts` - Para evitar hydration errors
- `useProducts.ts` - Para obtener productos (reusable)
- `useCategories.ts` - Para obtener categorías
- `useOrders.ts` - Para obtener órdenes
- `useImages.ts` - Para obtener imágenes

### Rule 2: MODULE Hooks (modules/[module]/hooks/)
Hooks específicos de UN SOLO módulo van en `modules/[module]/hooks/`:
- useProductViewController.ts
- useProductFormController.ts
- useProductImageSelectorController.ts

### Rule 3: Controller Naming Convention
Los hooks que actúan como controladores (orquestación de UI) deben seguir:
- `use[Entity][Action]Controller.ts`

### Decision Tree: ¿Dónde va mi hook?
```
¿El hook se usa en múltiples módulos diferentes?
  → SÍ → presentation/hooks/ (GLOBAL)
  → NO → ¿Es principalmente orquestación de UI para un módulo específico?
    → SÍ → modules/[modulo]/hooks/useXxxController.ts
    → NO → presentation/hooks/ (si es utilería)
```

## View Organization Rules (MANDATORY)

### Rule 1: Views are Composers
Views should only compose components, never contain logic:
```typescript
// GOOD - View only composes
export function ProductsView() {
  const { data, handlers } = useProductViewController();
  return <ProductFilters ... /><ProductTable ... /><ProductForm ... />;
}

// BAD - View contains logic
export function ProductsView() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  // ... 200 lines of logic
}
```

### Rule 2: One View Per Module
Each module should have one main view file in `views/`.

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `ProductForm.tsx` |
| Hook | camelCase + use prefix | `useProductFormController.ts` |
| Use Case | PascalCase + UseCase suffix | `GetProductsUseCase.ts` |
| Repository | PascalCase + Repository suffix | `ProductRepository.ts` |
| Interface | PascalCase + I prefix | `IProductRepository.ts` |

## Import Order (MANDATORY)

Always order imports in this sequence:
1. External libraries (react, next, lucide-react)
2. Core domain (entities, interfaces, use-cases)
3. Infrastructure (repositories, api)
4. Presentation shared (ui components, global hooks)
5. Presentation module (local components, hooks)
6. Relative paths

```typescript
// 1. External
import { useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';

// 2. Core Domain
import { Product, CreateProductRequest } from '@/core/entities/product';
import { GetProductsUseCase } from '@/core/use-cases/product';

// 3. Infrastructure
import { ProductRepository } from '@/infrastructure/repositories';

// 4. Presentation Shared
import { Button } from '@/presentation/components/ui/button';
import { useAuth } from '@/presentation/hooks/useAuth';

// 5. Presentation Module
import { ProductForm } from '../components/form/ProductForm';
import { useProductFormController } from '../hooks/useProductFormController';
```

## Absolute Paths Configuration
Always use `@/` alias for imports:
- `@/core/` - Domain layer
- `@/infrastructure/` - Infrastructure layer
- `@/presentation/` - Presentation layer
- `@/presentation/components/ui/` - shadcn/ui

## Examples

### Creating a New Module
```
# Create structure for "categories" module
mkdir -p src/presentation/modules/categories/{components/{form,table,filters,common},hooks,views}
```

### Creating a New Form
```
# Add to existing module's form folder
# components/form/CategoryForm.tsx
# components/form/CategoryFormFields.tsx
# components/form/BasicInfoFields.tsx (reusable)
```

### Creating a New Controller
```
# modules/products/hooks/useProductDeleteController.ts
export function useProductDeleteController() {
  // Orchestrates delete logic
}
```
