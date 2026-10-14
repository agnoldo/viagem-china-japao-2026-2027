import { expect, type Page } from '@playwright/test';
import { preparePosts } from '../../scripts/posts';

// Operational uploads can change independently of application code.
const catalog = preparePosts();
export async function expectOperationalGallery(page: Page) {
  const { categories } = await catalog;
  const images = categories.flatMap((category) => category.images);
  const links = page.locator('.post-item a');
  await expect(links).toHaveCount(images.length);
  for (const [index, image] of images.entries()) {
    await expect(links.nth(index)).toHaveAttribute(
      'href',
      new RegExp(`/posts/imagem/${image.id}(?:\\?|$)`),
    );
    await expect(links.nth(index).getByRole('img')).toHaveAttribute(
      'src',
      new RegExp(`${image.src}$`),
    );
  }
  if (!images.length) {
    await expect(
      page.getByRole('heading', { name: 'Nenhum print adicionado ainda' }),
    ).toBeVisible();
  }
  return categories;
}
