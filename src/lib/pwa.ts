import { canOfferUpdate } from './cache-policy';
export type OfflineReport = { ready: boolean; missing: number; version: string; assets: number };
let registration: ServiceWorkerRegistration | undefined;
let waiting: ServiceWorker | undefined;
let started = false;
export function startPwa(onUpdate: () => void, onStatus: (message: string) => void): void {
  if (started || !('serviceWorker' in navigator) || import.meta.env.DEV) {
    if (import.meta.env.DEV)
      onStatus('Modo de desenvolvimento: teste offline no preview do build.');
    return;
  }
  started = true;
  const container = navigator.serviceWorker;
  let controlled = !!container.controller;
  const audit = () => {
    if (!container.controller) return;
    void checkOffline()
      .then((report) =>
        onStatus(
          report.ready
            ? 'Conteúdo disponível offline'
            : 'Cache incompleto: reconecte para preparar offline.',
        ),
      )
      .catch(() =>
        onStatus('Não foi possível verificar o cache. Abra Mais para tentar novamente.'),
      );
  };
  // Auditar o controlador existente não depende de rede nem de uma nova chamada register().
  // No WebKit, ready/register podem ficar pendentes ou rejeitar após uma reabertura offline.
  if (controlled) audit();
  container.addEventListener('controllerchange', () => {
    if (controlled) {
      location.reload();
      return;
    }
    controlled = true;
    audit();
  });
  const observed = new WeakSet<ServiceWorkerRegistration>();
  const observe = (reg: ServiceWorkerRegistration) => {
    registration = reg;
    if (observed.has(reg)) return;
    observed.add(reg);
    const offer = (worker: ServiceWorker | null) => {
      if (worker && canOfferUpdate(worker.state) && container.controller) {
        waiting = worker;
        onUpdate();
      }
    };
    const watchInstalling = () => {
      const worker = reg.installing;
      if (worker) {
        offer(worker);
        worker.addEventListener('statechange', () => offer(worker));
      }
    };
    offer(reg.waiting);
    watchInstalling();
    reg.addEventListener('updatefound', watchInstalling);
  };
  // Também recupera a inscrição ativa quando register não consegue acessar a publicação.
  void container
    .getRegistration()
    .then((reg) => {
      if (reg) observe(reg);
    })
    .catch(() => {});
  void container
    .register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none',
    })
    .then((reg) => {
      observe(reg);
      if (container.controller) audit();
      else void container.ready.then(audit);
    })
    .catch(() => {
      if (container.controller) audit();
      else onStatus('Instalação offline falhou. Reconecte e recarregue a página.');
    });
}
export function activateUpdate(): void {
  if (waiting && canOfferUpdate(waiting.state)) waiting.postMessage({ type: 'SKIP_WAITING' });
}
export async function checkForUpdate(): Promise<string> {
  if (!navigator.onLine) return 'Sem rede. A versão instalada continua disponível.';
  if (!registration) return 'Abra o build publicado ou o preview para verificar atualizações.';
  try {
    await registration.update();
    return registration.waiting
      ? 'Nova versão pronta. Use “Atualizar agora”.'
      : 'Verificação concluída. A instalação de uma nova versão pode levar alguns segundos.';
  } catch {
    return 'Não foi possível acessar a publicação. Continue usando a versão instalada.';
  }
}
export function checkOffline(): Promise<OfflineReport> {
  return new Promise((resolve, reject) => {
    const worker = navigator.serviceWorker?.controller;
    if (!worker) {
      reject(new Error('Aguarde a instalação offline ou recarregue a publicação.'));
      return;
    }
    const channel = new MessageChannel();
    const timeout = window.setTimeout(
      () => reject(new Error('A verificação offline demorou. Feche e abra o aplicativo.')),
      10000,
    );
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(event.data as OfflineReport);
    };
    worker.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]);
  });
}
