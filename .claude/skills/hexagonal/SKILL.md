# Hexagonal Architecture Skill

## Overview
Best practices for implementing Hexagonal Architecture (Ports & Adapters) in TypeScript/Next.js projects.

## Directory Structure (COMPLETE)

```
src/
├── core/                           # DOMAIN LAYER - Business Rules (Pure TypeScript)
│   ├── entities/                   # Pure data models (interfaces/types)
│   │   ├── product.ts
│   │   ├── category.ts
│   │   ├── user.ts
│   │   └── ...
│   ├── interfaces/                 # PORTS (contracts - no implementations)
│   │   ├── IProductRepository.ts
│   │   ├── ICategoryRepository.ts
│   │   └── ...
│   └── use-cases/                  # BUSINESS LOGIC (single responsibility)
│       ├── product/
│       │   ├── GetProductsUseCase.ts
│       │   ├── CreateProductUseCase.ts
│       │   └── ...
│       └── ...
│
├── infrastructure/                 # ADAPTERS LAYER (implementations)
│   ├── api/                        # HTTP clients (Axios with interceptors)
│   ├── repositories/               # PORT IMPLEMENTATIONS
│   │   ├── ProductRepository.ts   # implements IProductRepository
│   │   └── ...
│   ├── storage/                    # LocalStorage, Cookies
│   └── mappers/                   # DTO → Entity transformers
│
└── presentation/                  # UI LAYER
    ├── shared/                     # GLOBAL SHARED RESOURCES
    │   ├── components/
    │   │   └── ui/               # shadcn/ui base components
    │   ├── hooks/                 # Global hooks (useAuth, useCart, etc.)
    │   └── lib/                   # Utils, constants
    │
    └── modules/                    # FEATURE MODULES (by domain)
        └── [module]/
            ├── components/         # MODULE-SPECIFIC COMPONENTS
            │   ├── form/           # Forms and form fields
            │   ├── table/         # Tables and rows
            │   ├── filters/       # Filter components
            │   └── common/        # Shared module components
            ├── hooks/              # ENTRY ADAPTERS (Controllers)
            │   └── use[Entity][Action]Controller.ts
            └── views/             # View compositions (used by pages)
```

## Core Principles

### 1. Dependency Inversion
Use Cases depend on Interfaces (Ports), NOT Implementations:

```typescript
// core/interfaces/IProductRepository.ts (PORT)
export interface IProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product>;
  create(data: CreateProductDTO): Promise<Product>;
}

// core/use-cases/product/GetProductsUseCase.ts (DOMAIN)
export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}
  
  async execute(): Promise<Product[]> {
    return this.productRepo.getAll(); // Doesn't know about implementation
  }
}

// infrastructure/repositories/ProductRepository.ts (ADAPTER)
export class ProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get('/products');
    return response.data;
  }
}
```

### 2. Single Responsibility (SRP)
Each use case handles ONE action:
- `GetProductsUseCase` - only gets products
- `CreateProductUseCase` - only creates products
- `UpdateProductUseCase` - only updates products

### 3. Entry Adapters (Controllers) Pattern
Hooks in presentation layer act as CONTROLLERS - they orchestrate but don't contain business logic:

```typescript
// presentation/modules/products/hooks/useProductCreateController.ts
export function useProductCreateController() {
  // State management (NOT business logic)
  const [isLoading, setIsLoading] = useState(false);
  
  // Orchestration (calls use cases, handles UI state)
  const handleSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      const useCase = new CreateProductUseCase(new ProductRepository());
      await useCase.execute(data);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };
  
  return { handleSubmit, isLoading };
}
```

### 4. Entity Design
Entities should be pure TypeScript interfaces:

```typescript
// core/entities/product.ts
export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  imageIds: string[];
  categoryId: string;
  sizes: Size[];
  gender: Gender;
  type: ProductType;
  inStock: number;
  active: boolean;
  slug: string;
}
```

## Module Structure Rules

### Component Organization (MANDATORY)
Components must be organized by TYPE in subfolders:

```
modules/products/components/
├── form/                    # Form-related components
│   ├── ProductForm.tsx
│   ├── ProductFormFields.tsx
│   ├── BasicInfoFields.tsx
│   ├── PriceStockFields.tsx
│   └── image-selector/
│       ├── ProductImageSelector.tsx
│       └── ImageCarousel.tsx
├── table/                  # Table-related components
│   ├── ProductTable.tsx
│   └── ProductRow.tsx
├── filters/               # Filter components
│   └── ProductFilters.tsx
└── common/                # Module-specific common components
```

### Hook Naming Convention (MANDATORY)
- `use[Entity][Action]Controller.ts` for controllers
- Examples:
  - `useProductViewController.ts` - products list view logic
  - `useProductFormController.ts` - product form logic
  - `useProductImageSelectorController.ts` - image selector logic

### View Structure
Views should be thin - they only compose components:

```typescript
// presentation/modules/products/views/ProductsView.tsx
export function ProductsView() {
  const { products, handleEdit, handleDelete, ... } = useProductViewController();
  
  return (
    <>
      <ProductFilters ... />
      <ProductTable ... />
      <ProductForm ... />
    </>
  );
}
```

## Benefits
- **Testable**: Mock any repository
- **Flexible**: Swap implementations easily
- **Clear separation**: Domain, Infrastructure, Presentation
- **Maintainable**: Each piece has single responsibility
- **Reusable**: Modules can be used across the app
