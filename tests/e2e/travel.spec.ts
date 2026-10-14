import { test, expect, type Page } from '@playwright/test';
const base = 'http://127.0.0.1:4178/offline-check/';
async function installed(page: Page) {
  await page.goto(base);
  await expect(page.locator('h1')).toContainText('Belo Horizonte');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
}
async function health(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ ready: boolean; version: string }>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => resolve(e.data);
        navigator.serviceWorker.controller!.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]);
      }),
  );
}
test.beforeEach(async ({ request, page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00Z') });
  await request.get('http://127.0.0.1:4178/__qa?version=current');
});
test('roteiro, locais e endereços acessíveis sem assets externos', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4178') && !r.url().startsWith('data:'))
      external.push(r.url());
  });
  await installed(page);
  await page.goto(base + '#/hoje/2027-01-01');
  await expect(page.getByRole('heading', { name: 'Beijing 北京' })).toBeVisible();
  await expect(page.getByText('08:00', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Ver detalhes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cidade Proibida', exact: true })).toBeVisible();
  for (const name of ['Apple Maps', 'AMap', 'Baidu Maps']) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    expect(await link.getAttribute('href')).toMatch(/^https:/);
  }
  await page.getByRole('link', { name: 'Endereço local', exact: true }).click();
  await expect(page.locator('.big-address')).toContainText('北京市东城区景山前街4号');
  await page.getByRole('button', { name: 'Copiar nome e endereço' }).click();
  await expect(page.getByRole('status')).toContainText(/copiado|Selecione/);
  for (const route of [
    '#/hotel/beijing-example-hotel',
    '#/local/beijing-west',
    '#/local/pek-airport',
    '#/trecho/beijing-xian-example',
    '#/trecho/shanghai-tokyo-example',
  ]) {
    await page.goto(base + route);
    await expect(page.locator('h1')).toBeVisible();
  }
  await expect(page.getByText('Asia/Shanghai', { exact: true })).toBeVisible();
  await expect(page.getByText('Asia/Tokyo', { exact: true })).toBeVisible();
  await page.goto(base + '#/viagem');
  await expect(page.getByRole('heading', { name: 'Depois da neve: Fuji ou Osaka?' })).toBeVisible();
  await expect(page.locator('.trip-day')).toHaveCount(30);
  await page.goto(base + '#/buscar?q=故宫');
  await expect(page.getByRole('link', { name: /Cidade Proibida/ })).toBeVisible();
  await page.goto(base + '#/cidades');
  await expect(page.getByRole('heading', { name: 'Cidades e regiões' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test('reabre sem rede e navega pelos 30 dias e todas as cidades', async ({ page, context }) => {
  await installed(page);
  expect((await health(page)).ready).toBe(true);
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.clock.install({ time: new Date('2026-10-14T12:00:00Z') });
  await reopened.goto(base);
  await expect(reopened.locator('h1')).toContainText('Belo Horizonte');
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.UTC(2026, 11, 29 + i)).toISOString().slice(0, 10);
    await reopened.goto(base + `#/hoje/${date}`);
    await expect(reopened.getByRole('textbox', { name: 'Escolher dia' })).toHaveValue(date);
    await expect(reopened.locator('h1')).toBeVisible();
  }
  for (const id of [
    'beijing',
    'xian',
    'chengdu',
    'chongqing',
    'zhangjiajie',
    'shanghai',
    'tokyo',
    'echigo-yuzawa',
    'fuji-area',
    'osaka',
  ]) {
    await reopened.goto(base + `#/cidades/${id}`);
    await expect(reopened.locator('h1')).toBeVisible();
  }
  await reopened.goto(base + '#/logistica');
  await expect(reopened.getByRole('heading', { name: 'Voos', exact: true })).toBeVisible();
  await reopened.reload();
  await expect(reopened.getByRole('heading', { name: 'Logística', exact: true })).toBeVisible();
});
test('recupera entrada e cache perdidos por cópia redundante', async ({ page, context }) => {
  await installed(page);
  await context.setOffline(true);
  await page.evaluate(async () => {
    const key = (await caches.keys()).find((k) => k.endsWith(':main'))!;
    const cache = await caches.open(key);
    for (const request of await cache.keys())
      if (request.url.endsWith('.js')) await cache.delete(request);
  });
  await page.reload();
  await expect(page.locator('h1')).toContainText('Belo Horizonte');
  expect((await health(page)).ready).toBe(true);
  await page.evaluate(async () => {
    for (const key of await caches.keys()) if (key.endsWith(':rescue')) await caches.delete(key);
  });
  await page.reload();
  expect((await health(page)).ready).toBe(true);
  await page.evaluate(async () => {
    for (const key of await caches.keys()) if (key.endsWith(':main')) await caches.delete(key);
  });
  await page.reload();
  await expect(page.locator('h1')).toContainText('Belo Horizonte');
  expect((await health(page)).ready).toBe(true);
});
test('instalação interrompida preserva versão; atualização e rollback exigem ação', async ({
  page,
  request,
  context,
}) => {
  await installed(page);
  const old = (await health(page)).version;
  await request.get('http://127.0.0.1:4178/__qa?version=next&interrupt=yes');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg!.update();
  });
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !reg?.installing;
  });
  expect((await health(page)).version).toBe(old);
  await expect(page.getByRole('button', { name: 'Atualizar agora' })).toHaveCount(0);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toContainText('Belo Horizonte');
  await context.setOffline(false);
  await request.get('http://127.0.0.1:4178/__qa?version=next');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg!.update();
  });
  await expect(page.getByRole('button', { name: 'Atualizar agora' })).toBeVisible();
  expect((await health(page)).version).toBe(old);
  await page.getByRole('button', { name: 'Atualizar agora' }).click();
  await expect(page.locator('meta[name="qa-version"]')).toHaveAttribute('content', 'next');
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  expect((await health(page)).version).not.toBe(old);
  await request.get('http://127.0.0.1:4178/__qa?version=current');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg!.update();
  });
  await expect(page.getByRole('button', { name: 'Atualizar agora' })).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar agora' }).click();
  await expect(page.locator('meta[name="qa-version"]')).toHaveCount(0);
  expect((await health(page)).version).toBe(old);
});
test('sem estado local mantém navegação e layout utilizável', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new Error('Blocked');
      },
    });
  });
  await installed(page);
  await page.goto(base + '#/hoje/2027-01-18');
  await expect(page.locator('h1')).toContainText('Echigo-Yuzawa');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto(base + '#/mais');
  await expect(page.getByRole('button', { name: 'Verificar offline', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Verificar offline', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Pronto para teste');
});
