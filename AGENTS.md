# AGENTS.md — Inventario Offline-First

> **LEER ANTES DE ESCRIBIR CÓDIGO**
> ⚠️ Next.js 16 tiene breaking changes — leer `node_modules/next/dist/docs/` antes de código

---

## Comandos Clave

### Frontend (`cd frontend`, usar pnpm)

```bash
pnpm dev                 # Dev server localhost:3000
pnpm build               # Build producción
pnpm lint                # ESLint
pnpm lint --fix          # Auto-corregir
pnpm test:run            # Tests una vez
pnpm test:coverage       # Coverage report

# Tests unitarios específicos
pnpm vitest run src/core/entities/product.test.ts
pnpm vitest run --grep "ProductEntity"    # Tests con patrón
```

### Backend (`cd backend/inventory-app`, maven)

```bash
./mvnw spring-boot:run             # Puerto 8080
./mvnw clean package                # Build JAR

# Tests unitarios específicos
./mvnw test -Dtest=ProductControllerTest
./mvnw test -Dtest=ProductControllerTest#testGetProduct
./mvnw test -Dtest=*ServiceTest     # Patrón
```

### Docker Compose

```bash
docker compose up -d     # PostgreSQL + Backend + Frontend + Caddy
docker compose logs -f  # Ver logs (Ctrl+C para salir)
# URLs: http://localhost:8080 (API), https://localhost (App)
```

---

## Reglas Críticas

- **Idioma**: Español en UI, Inglés en código
- **Skills**: Cargar `senior-frontend` o `senior-fullstack` antes de cualquier tarea
- **Mobile-first**: UI debe funcionar en móvil
- **Offline**: Sin CDNs, sin APIs externas en runtime. Assets locales en `/public`
- **Sin `any`** sin justificación

### Stack Estado
- **TanStack Query** para datos servidor (NO React state)
- **Zustand** para estado UI (NO Redux)

---

## Estándares de Código

### TypeScript (Frontend)
- Target ES2017, `strict: true`, `moduleResolution: "bundler"`
- Path alias: `@/*` → `./src/*`
- Componentes max ~100 líneas, hooks max ~150 líneas

### Java/Spring (Backend)
- Java 21, Spring Boot 3.4+, WebFlux (reactivo - NO bloqueantes)
- **Clean Architecture + Hexagonal**: domain NO depende de Spring/DB/JSON
- Paquetes: `domain/model`, `domain/ports`, `application/usecase`, `adapters/web`, `adapters/persistence`
- Usar `record` para DTOs inmutables
- Constructor injection obligatorio

### Convenciones de Nombres
| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Archivos TS | kebab-case | `product-repository.ts` |
| Archivos TSX | PascalCase | `ProductTable.tsx` |
| Archivos Java | PascalCase | `ProductRepository.java` |
| Funciones/Variables | camelCase | `getProducts()`, `totalAmount` |
| Constantes | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Clases TS/Java | PascalCase | `ProductNotFoundError` |

### Orden de Imports (Frontend)
1. **Externos** (react, tanstack, etc.)
2. **Core domain** (entities, interfaces de dominio)
3. **Use cases** (lógica de negocio)
4. **Infraestructura** (repositorios, API clients)
5. **Presentación** (componentes, hooks)

### Errores (OBLIGATORIO)

**Frontend** - Extender Error, tipar en catch:
```typescript
class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}
// Uso:
try {
  await getProduct(id);
} catch (e) {
  if (e instanceof ProductNotFoundError) {
    // manejar error específico
  }
}
```

**Backend** - Extender `DomainException`, responder `application/problem+json`:
```java
public record ProductNotFoundError(String productId) implements DomainException {}
```

**Prohibido**:
- ❌ `catch (e) {}` sin tipar
- ❌ `console.log()` en producción (usar logger)
- ❌ `throw new Error()` sin nombre personalizado

---

## Testing

- Tests junto al código: `*.test.ts` o `*.spec.ts` (frontend), `*Test.java` (backend)
- Pattern AAA: Arrange → Act → Assert
- Frontend: Vitest + React Testing Library
- Backend: JUnit 5 + Reactor Test + Spring Boot Test

```typescript
// Ejemplo test frontend
test('calculates total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  // Act
  const result = calculateTotal(items);
  // Assert
  expect(result).toBe(30);
});
```

---

## Patrones Prohibidos

- ❌ `any` sin justificación
- ❌ Console.log en producción
- ❌ `catch (e) {}` sin tipar
- ❌ Estado React directo para datos servidor
- ❌ Componentes > 100 líneas
- ❌ Hooks > 150 líneas
- ❌ Redux (usar Zustand)
- ❌ CDNs externos (Google Fonts, Bootstrap CDN)

---

## Arquitectura Hexagonal

```
Frontend:
src/
├── core/           # DOMINIO (TypeScript puro, sin React/HTTP)
├── infrastructure/ # ADAPTERS (API, repositories, IndexedDB)
└── presentation/   # UI (componentes React)

Backend:
src/main/java/com/inventory/
├── domain/         # PURO (model, ports, services)
├── application/     # use cases, dto, mappers
└── adapters/        # web (REST), persistence (R2DBC)
```

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 3.4 + WebFlux + Java 21 |
| DB | PostgreSQL 17 + R2DBC + Flyway |
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

---

## Referencia Adicional

Ver `.github/copilot-instructions.md` para guía completa de arquitectura y tareas comunes.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
