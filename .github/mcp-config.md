# MCP Server Configuration

This document guides setup of Model Context Protocol (MCP) servers for enhanced Copilot capabilities in this offline-first inventory system.

## 1. Playwright MCP (E2E Testing & PWA Validation)

Enables Copilot to run, debug, and validate Playwright tests for E2E testing, PWA functionality, offline sync, and mobile scenarios.

### Installation

```bash
cd frontend

# Playwright is typically included; if not:
pnpm add -D playwright @playwright/test

# Or via npm/yarn:
npm install --save-dev playwright @playwright/test
```

### Configuration

**GitHub Copilot CLI:**
```bash
# Add to your Copilot config (typically in ~/.copilot/config or project-local)
# Enable playwright-mcp in your configuration file
```

**Cursor IDE:**
- Go to Cursor Settings → Features → MCP
- Add Playwright MCP with playwright binary path
- Or manually edit `.cursor/rules/mcp-config.json`

**VS Code + Copilot Extension:**
- Install MCP server locally
- Configure in VS Code settings: `"copilot.mcp.servers"`

### Available Test Locations & Commands

```bash
cd frontend

# Root-level E2E tests (Node/Playwright)
node ../e2e-tests.mjs

# Playwright tests in tests/ directory
npx playwright test                       # Run all tests
npx playwright test --headed              # Watch browser (debug mode)
npx playwright test tests/auth.spec.ts    # Single test file
npx playwright test --debug               # Step through tests

# Generate test report
npx playwright show-report
```

### Critical Test Scenarios for This Project

- **Offline functionality:** Load app, go offline, verify cached data in IndexedDB
- **Sync validation:** Create product/sale offline, go online, verify sync to backend
- **PWA installation:** Test service worker registration and caching
- **Mobile PWA:** Test on iOS/Android via local device or Browserstack
- **Multi-warehouse:** Test warehouse transfers, stock balances offline
- **RBAC scenarios:** Test SELLER vs MANAGER vs ADMIN role restrictions

### Example Offline Test Pattern

```typescript
// tests/offline-sync.spec.ts
test('should sync product creation after going offline', async ({ page, context }) => {
  await page.goto('http://localhost:3000');
  
  // Go offline
  await context.setOffline(true);
  
  // Create product (should go to IndexedDB outbox)
  await page.fill('input[name="productName"]', 'Test Product');
  await page.click('button:text("Save")');
  
  // Verify outbox has pending sync
  const outbox = await page.evaluate(() => {
    return window.indexedDB.databases().then(dbs => /* check outbox */);
  });
  
  // Go online
  await context.setOffline(false);
  
  // Verify sync happened (check backend logs or verify UI updated)
  await page.waitForResponse(r => r.url().includes('/sync/push'));
});
```

---

## 2. PostgreSQL MCP (Database Debugging)

Enables Copilot to query the database schema, debug migration issues, and validate data during development.

### Installation

1. **PostgreSQL CLI tool:**
   ```bash
   # Linux/Mac
   brew install postgresql  # or apt install postgresql-client
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   # Or use psql via WSL
   ```

2. **Configure connection environment:**
   ```bash
   # Add to .env or shell profile
   export PGHOST=localhost
   export PGPORT=5432
   export PGUSER=postgres
   export PGPASSWORD=postgres  # Only in dev, never commit
   export PGDATABASE=inventory_dev
   ```

3. **MCP Server setup:**
   ```bash
   # If using custom MCP server, install via npm
   npm install -g @modelcontextprotocol/server-postgres
   
   # Or configure via IDE's MCP settings
   ```

### Common Queries for This Project

```sql
-- Check schema version (Flyway)
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

-- Check products table
SELECT * FROM products LIMIT 10;

-- Check stock movements
SELECT sm.id, sm.product_id, sm.warehouse_id, sm.quantity, sm.movement_type, sm.created_at
FROM stock_movements sm
ORDER BY sm.created_at DESC LIMIT 20;

-- Check pending outbox (if synced to backend)
SELECT * FROM sync_outbox WHERE status = 'pending' ORDER BY created_at;

-- Verify indices exist
SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Check user roles and permissions
SELECT u.id, u.username, u.role, u.created_at FROM users u;

-- Audit log (if implemented)
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20;
```

### IDE Configuration

**Cursor IDE:**
- Install PostgreSQL extension (if available)
- Configure in `.cursor/mcp-config.json`:
  ```json
  {
    "mcpServers": {
      "postgres": {
        "command": "psql",
        "args": [
          "-h", "localhost",
          "-U", "postgres",
          "-d", "inventory_dev"
        ]
      }
    }
  }
  ```

