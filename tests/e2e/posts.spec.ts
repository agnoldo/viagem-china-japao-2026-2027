import { test, expect, type Page } from '@playwright/test';
import { expectOperationalGallery } from './operational-gallery';
const base = 'http://127.0.0.1:4178/offline-check/';
type Point = { x: number; y: number };
async function touchEvents(
  page: Page,
  events: { type: string; points: Point[]; changed?: Point[] }[],
) {
  // DOM gesture simulation works in both desktop Chromium and WebKit; not a physical iPhone test.
  await page.locator('.post-viewer').evaluate((viewer, sequence) => {
    for (const step of sequence) {
      const event = new Event(step.type, { bubbles: true });
      const points = (values: { x: number; y: number }[]) =>
        values.map((point) => ({ clientX: point.x, clientY: point.y }));
      Object.defineProperties(event, {
        touches: { value: points(step.points) },
        changedTouches: { value: points(step.changed ?? step.points) },
      });
      viewer.dispatchEvent(event);
    }
  }, events);
}
async function swipe(page: Page, dx: number, dy = 0) {
  await touchEvents(page, [
    { type: 'touchstart', points: [{ x: 180, y: 180 }] },
    { type: 'touchmove', points: [{ x: 180 + dx, y: 180 + dy }] },
    { type: 'touchend', points: [], changed: [{ x: 180 + dx, y: 180 + dy }] },
  ]);
}
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

test('swipe respeita categoria e limites; botões e teclado navegam em Todos', async ({ page }) => {
  await page.goto(base + '#/posts?categoria=Teste%20China');
  await page.getByRole('link', { name: /Ampliar 01 metro/ }).click();
  const pager = page.getByRole('navigation', { name: 'Navegação entre imagens' });
  await expect(pager).toContainText('1 de 2');
  await expect(page.getByRole('button', { name: 'Imagem anterior' })).toBeDisabled();
  await swipe(page, 100);
  await expect(pager).toContainText('1 de 2');
  await swipe(page, -100);
  await expect(pager).toContainText('2 de 2');
  await expect(page.locator('h1')).toHaveText('02 restaurante');
  await expect(page.getByRole('button', { name: 'Próxima imagem' })).toBeDisabled();
  await swipe(page, -100);
  await expect(pager).toContainText('2 de 2');
  await swipe(page, 100);
  await expect(pager).toContainText('1 de 2');
  await page.getByRole('link', { name: 'Voltar aos posts' }).click();
  await expect(page.getByRole('link', { name: 'Teste China 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('link', { name: 'Todos 3', exact: true }).click();
  await page.getByRole('link', { name: /Ampliar 02 restaurante/ }).click();
  await expect(pager).toContainText('2 de 3');
  await page.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(page.locator('h1')).toHaveText('01 trem');
  await page.locator('.post-viewer').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(pager).toContainText('2 de 3');
  await page.locator('.post-viewer').focus();
  await page.keyboard.press('ArrowRight');
  await expect(pager).toContainText('3 de 3');
  await page.getByRole('link', { name: 'Voltar aos posts' }).click();
  await expect(page.locator('.post-item')).toHaveCount(3);
});

test('rolagem, gesto curto, multitoque, cancelamento e zoom não trocam o print', async ({
  page,
}) => {
  await page.goto(base + '#/posts?categoria=Teste%20China');
  await page.getByRole('link', { name: /Ampliar 01 metro/ }).click();
  const pager = page.getByRole('navigation', { name: 'Navegação entre imagens' });
  await swipe(page, -20);
  await expect(pager).toContainText('1 de 2');
  await swipe(page, -20, 100);
  await expect(pager).toContainText('1 de 2');
  await touchEvents(page, [
    { type: 'touchstart', points: [{ x: 180, y: 180 }] },
    { type: 'touchmove', points: [{ x: 180, y: 210 }] },
    { type: 'touchend', points: [], changed: [{ x: 60, y: 210 }] },
  ]);
  await expect(pager).toContainText('1 de 2');
  await touchEvents(page, [
    { type: 'touchstart', points: [{ x: 180, y: 180 }] },
    {
      type: 'touchmove',
      points: [
        { x: 160, y: 180 },
        { x: 200, y: 180 },
      ],
    },
    { type: 'touchend', points: [], changed: [{ x: 60, y: 180 }] },
  ]);
  await expect(pager).toContainText('1 de 2');
  await touchEvents(page, [
    { type: 'touchstart', points: [{ x: 180, y: 180 }] },
    { type: 'touchcancel', points: [] },
    { type: 'touchend', points: [], changed: [{ x: 60, y: 180 }] },
  ]);
  await expect(pager).toContainText('1 de 2');
  await page.getByRole('button', { name: 'Ampliar imagem' }).click();
  await swipe(page, -100);
  await expect(pager).toContainText('1 de 2');
  await page.getByRole('button', { name: 'Ajustar à tela' }).click();
  await swipe(page, -100);
  await expect(pager).toContainText('2 de 2');
});

test('swipe funciona offline e navegação cabe em 320 px', async ({ page, context }, testInfo) => {
  await page.goto(base + '#/posts?categoria=Teste%20China');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('link', { name: /Ampliar 01 metro/ }).click();
  await swipe(page, -100);
  await expect(page.locator('h1')).toHaveText('02 restaurante');
  await expect(page.locator('.post-viewer img')).toHaveJSProperty('naturalWidth', 1100);
  await page.screenshot({ path: testInfo.outputPath('swipe-viewer.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.screenshot({ path: testInfo.outputPath('swipe-viewer-320.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Navegação entre imagens' })).toContainText(
    '2 de 2',
  );
});
