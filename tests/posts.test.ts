import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { preparePosts, postTitle } from '../scripts/posts';
import { readContent } from '../scripts/read-content';

const roots: string[] = [];
async function root() {
  const path = await mkdtemp(join(tmpdir(), 'trip-posts-'));
  roots.push(path);
  return path;
}
afterEach(async () => {
  for (const path of roots.splice(0)) await rm(path, { recursive: true, force: true });
});
const image = () =>
  sharp({ create: { width: 1800, height: 2400, channels: 3, background: '#193e38' } })
    .png()
    .toBuffer();

describe('upload por pastas', () => {
  it('usa título da pasta, ordenação numérica, legenda e categoria vazia', async () => {
    const dir = await root();
    await mkdir(join(dir, 'Japão'));
    await mkdir(join(dir, 'China'));
    await writeFile(join(dir, 'China', '.gitkeep'), '');
    const png = await image();
    await writeFile(join(dir, 'Japão', '10-restaurante.png'), png);
    await writeFile(join(dir, 'Japão', '2-metrô_de_Tokyo.PNG'), png);
    const result = await preparePosts(dir);
    const content = readContent(result.categories);
    expect(content.posts.map((category) => category.title)).toEqual(['China', 'Japão']);
    expect(content.posts[0].images).toEqual([]);
    expect(content.posts[1].images.map((item) => item.title)).toEqual([
      '2 metrô de Tokyo',
      '10 restaurante',
    ]);
    expect(result.assets.size).toBe(1); // Identical images share one cached asset.
  });
  it('comprime sem recortar, remove metadados e muda URL quando o print é substituído', async () => {
    const dir = await root();
    await mkdir(join(dir, 'China'));
    await writeFile(
      join(dir, 'China', 'metrô.png'),
      await sharp(await image())
        .withMetadata()
        .png()
        .toBuffer(),
    );
    const a = await preparePosts(dir);
    const item = a.categories[0].images[0];
    expect([item.width, item.height]).toEqual([1600, 2133]);
    const metadata = await sharp(a.assets.get(item.src)!).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.exif).toBeUndefined();
    await writeFile(
      join(dir, 'China', 'metrô.png'),
      await sharp({ create: { width: 100, height: 100, channels: 3, background: '#fff' } })
        .png()
        .toBuffer(),
    );
    const b = (await preparePosts(dir)).categories[0].images[0];
    expect(b.id).toBe(item.id);
    expect(b.src).not.toBe(item.src);
  });
  it('recusa subpastas, formato incompatível e imagem corrompida com caminho do erro', async () => {
    const dir = await root();
    await mkdir(join(dir, 'China'));
    await mkdir(join(dir, 'China', 'subpasta'));
    await expect(preparePosts(dir)).rejects.toThrow(/subpasta/);
    await rm(join(dir, 'China', 'subpasta'), { recursive: true });
    await writeFile(join(dir, 'China', 'arquivo.pdf'), 'PDF');
    await expect(preparePosts(dir)).rejects.toThrow(/arquivo.pdf/);
    await rm(join(dir, 'China', 'arquivo.pdf'));
    await writeFile(join(dir, 'China', 'print.png'), 'corrompido');
    await expect(preparePosts(dir)).rejects.toThrow(/print.png/);
  });
  it('valida categorias e URLs locais antes de chegar à interface', () => {
    expect(() =>
      readContent([
        {
          id: 'China',
          title: 'China',
          images: [
            {
              id: 'print',
              title: 'Print',
              src: 'https://example.com/print.png',
              width: 10,
              height: 10,
            },
          ],
        },
      ]),
    ).toThrow();
    expect(() =>
      readContent([
        { id: 'China', title: 'China', images: [] },
        { id: 'China', title: 'China', images: [] },
      ]),
    ).toThrow(/Categoria de posts duplicado/);
    expect(postTitle('01-pandas_e-metrô.png')).toBe('01 pandas e metrô');
  });
});
