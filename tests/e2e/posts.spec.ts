import { test, expect, type Page } from '@playwright/test';
import { expectOperationalGallery } from './operational-gallery';
const base = 'http://127.0.0.1:4178/offline-check/';
type Point = { x: number; y: number };
async function touchEvents(
  page: Page,
  events: { type: string; points: Point[]; changed?: Point[] }[],
) {
  // DOM gesture simulation does not replace a physical iPhone check.
  await page.locator('.post-lightbox-stage').evaluate((viewer, sequence) => {
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

test('galeria abre tela cheia sem mudar URL e fecha preservando categoria, foco e rolagem', async ({
  page,
}, testInfo) => {
  await page.goto(base + '#/posts');
  await expect(page.locator('.post-item')).toHaveCount(3);
  await page.getByRole('link', { name: 'Teste China 2', exact: true }).click();
  await page.reload();
  await expect(page.locator('.post-item')).toHaveCount(2);
  await expect(page.locator('.post-item figcaption')).toHaveCount(0);
  const opener = page.getByRole('button', { name: /Ampliar 01 metro/ });
  await opener.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => ({ y: scrollY, url: location.href }));
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Visualizador de imagens' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', '01 metro');
  expect(page.url()).toBe(before.url);
  const box = await dialog.boundingBox();
  expect(Math.round(box!.width)).toBe(page.viewportSize()!.width);
  expect(Math.round(box!.height)).toBe(page.viewportSize()!.height);
  await page.screenshot({ path: testInfo.outputPath('lightbox.png'), fullPage: false });
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.getByRole('button', { name: 'Fechar imagens' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before.y, 0);
  await expect(page.getByRole('link', { name: 'Teste China 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('link', { name: 'Todos 3', exact: true }).click();
  await page.getByRole('button', { name: /Ampliar 01 trem/ }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.post-item')).toHaveCount(3);
  await page.getByRole('link', { name: 'Teste vazio 0', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Esta categoria ainda não tem prints' }),
  ).toBeVisible();
});

test('prints não visitados abrem em tela cheia offline e cache perdido é recuperado', async ({
  page,
  context,
}) => {
  await page.goto(base + '#/hoje');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(base + '#/posts?categoria=Teste%20Jap%C3%A3o');
  await expect(reopened.locator('.post-gallery img')).toHaveJSProperty('naturalWidth', 1100);
  await reopened.evaluate(async () => {
    const key = (await caches.keys()).find((key) => key.endsWith(':main'))!;
    const cache = await caches.open(key);
    for (const request of await cache.keys())
      if (new URL(request.url).pathname.includes('/posts/')) await cache.delete(request);
  });
  await reopened.reload();
  await reopened.getByRole('button', { name: /Ampliar 01 trem/ }).click();
  await expect(reopened.locator('.post-lightbox-stage img')).toHaveJSProperty('naturalWidth', 1100);
  await expect(reopened.getByRole('button', { name: 'Próxima imagem' })).toHaveCount(0);
  await expect(reopened.getByRole('status', { name: 'Posição da imagem' })).toHaveText('1 de 1');
  await reopened.keyboard.press('Escape');
  expect(await reopened.evaluate(() => document.body.style.overflow)).toBe('');
});

test('galeria operacional acompanha uploads e rotas antigas voltam para a galeria', async ({
  page,
  request,
}) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
  await page.goto(base + '#/posts');
  const categories = await expectOperationalGallery(page);
  for (const category of categories)
    await expect(
      page.getByRole('link', { name: `${category.title} ${category.images.length}`, exact: true }),
    ).toBeVisible();
  await expect(page.getByRole('link', { name: /Teste China/ })).toHaveCount(0);
  const populated = categories.find((category) => category.images.length > 0);
  if (populated) {
    await page
      .getByRole('link', { name: `${populated.title} ${populated.images.length}`, exact: true })
      .click();
    await page.locator('.post-item').first().click();
    await expect(page.locator('.post-lightbox-stage img')).toHaveJSProperty(
      'naturalWidth',
      populated.images[0].width,
    );
    await page.getByRole('button', { name: 'Fechar imagens' }).click();
  }
  await page.goto(base + '#/posts/imagem/inexistente');
  await expect(page).toHaveURL(base + '#/posts');
  await expectOperationalGallery(page);
});

test('swipe, botões e teclado percorrem o filtro sem sair da galeria', async ({ page }) => {
  await page.goto(base + '#/posts?categoria=Teste%20China');
  await page.getByRole('button', { name: /Ampliar 01 metro/ }).click();
  const counter = page.getByRole('status', { name: 'Posição da imagem' });
  await expect(counter).toHaveText('1 de 2');
  await expect(page.getByRole('button', { name: 'Imagem anterior' })).toBeDisabled();
  await swipe(page, 100);
  await expect(counter).toHaveText('1 de 2');
  await swipe(page, -100);
  await expect(counter).toHaveText('2 de 2');
  await expect(page.locator('.post-lightbox-stage img')).toHaveAttribute('alt', '02 restaurante');
  await expect(page.getByRole('button', { name: 'Próxima imagem' })).toBeDisabled();
  await swipe(page, -100);
  await expect(counter).toHaveText('2 de 2');
  await swipe(page, 100);
  await expect(counter).toHaveText('1 de 2');
  await page.getByRole('button', { name: 'Fechar imagens' }).click();
  await page.getByRole('link', { name: 'Todos 3', exact: true }).click();
  await page.getByRole('button', { name: /Ampliar 02 restaurante/ }).click();
  await expect(counter).toHaveText('2 de 3');
  await page.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(page.locator('.post-lightbox-stage img')).toHaveAttribute('alt', '01 trem');
  expect(
    await page.getByRole('dialog').evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText('2 de 3');
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('3 de 3');
  await expect(page).toHaveURL(base + '#/posts');
  await page.keyboard.press('Escape');
  await expect(page.locator('.post-item')).toHaveCount(3);
});

test('gestos curtos, verticais, multitoque, cancelamento e zoom não trocam o print', async ({
  page,
}) => {
  await page.goto(base + '#/posts?categoria=Teste%20China');
  await page.getByRole('button', { name: /Ampliar 01 metro/ }).click();
  const counter = page.getByRole('status', { name: 'Posição da imagem' });
  await swipe(page, -20);
  await expect(counter).toHaveText('1 de 2');
  await swipe(page, -20, 100);
  await expect(counter).toHaveText('1 de 2');
  await touchEvents(page, [
    { type: 'touchstart', points: [{ x: 180, y: 180 }] },
    { type: 'touchmove', points: [{ x: 180, y: 210 }] },
    { type: 'touchend', points: [], changed: [{ x: 60, y: 210 }] },
  ]);
  await expect(counter).toHaveText('1 de 2');
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
  await expect(counter).toHaveText('1 de 2');
  await touchEvents(page, [
    { type: 'touchstart', points: [{ x: 180, y: 180 }] },
    { type: 'touchcancel', points: [] },
    { type: 'touchend', points: [], changed: [{ x: 60, y: 180 }] },
  ]);
  await expect(counter).toHaveText('1 de 2');
  await page.evaluate(() =>
    Object.defineProperty(visualViewport!, 'scale', { configurable: true, value: 2 }),
  );
  await swipe(page, -100);
  await expect(counter).toHaveText('1 de 2');
  await page.evaluate(() => Reflect.deleteProperty(visualViewport!, 'scale'));
  await swipe(page, -100);
  await expect(counter).toHaveText('2 de 2');
});

test('tela cheia e swipe funcionam offline em 320 px sem mostrar menus do aplicativo', async ({
  page,
  context,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(base + '#/posts?categoria=Teste%20China');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: /Ampliar 01 metro/ }).click();
  await swipe(page, -100);
  const viewer = page.getByRole('dialog', { name: 'Visualizador de imagens' });
  await expect(page.locator('.post-lightbox-stage img')).toHaveJSProperty('naturalWidth', 1100);
  const box = await viewer.boundingBox();
  expect(Math.round(box!.width)).toBe(320);
  expect(Math.round(box!.height)).toBe(720);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  expect(
    await viewer.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return (
        document.elementFromPoint(rect.width / 2, rect.height - 10)?.closest('dialog') === node
      );
    }),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('lightbox-320.png'), fullPage: false });
  await page.getByRole('button', { name: 'Fechar imagens' }).click();
  await page.reload();
  await expect(viewer).toHaveCount(0);
  await expect(page.locator('.post-item')).toHaveCount(2);
});
