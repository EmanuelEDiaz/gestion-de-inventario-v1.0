# AGENTS.md — Inventario Offline-First

> **LEER ANTES DE ESCRIBIR CÓDIGO**
> ⚠️ Next.js 16 tiene breaking changes — leer `node_modules/next/dist/docs/` antes de código

---

## Comandos Clave

### Frontend (`cd frontend`, usar pnpm)

```bash
pnpm dev          # Dev server localhost:3000
pnpm build        # Build producción
pnpm lint         # ESLint
pnpm lint --fix   # Auto-corregir
pnpm test:run     # Tests una vez
pnpm test:coverage

# Ejecutar un solo test
pnpm vitest run src/core/entities/product.test.ts
```

### Backend (`cd backend/inventory-app`, maven)

```bash
./mvnw spring-boot:run   # Puerto 8080
./mvnw test -Dtest=ProductControllerTest
```

### Docker Compose

```bash
docker compose up -d    # PostgreSQL + Backend + Frontend + Caddy
# URLs: http://localhost:8080 (API), https://localhost (App)
```

---

## Reglas Críticas

- **Idioma**: Español en UI, Inglés en código
- **Skills obligatorios**: Cargar `senior-frontend` o `senior-fullstack` antes de cualquier tarea
- **Mobile-first**: UI debe funcionar en móvil
- **Offline**: Sin CDNs, sin APIs externas en runtime. Assets locales en `/public`
- **Sin `any`** sin justificación

### Stack Estado
- **TanStack Query** para datos servidor
- **Zustand** para estado UI (NO Redux)

---

## Estándares de Código

### TypeScript
- Target ES2017, Strict true, Module Resolution bundler
- Path alias: `@/*` → `./src/*`

### Java/Spring (Backend)
- Java 21, Spring Boot 3.4+, WebFlux (reactivo)
- **Clean Architecture + Hexagonal**: domain NO depende de Spring/DB/JSON
- Paquetes: `domain/model`, `domain/ports`, `application/usecase`, `adapters/web`, `adapters/persistence`
- Usar `record` para DTOs inmutables

### Convenciones de Nombres
| Archivos TS | kebab-case: `product-repository.ts` |
| Archivos TSX | PascalCase: `ProductTable.tsx` |

### Orden de Imports
1. Externos → 2. Core domain → 3. Interfaces → 4. Infraestructura → 5. Presentación

---

## Arquitectura Hexagonal

```
src/
├── core/          # DOMINIO (TypeScript puro)
├── infrastructure/# ADAPTERS (API, repositories, IndexedDB)
└── presentation/  # UI (shared + modules)
```

---

## Errores (OBLIGATORIO)

Errores custom Extender `DomainException`, responder `application/problem+json`

```typescript
class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}
```

**Prohibido**: `catch (e) {}` sin tipar, `console.log` en producción

---

## Testing

- Tests junto al código con extensión `.test.ts` o `.spec.ts`
- Pattern AAA: Arrange, Act, Assert

---

## Patrones Prohibidos

- ❌ `any` sin justificación
- ❌ Console.log en producción
- ❌ `catch (e) {}` sin tipar
- ❌ Estado React directo para datos servidor
- ❌ Componentes > 100 líneas
- ❌ Hooks > 150 líneas

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3.4 + WebFlux + Java 21 |
| DB | PostgreSQL 17 + R2DBC |
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Estado | TanStack Query + Zustand |
| Offline | IndexedDB (idb) + Service Worker |

---

## Documentación

- Arquitectura: `CLAUDE.md`
- Contratos DB: `docs/contracts/database-schema.md`
- Endpoints: `docs/contracts/endpoints.md`
- Offline: `docs/design/offline-strategy.md`