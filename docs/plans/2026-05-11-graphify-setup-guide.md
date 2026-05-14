# Graphify — Guía de Configuración y Uso Eficiente

> Basado en análisis de graphifyy v0.7.14. Última actualización: 2026-05-11.

---

## 1. Instalación y Configuración Inicial

### 1.1 Verificar Instalación

```bash
which graphify
# /home/emanuel/.local/bin/graphify -> uv tool

# Verificar versión
graphify --version
```

### 1.2 Integrar con OpenCode (tu plataforma)

```bash
graphify opencode install
```

Esto agrega el skill `graphify` al sistema de skills de OpenCode y configura el hook para auto-actualizar el grafo post-commit.

### 1.3 Variables de Entorno Clave

```bash
# Output directory (default: graphify-out/)
export GRAPHIFY_OUT="graphify-out"

# LLM Backend (claude, gemini, openai, kimi, ollama, bedrock)
export GRAPHIFY_BACKEND="claude"

# API Keys
export ANTHROPIC_API_KEY="sk-ant-..."      # Claude
export GEMINI_API_KEY="..."                 # Gemini
export OPENAI_API_KEY="sk-..."             # OpenAI

# Limits
export GRAPHIFY_VIZ_NODE_LIMIT=5000         # Max nodes en HTML viz
export GRAPHIFY_MAX_WORKERS=4               # AST subprocess count
export GRAPHIFY_MAX_OUTPUT_TOKENS=60000     # Por llamada LLM
export GRAPHIFY_API_TIMEOUT=600             # segundos por request

# Performance
export GRAPHIFY_NO_TIPS=1                  # Suprime tips (menos output)
```

---

## 2. Sistema de Cache — El Secreto de la Eficiencia

Graphify cachea las extracciones para **nunca re-procesar archivos sin cambios**.

### 2.1 Estructura del Cache

```
graphify-out/
└── cache/
    ├── ast/              # Resultados AST (código)
    │   └── [sha256-content-hash].json
    └── semantic/         # Resultados semánticos (LLM)
        └── [sha256-content-hash].json
```

### 2.2 Cómo Funciona

- **Hash portable**: SHA256(contenido + ruta relativa) → clave del cache
- **Markdown special**: Archivos `.md` solo hashean el body (ignora YAML frontmatter)
- **Separación por tipo**: `ast` vs `semantic` (evita colisiones)
- **Migración legacy**: Soporta cache plano antiguo en `graphify-out/cache/`

### 2.3 Comandos de Cache

```bash
# Verificar cache disponible
graphify check-update .

# Forzar re-extracción (borra cache)
export GRAPHIFY_FORCE=1
graphify update . --force

# Limpiar cache específico
rm -rf graphify-out/cache/ast/
rm -rf graphify-out/cache/semantic/

# Ver archivos en cache
ls graphify-out/cache/ast/ | wc -l
ls graphify-out/cache/semantic/ | wc -l
```

### 2.4 Estrategia Óptima de Cache

```
PRIMERA EJECUCIÓN (lenta, necesaria):
  graphify extract . --backend claude

EJECUTAR GRÁFICAS (incremental, rápido):
  graphify update .           # Solo AST, sin LLM
  graphify update . --force   # Forzar re-extract (incluye LLM)
```

**Regla**: Solo usa `extract` la primera vez. Después usa `update` para re-extraer cambios.

---

## 3. Workflows Recomendados por Escenario

### 3.1 Proyecto Nuevo — Extracción Completa

```bash
# 1. Extraer todo (puede tomar tiempo)
graphify extract .

# 2. Generar visualización
graphify export html

# 3. Consultar el grafo
graphify query "How does the sale flow work?" --budget 2000
graphify path "SaleConfirmSheet" "SaleEntity"
```

### 3.2 Proyecto Existente — Actualización Incremental

```bash
# Rápido: solo re-extracción de archivos cambiados (no LLM)
graphify update .

# Si cambiaste archivos no-código (docs/imágenes), fuerza re-extract:
graphify update . --force
```

### 3.3 Solo Documentos/Conceptos — Extracción Selectiva

