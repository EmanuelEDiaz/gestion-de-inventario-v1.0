# 📋 Guía de Estructura de Archivos - Inventario Offline-First

> Versión: 1.0 | Fecha: Mayo 2026
> Basado en: código existente del proyecto + AGENTS.md + CLAUDE.md + Skills de Claude

---

## ⚠️ REGLAS OBLIGATORIAS ANTES DE CADA TAREA

### 1. Cargar Skills Obligatorios

**Antes de escribir código o revisar archivos, DEBES cargar los skills relevantes:**

| Área de Trabajo | Skills Obligatorios | Cuándo Cargar |
|-----------------|---------------------|---------------|
| Backend Java/Spring | `senior-backend`, `senior-architect` | Siempre que trabajes con código backend |
| Frontend React/Next.js | `senior-frontend`, `react-best-practices` | Siempre que trabajes con código frontend |
| UI/Componentes | `shadcn`, `ui-ux-pro-max`, `tailwind-patterns` | Al crear/modificar componentes UI |
| Errores/Debug | `error-resolver` | Al investigar o resolver errores |
| Código Limpio | `clean-code` | Al refactorizar o escribir nuevo código |
| Docker/Infra | `docker-expert` | Al trabajar con contenedores |
| Planificación | `planning` | Para tareas complejas de 3+ pasos |

**Si no existe un skill para lo que necesitas hacer:**
1. Primero busca en `.claude/skills/` disponibles
2. Si no hay, busca en `aitmpl.com/skills`, `github.com/opencode/skills`, o `skills.sh`
3. Si aún no existe, **recomienda al usuario instalar un skill** específico para esa tarea
4. Documenta la necesidad en este archivo

### 2. NO USAR COSAS DEPRECADAS

**Regla:** Está prohibido usar APIs, funciones o patrones deprecados.

**Ejemplos deprecados a evitar:**

| Tecnología | Deprecated | Alternativa Actual |
|-------------|------------|---------------------|
| Next.js | `getServerSideProps` | `async` components o Server Actions |
| Next.js | `getStaticProps` | `generateStaticParams` |
| React | `class` components | Functional components + Hooks |
| React | `componentWillMount` | `useEffect` |
| React | `componentWillReceiveProps` | `useEffect` con comparación |
| TypeScript | `any` | `unknown` o tipos específicos |
| TanStack Query | `useQuery` (v4 old) | `useQuery` v5 con nueva API |
| Zustand | `create()` (old) | `create()` con tipos inference |
| Spring | `RestTemplate` | `WebClient` (reactivo) |
| Spring | `@Autowired` en campo | Constructor injection |
| Java | `Optional.get()` | `Optional.orElseThrow()` |
| JUnit 4 | `@Test` (JUnit 4) | `@Test` (JUnit 5) |

**Antes de usar cualquier API, verificar:**
- [ ] ¿La API está deprecada en la versión actual?
- [ ] ¿Hay una alternativa recomendada?
- [ ] ¿El skill loaded cubre las mejores prácticas actuales?

---

## PARTE 1: BACKEND (Java/Spring Boot)

> ⚠️ **Skills requeridos:** `senior-backend`, `senior-architect` (cargar antes de trabajar)

### 1.1 Entidades de Dominio (`domain/model/*.java`)

**Qué debe contener:**
- Clase con campos privados `final` (inmutabilidad)
- Validación en constructor
- Getters para todos los campos
- Métodos de dominio (lógica de negocio relacionada con la entidad)
- Métodos de actualización que retornan nueva instancia (inmutabilidad)
- Enums internos cuando aplican al dominio

**Patrones obligatorios:**
- ✅ Inmutabilidad - todos los campos final, métodos update retornan nueva instancia
- ✅ Validación en constructor - nunca en setters
- ✅ Factory methods (`create()`) para construcción controlada
- ✅ Métodos de dominio encapsulan lógica del negocio

**Errores comunes a evitar:**
- ❌ Setters - usar métodos de actualización inmutables
- ❌ Validación en setter en lugar de constructor
- ❌ Exponer campos mutables
- ❌ Usar APIs deprecadas (ver sección anterior)

**Skills:** `senior-backend`, `clean-code`

---

### 1.2 Puertos de Entrada (`domain/ports/in/*.java`)

**Qué debe contener:**
- Interfaz Java simple (sin implementaciones)
- Métodos que definen operaciones de consulta/comando
- Uso de `Mono`/`Flux` (Project Reactor) para operaciones asíncronas
- Documentación javadoc

