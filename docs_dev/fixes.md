# Fixes — Errores Preexistentes Reparados

> Este archivo documenta errores encontrados durante la ejecución del Plan O (refactor.md) que estaban fuera del plan, su causa raíz y cómo se resolvieron.

---

## Fix-001: ProductControllerTest devolvía 500 en todos los endpoints

**Fase origen**: O.1 — detectado durante verificación de tests preexistentes

### Síntoma
8 tests de `ProductControllerTest` fallaban con `500 INTERNAL_SERVER_ERROR` en lugar de los códigos esperados:
- `getAll_emptyList` → esperaba 200, obtenía 500
- `getById_found` → esperaba 200, obtenía 500
- `getById_notFound` → esperaba 404, obtenía 500
- `create_success` → esperaba 201, obtenía 500
- `update_success` → esperaba 200, obtenía 500
- `delete_success` → esperaba 204, obtenía 500
- `archive_success` → esperaba 200, obtenía 500
- `activate_success` → esperaba 200, obtenía 500

### Causa Raíz (2 problemas encadenados)

**Problema 1 (primary)**: `mockUser()` en `ProductControllerTest` no especificaba roles/authorities. Spring Security crea un `UserDetails` vacío sin `GrantedAuthority` alguno. Los endpoints del `ProductController` usan `@PreAuthorize` que requiere roles como `ADMIN`, `MANAGER`, o `SELLER`. Sin roles, toda request es rechazada con `AuthorizationDeniedException`.

**Problema 2 (secondary)**: `GlobalExceptionHandler` no tenía handler para `AuthorizationDeniedException`. La excepción caía al `@ExceptionHandler(Exception.class)` genérico (línea 275) que retorna `500 INTERNAL_SERVER_ERROR`. Debería retornar `403 FORBIDDEN`.

### Reparación

**Fix 1** — `ProductControllerTest.java`:
```diff
- .mutateWith(mockUser())
+ .mutateWith(mockUser().roles("ADMIN"))
```
`mockUser().roles("ADMIN")` concede `ROLE_ADMIN`, que satisface `hasRole('ADMIN')`, `hasAnyRole('ADMIN', 'MANAGER', 'SELLER')`, y `hasAnyRole('ADMIN', 'MANAGER')`.

**Fix 2** — `GlobalExceptionHandler.java`:
Nuevo handler para `AuthorizationDeniedException`:
```java
@ExceptionHandler(AuthorizationDeniedException.class)
public Mono<ResponseEntity<ProblemDetail>> handleAccessDenied(
        AuthorizationDeniedException ex, ServerWebExchange exchange) {
    // retorna 403 FORBIDDEN con application/problem+json
}
```

### Archivos modificados
- `backend/inventory-app/src/test/java/.../ProductControllerTest.java` — 8 cambios de `mockUser()` a `mockUser().roles("ADMIN")`
- `backend/inventory-app/src/main/java/.../GlobalExceptionHandler.java` — nuevo handler para `AuthorizationDeniedException`

### Verificación
```bash
cd backend/inventory-app && mvn test
# Resultado: Tests run: 102, Failures: 0, Errors: 0, Skipped: 2
# ProductControllerTest: 9/9 tests pasan
```

### Commit
`8f093bf` — `fix(backend): repair ProductControllerTest 500 errors + add AuthorizationDeniedException handler`

---

## Fix-002: CustomerDebtRepository.ts usaba `as any` en `db.put`

**Fase origen**: Pre-existing (detectado durante J.6 Fase A — verificación lint)

### Síntoma
2 errores ESLint `@typescript-eslint/no-explicit-any` en `CustomerDebtRepository.ts` líneas 47 y 61:
```typescript
await db.put('customerDebts', { ...response.data, cachedAt: Date.now() } as any);
```

### Causa Raíz
El desarrollador usó `as any` para silenciar TypeScript. El tipo `CachedCustomerDebt` es compatible estructuralmente con `CustomerDebt + cachedAt`.

### Reparación
Eliminar `as any` — el spread es asignable a `CachedCustomerDebt` sin coerción.

### Archivos modificados
- `frontend/src/infrastructure/repositories/customer/CustomerDebtRepository.ts` — 2 cambios

### Verificación
```bash
cd frontend && pnpm run lint
# Resultado: 0 errors (antes: 2)
```

---

## Fix-003: Lint warning — unused `axios` import en client.test.ts

**Fase origen**: J.8.3 — detectado durante verificación lint

### Síntoma
```bash
frontend/src/infrastructure/api/client.test.ts:2:8
  warning  'axios' is defined but never used  @typescript-eslint/no-unused-vars
```

### Causa Raíz
El test importaba `axios` para `vi.mock('axios', ...)` pero en Vitest el mock factory reemplaza el módulo completo. La importación no es necesaria — `vi.mock` no requiere que el módulo esté importado en el archivo de test.

### Reparación
Eliminar `import axios from 'axios';` del test file.

### Archivos modificados
- `frontend/src/infrastructure/api/client.test.ts` — remove unused import

### Verificación
```bash
cd frontend && pnpm lint
# Resultado: 0 errors, 0 warnings
```

---

## Fix-004: 4 catch blocks sin inspección de error en repositorios

**Fase origen**: J.8.5 — detectado durante verificación de catch patterns

### Síntoma
4 repositorios tenían `catch {}` sin comentario ni inspección de error:
- `UserRepository.getById()` — `catch { return null; }`
- `RoleRepository.getById()` — `catch { return null; }`
- `UserPreferencesRepository.get()` — `catch { return DEFAULT_PREFS; }`
- `SyncIncidentRepository.findById()` — `catch { return null; }`

### Causa Raíz
Estos repositorios implementan `getById`/`get` con fallback offline: si la API falla (404, network), retornan null o defaults. Originalmente sin comentario documentando la intencionalidad.

### Reparación
Agregar comentario explicativo en cada catch block:
```typescript
} catch {
  // Offline fallback: user may not exist (404) or network unavailable
  return null;
}
```

### Archivos modificados
- `frontend/src/infrastructure/repositories/user/UserRepository.ts`
- `frontend/src/infrastructure/repositories/user/RoleRepository.ts`
- `frontend/src/infrastructure/repositories/user/UserPreferencesRepository.ts`
- `frontend/src/infrastructure/repositories/settings/SyncIncidentRepository.ts`

### Verificación
```bash
cd frontend && rg "Offline fallback" src/infrastructure/repositories/
# 4 matches — cada catch documentado
pnpm lint  # 0 errors
pnpm exec tsc --noEmit  # 0 errors
pnpm test:run  # 274 tests pass
```
