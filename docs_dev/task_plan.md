# Task: Inventario Offline-First - Setup Inicial

**Inicio:** 2026-04-17
**Stack:** Spring Boot WebFlux + Next.js 15 + PWA

## Fases

- [x] Fase 0: Verificar consistencia de skills
- [ ] Fase 1: Crear estructura de carpetas base
- [ ] Fase 2: Inicializar backend (Spring Boot WebFlux + R2DBC + Flyway)
- [ ] Fase 3: Inicializar frontend (Next.js 15 + pnpm + PWA shell)
- [ ] Fase 4: Migrar plan detallado desde CLAUDE.md a docs/
- [ ] Fase 5: Simplificar CLAUDE.md (solo reglas esenciales)
- [ ] Fase 6: Crear README.md completo
- [ ] Fase 7: Verificar que compila y arranca

## Decisiones

| Decisión | Razón | Fecha |
|----------|-------|-------|
| Java 21 LTS | Última LTS estable, soporte hasta 2031 | 2026-04-17 |
| Spring Boot 3.4.x | Última estable, soporte WebFlux nativo | 2026-04-17 |
| Next.js 15.x | App Router estable, mejor PWA | 2026-04-17 |
| pnpm | Más rápido, mejor gestión de deps | 2026-04-17 |
| PostgreSQL 16 | Estable, buen soporte JSON | 2026-04-17 |
| Flyway | Migraciones versionadas | 2026-04-17 |

## Versiones a usar

| Componente | Versión | Notas |
|------------|---------|-------|
| Java | 21 LTS | OpenJDK/Temurin |
| Maven | 3.9.x | Wrapper incluido |
| Spring Boot | 3.4.x | WebFlux + R2DBC |
| Node.js | 20 LTS | Para frontend |
| pnpm | 9.x | Package manager |
| Next.js | 15.x | App Router |
| PostgreSQL | 16 | Para desarrollo y producción |
| Tailwind CSS | 4.x | Con design tokens |
| shadcn/ui | latest | Componentes accesibles |

## Errores Encontrados

| Error | Intento | Resolución |
|-------|---------|------------|
| (ninguno aún) | - | - |

## Notas

- Skills verificados: hexagonal, project-structure, patterns - CONSISTENTES
- UI en español, código en inglés
- Runtime 100% offline obligatorio
- Middleware auth obligatorio
