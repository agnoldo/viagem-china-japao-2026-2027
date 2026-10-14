import { readContent } from './read-content';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { MAX_POST_IMAGE_BYTES, MAX_POSTS_BYTES, preparePosts } from './posts';
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) =>
    statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : [join(dir, name)],
  );
}
const paths = files('dist');
const js = paths
  .filter((p) => p.endsWith('.js') && !p.endsWith('/sw.js'))
  .map((p) => readFileSync(p, 'utf8'))
  .join('');
const content = readContent();
const markers = [
  content.trip.id,
  ...content.trip.cities.flatMap((c) => [c.id, c.timezone]),
  ...content.days.map((d) => d.date),
  ...content.hotels.map((h) => h.id),
  ...content.flights.map((f) => f.id),
  ...content.trains.map((t) => t.id),
  ...content.trip.alternatives.flatMap((a) => a.options.map((o) => o.id)),
];
for (const marker of markers)
  if (!js.includes(marker)) throw new Error(`Conteúdo não incluído no build: ${marker}`);
for (const path of paths.filter((p) => p.endsWith('.css') || p.endsWith('.html'))) {
  const source = readFileSync(path, 'utf8');
  if (/(?:src\s*=\s*["']https?:|@import\s+["']https?:|url\(\s*["']?https?:)/i.test(source))
    throw new Error(`Asset remoto em ${path}`);
}
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8')) as {
  icons: { src: string }[];
  display: string;
};
for (const icon of manifest.icons)
  if (!existsSync(join('dist', icon.src))) throw new Error(`Ícone ausente: ${icon.src}`);
const sw = readFileSync('dist/sw.js', 'utf8');
if (!sw.includes('index.html') || !sw.includes('rescue') || !sw.includes('SKIP_WAITING'))
  throw new Error('Service Worker incompleto');
const total = paths.reduce((sum, path) => sum + statSync(path).size, 0);
const gallery = await preparePosts();
for (const [path, source] of gallery.assets) {
  const published = join('dist', path);
  if (!existsSync(published) || !readFileSync(published).equals(source))
    throw new Error(`Print ausente ou divergente: ${path}`);
  if (!sw.includes(path)) throw new Error(`Print fora do pacote offline: ${path}`);
  if (source.length > MAX_POST_IMAGE_BYTES) throw new Error(`Print excedeu orçamento: ${path}`);
}
const imageBytes = paths
  .filter((path) => path.startsWith(join('dist', 'posts') + '/'))
  .reduce((sum, path) => sum + statSync(path).size, 0);
if (imageBytes > MAX_POSTS_BYTES) throw new Error('Posts excedeu orçamento offline de 30 MB');
if (total - imageBytes > 2_000_000)
  throw new Error('Aplicação excedeu orçamento offline de 2 MB, sem contar Posts');
console.log(
  `Build verificado: conteúdo registrado, ícones e SW locais; ${(total / 1024).toFixed(0)} KiB sem gzip.`,
);
