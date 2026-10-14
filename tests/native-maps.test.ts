import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readContent } from '../scripts/read-content';
import { buildMapLinks } from '../src/features/maps/links';
import {
  handleMapClick,
  isIOSDevice,
  mapWebHref,
  openMapApp,
  type MapAppEnvironment,
} from '../src/features/maps/open-app';
const hotel = readContent().hotels.find((h) => h.id === 'pan-pacific-beijing')!;
const iphone = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
  platform: 'iPhone',
  maxTouchPoints: 5,
};
const desktop = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
  platform: 'MacIntel',
  maxTouchPoints: 0,
};
const click = (extra = {}) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  preventDefault: vi.fn(),
  ...extra,
});
function harness() {
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const navigate = vi.fn<(url: string) => void>();
  const timerWindow = {
    addEventListener: win.addEventListener.bind(win),
    removeEventListener: win.removeEventListener.bind(win),
    setTimeout: (handler: () => void, delay: number) => setTimeout(handler, delay),
    clearTimeout: (id: number) => clearTimeout(id),
  } as unknown as MapAppEnvironment['window'];
  const environment: MapAppEnvironment = { window: timerWindow, document: doc, navigate };
  return { win, doc, navigate, environment, timerWindow };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('URLs nativas com sistemas de coordenadas explícitos', () => {
  it('mantém o Apple Maps e o fallback web AMap', () => {
    const apple = buildMapLinks(hotel, 'apple');
    expect(apple.url).toBe(
      'https://maps.apple.com/?q=%E5%8C%97%E4%BA%AC%E6%B3%9B%E5%A4%AA%E5%B9%B3%E6%B4%8B%E9%85%92%E5%BA%97+%E5%8C%97%E4%BA%AC%E5%B8%82%E8%A5%BF%E5%9F%8E%E5%8C%BA%E5%8D%8E%E8%BF%9C%E8%A1%972%E5%8F%B7',
    );
    expect(apple.appUrl).toBeNull();
    expect(mapWebHref(apple, iphone)).toBe(apple.url);
    const amap = buildMapLinks(hotel, 'amap');
    expect(amap.fallbackUrl).toBe(amap.url);
  });
  it('gera buscas codificadas para hotel sem coordenadas, incluindo src obrigatório', () => {
    const amap = new URL(buildMapLinks(hotel, 'amap').appUrl!);
    expect(amap.protocol).toBe('iosamap:');
    expect(amap.hostname).toBe('poi');
    expect(amap.searchParams.get('sourceApplication')).toBe('ViagemChinaJapao');
    expect(amap.searchParams.get('name')).toBe('北京泛太平洋酒店 华远街2号 北京');
    const baidu = buildMapLinks(hotel, 'baidu');
    const native = new URL(baidu.appUrl!);
    expect(native.protocol).toBe('baidumap:');
    expect(native.pathname).toBe('/place/search');
    expect(native.searchParams.get('region')).toBe('北京');
    expect(native.searchParams.get('src')).toBe('ios.viagemchinajapao.app');
    expect(new URL(mapWebHref(baidu, iphone)!).hostname).toBe('map.baidu.com');
    expect(mapWebHref(baidu, desktop)).toBe(baidu.url);
  });
  it.each(['gcj02', 'wgs84'] as const)(
    'AMap respeita %s e prioriza coordenadas sobre nome',
    (system) => {
      const p = structuredClone(hotel);
      p.coordinates[system] = { lat: 39.9, lon: 116.3 };
      const native = new URL(buildMapLinks(p, 'amap').appUrl!);
      expect(native.hostname).toBe('viewMap');
      expect(native.searchParams.get('lat')).toBe('39.9');
      expect(native.searchParams.get('lon')).toBe('116.3');
      expect(native.searchParams.get('dev')).toBe(system === 'gcj02' ? '0' : '1');
    },
  );
  it('prioriza GCJ-02, aceita zero e nunca envia BD-09 como GCJ-02', () => {
    const p = structuredClone(hotel);
    p.coordinates.gcj02 = { lat: 0, lon: 0 };
    p.coordinates.wgs84 = { lat: 1, lon: 2 };
    expect(new URL(buildMapLinks(p, 'amap').appUrl!).searchParams.get('lat')).toBe('0');
    p.coordinates.gcj02 = { lat: null, lon: null };
    p.coordinates.wgs84 = { lat: null, lon: null };
    p.coordinates.bd09 = { lat: 39.9, lon: 116.3 };
    expect(new URL(buildMapLinks(p, 'amap').appUrl!).hostname).toBe('poi');
  });
  it.each(['gcj02', 'wgs84', 'bd09'] as const)(
    'Baidu identifica coordenadas %s, sem inverter latitude e longitude',
    (system) => {
      const p = structuredClone(hotel);
      p.coordinates[system] = { lat: 39.9, lon: 116.3 };
      const native = new URL(buildMapLinks(p, 'baidu').appUrl!);
      expect(native.pathname).toBe('/marker');
      expect(native.searchParams.get('location')).toBe('39.9,116.3');
      expect(native.searchParams.get('coord_type')).toBe(system === 'bd09' ? 'bd09ll' : system);
      expect(native.searchParams.get('content')).toBe(hotel.address.local);
      expect(native.searchParams.get('src')).toBe('ios.viagemchinajapao.app');
    },
  );
  it('codifica nomes e cidades sem permitir parâmetros acidentais', () => {
    const p = structuredClone(hotel);
    const text = '北京 & 酒店?门=北 #+';
    p.mapSearch.amapKeyword = text;
    p.mapSearch.baiduKeyword = text;
    p.mapSearch.amapCity = '北京 & 海淀';
    p.mapSearch.baiduCity = '北京 & 海淀';
    const amap = buildMapLinks(p, 'amap');
    const baidu = buildMapLinks(p, 'baidu');
    expect(new URL(amap.appUrl!).searchParams.get('name')).toBe(text + ' 北京 & 海淀');
    expect(new URL(baidu.appUrl!).searchParams.get('query')).toBe(text);
    expect(new URL(baidu.appUrl!).searchParams.get('region')).toBe('北京 & 海淀');
    expect(amap.url).toContain(encodeURIComponent(text));
    expect(baidu.url).toContain(encodeURIComponent(text));
    expect(baidu.fallbackUrl).toContain(encodeURIComponent(text));
    expect(new URL(baidu.fallbackUrl!).searchParams.get('wd')).toBe(text);
  });
  it('não gera busca de hotel fictício sem nome, endereço ou coordenadas', () => {
    const unknown = readContent().hotels.find((h) => h.id === 'echigo-yuzawa-resort')!;
    for (const provider of ['amap', 'baidu'])
      expect(buildMapLinks(unknown, provider).appUrl).toBeNull();
  });
});
describe('iOS, iPadOS e tentativas de abrir o app', () => {
  it.each([
    [iphone, true],
    [desktop, false],
    [{ ...desktop, maxTouchPoints: 5 }, true],
    [{ userAgent: 'Mozilla/5.0 (iPad)', platform: 'iPad', maxTouchPoints: 5 }, true],
    [{ userAgent: 'Mozilla/5.0 (Android)', platform: 'Linux arm', maxTouchPoints: 5 }, false],
  ])('detecta a plataforma %j', (device, result) => expect(isIOSDevice(device)).toBe(result));
  it('abre o app imediatamente e o site somente após 1500 ms, limpando os listeners', () => {
    const h = harness();
    const remove = vi.spyOn(h.doc, 'removeEventListener');
    openMapApp('iosamap://poi?name=test', 'https://uri.amap.com/search', h.environment);
    expect(h.navigate.mock.calls).toEqual([['iosamap://poi?name=test']]);
    vi.advanceTimersByTime(1499);
    expect(h.navigate).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(h.navigate).toHaveBeenLastCalledWith('https://uri.amap.com/search');
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
  it.each(['pagehide', 'visibilitychange'])(
    'cancela em %s e não abre o site ao voltar do app',
    (event) => {
      const h = harness();
      openMapApp(
        'baidumap://map/place/search',
        'https://map.baidu.com/search/hotel',
        h.environment,
      );
      if (event === 'pagehide') h.win.dispatchEvent(new Event(event));
      else {
        h.doc.dispatchEvent(new Event(event));
        h.doc.hidden = true;
        h.doc.dispatchEvent(new Event(event));
      }
      h.doc.hidden = false;
      h.doc.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(5000);
      expect(h.navigate).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it('cliques seguidos mantêm apenas o último fallback', () => {
    const h = harness();
    openMapApp('iosamap://poi?name=1', 'https://example.com/1', h.environment);
    openMapApp('baidumap://map/place/search', 'https://example.com/2', h.environment);
    vi.advanceTimersByTime(1500);
    expect(h.navigate.mock.calls.map((c) => c[0])).toEqual([
      'iosamap://poi?name=1',
      'baidumap://map/place/search',
      'https://example.com/2',
    ]);
  });
  it('preserva o fallback se o navegador rejeitar o esquema', () => {
    const h = harness();
    h.navigate.mockImplementationOnce(() => {
      throw new Error('Unsupported protocol');
    });
    openMapApp('iosamap://poi', 'https://uri.amap.com/search', h.environment);
    vi.advanceTimersByTime(1500);
    expect(h.navigate).toHaveBeenLastCalledWith('https://uri.amap.com/search');
  });
  it('preserva desktop, Apple Maps e cliques modificados', () => {
    const h = harness();
    const native = buildMapLinks(hotel, 'amap');
    for (const [event, link, device] of [
      [click(), native, desktop],
      [click(), buildMapLinks(hotel, 'apple'), iphone],
      [click({ metaKey: true }), native, iphone],
      [click({ ctrlKey: true }), native, iphone],
      [click({ shiftKey: true }), native, iphone],
      [click({ button: 1 }), native, iphone],
    ] as const) {
      expect(handleMapClick(event, link, device, h.environment)).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(h.navigate).not.toHaveBeenCalled();
  });
  it('intercepta clique iOS e usa a mesma janela no ambiente standalone simulado', () => {
    const h = harness();
    const location = {
      set href(value: string) {
        h.navigate(value);
      },
    };
    vi.stubGlobal('window', { ...h.timerWindow, location });
    vi.stubGlobal('document', h.doc);
    vi.stubGlobal('navigator', { ...iphone, standalone: true });
    const event = click();
    const link = buildMapLinks(hotel, 'baidu');
    expect(handleMapClick(event, link)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(h.navigate).toHaveBeenLastCalledWith(link.appUrl);
    vi.advanceTimersByTime(1500);
    expect(h.navigate).toHaveBeenLastCalledWith(link.fallbackUrl);
  });
});
