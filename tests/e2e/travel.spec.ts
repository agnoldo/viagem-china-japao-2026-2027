import { test, expect, type Page } from '@playwright/test';
import { readContent } from '../../scripts/read-content';
const content = readContent();
const firstDay = content.days[0];
const firstCity = content.trip.cities.find((c) => c.id === firstDay.cityId)!.name.default;
const lastDay = content.days[content.days.length - 1];
const lastCity = content.trip.cities.find((c) => c.id === lastDay.cityId)!.name.default;
const base = 'http://127.0.0.1:4178/offline-check/';
async function installed(page: Page) {
  await page.goto(base);
  await expect(page.locator('h1')).toContainText(firstCity);
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
  await expect(page).toHaveTitle('China e Japão 2027');
  const airport = content.places.find((p) => p.category === 'airport')!;
  await page.goto(base + `#/local/${airport.id}`);
  await expect(
    page.getByRole('heading', { name: airport.name.default, exact: true }),
  ).toBeVisible();
  const apple = page.getByRole('link', { name: 'Apple Maps', exact: true });
  await expect(apple).toHaveAttribute('target', '_blank');
  expect(await apple.getAttribute('href')).toMatch(/^https:/);
  await page.getByRole('link', { name: 'Endereço local', exact: true }).click();
  await expect(page.locator('.big-address')).toContainText(airport.name.local!);
  await page.getByRole('button', { name: 'Copiar nome e endereço' }).click();
  await expect(page.getByRole('status', { name: 'Resultado da cópia' })).toContainText(
    /copiado|Selecione/,
  );
  for (const route of [
    ...content.hotels.map((h) => `#/hotel/${h.id}`),
    ...content.places.map((p) => `#/local/${p.id}`),
    ...content.trains.map((t) => `#/trecho/${t.id}`),
    ...content.flights.map((f) => `#/trecho/${f.id}`),
  ]) {
    await page.goto(base + route);
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.goto(base + '#/trecho/flight-shanghai-tokyo-2027-01-18');
  await expect(page.getByText('Asia/Shanghai', { exact: true })).toBeVisible();
  await expect(page.getByText('Asia/Tokyo', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aeroporto a definir', exact: true }),
  ).toBeVisible();
  await page.goto(base + '#/viagem');
  await expect(page.locator('.trip-day')).toHaveCount(content.days.length);
  await expect(page.locator('.alternative-panel')).toHaveCount(content.trip.alternatives.length);
  await page.goto(base + `#/buscar?q=${encodeURIComponent(airport.name.local!)}`);
  await expect(page.getByRole('link', { name: new RegExp(airport.name.default) })).toBeVisible();
  await page.goto(base + '#/cidades');
  await expect(page.getByRole('heading', { name: 'Cidades e regiões' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test('reabre sem rede e navega por todos os dias e cidades registrados', async ({
  page,
  context,
}) => {
  await installed(page);
  expect((await health(page)).ready).toBe(true);
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.clock.install({ time: new Date('2026-10-14T12:00:00Z') });
  await reopened.goto(base);
  await expect(reopened.locator('h1')).toContainText(firstCity);
  for (const { date } of content.days) {
    await reopened.goto(base + `#/hoje/${date}`);
    await expect(reopened.getByLabel('Escolher dia')).toHaveValue(date);
    await expect(reopened.locator('h1')).toBeVisible();
    if (content.days.find((d) => d.date === date)!.overnightInTransit) {
      await expect(reopened.locator('.stay-panel')).toContainText('Noite em trânsito');
      await expect(reopened.locator('.stay-panel').getByRole('link')).toHaveCount(0);
      await expect(reopened.locator('.stay-panel')).not.toContainText('Hospedagem a definir');
    }
  }
  for (const { id } of content.trip.cities) {
    await reopened.goto(base + `#/cidades/${id}`);
    await expect(reopened.locator('h1')).toBeVisible();
  }
  for (const route of content.trains.filter((t) => t.from.timezone === 'Asia/Shanghai')) {
    await reopened.goto(base + `#/trecho/${route.id}`);
    await expect(
      reopened.getByRole('heading', { name: 'Estação a definir', exact: true }),
    ).toHaveCount(2);
    await expect(reopened.locator('.status-planned')).toBeVisible();
  }
  await reopened.goto(base + '#/trecho/zhangjiajie-shanghai-2027-01-14');
  await expect(
    reopened.getByRole('heading', { name: 'Aeroporto a definir', exact: true }),
  ).toHaveCount(2);
  await reopened.goto(base + '#/local/chengdu-panda-base');
  await expect(reopened.getByRole('link', { name: 'Baidu Maps', exact: true })).toHaveAttribute(
    'href',
    /region=|querytype=s/,
  );
  await reopened.getByRole('link', { name: 'Endereço local', exact: true }).click();
  await expect(reopened.locator('.big-address')).toContainText('成都大熊猫繁育研究基地');
  expect(
    await reopened.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await reopened.goto(base + '#/hotel/pan-pacific-beijing');
  await expect(reopened.locator('h1')).toHaveText('Pan Pacific Beijing');
  await expect(reopened.getByText('Check-in:', { exact: false })).toContainText(
    '31 de dezembro · 15:00',
  );
  await expect(reopened.getByText('Check-out:', { exact: false })).toContainText(
    '4 de janeiro · 12:00',
  );
  await expect(reopened.getByRole('link', { name: 'AMap', exact: true })).toHaveAttribute(
    'href',
    /^https:/,
  );
  await reopened.getByRole('link', { name: 'Endereço local', exact: true }).click();
  await expect(reopened.locator('.big-address')).toContainText('北京泛太平洋酒店');
  await expect(reopened.locator('.big-address')).toContainText('华远街2号');
  await reopened.getByRole('button', { name: 'Copiar nome e endereço' }).click();
  await expect(reopened.getByRole('status', { name: 'Resultado da cópia' })).toContainText(
    /copiado|Selecione/,
  );
  await reopened.goto(base + '#/hotel/ueno-woo-hotel');
  await expect(reopened.locator('h1')).toHaveText('Ueno Woo Hotel');
  await expect(reopened.getByText('Check-in:', { exact: false })).toContainText(
    '18 de janeiro · 15:00–21:00',
  );
  await expect(reopened.getByText('Check-out:', { exact: false })).toContainText(
    '19 de janeiro · 11:00',
  );
  await reopened.goto(base + '#/hoje/2027-01-18');
  await expect(reopened.locator('.stay-panel')).toContainText('Ueno Woo Hotel');
  await reopened.goto(base + '#/hoje/2027-01-19');
  await expect(reopened.locator('.stay-panel')).toContainText('Resort · nome a registrar');
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
      if (new URL(request.url).pathname.endsWith('.js')) await cache.delete(request);
  });
  await page.reload();
  await expect(page.locator('h1')).toContainText(firstCity);
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
  await expect(page.locator('h1')).toContainText(firstCity);
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
  await expect(page.locator('h1')).toContainText(firstCity);
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
  const reportAfterUpdate = await health(page);
  expect(reportAfterUpdate).toMatchObject({ ready: true });
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  expect(reportAfterUpdate.version).not.toBe(old);
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
  await page.goto(base + `#/hoje/${lastDay.date}`);
  await expect(page.locator('h1')).toContainText(lastCity);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto(base + '#/mais');
  await expect(page.getByRole('button', { name: 'Verificar offline', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Verificar offline', exact: true }).click();
  await expect(
    page.getByRole('status', { name: 'Resultado da verificação offline' }),
  ).toContainText('Pronto para teste');
});

test('controlador instalado confirma offline mesmo se reinscrição falhar', async ({
  page,
  context,
}) => {
  await installed(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator.serviceWorker, 'register', {
      value: () => Promise.reject(new Error('Simulação de reinscrição sem rede')),
    });
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toHaveCount(0);
  // Sem rede é o rótulo prioritário; title comprova a auditoria do cache, independente de register.
  await expect(page.locator('.connection')).toHaveAttribute('title', 'Conteúdo disponível offline');
  expect((await health(page)).ready).toBe(true);
});

test('hospedagem reservada sem nome não inventa endereço ou datas', async ({ page }) => {
  await installed(page);
  const hotel = content.hotels.find((h) => h.name.default === null)!;
  await page.goto(base + `#/hotel/${hotel.id}`);
  await expect(page.locator('h1')).toContainText('nome a registrar');
  await expect(page.locator('.status-confirmed')).toBeVisible();
  await expect(page.getByText('Check-out: A definir', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Endereço local', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copiar nome e endereço' })).toBeDisabled();
  await page.goto(base + `#/hoje/${firstDay.date}`);
  await expect(page.getByText('Plano parcial.', { exact: true })).toBeVisible();
  await expect(page.locator('.stay-panel')).toContainText('Noite em trânsito');
  await page.goto(base + '#/hoje/2027-01-04');
  await expect(page.locator('.stay-panel')).toContainText('Hospedagem a definir');
});

test('voos da família e conexões permanecem completos offline', async ({ page, context }) => {
  await installed(page);
  await context.setOffline(true);
  await page.goto(base + '#/logistica?tipo=flight');
  await expect(page.getByRole('region', { name: 'Conexão entre voos' })).toContainText(
    'Conexão curta · 45 min',
  );
  await page.goto(base + '#/trecho/flight-qr809-2027-01-27');
  await expect(
    page.getByRole('heading', { name: 'NRT · Tokyo Narita International Airport' }),
  ).toBeVisible();
  await expect(page.getByText('Terminal 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Mesmo voo para os 4 viajantes.', { exact: true })).toBeVisible();
  await expect(page.getByText('Bagagem despachada:', { exact: false })).toContainText(
    '2 volumes por passageiro',
  );
  await expect(page.getByRole('region', { name: 'Conexão entre voos' })).toContainText(
    '28 de janeiro às 00:25',
  );
  await page.getByRole('link', { name: 'Ver próximo voo · QR785' }).click();
  await expect(page.getByRole('region', { name: 'Conexão entre voos' })).toContainText(
    'Terminal 3 → terminal 2',
  );
  await page.getByRole('link', { name: 'Ver próximo voo · QR4834' }).click();
  await expect(page.getByText('Operado por:', { exact: false })).toContainText(
    'LATAM AIRLINES BRASIL',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