**Estructura típica:**
```java
public interface ProductQueryPort {
    Mono<Product> findById(UUID id);
    Flux<Product> findAll(int page, int size, boolean activeOnly);
    Mono<Long> count();
}
```

**Patrones:**
- ✅ Separación Command/Query (ProductCommandPort / ProductQueryPort)
- ✅ Nombres descriptivos
- ✅ Tipos reactivos (Mono/Flux) - NO usar blocking calls

**Errores:**
- ❌ Implementaciones en domain/
- ❌ Dependencias de Spring/DB/JSON en domain
- ❌ Usar `RestTemplate` (deprecated) → usar `WebClient`

**Skills:** `senior-backend`, `hexagonal`

---

### 1.3 Puertos de Salida (`domain/ports/out/*.java`)

**Qué debe contener:**
- Interfaz que define contrato de persistencia
- Métodos de acceso a datos (CRUD)
- Tipos reactivos (Mono/Flux)

**Estructura típica:**
```java
public interface ProductRepository {
    Mono<Product> findById(UUID id);
    Mono<Product> save(Product product);
    Mono<Boolean> existsBySku(String sku);
    Flux<Product> findAllActive();
}
```

**Patrones:**
- ✅ Solo operaciones de datos
- ✅ Sin lógica de negocio
- ✅ Nombres del dominio (no de DB)

**Skills:** `senior-backend`

---

### 1.4 Excepciones de Dominio (`domain/errors/*.java`)

**Qué debe contener:**
- Clase abstracta base (`DomainException`) con código de error
- Excepciones específicas que extienden la base
- Constructores con mensaje y opcionalmente causa
- NO usar `IllegalArgumentException` para errores de negocio

**Estructura:**
```java
// Base
public abstract class DomainException extends RuntimeException {
    private final String errorCode;
    protected DomainException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    public String getErrorCode() { return errorCode; }
}

// Específica
public class ProductNotFoundException extends DomainException {
    public ProductNotFoundException(UUID productId) {
        super("PRODUCT_NOT_FOUND", "Producto no encontrado: " + productId);
    }
}
```

**Patrones:**
- ✅ Herencia de DomainException
- ✅ Código de error único (string)
- ✅ RuntimeException (no checked exception)
- ✅ GlobalExceptionHandler traduce a `application/problem+json`

**Errores:**
- ❌ Lanzar Exception genérica
- ❌ Sin código de error
- ❌ Usar `IllegalArgumentException` para errores de dominio
- ❌ Usar `throw new Error()` sin nombre personalizado

**Skills:** `senior-backend`, `error-resolver`

---

### 1.5 Casos de Uso (`application/usecase/command/*.java` y `application/usecase/query/*.java`)

**Qué debe contener:**
- Anotación `@Service`
- Constructor con inyección de dependencias (puertos) - NO usar `@Autowired` en campo
- Implementación de puerto de entrada
- Lógica de orquestación (no lógica de dominio)
- Sin estado (stateless)

**Estructura:**
```java
@Service
public class ProductQueryUseCase implements ProductQueryPort {
    private final ProductRepository productRepository;
    
    // Constructor injection - OBLIGATORIO
    public ProductQueryUseCase(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    @Override
    public Mono<Product> findById(UUID id) {
        return productRepository.findById(id);
    }
}
```

**Patrones:**
- ✅ Una clase por caso de uso
- ✅ Constructor injection obligatorio
- ✅ Solo orquesta, no tiene lógica de dominio
- ✅ Implementa puerto de entrada
- ✅ Usar `Mono`/`Flux` (NO blocking)

**Errores:**
- ❌ Campos de estado (variables que mutan)
- ❌ Validación de negocio que debería estar en entity
- ❌ Depende directamente de repositorio concreto (no puerto)
- ❌ Usar `@Autowired` en campo (deprecated)
- ❌ Usar `.block()` en WebFlux

**Skills:** `senior-backend`, `clean-code`

---

### 1.6 Controladores REST (`adapters/web/controller/*.java`)

**Qué debe contener:**
- Anotaciones `@RestController`, `@RequestMapping`
- Inyección de puertos de entrada (NO repositorios)
- DTOs para request/response (usar `record`)
- Manejo de parámetros y validación con `@Valid`
- Manejo de errores via GlobalExceptionHandler
- Documentación básica

**Estructura:**
```java
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductQueryPort productQuery;
    private final ProductCommandPort productCommand;
    private final CatalogWebMapper mapper;
    
    public ProductController(ProductQueryPort productQuery, 
                            ProductCommandPort productCommand,
                            CatalogWebMapper mapper) {
        this.productQuery = productQuery;
        this.productCommand = productCommand;
        this.mapper = mapper;
    }
    
    @GetMapping
    public Mono<ProductsPageResponse> getAll(...) {
        // Usa puertos, no repositorios
    }
}
```