```bash
# Opción A: Extraer en subcarpeta docs
graphify extract ./docs --out ./docs-graph

# Opción B: Merge de grafos
graphify extract ./docs --out ./docs-graph
graphify merge-graphs graphify-out/graph.json docs-graph/graph.json \
  --out graphify-out/graph.json
```

### 3.4 Re-clustering (sin re-extracción)

```bash
# Regenerar comunidades con diferentes parámetros
graphify cluster-only . --no-viz
```

---

## 4. Consultas al Grafo — query / path / explain

### 4.1 query — BFS traversal (contexto amplio)

```bash
# Default: BFS, 2000 tokens output
graphify query "How does sync handle conflicts?"

# DFS: seguir un camino específico (más profundo)
graphify query "Find all sale repositories" --dfs

# Filtrar por tipo de arista
graphify query "Show uses relationships" --context uses
graphify query "Show imports and calls" --context imports --context calls

# Budget personalizado (tokens output)
graphify query "..." --budget 4000

# Especificar grafo
graphify query "..." --graph ./graphify-out/graph.json
```

### 4.2 path — Camino más corto entre nodos

```bash
# Encontrar conexión entre componentes
graphify path "ProductRepositoryAdapter" "ProductController"

# Output ejemplo:
# Shortest path (4 hops):
# ProductRepositoryAdapter --method--> .findAllFiltered() --calls--> .isEmpty() --calls--> .getAll() --method--> ProductController
```

### 4.3 explain — Detalle de un nodo

```bash
graphify explain "ProductRepositoryAdapter"

# Output:
# Node: ProductRepositoryAdapter.java
#   ID:        backend_..._productrepositoryadapter_java
#   Source:    .../ProductRepositoryAdapter.java L1
#   Type:      code
#   Community: 87
#   Degree:    2
# Connections (2):
#   --> ProductRepositoryAdapter [contains] [EXTRACTED]
#   --> ProductRepository [imports] [EXTRACTED]
```

---

## 5. MCP Server — Para Agentes AI

### 5.1 Iniciar el Servidor

```bash
# Servidor stdio (para Claude Desktop, OpenCode, etc.)
python -m graphify.serve graphify-out/graph.json
```

### 5.2 Herramientas Expuestas

| Herramienta | Descripción |
|-------------|-------------|
| `query_graph` | BFS/DFS traversal con token budget |
| `get_node` | Lookup de nodo por label |
| `get_neighbors` | Ver adyacentes, filtrar por relación |
| `get_community` | Miembros de una comunidad |
| `god_nodes` | Top N nodos más conectados |
| `graph_stats` | Estadísticas resumidas |
| `shortest_path` | Camino entre dos nodos |

### 5.3 Configurar en OpenCode (config.json)

```json
{
  "mcpServers": {
    "graphify": {
      "command": "python",
      "args": ["-m", "graphify.serve", "${workspace}/graphify-out/graph.json"]
    }
  }
}
```

### 5.4 Recursos MCP Disponibles

- `graphify://report` — GRAPH_REPORT.md completo
- `graphify://stats` — Node/edge/community counts
- `graphify://god-nodes` — Top 10 god nodes
- `graphify://surprises` — Cross-community connections
- `graphify://audit` — Confidence breakdown
- `graphify://questions` — Suggested questions

---

## 6. Export Formats

```bash
# HTML interactivo (default, Vis.js)
graphify export html

# HTML con diagrama de callflow (arquitectura)
graphify export callflow-html \
  --report graphify-out/GRAPH_REPORT.md \
  --output graphify-out/callflow.html

# Obsidian vault (un .md por nodo + graph.canvas)
graphify export obsidian --dir graphify-out/obsidian

# Wiki navegable
graphify export wiki

# SVG estático
graphify export svg

# GraphML (Gephi, yEd)
graphify export graphml

# Neo4j Cypher
graphify export neo4j
# Push directo:
graphify export neo4j --push bolt://localhost:7687 \
  --user neo4j --password "$NEO4J_PASSWORD"

# D3 tree
graphify tree --graph graphify-out/graph.json \
  --output graphify-out/tree.html --root "ProductRepository"
```

