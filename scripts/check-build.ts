import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
for (const marker of [
  '2026-12-29',
  '2027-01-27',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'forbidden-city',
  'panda-base',
  'echigo-yuzawa',
  'fuji-option',
  'osaka-option',
])
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
if (total > 2_000_000) throw new Error('Build excedeu orçamento offline de 2 MB');
console.log(
  `Build verificado: China, Japão, alternativas, ícones e SW locais; ${(total / 1024).toFixed(0)} KiB sem gzip.`,
);