**Patrones:**
- ✅ Delega a use cases (puertos de entrada)
- ✅ Constructor injection
- ✅ Constantes para valores por defecto
- ✅ Mappers para transformar Domain ↔ DTO
- ✅ Responder con `application/problem+json` para errores

**Errores:**
- ❌ Usa repositorio directamente (no puerto)
- ❌ Tiene lógica de negocio
- ❌ Sin manejo de errores
- ❌ Retornar `ResponseEntity` sin tipado genérico

**Skills:** `senior-backend`

---

### 1.7 DTOs (`adapters/web/dto/*.java`)

**Qué debe contener:**
- Record Java (inmutable) - desde Java 16+
- Campos correspondientes a la respuesta/petición
- Sin lógica, solo datos

**Estructura:**
```java
public record ProductResponse(
    UUID id,
    String sku,
    String name,
    BigDecimal salePrice,
    String status,
    Instant createdAt
) {}
```

**Patrones:**
- ✅ Usar `record` (inmutable) - NO usar class con getters/setters
- ✅ Nombres claros (XxxRequest, XxxResponse)
- ✅ Solo datos, sin métodos

**Errores:**
- ❌ Usar class con setters para DTOs
- ❌ Tiene lógica de negocio

**Skills:** `senior-backend`, `clean-code`

---

### 1.8 Adaptadores de Persistencia (`adapters/persistence/*Adapter.java`)

**Qué debe contener:**
- Anotación `@Repository`
- Implementa puerto de salida (interfaz de dominio)
- Usa R2DBC repository (reactivo)
- Mapper para transformar Entity ↔ Domain

**Estructura:**
```java
@Repository
public class ProductRepositoryAdapter implements ProductRepository {
    private final ProductR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;
    
    public ProductRepositoryAdapter(ProductR2dbcRepository r2dbcRepository,
                                    CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }
    
    @Override
    public Mono<Product> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }
}
```

**Patrones:**
- ✅ Implementa puerto de dominio (no interfaz Spring Data)
- ✅ Usa mapper para conversión
- ✅ Tipos reactivos (Mono/Flux) - NO blocking
- ✅ Usar `R2dbcRepository` (no `JpaRepository`)

**Errores:**
- ❌ Depende de Entity de dominio (no de persistence)
- ❌ Usar `JpaRepository` (blocking) en lugar de `R2dbcRepository`
- ❌ Usar `.block()` en consultas

**Skills:** `senior-backend`

---

### 1.9 Mappers (`adapters/web/mapper/*.java` y `adapters/persistence/mapper/*.java`)

**Qué debe contener:**
- Métodos de transformación (estáticos o de instancia)
- Conversión entre capas (Domain ↔ DTO ↔ Entity)
- Sin lógica de negocio

**Patrones:**
- ✅ Métodos de extensión o estáticos
- ✅ Nombres claros (toDomain, toEntity, toResponse)
- ✅ Usar MapStruct o métodos manuales simples

**Errores:**
- ❌ Lógica de transformación compleja (mover a use case)

**Skills:** `senior-backend`

---

## PARTE 2: FRONTEND (TypeScript/React/Next.js)

> ⚠️ **Skills requeridos:** `senior-frontend`, `react-best-practices` (cargar antes de trabajar)

### 2.1 Entidades de Dominio (`core/entities/*.ts`)

**Qué debe contener:**
- Tipos/interfaces TypeScript puros
- Sin dependencias de React/HTTP/infraestructura
- Tipos para estado, create, update, filters

**Estructura:**
```typescript
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  salePrice: number | null;
  categoryId: string | null;
}

export interface CreateProductData {
  name: string;
  salePrice?: number;
  categoryId?: string | null;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
}
```

**Patrones:**
- ✅ Tipos puros (sin implementación)
- ✅ Exportar tipos relacionados (Create, Update, Filters)
- ✅ Nombres claros
- ✅ Usar tipos específicos, NO `any`

**Errores:**
- ❌ Depende de axios, react, etc.
- ❌ Tiene lógica de negocio
- ❌ Usar `any` sin justificación

**Skills:** `senior-frontend`, `clean-code`

---

### 2.2 Interfaces de Repositorio (`core/interfaces/I*Repository.ts`)

**Qué debe contener:**
- Interfaz que define operaciones de datos
- Tipos genéricos para paginación
- Métodos asíncronos (Promise)
- NO depender de implementaciones concretas

