import { test, expect } from '@playwright/test';
const base = 'http://127.0.0.1:4178/offline-check/';
test.beforeEach(async ({ request }) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
});
test('desktop mantém links web e Apple Maps sem interceptação nativa', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    });
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
  });
  await page.goto(base + '#/hotel/pan-pacific-beijing');
  await expect(page.getByRole('link', { name: 'AMap', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\/uri\.amap\.com\/search\?/,
  );
  await expect(page.getByRole('link', { name: 'Baidu Maps', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\/api\.map\.baidu\.com\/place\/search\?/,
  );
  await expect(page.getByRole('link', { name: 'Apple Maps', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\/maps\.apple\.com\/\?q=/,
  );
  await expect(page.getByRole('link', { name: 'Apple Maps', exact: true })).toHaveAttribute(
    'target',
    '_blank',
  );
});
for (const provider of [
  { label: 'AMap', pattern: 'https://uri.amap.com/**', host: 'uri.amap.com' },
  { label: 'Baidu Maps', pattern: 'https://map.baidu.com/**', host: 'map.baidu.com' },
]) {
  test(`iPadOS standalone simulado: ${provider.label} tenta o esquema e cai no web na mesma janela`, async ({
    page,
    context,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
      Object.defineProperty(navigator, 'standalone', { get: () => true });
      const match = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const result = match(query);
        if (query === '(display-mode: standalone)')
          Object.defineProperty(result, 'matches', { value: true });
        return result;
      };
    });
    let requests = 0;
    await page.route(provider.pattern, async (route) => {
      requests++;
      await route.fulfill({ contentType: 'text/html', body: '<h1>Fallback web recebido</h1>' });
    });
    await page.goto(base + '#/hotel/pan-pacific-beijing');
    await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.matchMedia('(display-mode: standalone)').matches)).toBe(
      true,
    );
    const link = page.getByRole('link', { name: provider.label, exact: true });
    const href = await link.getAttribute('href');
    expect(new URL(href!).hostname).toBe(provider.host);
    const started = Date.now();
    await link.click();
    await expect(page.getByRole('heading', { name: 'Fallback web recebido' })).toBeVisible();
    expect(Date.now() - started).toBeGreaterThanOrEqual(1000);
    expect(requests).toBe(1);
    expect(context.pages()).toHaveLength(1);
    expect(new URL(page.url()).hostname).toBe(provider.host);
  });
}
