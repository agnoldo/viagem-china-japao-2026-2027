import { describe, it, expect, vi, afterEach } from 'vitest';
import { readContent } from '../scripts/read-content';
import {
  currentTripDay,
  localDate,
  localTime,
  sortActivities,
  nextActivity,
  departureTime,
} from '../src/lib/time';
import { buildMapLinks, offlineInstruction } from '../src/features/maps/links';
import { canOfferUpdate, cacheNames, versionHash } from '../src/lib/cache-policy';
import { readPreference, writePreference } from '../src/lib/preferences';
const c = readContent();
afterEach(() => vi.unstubAllGlobals());
describe('dia local e atividades', () => {
  it('mostra preparação antes e histórico depois da viagem', () => {
    expect(currentTripDay(c, new Date('2026-10-14T12:00:00Z'))).toEqual({
      date: '2026-12-29',
      phase: 'before',
    });
    expect(currentTripDay(c, new Date('2027-01-28T03:00:00Z'))).toEqual({
      date: '2027-01-27',
      phase: 'after',
    });
  });
  it('identifica dia da China sem usar fuso do dispositivo', () => {
    expect(currentTripDay(c, new Date('2026-12-31T16:10:00Z')).date).toBe('2027-01-01');
    expect(localTime(new Date('2026-12-31T16:10:00Z'), 'Asia/Shanghai')).toBe('00:10');
  });
  it('identifica dia do Japão na virada local', () => {
    expect(currentTripDay(c, new Date('2027-01-18T15:10:00Z')).date).toBe('2027-01-19');
    expect(localDate(new Date('2027-01-18T15:10:00Z'), 'Asia/Tokyo')).toBe('2027-01-19');
  });
  it('ordena horários e deixa itens sem horário no final', () => {
    const acts = c.days.flatMap((d) => d.activities);
    const a = acts.find((a) => a.time === '09:00')!;
    const b = acts.find((a) => !a.time)!;
    const sorted = sortActivities([b, a]);
    expect(sorted[0]).toEqual(a);
    expect(sorted[1]).toEqual(b);
  });
  it('exclui opcionais e canceladas do próximo compromisso', () => {
    const day = c.days.find((d) => d.date === '2027-01-01')!;
    expect(nextActivity(day, 'Asia/Shanghai', new Date('2027-01-01T00:00:00Z'))?.time).toBe(
      '09:00',
    );
    expect(nextActivity(day, 'Asia/Shanghai', new Date('2027-01-01T04:00:00Z'))).toBeUndefined();
  });
  it('calcula saída no dia anterior', () => {
    expect(departureTime('2027-01-01', '00:30', 90)).toEqual({ date: '2026-12-31', time: '23:00' });
  });
});
describe('mapas e endereço independente de rede', () => {
  it('prioriza URL explícita', () => {
    const p = structuredClone(c.places[0]);
    p.mapLinks.apple = 'https://maps.apple.com/?q=real';
    expect(buildMapLinks(p, 'apple').url).toBe(p.mapLinks.apple);
  });
  it('usa nome local e cidade na busca chinesa', () => {
    const link = buildMapLinks(c.places[0], 'amap');
    expect(new URL(link.url!).searchParams.get('keyword')).toBe('故宫博物院');
    expect(new URL(link.url!).searchParams.get('city')).toBe('北京');
    expect(buildMapLinks(c.places[0], 'baidu').url).toContain('output=html');
  });
  it('não interpreta WGS84 como GCJ-02 ou BD-09', () => {
    const p = structuredClone(c.places[0]);
    p.mapSearch.amapKeyword = null;
    p.mapSearch.baiduKeyword = null;
    expect(buildMapLinks(p, 'amap').coordinateAvailable).toBe(false);
    expect(buildMapLinks(p, 'amap').url).toBeNull();
    expect(buildMapLinks(p, 'baidu').url).toBeNull();
  });
  it('usa coordenada no sistema correto quando configurada', () => {
    const p = structuredClone(c.places[0]);
    p.mapSearch.amapKeyword = null;
    p.coordinates.gcj02 = { lat: 39, lon: 116 };
    expect(new URL(buildMapLinks(p, 'amap').url!).searchParams.get('position')).toBe('116,39');
  });
  it('oferece endereço quando provedor não configurado', () => {
    const result = buildMapLinks(c.places[0], 'missing');
    expect(result.status).toBe('not-configured');
    expect(result.addressAvailable).toBe(true);
    expect(result.address).toContain('北京市');
  });
  it('hotel pendente não gera busca por nome fictício', () => {
    expect(buildMapLinks(c.hotels[0], 'apple')).toMatchObject({
      status: 'not-configured',
      addressAvailable: false,
    });
  });
  it('gera instrução offline legível com endereço local e fallback', () => {
    expect(offlineInstruction(c.places[0])).toContain('北京市东城区');
    expect(offlineInstruction(c.hotels[0])).toContain('Endereço ainda não preenchido');
  });
});
describe('versão e estado local', () => {
  it('só oferece atualização completamente instalada', () => {
    expect(canOfferUpdate('installing')).toBe(false);
    expect(canOfferUpdate('redundant')).toBe(false);
    expect(canOfferUpdate('installed')).toBe(true);
  });
  it('separa versões e escopos de cache', () => {
    expect(cacheNames('/trip/', 'a')).not.toEqual(cacheNames('/other/', 'a'));
    expect(versionHash([{ url: 'index.html', revision: 'a' }])).not.toBe(
      versionHash([{ url: 'index.html', revision: 'b' }]),
    );
  });
  it('funciona sem localStorage ou com acesso negado', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readPreference('last-day')).toBeNull();
    expect(() => writePreference('last-day', 'bad')).not.toThrow();
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Denied');
      },
    });
    expect(readPreference('last-day')).toBeNull();
  });
  it('ignora preferência corrupta e aceita ausência', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'x'.repeat(250) });
    expect(readPreference('last-day')).toBeNull();
    vi.stubGlobal('localStorage', { getItem: () => null });
    expect(readPreference('last-day')).toBeNull();
  });
});
