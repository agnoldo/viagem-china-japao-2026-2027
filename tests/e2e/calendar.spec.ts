import { test, expect } from '@playwright/test';
import { readContent } from '../../scripts/read-content';

const content = readContent();
test.beforeEach(async ({ page, request }) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
  await page.goto('./#/viagem');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
});

test('calendário abre janeiro, preserva lacunas e alterna para a lista', async ({ page }) => {
  const calendar = page.getByRole('region', { name: 'Calendário da viagem', exact: true });
  await expect(calendar.getByRole('heading', { name: 'janeiro de 2027' })).toBeVisible();
  await expect(calendar.locator('.calendar-day')).toHaveCount(28);
  await expect(calendar.locator('.calendar-gap')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
  await calendar.getByRole('button', { name: /20 de janeiro.*Sem programação cadastrada/ }).click();
  const summary = page.getByRole('region', { name: 'Resumo do dia selecionado' });
  await expect(summary).toContainText('Cidade, hospedagem e atividades permanecem em aberto');
  await expect(summary.getByRole('link')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await expect(page.locator('.trip-day')).toHaveCount(content.days.length);
  await page.getByRole('button', { name: 'Calendário', exact: true }).click();
  await expect(summary).toContainText('20 de janeiro');
  await page.reload();
  await expect(
    calendar.getByRole('button', { name: /20 de janeiro.*Sem programação cadastrada/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('mostra propostas, reservas e trânsito sem inventar hospedagens', async ({ page }) => {
  const calendar = page.getByRole('region', { name: 'Calendário da viagem', exact: true });
  const summary = page.getByRole('region', { name: 'Resumo do dia selecionado' });
  await calendar.getByRole('button', { name: /18 de janeiro.*Tokyo/ }).click();
  await expect(summary).toContainText('Ueno Woo Hotel');
  await expect(summary.locator('.calendar-route .status')).toHaveText('Planejado');
  await expect(summary.locator('.calendar-stay .status')).toHaveText('Confirmado');
  await page.getByRole('button', { name: 'Mês anterior' }).click();
  await expect(calendar.getByRole('heading', { name: 'dezembro de 2026' })).toBeVisible();
  await expect(calendar.locator('.calendar-day')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Mês anterior' })).toBeDisabled();
  await calendar.getByRole('button', { name: /30 de dezembro.*Noite em trânsito/ }).click();
  await expect(summary).toContainText('Noite em trânsito · sem pernoite em hotel');
  await expect(summary).not.toContainText('Hospedagem a definir');
  await summary.getByRole('link', { name: 'Ver programação do dia' }).click();
  await expect(page.getByLabel('Escolher dia')).toHaveValue('2026-12-30');
});

test('reabre calendário offline em subpasta, navega e cabe em 320 px', async ({
  page,
  context,
}, testInfo) => {
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  const calendar = page.getByRole('region', { name: 'Calendário da viagem', exact: true });
  await calendar.getByRole('button', { name: /7 de janeiro.*Chengdu/ }).click();
  await expect(calendar.getByRole('button', { name: /7 de janeiro.*Chengdu/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('region', { name: 'Resumo do dia selecionado' })).toContainText(
    'Chengdu',
  );
  await page.screenshot({ path: testInfo.outputPath('calendar.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const dimensions = await calendar.locator('.calendar-day').first().boundingBox();
  expect(dimensions!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: testInfo.outputPath('calendar-320.png'), fullPage: true });
  await page.getByRole('link', { name: 'Ver programação do dia' }).click();
  await expect(page.getByLabel('Escolher dia')).toHaveValue('2027-01-07');
});
