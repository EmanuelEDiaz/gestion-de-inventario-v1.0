# Investigación: Graphify para este proyecto

## Resumen ejecutivo

Graphify es una herramienta de **desarrollo** (no de runtime) que convierte repositorios en un grafo de conocimiento consultable (`graphify-out/graph.json`, `GRAPH_REPORT.md`, `graph.html`). Para este monorepo (Spring Boot + Next.js) puede aportar valor para navegación arquitectónica, análisis de dependencias y descubrimiento de relaciones entre backend/frontend/docs.

La adopción es **compatible** con las reglas offline del proyecto si se usa solo en desarrollo y se evita enviar código a APIs externas.

## Hallazgos verificados (fuentes oficiales)

1. **Instalación y paquete oficial**
   - El paquete oficial en PyPI es `graphifyy` (CLI: `graphify`).
   - Requiere Python `>=3.10`.
   - Fuente: `pyproject.toml` y README oficiales.

2. **Qué procesa y cómo**
   - Soporta código (incluye Java/TypeScript/JavaScript), docs, PDFs, imágenes y más.
   - El pipeline está documentado como: `detect -> extract -> build_graph -> cluster -> analyze -> report -> export`.
   - Fuentes: `README.md` y `ARCHITECTURE.md`.

3. **Outputs principales**
   - `graphify-out/graph.json`: grafo completo.
   - `graphify-out/GRAPH_REPORT.md`: hallazgos resumidos.
   - `graphify-out/graph.html`: visualización interactiva.
   - Fuente: `README.md`.

4. **Seguridad y superficie de riesgo**
   - Modelo de seguridad documentado (validación de URLs, path constraints para MCP, sanitización de labels, límites de tamaño en descargas, etc.).
   - Fuente: `SECURITY.md`.

5. **Dependencias relevantes para este repo**
   - Incluye `tree-sitter-java`, `tree-sitter-typescript`, `tree-sitter-javascript` en dependencias.
   - Fuente: `pyproject.toml`.

## Compatibilidad con reglas del proyecto

Este repositorio exige runtime 100% offline y sin APIs externas en producción (`CLAUDE.md`, `AGENTS.md`).

**Evaluación:**
- ✅ Compatible si Graphify se limita a desarrollo local/CI interno.
- ✅ Compatible para análisis estructural de código (AST local con tree-sitter).
- ⚠️ Para mantener cumplimiento offline estricto, usar Graphify en modo local de código (AST) y **no habilitar extracción semántica con backends externos** ni `graphify add <url>` en este proyecto.

## Recomendación de adopción (paso a paso)

1. **Prueba controlada local (1 desarrollador)**
   ```bash
   uv tool install graphifyy
   graphify --help
   graphify .
   ```

2. **Aislar alcance para este monorepo**
   - Crear `.graphifyignore` para excluir `node_modules`, `.next`, `target`, binarios y artefactos.
   - Ejecutar en raíz para mapear backend + frontend + docs.

3. **Consulta operativa para arquitectura**
   ```bash
   graphify query "what connects sync outbox to API layer?"
   graphify path "Product" "Stock"
   graphify export callflow-html
   ```

4. **Integración gradual de equipo**
   - Empezar sin hooks automáticos.
   - Si el equipo lo aprueba, activar `graphify hook install`.
   - Versionar solo artefactos útiles y controlar tamaño del repo.

5. **Regla de seguridad interna**
   - No usar Graphify para exponer código sensible en servicios externos.
   - Mantenerlo fuera de runtime y contenedores productivos.

## Comandos sugeridos para este proyecto

```bash
# instalación
uv tool install graphifyy

# análisis inicial del monorepo
graphify .

# actualización incremental
graphify . --update

# consultas
graphify query "what connects JWT to WebFlux security?"
graphify path "ProductRepository" "StockMovement"

# exportes
graphify export callflow-html
graphify . --wiki
```

## Fuentes citadas (confiables)

- Repositorio oficial: https://github.com/safishamsi/graphify
- README (comandos, outputs, plataformas): https://github.com/safishamsi/graphify/blob/4cec58e07242a42a94e7d7c41568120e46aac862/README.md
- Arquitectura interna (pipeline y módulos): https://github.com/safishamsi/graphify/blob/4cec58e07242a42a94e7d7c41568120e46aac862/ARCHITECTURE.md
- Seguridad (threat model y mitigaciones): https://github.com/safishamsi/graphify/blob/4cec58e07242a42a94e7d7c41568120e46aac862/SECURITY.md
- Metadatos del paquete y dependencias: https://github.com/safishamsi/graphify/blob/4cec58e07242a42a94e7d7c41568120e46aac862/pyproject.toml
- Políticas del proyecto (offline/runtime):
  - `CLAUDE.md`
  - `AGENTS.md`