**Estructura:**
```typescript
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IProductRepository {
  getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>>;
  getById(id: string): Promise<Product>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

**Patrones:**
- ✅ Interfaz pública (contrato)
- ✅ Promise-based (async/await)
- ✅ Tipos del core (no implementación)

**Errores:**
- ❌ Implementa lógica de HTTP
- ❌ Depende de axios/apiClient
- ❌ Usar `any` en retornos

**Skills:** `senior-frontend`

---

### 2.3 Casos de Uso (`core/use-cases/*/*.ts`)

**Qué debe contener:**
- Clase que ejecuta lógica de negocio
- Depende de interfaz de repositorio (inyección)
- Un método `execute()` principal

**Estructura:**
```typescript
export class GetProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}
  
  async execute(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return this.productRepo.getAll(filters);
  }
}
```

**Patrones:**
- ✅ Una clase por caso de uso
- ✅ Inyección de repositorio (interfaz)
- ✅ Solo lógica de orquestación

**Errores:**
- ❌ Hace validación de negocio que debería estar en entity
- ❌ Depende de implementación concreta
- ❌ Lógica de transformación compleja

**Skills:** `senior-frontend`, `clean-code`

---

### 2.4 Repositorios/Adaptadores (`infrastructure/repositories/*.ts`)

**Qué debe contener:**
- Implementación de interfaz de core
- Comunicación con API (HTTP) via apiClient
- Transformación de datos
- Manejo de errores

**Estructura:**
```typescript
export class ProductRepository implements IProductRepository {
  private readonly basePath = '/api/v1/products';
  
  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>(this.basePath);
    return response.data;
  }
  
  async create(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post<Product>(this.basePath, data);
    return response.data;
  }
}
```

**Patrones:**
- ✅ Implementa interfaz de core
- ✅ Usa apiClient para HTTP
- ✅ Manejo de errores (lanzar errores tipados)
- ✅ Transformación mínima de datos

**Errores:**
- ❌ Expone apiClient directamente
- ❌ Sin manejo de errores
- ❌ Lógica de negocio aquí

**Skills:** `senior-frontend`, `error-resolver`

---

### 2.5 Componentes UI (`presentation/shared/components/ui/*.tsx` y `presentation/modules/*/components/*.tsx`)

**Qué debe contener:**
- Componente React funcional (NO class components)
- Props tipadas con interfaces
- Composición de UI (shadcn/ui)
- Max ~100 líneas
- Usar `forwardRef` si necesita ref

**Estructura:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
);
```

**Patrones:**
- ✅ Props tipadas
- ✅ forwardRef para ref
- ✅ Composición (no lógica de negocio)
- ✅ Max ~100 líneas
- ✅ Usar `class-variance-authority` (cva) para variants

**Errores:**
- ❌ Tiene lógica de negocio
- ❌ Hace fetching de datos
- ❌ Usar class components (deprecated)
- ❌ Usar componentWillMount (deprecated)

**Skills:** `senior-frontend`, `react-best-practices`, `shadcn`, `ui-ux-pro-max`

---

### 2.6 Hooks Personalizados (`presentation/modules/*/hooks/*.ts`)

**Qué debe contener:**
- Lógica de UI reutilizable
- TanStack Query (React Query) para server state - NO usar useState para datos del servidor
- useState solo para estado UI
- useCallback/useMemo para performance
- Max ~150 líneas

**Estructura:**
```typescript
export function useProductsController(initialFilters?: ProductFilters) {
  // Server state - USAR TANSTACK QUERY
  const query = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProductsUseCase.execute(filters),
  });
  
  // UI state
  const [selected, setSelected] = useState<string | null>(null);
  
  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);
  
  return { 
    products: query.data?.content ?? [],
    isLoading: query.isLoading,
    error: query.error,
    handleSearch,
  };
}
```

**Patrones:**
- ✅ TanStack Query para server state
- ✅ useState solo para UI state
- ✅ useCallback/useMemo
- ✅ Max ~150 líneas
- ✅ errors tipados (custom Error classes)

**Errores:**
- ❌ Usa useState para datos del servidor (deprecated pattern)
- ❌ Usa useEffect para fetching sin TanStack Query
- ❌ Hace lógica de negocio (validación)
- ❌ Lógica de más de 150 líneas

**Skills:** `senior-frontend`, `react-best-practices`

---

### 2.7 Vistas (`presentation/modules/*/views/*.tsx`)

**Qué debe contener:**
- Composición de componentes
- Uso de hooks de controller
- Renderizado de UI
- Max ~100 líneas

**Estructura:**
```typescript
export function ProductsView() {
  const { products, isLoading, handleSearch } = useProductsController();
  
  return (
    <div>
      <PageHeader title="Productos" />
      <SearchBar onSearch={handleSearch} />
      {isLoading ? (
        <Skeleton />
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
}
```

**Patrones:**
- ✅ Composición de componentes
- ✅ Llama a hooks de controller
- ✅ Sin lógica de negocio
- ✅ Max ~100 líneas

**Errores:**
- ❌ Hace fetching directo (no usar controller)
- ❌ Lógica de negocio

**Skills:** `senior-frontend`

---

### 2.8 Páginas Next.js (`app/*/page.tsx` y `app/*/layout.tsx`)

**Qué debe contener:**
- Componente de página Next.js (App Router)
- Layout wrapper (si aplica)
- Metadata para SEO
- Solo composición (NO fetching en page component)

**Estructura:**
```typescript
// app/products/page.tsx
export default function ProductsPage() {
  return (
    <DashboardLayout>
      <ProductsView />
    </DashboardLayout>
  );
}

export const metadata = {
  title: 'Productos - Inventario',
  description: 'Gestión de productos del inventario',
};
```

**Patrones:**
- ✅ Solo composición
- ✅ Metadata para SEO
- ✅ NO usar getServerSideProps (deprecated)
- ✅ NO usar getStaticProps (deprecated)
- ✅ Usar Server Components o Server Actions

**Errores:**
- ❌ Usar getServerSideProps (deprecated)
- ❌ Usar getStaticProps (deprecated)
- ❌ Hacer fetching en cliente sin Server Action

**Skills:** `senior-frontend`, `nextjs`, `react-best-practices`

---

### 2.9 API Client (`infrastructure/api/*.ts`)

**Qué debe contener:**
- Instancia de axios configurada
- Interceptors para auth (token)
- Interceptors para manejo de errores
- Headers por defecto

**Patrones:**
- ✅ Instancia centralizada
- ✅ Interceptors para token/auth
- ✅ Manejo global de errores (lanzar errores tipados)
- ✅ Timeout configurado

**Errores:**
- ❌ Sin interceptors de errores
- ❌ Sin timeout

**Skills:** `senior-frontend`

---

## Resumen: Capas对应关系

| Backend (Java) | Frontend (TS) | Patrón |
|----------------|---------------|--------|
| `domain/model/` | `core/entities/` | Entidades puras |
| `domain/ports/in/` | `core/interfaces/` | Contratos de entrada |
| `domain/ports/out/` | `infrastructure/repositories/` | Contratos de salida |
| `domain/errors/` | `core/` (errores) | Excepciones |
| `application/usecase/` | `core/use-cases/` | Casos de uso |
| `adapters/web/controller/` | `presentation/hooks/` | Controladores |
| `adapters/web/dto/` | `presentation/components/` | UI/DTOs |
| `adapters/persistence/` | `infrastructure/` | Implementaciones |

---

## Skills por Tipo de Archivo

| Tipo | Skills Primarios | Secundarios |
|------|-----------------|-------------|
| Backend Model | senior-backend | clean-code |
| Backend Ports | senior-backend, senior-architect | hexagonal |
| Backend UseCase | senior-backend | clean-code |
| Backend Controller | senior-backend | - |
| Frontend Entity | senior-frontend | clean-code |
| Frontend Interface | senior-frontend | - |
| Frontend UseCase | senior-frontend | clean-code |
| Frontend Repository | senior-frontend | error-resolver |
| Frontend Component | senior-frontend, react-best-practices | shadcn, ui-ux-pro-max |
| Frontend Hook | senior-frontend, react-best-practices | - |

---

## Lista de Verificación Antes de Cada Tarea

- [ ] **Cargar skills requeridos** para el área de trabajo
- [ ] **Verificar** que no se usen APIs deprecadas
- [ ] **Verificar** arquitectura Clean Architecture + Hexagonal
- [ ] **Verificar** inyección de dependencias (constructor)
- [ ] **Verificar** tipos específicos (NO `any`)
- [ ] **Verificar** manejo de errores tipados
- [ ] **Verificar** límites de líneas (100 componentes, 150 hooks)

---

## Fuentes

1. **AGENTS.md** - Comandos, reglas críticas
2. **CLAUDE.md** - Arquitectura detallada
3. **.github/copilot-instructions.md** - Guía técnica
4. **Skills Claude** - senior-backend, senior-frontend, react-best-practices, etc.

---

---

## PARTE 3: ROADMAP DE REVISIÓN DE ARCHIVOS

> ⚠️ **Objetivo:** Revisión general de código aplicación (NO configuraciones)
> **Exclusiones:** Archivos de configuración (.yml, .properties, .json, dockerfiles, etc.)

### Resumen de Archivos por Capa

| Capa | Cantidad Estimada | Tipo |
|------|-------------------|------|
| **BACKEND (Java)** | ~200 archivos | |
| domain/model | ~25 | Entidades |
| domain/ports/in | ~35 | Interfaces entrada (Query/Command) |
| domain/ports/out | ~30 | Repositorios (salida) |
| domain/errors | ~5 | Excepciones |
| application/usecase/command | ~25 | Casos de uso comando |
| application/usecase/query | ~25 | Casos de uso consulta |
| adapters/web/controller | ~20 | REST controllers |
| adapters/web/dto | ~30 | DTOs/Records |
| adapters/web/mapper | ~10 | Mappers web |
| adapters/persistence | ~15 | Adaptadores DB |
| **FRONTEND (TS/TSX)** | ~250 archivos | |
| core/entities | ~15 | Tipos domain |
| core/interfaces | ~10 | Interfaces repositorios |
| core/use-cases | ~30 | Casos de uso |
| infrastructure/repositories | ~25 | Implementaciones repositorio |
| infrastructure/api | ~10 | Cliente HTTP |
| infrastructure/storage | ~10 | IndexedDB/sync |
| presentation/modules/*/hooks | ~40 | Hooks controllers |
| presentation/modules/*/views | ~25 | Vistas |
| presentation/modules/*/components | ~60 | Componentes módulo |
| presentation/shared/components/ui | ~25 | Componentes UI compartidos |
| presentation/shared/hooks | ~15 | Hooks compartidos |
| app/* (pages) | ~20 | Páginas Next.js |

---

### 3.1 BACKEND - Archivos a Revisar

#### 3.1.1 Domain Model (~25 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/domain/model/`

Archivos principales a revisar:
- Product.java
- Warehouse.java
- Category.java
- StockBalance.java
- Sale.java / SaleLine.java
- Purchase.java / PurchaseLine.java
- Transfer.java / TransferLine.java
- Customer.java
- Supplier.java
- User.java / Role.java / Permission.java
- Notification*.java
- ExchangeRate.java / Currency.java
- SyncIncident.java
- Adjustment.java
- Return.java / ReturnLine.java

**Skills:** `senior-backend`, `clean-code`

**Patrones a verificar:**
- [ ] Inmutabilidad (campos final, sin setters)
- [ ] Validación en constructor
- [ ] Factory methods (`create()`)
- [ ] Métodos de dominio

#### 3.1.2 Domain Ports - Entrada (~35 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/domain/ports/in/`

Grupos por funcionalidad:
- **Products:** ProductQueryPort, ProductCommandPort, ProductFilter
- **Inventory:** StockQueryPort, MovementQueryPort, AdjustmentQueryPort/CommandPort
- **Sales:** SaleQueryPort, SaleCommandPort
- **Purchases:** PurchaseQueryPort, PurchaseCommandPort
- **Transfers:** TransferQueryPort, TransferCommandPort
- **Customers:** CustomerQueryPort, CustomerCommandPort
- **Suppliers:** SupplierQueryPort, SupplierCommandPort
- **Users:** AdminUserQueryPort, AdminUserCommandPort
- **Auth:** LoginPort, RefreshTokenPort (si aplica)
- **Settings:** CurrencyQueryPort, CurrencyCommandPort, ExchangeRateQueryPort, ExchangeRateCommandPort, AppSettingsPort
- **Notifications:** NotificationQueryPort, NotificationCommandPort

**Skills:** `senior-backend`, `senior-architect`

**Patrones a verificar:**
- [ ] Interfaces simples (sin implementación)
- [ ] Métodos con Mono/Flux (reactivo)
- [ ] Separación Command/Query

#### 3.1.3 Domain Ports - Salida (~30 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/domain/ports/out/`

- ProductRepository, WarehouseRepository, CategoryRepository
- StockRepository, MovementRepository, AdjustmentRepository
- SaleRepository, PurchaseRepository, TransferRepository
- CustomerRepository, SupplierRepository
- UserRepository, RoleRepository, PermissionRepository
- NotificationRepository, SyncIncidentRepository
- CurrencyRepository, ExchangeRateRepository
- AppSettingsRepositoryPort

**Skills:** `senior-backend`

**Patrones a verificar:**
- [ ] Solo operaciones de datos
- [ ] Tipos reactivos (Mono/Flux)
- [ ] Sin lógica de negocio

#### 3.1.4 Domain Errors (~5 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/domain/errors/`

- DomainException.java (base)
- Excepciones específicas por dominio

**Skills:** `senior-backend`, `error-resolver`

**Patrones a verificar:**
- [ ] Extiende DomainException (no Exception genérica)
- [ ] Código de error único
- [ ] RuntimeException

#### 3.1.5 Application Use Cases (~50 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/application/usecase/`

- **Command:** ProductCommandUseCase, WarehouseCommandUseCase, SaleCommandUseCase, etc.
- **Query:** ProductQueryUseCase, WarehouseQueryUseCase, DashboardQueryUseCase, etc.

**Skills:** `senior-backend`, `clean-code`

**Patrones a verificar:**
- [ ] Constructor injection (NO @Autowired en campo)
- [ ] Implementa puerto de entrada
- [ ] Stateless (sin campos de estado)
- [ ] Solo orquestación, NO lógica de dominio

#### 3.1.6 Adapters Web - Controllers (~20 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/adapters/web/controller/`

Controllers por módulo:
- ProductController, WarehouseController, CategoryController
- SaleController, PurchaseController, TransferController
- CustomerController, SupplierController
- UserController, AuthController
- DashboardController, ReportController
- NotificationController

**Skills:** `senior-backend`

**Patrones a verificar:**
- [ ] Inyecta puertos de entrada (NO repositorios)
- [ ] Constructor injection
- [ ] Usa DTOs/Records
- [ ] Manejo de errores vía GlobalExceptionHandler

#### 3.1.7 Adapters Web - DTOs (~30 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/adapters/web/dto/`

**Skills:** `senior-backend`, `clean-code`

**Patrones a verificar:**
- [ ] Usa `record` (inmutable)
- [ ] Sin lógica de negocio
- [ ] Nombres claros (XxxRequest, XxxResponse)

#### 3.1.8 Adapters Web - Mappers (~10 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/adapters/web/mapper/`

**Skills:** `senior-backend`

**Patrones a verificar:**
- [ ] Solo transformación de datos
- [ ] Métodos claros (toDomain, toResponse)

#### 3.1.9 Adapters Persistence (~15 archivos)

**Ruta:** `backend/inventory-app/src/main/java/com/inventory/adapters/persistence/`

- *RepositoryAdapter.java para cada dominio

**Skills:** `senior-backend`

**Patrones a verificar:**
- [ ] Implementa puerto de dominio
- [ ] Usa R2DBC (NO JPA blocking)
- [ ] Tipos reactivos

---

### 3.2 FRONTEND - Archivos a Revisar

#### 3.2.1 Core Entities (~15 archivos)

**Ruta:** `frontend/src/core/entities/`

- product.ts, warehouse.ts, category.ts
- sale.ts, purchase.ts, transfer.ts
- customer.ts, supplier.ts, user.ts
- notification.ts, etc.

**Skills:** `senior-frontend`, `clean-code`

**Patrones a verificar:**
- [ ] Tipos puros (sin dependencias React/HTTP)
- [ ] Tipos para create, update, filters
- [ ] NO usar `any`

#### 3.2.2 Core Interfaces (~10 archivos)

**Ruta:** `frontend/src/core/interfaces/`

- IProductRepository.ts, IWarehouseRepository.ts, etc.

**Skills:** `senior-frontend`

**Patrones a verificar:**
- [ ] Interfaz pública (contrato)
- [ ] Promise-based
- [ ] Tipos del core (no implementación)

#### 3.2.3 Core Use Cases (~30 archivos)

**Ruta:** `frontend/src/core/use-cases/`

- GetProductsUseCase.ts, CreateProductUseCase.ts, etc.
- Por dominio: product/, warehouse/, sale/, etc.

**Skills:** `senior-frontend`, `clean-code`

**Patrones a verificar:**
- [ ] Una clase por caso de uso
- [ ] Inyección de repositorio (interfaz)
- [ ] Solo orquestación

#### 3.2.4 Infrastructure Repositories (~25 archivos)

**Ruta:** `frontend/src/infrastructure/repositories/`

- ProductRepository.ts, WarehouseRepository.ts, etc.
- AuthRepository.ts, SettingsRepository.ts

**Skills:** `senior-frontend`, `error-resolver`

**Patrones a verificar:**
- [ ] Implementa interfaz de core
- [ ] Usa apiClient
- [ ] Manejo de errores tipados

#### 3.2.5 Infrastructure API (~10 archivos)

**Ruta:** `frontend/src/infrastructure/api/`

- client.ts (axios instance)
- product-api.ts, warehouse-api.ts, etc.

**Skills:** `senior-frontend`

**Patrones a verificar:**
- [ ] Instancia centralizada
- [ ] Interceptors para auth
- [ ] Timeout configurado

#### 3.2.6 Infrastructure Storage (~10 archivos)

**Ruta:** `frontend/src/infrastructure/storage/`

- IndexedDB services
- SyncService.ts

**Skills:** `senior-frontend`, `offline-first`

**Patrones a verificar:**
- [ ] Offline-first patterns
- [ ] Sincronización correcta

#### 3.2.7 Presentation - Hooks (~40 archivos)

**Ruta:** `frontend/src/presentation/modules/*/hooks/`

- useProductsController.ts, useWarehousesController.ts
- useSales.ts, useMovements.ts, etc.

**Skills:** `senior-frontend`, `react-best-practices`

**Patrones a verificar:**
- [ ] TanStack Query para server state
- [ ] useState solo para UI state
- [ ] Max ~150 líneas
- [ ] Errors tipados

#### 3.2.8 Presentation - Views (~25 archivos)

**Ruta:** `frontend/src/presentation/modules/*/views/`

- ProductsView.tsx, WarehousesView.tsx, SalesListView.tsx, etc.

**Skills:** `senior-frontend`

**Patrones a verificar:**
- [ ] Composición de componentes
- [ ] Max ~100 líneas
- [ ] Sin lógica de negocio

#### 3.2.9 Presentation - Components (~60 archivos)

**Ruta:** `frontend/src/presentation/modules/*/components/`

- Tables, forms, dialogs, cards por módulo

**Skills:** `senior-frontend`, `react-best-practices`, `shadcn`

**Patrones a verificar:**
- [ ] Componente funcional (NO class)
- [ ] Props tipadas
- [ ] Max ~100 líneas
- [ ] forwardRef si necesita ref

#### 3.2.10 Presentation Shared - UI Components (~25 archivos)

**Ruta:** `frontend/src/presentation/shared/components/ui/`

- Button.tsx, Input.tsx, Select.tsx, Table.tsx, etc.
- shadcn/ui components

**Skills:** `senior-frontend`, `shadcn`, `ui-ux-pro-max`

**Patrones a verificar:**
- [ ] Composición (no lógica)
- [ ] Props tipadas
- [ ] cva para variants

#### 3.2.11 Presentation Shared - Hooks (~15 archivos)

**Ruta:** `frontend/src/presentation/shared/hooks/`

- useAuthStore.ts (Zustand)
- useDebounce.ts, useSort.ts, etc.

**Skills:** `senior-frontend`, `react-best-practices`

**Patrones a verificar:**
- [ ] Lógica reusable
- [ ] TanStack Query para server state
- [ ] Max ~150 líneas

#### 3.2.12 App Pages (~20 archivos)

**Ruta:** `frontend/src/app/`

- page.tsx, layout.tsx por ruta
- (admin)/products/page.tsx, etc.

**Skills:** `senior-frontend`, `react-best-practices`

**Patrones a verificar:**
- [ ] Server Components o composition
- [ ] NO getServerSideProps (deprecated)
- [ ] NO getStaticProps (deprecated)
- [ ] Metadata para SEO

---

## Secuencia Sugerida de Revisión

### Fase 1: Backend Domain (Prioridad Alta)
1. domain/model - Entidades base
2. domain/errors - Excepciones
3. domain/ports - Interfaces

### Fase 2: Backend Application
4. application/usecase - Casos de uso

### Fase 3: Backend Adapters
5. adapters/persistence - Persistencia
6. adapters/web/dto - DTOs
7. adapters/web/mapper - Mappers
8. adapters/web/controller - Controllers

### Fase 4: Frontend Core
9. core/entities - Tipos
10. core/interfaces - Interfaces
11. core/use-cases - Casos de uso

### Fase 5: Frontend Infrastructure
12. infrastructure/api - HTTP client
13. infrastructure/repositories - Implementaciones
14. infrastructure/storage - Offline

### Fase 6: Frontend Presentation
15. presentation/shared/components/ui - UI base
16. presentation/shared/hooks - Hooks compartidos
17. presentation/modules/*/components - Componentes módulo
18. presentation/modules/*/hooks - Controllers
19. presentation/modules/*/views - Vistas
20. app/* - Páginas

---

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Mayo 2026 | Versión inicial con reglas de skills y deprecaciones |
| 1.1 | Mayo 2026 | Añadido roadmap de revisión (~450 archivos) |