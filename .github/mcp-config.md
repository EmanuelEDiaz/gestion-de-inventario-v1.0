# MCP Server Configuration

This document guides setup of Model Context Protocol (MCP) servers for enhanced Copilot capabilities.

## Playwright MCP (Recommended for Testing)

Enables Copilot to run, debug, and validate Playwright tests for e2e testing, PWA functionality, and offline scenarios.

### Quick Setup

1. **Ensure Playwright is installed:**
   ```bash
   cd frontend
   npm install --save-dev playwright @playwright/test
   ```

2. **Configure in your Copilot CLI or IDE:**
   - **GitHub Copilot CLI:** Add to your MCP server configuration
   - **Cursor:** Add to `.cursor/rules/` or configure via Cursor Settings
   - **VS Code Copilot:** Configure via extension settings

3. **Example Playwright test location:**
   ```
   frontend/e2e/                    # E2E tests directory
     login.spec.ts
     offline-sync.spec.ts
     dashboard.spec.ts
   ```

### Useful Test Commands

```bash
cd frontend

# Run all Playwright tests
pnpm exec playwright test

# Run tests in headed mode (watch browser)
pnpm exec playwright test --headed

# Run a single test file
pnpm exec playwright test e2e/login.spec.ts

# Debug mode (step through tests)
pnpm exec playwright test --debug
```

### Test Scenario Examples

- **Offline functionality:** Load app, go offline, verify cached data
- **Sync validation:** Create data offline, go online, verify sync
- **PWA installation:** Test service worker registration
- **Mobile PWA:** Test on iOS/Android via Browserstack or local device

See `e2e-tests.mjs` for existing test patterns.

## Other Available MCPs

Consider these for future enhancement:

- **Database MCPs:** PostgreSQL query tool for debugging schema issues
- **Docker MCP:** Container management for local dev environment
- **Git MCP:** Commit history analysis, blame, branch operations

---

**Note:** MCP servers require explicit configuration per development environment (CLI, IDE, editor). Consult your tool's documentation for integration steps.