**GitHub Copilot CLI:**
- Check documentation for PostgreSQL MCP setup
- Typically: `copilot --mcp postgres`

---

## 3. Docker MCP (Container Management)

Enables Copilot to manage containers, view logs, inspect images, and troubleshoot deployment issues.

### Installation

1. **Docker CLI** (usually installed with Docker Desktop):
   ```bash
   docker --version  # Verify installed
   
   # On Linux, add user to docker group:
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **MCP Server setup:**
   ```bash
   # If using standalone Docker MCP server:
   npm install -g @modelcontextprotocol/server-docker
   
   # Or use Docker CLI directly via Copilot
   ```

### Common Commands via Copilot

```bash
# Container management
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f backend    # Follow backend logs
docker compose logs -f frontend   # Follow frontend logs
docker compose restart backend    # Restart backend only

# Container inspection
docker ps                         # List running containers
docker compose ps                 # List project containers
docker inspect inventory-postgres # View container details

# Debugging
docker compose exec backend bash                 # Shell into backend container
docker compose exec postgres psql -U postgres   # Shell into DB container
docker logs inventory-backend --tail 50         # Last 50 lines of backend logs
docker logs inventory-backend --since 5m        # Logs from last 5 minutes

# Image inspection
docker images | grep inventory    # List local images
docker image history inventory-backend:latest   # Image build history

# Network troubleshooting
docker network ls                 # List networks
docker network inspect inventory_default        # Inspect network (show connected containers)
docker compose run --rm backend curl http://postgres:5432  # Test connectivity

# Database backup/restore (from host)
docker compose exec postgres pg_dump -U postgres inventory_dev > backup.sql
docker compose exec -T postgres psql -U postgres inventory_dev < backup.sql

# Clear volumes and rebuild
docker compose down -v            # Remove containers AND volumes (data loss!)
docker compose up -d --build      # Rebuild images and start
```

### IDE Configuration

**Cursor IDE:**
- Install Docker extension for Cursor
- Configure in settings or `.cursor/mcp-config.json`

**GitHub Copilot CLI:**
- Docker MCP should be auto-detected if Docker is installed
- Test: `copilot --mcp docker` (if supported)

### Useful Container Metrics

```bash
# View resource usage
docker stats

# View container logs with timestamps
docker logs --timestamps inventory-backend

# Monitor PostgreSQL connections
docker compose exec postgres psql -U postgres -d inventory_dev -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Check disk usage of containers
docker system df
docker system df -v  # Verbose
```

---

## 4. Integration Summary

### Recommended MCP Priority

1. **Playwright (High):** Essential for testing offline functionality and PWA
2. **PostgreSQL (Medium):** Useful for migration debugging and data validation
3. **Docker (Medium):** Helpful for container troubleshooting and log inspection

### MCP Configuration per Tool

| Tool | Playwright | PostgreSQL | Docker | Notes |
|------|-----------|------------|--------|-------|
| **GitHub Copilot CLI** | ✅ Auto-detect | Manual setup | Auto-detect | Best overall support |
| **Cursor IDE** | ✅ Extension | Extension | Extension | Extensions available |
| **VS Code Copilot** | ✅ Extension | Extension | Extension | Install from marketplace |
| **Windsurf** | ✅ | Manual | Manual | Check documentation |

### Health Check Commands

```bash
# Verify all MCPs are working
playwright --version              # Should output Playwright version
psql --version                    # Should output PostgreSQL client version
docker --version                  # Should output Docker version

# Test MCP connectivity
# (depends on your Copilot implementation)
copilot --mcp-list                # List configured MCPs (if supported)
```

---

## Troubleshooting MCP Setup

### Playwright MCP not found
```bash
# Reinstall
cd frontend
pnpm remove playwright @playwright/test
pnpm add -D playwright @playwright/test
pnpm exec playwright install  # Install browser binaries
```

### PostgreSQL connection refused
```bash
# Check if database is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Verify connection
psql -h localhost -U postgres -d inventory_dev -c "SELECT 1;"
```

### Docker MCP not available
```bash
# Ensure Docker daemon is running
docker ps

# Verify Docker socket permissions (Linux)
ls -la /var/run/docker.sock
# Should have rwx for your user
```

---

**Note:** MCP servers require explicit configuration per development environment (CLI, IDE, editor). Each tool has different integration methods — consult your specific tool's documentation for exact setup steps. See `.github/copilot-instructions.md` for overall Copilot setup guidance.
