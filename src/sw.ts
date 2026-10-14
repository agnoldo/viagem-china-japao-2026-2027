/// <reference lib="webworker" />
import { cacheNames, versionHash } from './lib/cache-policy';
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision?: string | null }[];
};
const entries = self.__WB_MANIFEST;
const scope = self.registration.scope;
const version = versionHash(entries);
const [primaryName, rescueName] = cacheNames(scope, version);
const urls = [...new Set(entries.map((entry) => new URL(entry.url, scope).href))];
const shell = new URL('index.html', scope).href;
function cacheKey(url: string): string {
  const key = new URL(url);
  key.searchParams.set('__trip_version', version);
  return key.href;
}
// Só esta versão utiliza estes caches; um install incompleto nunca substitui a versão ativa.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const primary = await caches.open(primaryName);
      const rescue = await caches.open(rescueName);
      // addAll grava o lote de forma atômica; falha de um download não deixa meio lote ativo.
      const requests = urls.map((url) => new Request(cacheKey(url), { cache: 'no-store' }));
      await primary.addAll(requests);
      await rescue.addAll(requests);
      // Não oferecer um worker cujo cache ainda não passou por uma leitura completa.
      for (const url of urls) {
        if (!(await primary.match(cacheKey(url))) || !(await rescue.match(cacheKey(url))))
          throw new Error(`Gravação offline incompleta: ${url}`);
      }
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
  const cached = await primary.match(cacheKey(url));
  if (cached) return cached;
  const backup = await (await caches.open(rescueName)).match(cacheKey(url));
  if (backup) {
    await primary.put(cacheKey(url), backup.clone());
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
          const a = await primary.match(cacheKey(url));
          const b = await rescue.match(cacheKey(url));
          if (!a && !b) missing++;
          else {
            if (!a && b) await primary.put(cacheKey(url), b.clone());
            if (!b && a) await rescue.put(cacheKey(url), a.clone());
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
