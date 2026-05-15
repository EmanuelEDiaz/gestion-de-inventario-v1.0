// OpenCode plugin: Skills Auto-Loader Checker
// - Verifica skills disponibles al inicio de cada tarea
// - Sugiere skills relevantes según el contexto
// - Muestra resumen de skills instalados
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

const PROJECT_SKILLS = ".claude/skills";
const GLOBAL_SKILLS = ".agents/skills";

function getInstalledSkills(skillsDir) {
  const skills = [];
  try {
    if (existsSync(skillsDir)) {
      const items = readdirSync(skillsDir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const skillPath = join(skillsDir, item.name);
          const skillyaml = join(skillPath, "SKILL.md");
          const readmemd = join(skillPath, "README.md");
          let description = item.name;
          
          if (existsSync(skillyaml)) {
            try {
              const content = readFileSync(skillymd, "utf-8");
              const match = content.match(/description\s*:\s*(.+)/i);
              if (match) description = match[1].trim();
            } catch {}
          } else if (existsSync(readmemd)) {
            try {
              const content = readFileSync(readmemd, "utf-8");
              const lines = content.split("\n").filter(l => l.trim());
              if (lines.length > 1) description = lines[1].substring(0, 60);
            } catch {}
          }
          
          skills.push({ name: item.name, description });
        }
      }
    }
  } catch {}
  return skills;
}

function suggestRelevantSkills(message) {
  const msg = (message || "").toLowerCase();
  const suggestions = [];
  
  // Security keywords
  if (msg.includes("security") || msg.includes("seguridad") || msg.includes("auth") || msg.includes("jwt") || msg.includes("password") || msg.includes("vulnerable")) {
    suggestions.push("senior-security", "django-security", "owasp-security", "owasp-security-check");
  }
  
  // Docker/Deployment
  if (msg.includes("docker") || msg.includes("container") || msg.includes("deploy") || msg.includes("compose") || msg.includes("k8s")) {
    suggestions.push("docker-expert", "docker-patterns");
  }
  
  // API/Backend
  if (msg.includes("api") || msg.includes("rest") || msg.includes("endpoint") || msg.includes("backend") || msg.includes("spring") || msg.includes("java")) {
    suggestions.push("rest-api-design", "spring-boot-rest-api-standards", "openapi-spec-generation", "rest-api-conventions", "backend-patterns");
  }
  
  // Database
  if (msg.includes("database") || msg.includes("postgres") || msg.includes("sql") || msg.includes("query") || msg.includes("migration") || msg.includes("flyway")) {
    suggestions.push("supabase-postgres-best-practices", "flyway-migrations", "spring-data-jpa");
  }
  
  // Frontend
  if (msg.includes("frontend") || msg.includes("react") || msg.includes("next") || msg.includes("ui") || msg.includes("component")) {
    suggestions.push("senior-frontend", "react-best-practices", "shadcn", "tailwind-patterns");
  }
  
  // Planning/Tasks
  if (msg.includes("plan") || msg.includes("task") || msg.includes("organi") || msg.includes("project") || msg.includes("blueprint")) {
    suggestions.push("planning", "blueprint", "writing-plans", "folder-structure-blueprint-generator");
  }
  
  // Code Review
  if (msg.includes("review") || msg.includes("audit") || msg.includes("check") || msg.includes("quality")) {
    suggestions.push("code-reviewer", "clean-code", "django-verification", "django-tdd");
  }
  
  // Documentation
  if (msg.includes("doc") || msg.includes("readme") || msg.includes("comment") || msg.includes("spec")) {
    suggestions.push("documentation-writer", "api-design", "architecture-decision-records");
  }
  
  // Graph/Codebase
  if (msg.includes("graph") || msg.includes("architecture") || msg.includes("structure") || msg.includes("relat")) {
    suggestions.push("graphify-agent", "senior-architect", "hexagonal-architecture", "domain-driven-design");
  }
  
  return [...new Set(suggestions)];
}

export const SkillsCheckerPlugin = async ({ directory, userMessage }) => {
  const projectSkillsPath = join(directory, PROJECT_SKILLS);
  const globalSkillsPath = join(homedir(), GLOBAL_SKILLS);
  
  const projectSkills = getInstalledSkills(projectSkillsPath);
  const globalSkills = getInstalledSkills(globalSkillsPath);
  
  const relevantSuggestions = suggestRelevantSkills(userMessage || "");
  
  // Build skill context message
  const skillNames = [...projectSkills.map(s => s.name), ...globalSkills.map(s => s.name)];
  const matchedSkills = relevantSuggestions.filter(s => skillNames.includes(s));
  
  let contextMsg = `[skills] ${projectSkills.length} skills locales + ${globalSkills.length} skills globales = ${projectSkills.length + globalSkills.length} disponibles`;
  
  if (matchedSkills.length > 0) {
    contextMsg += `\n  🎯 Skills relevantes para esta tarea: ${matchedSkills.join(", ")}`;
  }
  
  contextMsg += `\n  📂 Locales: ${projectSkills.slice(0, 5).map(s => s.name).join(", ")}${projectSkills.length > 5 ? "..." : ""}`;
  contextMsg += `\n  🌐 Globales: ${globalSkills.slice(0, 5).map(s => s.name).join(", ")}${globalSkills.length > 5 ? "..." : ""}`;
  contextMsg += `\n  💡 Sugiere skills con: "usa el skill X" o "carga skill Y"`;
  
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return;
      
      const cmd = output.args.command || "";
      
      // Only inject at start of session (first bash command)
      // Check if it's likely the first command by looking for initial operations
      const isInitialCommand = cmd.includes("ls ") || cmd.includes("git ") || cmd.includes("echo") || cmd.startsWith("cd ");
      
      if (isInitialCommand) {
        output.args.command = `echo '${contextMsg.replace(/'/g, "'\"'\"'")}' && ` + cmd;
      }
    },
  };
};