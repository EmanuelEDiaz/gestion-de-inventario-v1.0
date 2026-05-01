import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: 'access_token',
      value: 'fake-token',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  await page.addInitScript(() => {
    const authState = {
      state: {
        user: {
          id: 'u1',
          username: 'admin',
          displayName: 'Administrador',
          role: { id: 'r1', name: 'ADMIN', code: 'ADMIN' },
        },
        refreshToken: 'fake-refresh',
        isAuthenticated: true,
      },
      version: 0,
    };

    localStorage.setItem('auth-storage', JSON.stringify(authState));
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('refresh_token', 'fake-refresh');

    class MockEventSource {
      onmessage: ((event: MessageEvent) => void) | null = null;
      private listeners: Record<string, Array<(event: MessageEvent) => void>> = {};

      constructor(_url: string) {
        setTimeout(() => {
          const evt = new MessageEvent('message', { data: 'new-notification' });
          this.onmessage?.(evt);
          (this.listeners.notification ?? []).forEach((fn) => fn(evt));
        }, 400);
      }

      addEventListener(type: string, listener: (event: MessageEvent) => void) {
        this.listeners[type] = this.listeners[type] ?? [];
        this.listeners[type].push(listener);
      }

      close() {}
    }

    // @ts-expect-error: test-only override
    window.EventSource = MockEventSource;
  });

  let unreadCalls = 0;
  let notifications = [
    {
      id: 'n1',
      type: 'SYSTEM_AUTO',
      category: 'SYSTEM',
      title: 'Tarea en segundo plano',
      body: 'Revisión automática',
      targetType: 'ALL',
      targetUserId: null,
      createdBy: null,
      entityType: null,
      entityId: null,
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: 'n2',
      type: 'USER_MANUAL',
      category: 'SALE',
      title: 'Venta registrada',
      body: 'Pedido #123',
      targetType: 'USER',
      targetUserId: 'u1',
      createdBy: 'u1',
      entityType: 'SALE',
      entityId: 's1',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ];

  await page.route('**/actuator/health', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }) });
  });

  await page.route('**/api/v1/notifications/unread-count', async (route) => {
    unreadCalls += 1;
    const count = unreadCalls > 1 ? 2 : 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(count),
    });
  });

  await page.route('**/api/v1/notifications?includeRead=*', async (route) => {
    const url = new URL(route.request().url());
    const includeRead = url.searchParams.get('includeRead') === 'true';
    const body = includeRead ? notifications : notifications.filter((n) => !n.read);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/v1/notifications/read-all', async (route) => {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    await route.fulfill({ status: 200, body: '' });
  });

  await page.route('**/api/v1/notifications/*/read', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });

  const incidents = [
    {
      id: 'inc-1',
      deviceId: 'dev-1',
      operationId: 'op-1',
      entityType: 'PRODUCT',
      entityId: 'prod-1',
      incidentType: 'ENTITY_DUPLICATE',
      status: 'PENDING',
      myPayload: '{"name":"Arroz local"}',
      serverPayload: '{"name":"Arroz servidor"}',
      resolution: null,
      userId: 'u1',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    },
    {
      id: 'inc-2',
      deviceId: 'dev-1',
      operationId: 'op-2',
      entityType: 'PRODUCT',
      entityId: 'prod-2',
      incidentType: 'STOCK_CONFLICT',
      status: 'PENDING',
      myPayload: null,
      serverPayload: null,
      resolution: null,
      userId: 'u1',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    },
  ];

  await page.route('**/api/v1/sync/incidents**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(incidents),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(incidents[0]),
    });
  });
});

test('criterio: SSE actualiza badge sin recargar y marcar leidas decrementa', async ({ page }) => {
  await page.goto(`${BASE}/notifications`);

  await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible();
  await expect(page.locator('span', { hasText: '2' }).first()).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Marcar todas como leídas' }).click();
  await expect(page.getByText('No hay notificaciones')).toBeVisible({ timeout: 5000 });
});

test('criterio: filtro de incidencias y resolver ENTITY_DUPLICATE con formulario precargado', async ({ page }) => {
  await page.goto(`${BASE}/sync/incidents`);

  await expect(page.getByRole('heading', { name: 'Incidentes de sincronización' })).toBeVisible();

  await page.getByTitle('Filtrar incidentes por tipo').selectOption('ENTITY_DUPLICATE');
  await expect(page.getByRole('table').getByText('Entidad duplicada')).toBeVisible();
  await expect(page.getByRole('table').getByText('Conflicto de stock')).toHaveCount(0);

  await page.getByRole('table').getByText('Entidad duplicada').first().click();
  await expect(page.getByText('Payload local')).toBeVisible();
  await expect(page.getByText('Arroz local')).toBeVisible();
  await expect(page.getByTitle('Escribe la resolución del conflicto de sincronización')).toBeVisible();
});
