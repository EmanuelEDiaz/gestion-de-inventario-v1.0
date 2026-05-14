// graphify OpenCode plugin v2
// - Reads graph before answering codebase questions
// - Suggests graph queries instead of file searches
// - Shows path/connection info before reading files
// - Auto-acknowledges graph state
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const GRAPHIFY_OUT = "graphify-out";
const GRAPH_JSON = "graph.json";
const PYTHON_BIN = join(GRAPHIFY_OUT, ".graphify_python");

function getPython() {
  try {
    return readFileSync(join(process.cwd(), PYTHON_BIN), "utf-8").trim();
  } catch {
    return "python3";
  }
}

function getGraphStats() {
  try {
    const python = getPython();
    const result = execSync(
      `${python} -c "
import json
from pathlib import Path
from networkx.readwrite import json_graph
g = json_graph.node_link_graph(json.loads(Path('${GRAPHIFY_OUT}/${GRAPH_JSON}').read_text()), edges='links')
print(json.dumps({
  'nodes': g.number_of_nodes(),
  'edges': g.number_of_edges(),
  'report_exists': Path('${GRAPHIFY_OUT}/GRAPH_REPORT.md').exists(),
  'cache_ast': len(list(Path('${GRAPHIFY_OUT}/cache/ast').glob('*'))),
}))
" 2>&1`,
      { encoding: "utf-8", cwd: process.cwd() }
    );
    return JSON.parse(result.trim());
  } catch {
    return null;
  }
}

function suggestGraphQuery(userMessage) {
  const msg = userMessage.toLowerCase();
  const python = getPython();

  // Cross-module / relationship questions → use graph
  if (msg.includes("how does") || msg.includes("how is") || msg.includes("como se") || msg.includes("como funciona") || msg.includes("how do")) {
    if (msg.includes("connect") || msg.includes("relat") || msg.includes("conect") || msg.includes("relacion")) {
      return "query";
    }
  }
  if (msg.includes("where is") || msg.includes("donde esta") || msg.includes("find all") || msg.includes("encontrar")) {
    return "query";
  }
  if (msg.includes("what calls") || msg.includes("who uses") || msg.includes("que llama") || msg.includes("que usa") || msg.includes("quien usa")) {
    return "query";
  }
  if (msg.includes("archite") || msg.includes("pattern") || msg.includes("flujo") || msg.includes("flow")) {
    return "query";
  }
  if (msg.includes("show me the path") || msg.includes("camino entre")) {
    return "path";
  }
  if (msg.includes("between") && (msg.includes(" and ") || msg.includes(" y "))) {
    return "path";
  }

  // Direct node questions → use explain
  if (msg.includes("explain") || msg.includes("explica") || msg.includes("describe")) {
    return "explain";
  }

  return null;
}

function extractPathTerms(userMessage) {
  const msg = userMessage.toLowerCase();
  const patterns = [
    /(?:between|from|entre|de)\s+["']([^"']+)["']\s+(?:and|y|to|a)\s+["']([^"']+)["']/i,
    /(?:between|from|entre|de)\s+(\w+(?:\.\w+)*)\s+(?:and|y|to|a)\s+(\w+(?:\.\w+)*)/i,
    /(?:camino|ruta|path)\s+(?:entre|from|de)\s+["']([^"']+)["']\s+(?:and|y|to|a)\s+["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m) return [m[1].trim(), m[2].trim()];
  }
  return null;
}

export const GraphifyPlugin = async ({ directory, userMessage }) => {
  const graphPath = join(directory, GRAPHIFY_OUT, GRAPH_JSON);
  const reportPath = join(directory, GRAPHIFY_OUT, "GRAPH_REPORT.md");

  if (!existsSync(graphPath)) return {};

  const stats = getGraphStats() || {};

  const suggestion = suggestGraphQuery(userMessage || "");

  let graphHint = "";
  if (suggestion === "query") {
    const q = (userMessage || "").replace(/[?]/g, "").trim();
    graphHint = `\n[graphify] Antes de buscar archivos — ejecuta: graphify query "${q}" --budget 2000`;
  } else if (suggestion === "path") {
    const terms = extractPathTerms(userMessage || "");
    if (terms) {
      graphHint = `\n[graphify] Ejecuta: graphify path "${terms[0]}" "${terms[1]}"`;
    } else {
      graphHint = `\n[graphify] Para path entre nodos: graphify path "NODO_A" "NODO_B"`;
    }
  } else if (suggestion === "explain") {
    graphHint = `\n[graphify] Ejecuta: graphify explain "NodeName"`;
  }

  // Inject graph context before bash commands
  const contextInfo = [
    `[graphify] Grafo: ${stats.nodes || "?"} nodes, ${stats.edges || "?"} edges | ${stats.report_exists ? "✅ Reporte listo" : "⚠️ Sin reporte"} | Cache AST: ${stats.cache_ast || 0} files`,
    stats.report_exists ? `  📋 Leer primero: graphify-out/GRAPH_REPORT.md` : "",
    graphHint,
    `  🔄 Actualizar: graphify update .`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return;

      const cmd = output.args.command || "";
      const isReadTool = ["read", "glob", "grep", "search", "find"].some(
        (t) => cmd.includes(`tool "${t}"`) || cmd.includes(`"${t}"`)
      );
      const isFileSearch =
        cmd.includes("cat ") ||
        cmd.includes(" rg ") ||
        cmd.includes(" find ") ||
        cmd.includes(" ls ");

      // Only inject before file search/read operations
      if (isReadTool || isFileSearch) {
        output.args.command = `echo '${contextInfo.replace(/'/g, "'\"'\"'")}' && ` + cmd;
      }
    },
  };
};