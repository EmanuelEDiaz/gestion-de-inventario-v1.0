# AGENTS.md — Inventario Offline-First

> **LEER ANTES DE ESCRIBIR CÓDIGO**
> ⚠️ Next.js 16 tiene breaking changes — leer `node_modules/next/dist/docs/` antes de código
> ⚠️ Prohibido usar `kill` para detener node/npm (ver reglas-globales-opencode)

---

## Comandos Clave

### Desarrollo Local
```bash
./start-dev.sh     # Backend(:8080) + Frontend(:3000) en terminales separadas
./stop-dev.sh      # Detener servicios
```

### Frontend (`cd frontend`, usar pnpm)
```bash
pnpm dev                 # Dev server localhost:3000
pnpm build               # Build producción
pnpm lint                # ESLint
pnpm lint --fix          # Auto-corregir
pnpm test:run            # Tests una vez (Vitest)
pnpm vitest run src/core/entities/product.test.ts  # Test específico
```

### Backend (`cd backend/inventory-app`, Maven)
```bash
./mvnw spring-boot:run             # Puerto 8080
./mvnw test -Dtest=ProductControllerTest  # Test específico
```

### Docker Compose (producción)
```bash
docker compose up -d     # PostgreSQL + Backend + Frontend + Caddy
# URLs: http://localhost:8080 (API), https://localhost (App)
```

---

## Reglas Críticas

- **Hasta 3 sub-agentes en paralelo**: Para toda tarea, usar como máximo 3 sub-agentes del tipo `general` o `explore` simultáneamente para maximizar paralelismo. No lanzar más de 3 agentes concurrentes en un mismo mensaje.
- **Graphify como mapa**: `graphify query "<pregunta>"` antes de grep. Ver `graphify-out/GRAPH_REPORT.md`.
- **Offline**: Sin CDNs, sin APIs externas en runtime. Assets locales en `/public`.
- **Idioma**: Español en UI, Inglés en código.
- **Skills obligatorios**: `senior-frontend` o `senior-fullstack` antes de código.
- **Skills con Symlinks**: Al agregar una skill nueva, crear symlink en `.opencode/skills/` apuntando a `.claude/skills/<skill-name>`. Esto asegura que OpenCode detecte todas las skills disponibles (evita bugs de auto-descubrimiento).
- **Mobile-first**: UI debe funcionar en móvil (Touch-first).
- **Sin `any`** sin justificación.
- **Errores**: Extender `Error` y tipar en catch (frontend), `DomainException` (backend).

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

---

## graphify — Knowledge Graph

> **ANTES de buscar archivos, usar el grafo.** El graphify-out/ es el mapa principal.

### Archivos del grafo
```
graphify-out/
├── graph.json          # ~5,600 nodes, ~8,200 edges, 588 comunidades
├── GRAPH_REPORT.md     # God nodes, comunidades, conexiones sorprendentes
├── graph.html          # Visualización interactiva (comunidades agregadas)
├── wiki/index.md       # Wiki navegable (generar con: graphify export wiki)
└── cache/              # AST cache (no re-procesa sin cambios)
```

### Flujo obligatorio (cada pregunta)
```
1. graphify query "pregunta" --budget 2000     # BFS: contexto amplio
2. graphify path "NODO_A" "NODO_B"             # Si busca camino entre A y B
3. graphify explain "NodeName"                 # Si pide detalle de un componente
4. Solo si el grafo no tiene la respuesta → leer archivos con grep/glob
5. Después de modificar código → graphify update .
```

### God nodes (core abstractions)
- Button, cn(), ProductEntity, InventoryMovementEntity, NotificationPreferencesEntity

### Actualización post-cambio
```bash
graphify update .              # Rápido: solo AST, $0 (recomendado)
graphify update . --force      # Completo: re-extracción LLM
graphify export html           # Regenerar visualización
```

### Solución de problemas
```bash
# Grafo vacío → rebuild completo
rm -rf graphify-out/ && graphify extract . --backend claude
```
