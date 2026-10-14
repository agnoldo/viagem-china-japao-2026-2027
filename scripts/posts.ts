import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';
import sharp from 'sharp';
import type { Content } from '../src/content/schema';

export const MAX_POST_IMAGE_BYTES = 1_900_000;
export const MAX_POSTS_BYTES = 30_000_000;
const hash = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex').slice(0, 24);
const supported = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export function postTitle(filename: string) {
  return filename
    .slice(0, -extname(filename).length)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function preparePosts(root = 'data/posts') {
  const categories: Content['posts'] = [];
  const assets = new Map<string, Buffer>();
  const folders = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'README.md')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
  for (const folder of folders) {
    if (!folder.isDirectory())
      throw new Error(`Posts: coloque ${folder.name} dentro de uma categoria.`);
    const category: Content['posts'][number] = { id: folder.name, title: folder.name, images: [] };
    const files = (await readdir(join(root, folder.name), { withFileTypes: true }))
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'README.md')
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
    for (const file of files) {
      const sourcePath = join(root, folder.name, file.name);
      if (!file.isFile() || !supported.has(extname(file.name).toLowerCase()))
        throw new Error(
          `Posts: formato não aceito em ${sourcePath}. Use JPG, JPEG, PNG ou WebP, sem subpastas.`,
        );
      const source = await readFile(sourcePath);
      if (source.length > 20_000_000)
        throw new Error(`Posts: ${sourcePath} excede 20 MB na origem.`);
      try {
        const metadata = await sharp(source, { limitInputPixels: 80_000_000 }).metadata();
        if (!['jpeg', 'png', 'webp'].includes(metadata.format))
          throw new Error('o conteúdo não é JPG, PNG ou WebP');
        // Rotate before resizing, preserve the whole screenshot, strip EXIF/GPS metadata.
        const { data, info } = await sharp(source, { limitInputPixels: 80_000_000 })
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 85, effort: 4 })
          .toBuffer({ resolveWithObject: true });
        if (data.length > MAX_POST_IMAGE_BYTES)
          throw new Error('imagem otimizada excede 1,9 MB; divida o print');
        const src = `posts/${hash(data)}.webp`;
        assets.set(src, data);
        category.images.push({
          id: hash(`${folder.name}/${file.name}`),
          title: postTitle(file.name),
          src,
          width: info.width,
          height: info.height,
        });
      } catch (error) {
        throw new Error(
          `Posts: não foi possível preparar ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    categories.push(category);
  }
  const bytes = [...assets.values()].reduce((sum, data) => sum + data.length, 0);
  if (bytes > MAX_POSTS_BYTES)
    throw new Error(
      'Posts: galeria otimizada excede 30 MB. Remova prints para preservar o offline.',
    );
  return { categories, assets, bytes };
}
