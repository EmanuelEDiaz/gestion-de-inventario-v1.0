# [ARCHIVED] Implementation Roadmap
> This document is archived. The current implementation plan is at `docs_dev/task_plan.md`.

Este documento aterriza [CLAUDE.md](../../CLAUDE.md) y [execution-addendum.md](./execution-addendum.md) a una secuencia operativa. No reemplaza los contratos del plan principal; define orden, dependencias y entregables para reducir ambiguedad.

## 1. Current starting point

- El repositorio actual contiene documentacion base, pero no contiene aun backend, frontend, OpenAPI ni migraciones materializadas.
- Por tanto, el trabajo real todavia no ha entrado en Gate B ni en Gate C; el estado actual corresponde sobre todo a preparacion documental de Gate A.
- Ninguna instalacion, scaffold o bootstrap debe ejecutarse hasta que esta hoja de ruta y las decisiones de stack queden aceptadas.

## 2. Locked planning decisions

- Backend: Spring Boot WebFlux + R2DBC + Flyway por JDBC solo para migraciones.
- Frontend: Next.js App Router + BFF + PWA, con pnpm como package manager previsto.
- Frontend interno: `src/core`, `src/infrastructure`, `src/presentation`, usando `src/app` solo como capa de entrada de Next.js.
- Runtime: 100% offline una vez construida la aplicacion y tambien dentro de Docker.
- Stitch: solo para exploracion visual en desarrollo y siempre sujeto a aprobacion del usuario antes de adoptar una propuesta UI.
- Docker: se difiere hasta que backend y frontend funcionen correctamente antes del build final.

## 3. Refined delivery phases

### Phase 0. Stack lock and preparation

Objetivo: cerrar decisiones de version y convenciones sin crear aun la aplicacion.

Entregables:

- Matriz de versiones objetivo para Java, Maven, Spring Boot, Node.js, pnpm y Next.js.
- Criterio explicito para rechazar dependencias deprecated.
- Inventario de skills locales vigentes y su precedencia.
- Resolucion documentada de la estructura frontend para evitar conflicto entre App Router y arquitectura hexagonal.

Salida esperada:

- El proyecto sabe que va a instalar despues, pero todavia no ejecuta instalaciones.

### Phase 1. Gate A complete

Objetivo: cerrar el diseno base antes de tocar codigo de negocio.

Entregables:

- ADRs completos y coherentes con el addendum.
- Glosario actualizado con terminos de dashboard, metricas configurables, acceso por hotspot y ayudas de UI.
- Estrategia offline ampliada con descubrimiento por LAN, enlace visible y opcion de QR.
- Politica de autenticacion frontend con middleware para rutas privadas.
- Politica de idioma: UI en espanol, codigo en ingles.

Salida esperada:

- El alcance funcional y UX ya no depende de interpretacion improvisada.

### Phase 2. Gate B contracts

Objetivo: convertir el diseno en artefactos verificables.

Entregables:

- ERD versionado con constraints, indices y aclaraciones de concurrencia.
- Migraciones iniciales de Flyway para tablas base.
- OpenAPI 3 para auth, catalogo, stock, operaciones, dashboard, sync e import/export.
- DTOs y puertos de entrada/salida definidos por agregado.
- Contrato de dashboard configurable: widgets, preferencias visibles y filtros.
- Contrato para descubrimiento local: endpoint o recurso para mostrar URL local y material para QR en frontend.

Salida esperada:

- Ya existe una base contractual suficiente para scaffold sin adivinar APIs ni modelos.

### Phase 3. Gate C scaffolding

Objetivo: crear la estructura minima ejecutable del monorepo.

Entregables:

- Estructura de carpetas backend conforme a Clean Architecture.
- Estructura de carpetas frontend conforme a App Router + `core/infrastructure/presentation`.
- Configuracion base de seguridad, middleware, BFF y PWA shell.
- Configuracion base de testing y reglas de arquitectura.
- Base de shadcn/ui solo si el sistema de componentes se confirma como parte del frontend.

Salida esperada:

- Backend y frontend arrancan con esqueletos coherentes, aunque todavia sin funcionalidad completa.

### Phase 4. Core inventory flows

Objetivo: implementar los flujos que sostienen inventario real.

Entregables:

- Catalogo, almacenes, ledger y balances.
- Compras, ventas, transferencias, ajustes y devoluciones.
- Costeo STANDARD, WAC y FIFO con reglas claras de consulta y visualizacion.
- Auditoria y idempotencia en operaciones mutables.

Salida esperada:

- El sistema ya soporta operaciones de inventario con coherencia de dominio.

### Phase 5. UX, dashboard and offline hardening

Objetivo: cerrar la experiencia de uso real en entorno local sin internet.

Entregables:

- Dashboard con metricas seleccionables por administrador.
- Graficas y comparativas de ventas, inventario, margenes y rotacion.
- Placeholders, tooltips y ayudas contextuales clave.
- Sync completo con barra de progreso, conflictos y recuperacion.
- Acceso LAN/hotspot con enlace visible y opcion de QR.

Salida esperada:

- La aplicacion puede usarse y evaluarse de forma realista antes del build final.

### Phase 6. Validation and packaging

Objetivo: validar primero la aplicacion y empaquetar despues.

Entregables:

- Pruebas antes del build final.
- Pruebas despues del build final.
- Imagen Docker y compose solo cuando las fases anteriores ya esten funcionales.
- Verificacion de assets locales, media volume y funcionamiento offline empaquetado.

Salida esperada:

- Docker deja de ser un objetivo prematuro y pasa a ser una etapa final de portabilidad.

## 4. Clarifications that change the original reading of the plan

- El apartado de skills del plan principal deja de ser solo una recomendacion generica y pasa a depender primero de los skills locales existentes en el repo.
- La estructura frontend del plan principal se interpreta con prioridad para App Router en la entrada y arquitectura hexagonal en la implementacion interna.
- Dashboard ya no se entiende como solo tres endpoints de reportes; incluye configuracion de widgets visibles y criterios de utilidad para administracion.
- La experiencia hotspot/LAN no se limita al HTTPS local; incluye descubrimiento practico para usuarios mediante enlace visible y opcion de QR.
- Stitch no define la UI por defecto; solo acelera iteraciones visuales si luego el usuario confirma el resultado.

## 5. Ready-to-start checklist before any installation

- Versiones objetivo propuestas y aceptadas.
- Estructura frontend sin contradicciones documentada.
- Skills locales inventariados y aceptados como referencia.
- Alcance de dashboard, metricas y UI contextual definido.
- Politica de acceso local y middleware descrita.
- Regla de no usar deprecated aplicada a dependencias y APIs.

Cuando todos estos puntos esten cerrados, el siguiente paso ya no sera seguir refinando documentos sino empezar a materializar Gate B y Gate C.

> **Estado de ejecucion real, hallazgos de tests y pendientes del frontend**: ver `docs/plans/implementation-plan.md`.