---

## 7. Git Integration — Hooks Automáticos

```bash
# Instalar hooks (post-commit + post-checkout)
graphify hook install

# Verificar status
graphify hook status

# Desinstalar
graphify hook uninstall

# Git merge driver para graph.json
# Agregar en .git/config:
[merge "graphify"]
    driver = graphify merge-driver %O %A %B
```

Los hooks permiten que después de cada `git commit` o `git checkout`, el grafo se auto-actualice con los cambios.

---

## 8. Global Graph — Multi-Repo

```bash
# Agregar proyecto al grafo global
graphify global add graphify-out/graph.json --as "gestion-inventario"

# Listar proyectos
graphify global list

# Ver path del grafo global
graphify global path

# Remover
graphify global remove gestion-inventario
```

---

## 9. Configuración Avanzada

### 9.1 .graphifyignore — Excluir archivos

```
# Excluir node_modules y archivos de build
node_modules/
dist/
build/
*.min.js
```

### 9.2 .graphifyinclude — Forzar inclusión

```
# Incluir archivos ocultos
.claude/
.agents/
```

### 9.3 Backends LLM

```bash
# Claude (default recomendado)
graphify extract . --backend claude --model claude-sonnet-4-6

# Gemini
export GEMINI_API_KEY="..."
graphify extract . --backend gemini --model gemini-2.5-flash

# Kimi
export MOONSHOT_API_KEY="..."
graphify extract . --backend kimi --model kimi-k2.6

# OpenAI
export OPENAI_API_KEY="..."
graphify extract . --backend openai --model gpt-4.1-mini

# Ollama (localhost)
graphify extract . --backend ollama --model qwen2.5-coder:7b

# Bedrock
graphify extract . --backend bedrock --model anthropic.claude-3-5-sonnet
```

---

## 10. Recomendaciones para tu Proyecto

### Resumen de Comandos Diarios

```bash
# Día 1: Extracción completa
graphify extract .

# Después de cambios (incremental, ~30s)
graphify update .

# Consultar el grafo
graphify query "..." --budget 2000
graphify path "A" "B"
graphify explain "NodeName"

# Regenerar visualización
graphify export html

# Verificar cache
graphify check-update .
```

### Estrategia de Actualización

```
WORKFLOW RECOMENDADO:
1. Modificar código
2. git commit
3. graphify hook actualiza automáticamente

O MANUAL:
  graphify update . --force
```

### Costeo de Tokens

| Escenario | Costo |
|-----------|-------|
| `update .` (solo AST) | $0 — tree-sitter, no LLM |
| `extract .` (primera vez) | ~50K-100K tokens (depende del backend) |
| `extract ./docs` (solo docs) | ~5K-10K tokens |

### Integración con AGENTS.md

Para que graphify sea parte del workflow del proyecto, agregar al `AGENTS.md`:

```markdown
## Graph

- Grafo: `graphify-out/graph.json`
- Reporte: `graphify-out/GRAPH_REPORT.md`
- Visualización: `graphify-out/graph.html`

### Comandos
- Actualizar: `graphify update . --force`
- Consultar: `graphify query "..."`
- Path: `graphify path "A" "B"`
- MCP: `python -m graphify.serve graphify-out/graph.json`
```

---

## 11. Troubleshooting

### Problema: "Graph is empty"
→ Ejecución anterior falló. Limpiar y re-ejecutar:
```bash
rm -rf graphify-out/
graphify extract .
```

### Problema: "Too large for HTML viz"
→ Graph tiene más de 5000 nodos. Usar versión agregada:
```bash
# Graphify ya genera graph.html con agregación de comunidades
# O regenerar manualmente:
export GRAPHIFY_VIZ_NODE_LIMIT=6000
graphify export html
```

### Problema: Cache no se usa
→ Verificar que el archivo no cambió. Force rebuild:
```bash
export GRAPHIFY_FORCE=1
graphify update . --force
```

### Problema: Semantic extraction lenta
→ Reducir concurrencia:
```bash
export GRAPHIFY_MAX_CONCURRENCY=2
graphify update . --force
```