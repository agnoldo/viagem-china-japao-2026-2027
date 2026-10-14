import { test, expect } from '@playwright/test';
import { expectOperationalGallery } from './operational-gallery';
const base = 'http://127.0.0.1:4178/offline-check/';
test.beforeEach(async ({ request }) => {
  await request.get('http://127.0.0.1:4178/__qa?version=next');
});
test.afterEach(async ({ request }) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
});

test('Posts filtra por pasta, amplia e retorna à categoria ou a Todos', async ({
  page,
}, testInfo) => {
  await page.goto(base + '#/posts');
  await expect(page.locator('.post-item')).toHaveCount(3);
  await page.getByRole('link', { name: 'Teste China 2', exact: true }).click();
  await expect(page.locator('.post-item')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.post-item')).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('posts.png'), fullPage: true });
  await page.getByRole('link', { name: /Ampliar 01 metro/ }).click();
  await expect(page.locator('.post-viewer img')).toBeVisible();
  await page.getByRole('button', { name: 'Ampliar imagem' }).click();
  await expect(page.locator('.post-viewer-actual')).toBeVisible();
  await page.getByRole('link', { name: 'Voltar aos posts' }).click();
  await expect(page.locator('.post-item')).toHaveCount(2);
  await page.getByRole('link', { name: 'Todos 3', exact: true }).click();
  await page.getByRole('link', { name: /Ampliar 01 trem/ }).click();
  await page.getByRole('link', { name: 'Voltar aos posts' }).click();
  await expect(page.locator('.post-item')).toHaveCount(3);
  await page.getByRole('link', { name: 'Teste vazio 0', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Esta categoria ainda não tem prints' }),
  ).toBeVisible();
});

test('prints não visitados abrem offline e cache perdido é recuperado; cabe em 320 px', async ({
  page,
  context,
}, testInfo) => {
  await page.goto(base + '#/hoje');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(base + '#/posts?categoria=Teste%20Jap%C3%A3o');
  const image = reopened.locator('.post-gallery img');
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty('naturalWidth', 1100);
  await reopened.evaluate(async () => {
    const key = (await caches.keys()).find((key) => key.endsWith(':main'))!;
    const cache = await caches.open(key);
    for (const request of await cache.keys())
      if (new URL(request.url).pathname.includes('/posts/')) await cache.delete(request);
  });
  await reopened.reload();
  await expect(reopened.locator('.post-gallery img')).toHaveJSProperty('naturalWidth', 1100);
  await reopened.setViewportSize({ width: 320, height: 720 });
  await reopened.screenshot({ path: testInfo.outputPath('posts-320.png'), fullPage: true });
  expect(await reopened.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
  await reopened.getByRole('link', { name: /Ampliar 01 trem/ }).click();
  await reopened.getByRole('button', { name: 'Ampliar imagem' }).click();
  await expect(reopened.locator('.post-viewer img')).toHaveJSProperty('naturalWidth', 1100);
  expect(await reopened.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
});

test('galeria operacional acompanha uploads e não publica fixtures', async ({ page, request }) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
  await page.goto(base + '#/posts');
  const categories = await expectOperationalGallery(page);
  for (const category of categories) {
    await expect(
      page.getByRole('link', { name: `${category.title} ${category.images.length}`, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /Teste China/ })).toHaveCount(0);
  const populated = categories.find((category) => category.images.length > 0);
  if (populated) {
    await page
      .getByRole('link', { name: `${populated.title} ${populated.images.length}`, exact: true })
      .click();
    await expect(page.locator('.post-item')).toHaveCount(populated.images.length);
    await page.locator('.post-item a').first().click();
    await expect(page.locator('.post-viewer img')).toHaveJSProperty(
      'naturalWidth',
      populated.images[0].width,
    );
  }
  await page.goto(base + '#/posts/imagem/inexistente');
  await expect(page.getByRole('heading', { name: 'Print não encontrado' })).toBeVisible();
});
