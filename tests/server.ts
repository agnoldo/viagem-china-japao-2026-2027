import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { build } from 'vite';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import sharp from 'sharp';
// Gallery fixtures exist only in the isolated QA build, never in operational data/dist.
const postsRoot = resolve('.qa-builds/posts-fixture');
await rm(postsRoot, { recursive: true, force: true });
for (const category of ['Teste China', 'Teste Japão', 'Teste vazio'])
  await mkdir(resolve(postsRoot, category), { recursive: true });
for (const [category, name, title] of [
  ['Teste China', '01-metro.png', 'PRINT DE TESTE: METRO'],
  ['Teste China', '02-restaurante.jpg', 'PRINT DE TESTE: RESTAURANTE'],
  ['Teste Japão', '01-trem.webp', 'PRINT DE TESTE: TREM'],
]) {
  const svg = `<svg width="1100" height="1800" xmlns="http://www.w3.org/2000/svg"><rect width="1100" height="1800" fill="#edf0e8"/><text x="60" y="140" font-family="sans-serif" font-size="42" fill="#193e38">${title}</text><text x="60" y="240" font-family="sans-serif" font-size="28">Fixture isolada. Não é conteúdo da viagem.</text></svg>`;
  await writeFile(
    resolve(postsRoot, category, name),
    await sharp(Buffer.from(svg))
      .toFormat(name.endsWith('jpg') ? 'jpeg' : name.endsWith('png') ? 'png' : 'webp')
      .toBuffer(),
  );
}
const previousPostsRoot = process.env.POSTS_DIR;
process.env.POSTS_DIR = postsRoot;
// Segundo build completo, isolado dos dados fonte: prova troca atômica de shell.
await build({
  build: { outDir: '.qa-builds/next' },
  plugins: [
    {
      name: 'qa-version',
      transformIndexHtml(html) {
        return html.replace('<title>', '<meta name="qa-version" content="next"/><title>');
      },
    },
  ],
});
if (previousPostsRoot === undefined) delete process.env.POSTS_DIR;
else process.env.POSTS_DIR = previousPostsRoot;
let variant = 'current';
let interrupted = false;
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/__qa') {
    variant = url.searchParams.get('version') ?? variant;
    interrupted = url.searchParams.get('interrupt') === 'yes';
    res.end('ok');
    return;
  }
  if (!url.pathname.startsWith('/offline-check/')) {
    res.writeHead(404);
    res.end('use /offline-check/');
    return;
  }
  const root = resolve(variant === 'next' ? '.qa-builds/next' : 'dist');
  const requested =
    decodeURIComponent(url.pathname.slice('/offline-check/'.length)) || 'index.html';
  const path = resolve(root, requested);
  if (!path.startsWith(root + '/') || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (interrupted && requested === 'index.html') {
    res.writeHead(503);
    res.end('simulated interrupted download');
    return;
  }
  res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.end(readFileSync(path));
});
server.listen(4178, '127.0.0.1', () =>
  console.log('QA server http://127.0.0.1:4178/offline-check/'),
);
