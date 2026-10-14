import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { build } from 'vite';
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
