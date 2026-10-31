import { test, expect } from '@playwright/test';
import { readContent } from '../../scripts/read-content';
const c = readContent();
test.beforeEach(async ({ page, request }) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
  await page.goto('./#/viagem?visao=mapa');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
});

test('mapa acompanha a data do calendário, lacunas e pernoite em trânsito', async ({ page }) => {
  const map = page.getByRole('region', { name: 'Mapa da viagem', exact: true });
  await expect(map.getByRole('button', { name: 'Selecionar Beijing', exact: true })).toBeVisible();
  await page.getByLabel('Dia da viagem', { exact: true }).fill('2027-01-07');
  await expect(map.locator('.journey-map-detail h3')).toContainText('Chengdu');
  await page.getByRole('button', { name: 'Calendário', exact: true }).click();
  await expect(page.getByRole('button', { name: /7 de janeiro.*Chengdu/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Mapa', exact: true }).click();
  await page.getByLabel('Dia da viagem', { exact: true }).fill('2027-01-20');
  await expect(map).toContainText('Sem programação cadastrada');
  await expect(map.locator('.journey-day-link')).toHaveCount(0);
  await page.getByLabel('Dia da viagem', { exact: true }).fill('2027-01-27');
  await expect(map).toContainText('Noite em trânsito');
  await page.getByRole('button', { name: 'Toda a viagem', exact: true }).click();
  await expect(map.locator('.journey-marker')).toHaveCount(c.trip.cities.length);
  await page.getByRole('button', { name: 'Selecionar Doha', exact: true }).click();
  await expect(map.locator('.journey-map-detail h3')).toContainText('Doha');
  await expect(map).toContainText('Dias registrados nesta cidade');
  await expect(map.locator('.journey-city-routes')).toContainText('Confirmado');
});

test('base e roteiro funcionam offline em subpasta e 320 px sem rede externa', async ({
  page,
  context,
}, testInfo) => {
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4178') && !r.url().startsWith('data:'))
      external.push(r.url());
  });
  await context.setOffline(true);
  await page.reload();
  const map = page.getByRole('region', { name: 'Mapa da viagem', exact: true });
  await page.getByRole('button', { name: 'Selecionar Shanghai', exact: true }).click();
  await expect(map.locator('.journey-map-detail h3')).toContainText('Shanghai');
  await page.screenshot({ path: testInfo.outputPath('map-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.getByRole('button', { name: 'Selecionar Echigo-Yuzawa', exact: true }).click();
  await expect(map.locator('.journey-map-detail h3')).toContainText('Echigo-Yuzawa');
  await page.screenshot({ path: testInfo.outputPath('map-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(external).toEqual([]);
  await map.getByRole('link', { name: 'Ver programação do dia', exact: true }).click();
  await expect(page.getByLabel('Escolher dia')).toHaveValue('2027-01-19');
});
