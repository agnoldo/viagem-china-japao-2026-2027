/// <reference lib="webworker" />
import { cacheNames, versionHash } from './lib/cache-policy';
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision?: string | null }[];
};
const entries = self.__WB_MANIFEST;
const scope = self.registration.scope;
const version = versionHash(entries);
const [primaryName, rescueName] = cacheNames(scope, version);
const urls = entries.map((entry) => new URL(entry.url, scope).href);
const shell = new URL('index.html', scope).href;
// Só esta versão utiliza estes caches; um install incompleto nunca substitui a versão ativa.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const primary = await caches.open(primaryName);
      const rescue = await caches.open(rescueName);
      await Promise.all(
        urls.map(async (url) => {
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (!response.ok || response.type === 'opaque')
            throw new Error(`Falha ao preparar offline: ${url}`);
          await primary.put(url, response.clone());
          await rescue.put(url, response);
        }),
      );
    })(),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Preserva a versão anterior para rollback e clientes que ainda terminam uma leitura.
      const prefix = `trip:${encodeURIComponent(scope)}:`;
      const keys = (await caches.keys()).filter((key) => key.startsWith(prefix));
      const previousVersions = [
        ...new Set(keys.map((key) => key.split(':').slice(-2, -1)[0])),
      ].filter((v) => v !== version);
      for (const oldVersion of previousVersions.slice(0, -1))
        for (const name of cacheNames(scope, oldVersion)) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});
async function localResponse(url: string): Promise<Response | undefined> {
  const primary = await caches.open(primaryName);
  const cached = await primary.match(url);
  if (cached) return cached;
  const backup = await (await caches.open(rescueName)).match(url);
  if (backup) {
    await primary.put(url, backup.clone());
    return backup;
  }
  return undefined;
}
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(scope)) return;
  const requested = new URL(event.request.url);
  requested.search = '';
  const key = event.request.mode === 'navigate' ? shell : requested.href;
  if (!urls.includes(key)) return;
  event.respondWith(
    (async () => {
      const response = await localResponse(key);
      if (response) return response;
      try {
        const network = await fetch(event.request);
        // Não salvar uma resposta potencialmente pertencente a outro build sob uma chave antiga.
        return network;
      } catch {
        return new Response(
          'Conteúdo offline removido pelo dispositivo. Reconecte e use “Verificar offline” em Mais.',
          { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
        );
      }
    })(),
  );
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
  if (event.data?.type === 'CHECK_OFFLINE') {
    event.waitUntil(
      (async () => {
        const primary = await caches.open(primaryName);
        const rescue = await caches.open(rescueName);
        let missing = 0;
        for (const url of urls) {
          const a = await primary.match(url);
          const b = await rescue.match(url);
          if (!a && !b) missing++;
          else {
            if (!a && b) await primary.put(url, b.clone());
            if (!b && a) await rescue.put(url, a.clone());
          }
        }
        event.ports[0]?.postMessage({
          ready: missing === 0,
          missing,
          version,
          assets: urls.length,
        });
      })(),
    );
  }
});
