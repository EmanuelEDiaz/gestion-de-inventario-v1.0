# graphify-agent skill

> **PRIMARY KNOWLEDGE SOURCE — Leer antes de buscar archivos**
> Este skill configura graphify como mapa principal del codebase. Cada conversación
> comienza aquí.

## Qué hace este skill

1. **Carga el grafo** como contexto base — no busca archivos primero
2. **Traduce preguntas del usuario** → queries de graphify
3. **Ejecuta graphify query/path/explain** antes de cualquier búsqueda
4. **Propaga cambios** al grafo después de cada modificación de código

## Graph actual

```
graphify-out/
├── graph.json           # Grafo principal (5,628 nodes, 8,271 edges)
├── GRAPH_REPORT.md      # Reporte con god nodes y comunidades
├── graph.html           # Visualización interactiva
├── wiki/index.md        # Wiki navegable
└── cache/
    ├── ast/             # 875 archivos cacheados
    └── semantic/        # Resultados LLM
```

## Flujo de cada pregunta

```
1. Leer GRAPH_REPORT.md para contexto general
2. Analizar pregunta del usuario
3. Si es pregunta sobre arquitectura/relaciones:
   → graphify query "..." --budget 2000
4. Si pregunta por camino entre A y B:
   → graphify path "A" "B"
5. Si pregunta por un nodo específico:
   → graphify explain "NodeName"
6. Solo SI el grafo no tiene la respuesta → buscar en archivos
7. Después de modificar código → graphify update .
```

## Comandos graphify disponibles

```bash
graphify query "<pregunta>" [--dfs] [--budget N] [--context C]
  # BFS: contexto amplio, múltiples hops
  # DFS: seguir un camino específico
  # --context: filtrar por tipo de relación (call, import, field, etc.)

graphify path "NODO_A" "NODO_B"
  # Camino más corto entre dos nodos

graphify explain "NombreNodo"
  # Detalle de un nodo y sus conexiones

graphify update .
  # Actualizar grafo después de cambios (AST, ~30s, $0)

graphify update . --force
  # Forzar re-extracción completa (incluye LLM)

graphify check-update .
  # Verificar qué archivos necesitan re-extracción

graphify export html
  # Regenerar visualización

graphify export wiki
  # Regenerar wiki

graphify tree --root "NodoRaiz" --output tree.html
  # D3 tree desde un nodo específico
```

## Configuración actual del proyecto

- **Python**: `/home/emanuel/.local/share/uv/tools/graphifyy/bin/python`
- **Backend LLM**: `claude` (ANTHROPIC_API_KEY)
- **Hooks git**: `post-commit` y `post-checkout` instalados
- **Plugin OpenCode**: `.opencode/plugins/graphify.js` activo
- **MCP server**: `python -m graphify.serve graphify-out/graph.json` (requiere `pip install mcp` en el env de graphify)

## God Nodes del proyecto

1. `Button` — 53 edges
2. `cn()` — 44 edges
3. `ProductEntity` — 40 edges
4. `InventoryMovementEntity` — 38 edges
5. `NotificationPreferencesEntity` — 36 edges
6. `PurchaseEntity` — 36 edges
7. `SaleEntity` — 36 edges
8. `NotificationEntity` — 34 edges
9. `Product` — 34 edges
10. `LoadingSpinner()` — 33 edges

## Comunidades clave (cohesión > 0.15)

| ID | Nombre | Cohesión | Nodos |
|----|--------|----------|-------|
| C160 | Auth (AuthResponse, AuthTokens, LoginCredentials) | 0.38 | 8 |
| C180 | Transfer (CreateTransferRequest, Transfer, TransferLine) | 0.51 | 6 |
| C226 | Adjustment (Adjustment, AdjustmentStatus) | 0.56 | 5 |
| C293 | Quiet Hours (isInQuietHours, isQuietDay, shouldDeliverNotification) | 0.6 | 3 |
| C300 | Test Utils (errors, fail, runTests, waitForServer) | 0.6 | 4 |
| C413 | IndexedDB/Outbox | 0.67 | 3 |
| C414 | API Endpoints | 0.67 | 3 |
| C415 | Notifications | 0.67 | 3 |

## Reglas de uso

1. **ANTES de grep/glob/read** → ejecutar `graphify query` o `graphify path`
2. **DESPUÉS de modificar código** → ejecutar `graphify update .`
3. **Para preguntas de arquitectura** → usar `graphify query --dfs`
4. **Para encontrar el camino** → usar `graphify path`
5. **Para entender un componente** → usar `graphify explain`

## Integración con skills del proyecto

- Cargar `senior-frontend` o `senior-fullstack` para tareas de código
- Cargar `graphify-agent` para navegación y comprensión del codebase
- graphify-agent es el **mapa**, skills son el **detalle técnico**

## Solución de problemas

```bash
# Grafo vacío o corrupto
rm -rf graphify-out/ && graphify extract .

# Cache no funciona
export GRAPHIFY_FORCE=1 && graphify update . --force

# HTML viz muy grande (>5000 nodos)
# graphify ya genera versión agregada con comunidades
graphify export html --node-limit 6000

# MCP server no funciona
uv pip install --python /home/emanuel/.local/share/uv/tools/graphifyy/bin/python mcp
python -m graphify.serve graphify-out/graph.json
```