# Good Programming Practices Skill

## Overview
This skill defines best practices and patterns for React/Next.js development in this project.

## Component Rules

### 1. One Component Per File
- Only one component implementation per file
- Helper components go in separate files
- Use folder structure for related components:
  ```
  components/
  ├── Products/
  │   ├── ProductsView.tsx      # Main component
  │   ├── ProductForm.tsx      # Form modal
  │   ├── ProductFormFields.tsx # Form fields
  │   ├── ProductTable.tsx     # Table wrapper
  │   └── ProductRow.tsx       # Table row
  ```

### 2. Component Size Limit
- **STRICT**: No component exceeding 100 lines
- If a component grows beyond 100 lines, decompose it into:
  - Smaller reusable sub-components
  - Custom hooks for logic extraction
  - Separate files for each concern

### 3. File Naming Conventions
- PascalCase for component files: `ProductsView.tsx`, `ProductRow.tsx`
- camelCase for utility files: `useProducts.ts`, `utils.ts`
- Descriptive names that match the component purpose

### 4. Component Structure
```typescript
// 1. Imports (external first, then internal)
import { useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Product } from '@/core/entities/product';

// 2. Types/Interfaces
interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Product) => void;
}

// 3. Main component (export default or named)
export function ProductForm({ product, onSubmit }: ProductFormProps) {
  // 4. Hooks
  const [state, setState] = useState('');
  
  // 5. Handlers
  const handleSubmit = () => {};
  
  // 6. Render
  return <div>...</div>;
}
```

## Hooks Best Practices

### 1. Custom Hooks for Reusable Logic
Extract logic into custom hooks when:
- Logic is used in multiple components
- Component becomes too large (>80 lines)
- State management becomes complex

### 2. Hook Naming
- Always prefix with `use`: `useProducts`, `useProductActions`
- Place in `src/presentation/hooks/`

## State Management

### 1. Local State
- Use `useState` for component-specific state
- Use `useCallback` for event handlers passed to children

### 2. Global State (Zustand)
- Use for auth, cart, UI state
- Place in `src/presentation/state/`
- Use middleware for persistence

### 3. Server State
- Use custom hooks that wrap use-cases
- Handle loading, error, and data states

## TypeScript Best Practices

### 1. Never Use `any`
Use `unknown` and narrow with type guards:
```typescript
function parse(data: unknown): string {
  if (typeof data === 'string') return data;
  throw new Error('Invalid data');
}
```

### 2. Explicit Return Types
For complex functions, explicit return types improve readability:
```typescript
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO').format(price);
}
```

### 3. Use Utility Types
```typescript
// Partial update type
type UpdateProduct = Partial<Product>;

// Discriminated unions
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

## Performance

### 1. Memoization
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to memoized components
- Use `React.memo` for pure components

### 2. Lazy Loading
- Use `next/dynamic` for heavy components
- Use `React.lazy` for code splitting

### 3. Avoid Premature Optimization
- Profile first
- Don't memoize everything
- Focus on re-renders that affect user experience

## Form Handling

### 1. Controlled Components
- Keep form state in local component state
- Use single state object for related fields

### 2. Validation
- Validate on blur for better UX
- Validate on submit for final check
- Use clear error messages

### 3. File Uploads
- Handle preview locally before upload
- Use `URL.createObjectURL()` for previews
- Clean up URLs with `URL.revokeObjectURL()`

## Best Practices Summary

| Rule | Description |
|------|-------------|
| One component per file | Each file exports one component |
| Max 100 lines | Decompose larger components |
| Custom hooks | Extract reusable logic |
| TypeScript | No `any`, explicit types |
| Memoization | Optimize carefully |
| Forms | Local state, validate properly |
| File uploads | Preview before upload |

## Common Patterns

### 1. CRUD Pattern
```typescript
// View handles state and callbacks
// Sub-components handle rendering
// Hooks handle business logic
```

### 2. Modal Pattern
```typescript
// Parent manages isOpen state
// Modal component receives isOpen, onClose
// Form handles validation
```

### 3. Table Pattern
```typescript
// Table wrapper handles layout
// Row component handles individual rows
// Pagination in parent or hook
```
