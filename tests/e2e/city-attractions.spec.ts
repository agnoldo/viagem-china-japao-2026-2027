import { test, expect } from '@playwright/test';
import { readContent } from '../../scripts/read-content';

const destinations = readContent().trip.cities.filter((city) => city.tripAdvisorAttractionsUrl);

test('guias oferecem atrações de cada destino e preservam os links offline', async ({
  page,
  request,
  context,
}) => {
  await request.get('http://127.0.0.1:4178/__qa?version=current');
  for (const city of destinations) {
    await page.goto(`./#/cidades/${city.id}`);
    const link = page.getByRole('link', { name: /Atrações no TripAdvisor/ });
    await expect(link).toHaveAttribute('href', city.tripAdvisorAttractionsUrl!);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText(city.name.default);
  }
  await expect(page.getByRole('link', { name: 'Offline pronto', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('link', { name: /Atrações no TripAdvisor/ })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
