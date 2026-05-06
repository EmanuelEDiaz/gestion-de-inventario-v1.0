import os

roles_dir = r"d:\emanuel\Programacion\Nextjs\gestion de inventario.worktrees\copilot-worktree-2026-05-06T15-17-48\frontend\src\app\(admin)\roles"
os.makedirs(roles_dir, exist_ok=True)

content = (
    "import { RolesView } from '@/presentation/modules/roles';\n"
    "\n"
    "export const metadata = { title: 'Roles \u2014 Inventario' };\n"
    "\n"
    "export default function RolesPage() {\n"
    "  return <RolesView />;\n"
    "}\n"
)

file_path = os.path.join(roles_dir, "page.tsx")
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done:", os.path.exists(file_path))
