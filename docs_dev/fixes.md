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
