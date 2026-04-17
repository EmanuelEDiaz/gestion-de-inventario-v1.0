# Execution Addendum

Este documento complementa a [CLAUDE.md](../../CLAUDE.md). No reemplaza el plan principal; agrega reglas operativas y criterios de ejecucion para evitar ambiguedades durante la implementacion.

La secuencia de entrega refinada vive en [implementation-roadmap.md](./implementation-roadmap.md).

## 1. Dependency Policy

- Prohibido introducir dependencias, APIs o configuraciones marcadas como deprecated.
- Antes de instalar o actualizar dependencias, se debe informar al usuario que componentes base hacen falta y cual es su funcion.
- Backend: usar una version estable y soportada de Java, Maven y Spring Boot adecuada para el proyecto.
- Frontend: usar la version estable mas actual de Next.js compatible con el stack elegido y usar pnpm como package manager por defecto.
- Docker se prepara al final, solo cuando la aplicacion funcione correctamente antes y despues del build.

## 2. Skills Workflow

- Antes de empezar una tarea relevante, revisar primero los skills en `.claude/skills/`.
- Si se agregan nuevos skills al repositorio, reevaluar si cambian la forma correcta de implementar la tarea antes de continuar.
- Si un skill nuevo contradice una convencion activa, resolver la contradiccion explicitamente en documentacion antes de seguir.
- Las recomendaciones de skills al usuario deben hacerse antes de comenzar una implementacion grande.

### Skills disponibles (ubicacion unificada: `.claude/skills/`)

#### Arquitectura frontend (precedencia alta)
- `hexagonal`: separacion frontend entre `core`, `infrastructure` y `presentation`, con hooks controladores y vistas delgadas.
- `project-structure`: organizacion por modulos, componentes y hooks.
- `patterns`: reglas de tamano, division de componentes y buenas practicas de React/Next.js.
- `shadcn`: composicion de UI con shadcn/ui o registries compatibles.

#### UI/UX
- `ui-design-system`: design tokens, paletas, tipografia, spacing grid 8pt.
- `ui-ux-pro-max`: dashboard, UX configurable, 50 estilos.
- `tailwind-patterns`: Tailwind CSS v4, tokens de diseño.

#### Desarrollo
- `senior-architect`, `senior-backend`, `senior-frontend`, `react-best-practices`, `webapp-testing`, `senior-security`, `docker-expert`, `git-commit-helper`.

#### Soporte
- `brainstorming`, `clean-code`, `error-resolver`, `planning`.

### Skill precedence for this project

- Arquitectura backend: manda [CLAUDE.md](../../CLAUDE.md).
- Arquitectura frontend interna: mandan `hexagonal` y `project-structure`.
- Reglas de implementacion React: manda `patterns`.
- Sistema de componentes y estilo UI: mandan `shadcn` + `ui-design-system` cuando aplique.
- Si aparece un nuevo skill de mayor especializacion para este repo, se documenta el cambio de precedencia antes de usarlo como nueva base.

### Frontend structure conflict resolution

- `src/app` se mantiene solo para rutas, layouts, route handlers y entry points de Next.js App Router.
- La logica interna del frontend se organiza en `src/core`, `src/infrastructure` y `src/presentation` siguiendo los skills locales.
- Si hace falta una capa de modulos visuales por dominio, debe vivir bajo `src/presentation/modules` y no competir con otra taxonomia paralela.
- No se debe mezclar en el mismo nivel una estructura tipo `features/entities/widgets/shared` con otra tipo `core/infrastructure/presentation`; para este repo gana la segunda.
- Cualquier ejemplo o bloque externo que llegue con otra estructura debe adaptarse a esta convencion antes de consolidarse.

## 3. UI and Language Rules

- Todo texto visible en la aplicacion debe estar en espanol.
- Nombres de variables, funciones, clases, archivos y codigo en general deben mantenerse en ingles.
- Las acciones, campos y controles importantes deben tener descripcion visible o ayuda contextual.
- Cuando tenga sentido en desktop, usar tooltip o ayuda equivalente al pasar el mouse.
- Si se usa Stitch para iterar UI, primero se presenta la propuesta al usuario y se pide confirmacion explicita antes de consolidar esa direccion visual en la aplicacion.

## 4. Access and Navigation

- Debe existir middleware para impedir acceso a rutas privadas sin autenticacion.
- La aplicacion debe ofrecer una forma simple de acceso desde LAN u hotspot: enlace visible y, si es viable en la UI, un codigo QR para abrirla rapidamente desde otro dispositivo conectado.
- La experiencia PWA y de acceso local debe poder probarse antes del build final y tambien despues del build.

## 5. Metrics and Reporting

- El dashboard debe incluir metricas de ventas, inventario y operacion con representaciones visuales utiles.
- El administrador debe poder decidir que metricas o widgets quedan visibles.
- La seleccion de metricas visibles es una configuracion funcional de la aplicacion, no una decision fija en codigo.
- Al agregar metricas, priorizar indicadores accionables y comparables, no solo volumen bruto.

## 6. Stitch MCP Handling

- Stitch es una herramienta **solo de desarrollo**; no se usa en runtime.
- La configuración MCP vive en `.vscode/mcp.json` (archivo local no versionado, en `.gitignore`).
- La API key de Stitch debe existir **únicamente** en ese archivo local.
- Prohibido copiar la key a documentos del repositorio, issues, backlog, chat o archivos compartidos.
- Si el cliente (ej. VS Code Copilot Chat) no soporta MCP servers HTTP externos, Stitch simplemente no se usa y se continúa sin él.

## 7. Relationship with the Main Plan

- [CLAUDE.md](../../CLAUDE.md) sigue siendo la referencia principal de arquitectura, contratos y restricciones globales.
- Este addendum solo agrega decisiones operativas nuevas solicitadas despues del plan base.
- [implementation-roadmap.md](./implementation-roadmap.md) traduce el plan principal a una secuencia de trabajo mas concreta y revisable.
- Si aparece un conflicto entre ambos documentos, se debe corregir la contradiccion en el documento fuente adecuado antes de implementar.
