import { entityName } from '../../lib/labels';
import type { Hotel, Place } from '../../content/schema';
export type MapTarget = Place | Hotel;
export type MapProvider = 'apple' | 'amap' | 'baidu' | 'google';
type WebMapLinkResult = {
  status: 'available' | 'not-configured';
  url: string | null;
  address: string | null;
  addressAvailable: boolean;
  coordinateAvailable: boolean;
};
const url = (base: string, params: Record<string, string>) =>
  `${base}?${new URLSearchParams(params).toString()}`;
function buildWebMapLink(place: MapTarget, provider: string): WebMapLinkResult {
  const address = place.address.local || place.address.default;
  const coords =
    provider === 'amap'
      ? place.coordinates.gcj02
      : provider === 'baidu'
        ? place.coordinates.bd09
        : place.coordinates.wgs84;
  const available = coords.lat !== null && coords.lon !== null;
  const result = (link: string | null): WebMapLinkResult => ({
    status: link ? 'available' : 'not-configured',
    url: link,
    address,
    addressAvailable: !!address,
    coordinateAvailable: available,
  });
  const explicit = place.mapLinks[provider];
  if (explicit) return result(explicit);
  const query = [place.name.local || entityName(place), address].filter(Boolean).join(', ');
  if (provider === 'apple') {
    if (place.mapSearch.apple || address)
      return result(url('https://maps.apple.com/', { q: place.mapSearch.apple || query }));
    if (available)
      return result(
        url('https://maps.apple.com/', {
          ll: `${coords.lat},${coords.lon}`,
          q: entityName(place),
        }),
      );
  }
  if (provider === 'amap') {
    if (place.mapSearch.amapKeyword)
      return result(
        encodedUrl('https://uri.amap.com/search', {
          keyword: place.mapSearch.amapKeyword,
          ...(place.mapSearch.amapCity ? { city: place.mapSearch.amapCity } : {}),
        }),
      );
    if (available)
      return result(
        encodedUrl('https://uri.amap.com/marker', {
          position: `${coords.lon},${coords.lat}`,
          name: place.name.local || entityName(place),
        }),
      );
  }
  if (provider === 'baidu') {
    if (place.mapSearch.baiduKeyword && place.mapSearch.baiduCity)
      return result(
        encodedUrl('https://api.map.baidu.com/place/search', {
          query: place.mapSearch.baiduKeyword,
          region: place.mapSearch.baiduCity,
          output: 'html',
          src: 'webapp.family.chinajapan',
        }),
      );
    if (available)
      return result(
        encodedUrl('https://api.map.baidu.com/marker', {
          location: `${coords.lat},${coords.lon}`,
          title: place.name.local || entityName(place),
          content: address || entityName(place),
          coord_type: 'bd09ll',
          output: 'html',
          src: 'webapp.family.chinajapan',
        }),
      );
  }
  if (provider === 'google' && address)
    return result(url('https://www.google.com/maps/search/', { api: '1', query }));
  return result(null);
}
export type MapLinkResult = WebMapLinkResult & {
  appUrl: string | null;
  fallbackUrl: string | null;
};
// Custom schemes need percent-encoded UTF-8 (including spaces), not form encoding.
const encodedUrl = (base: string, params: Record<string, string>) =>
  `${base}?${Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')}`;
const hasCoordinates = (point: MapTarget['coordinates']['wgs84']) =>
  point.lat !== null && point.lon !== null;
export function buildMapLinks(place: MapTarget, provider: string): MapLinkResult {
  const web = buildWebMapLink(place, provider);
  const result = (appUrl: string | null, fallbackUrl = web.url): MapLinkResult => ({
    ...web,
    appUrl,
    fallbackUrl,
    status: web.url || (appUrl && fallbackUrl) ? 'available' : 'not-configured',
  });
  if (provider !== 'amap' && provider !== 'baidu') return result(null);
  const name = place.name.local || place.name.default || web.address;
  const keyword =
    (provider === 'amap' ? place.mapSearch.amapKeyword : place.mapSearch.baiduKeyword) || name;
  if (!keyword) return result(null);
  const { gcj02, wgs84, bd09 } = place.coordinates;
  if (provider === 'amap') {
    const city = place.mapSearch.amapCity;
    const fallback =
      web.url || encodedUrl('https://uri.amap.com/search', { keyword, ...(city ? { city } : {}) });
    const coords = hasCoordinates(gcj02) ? gcj02 : hasCoordinates(wgs84) ? wgs84 : null;
    if (coords)
      return result(
        encodedUrl('iosamap://viewMap', {
          sourceApplication: 'ViagemChinaJapao',
          poiname: name || keyword,
          lat: String(coords.lat),
          lon: String(coords.lon),
          dev: hasCoordinates(gcj02) ? '0' : '1',
        }),
        fallback,
      );
    return result(
      encodedUrl('iosamap://poi', {
        sourceApplication: 'ViagemChinaJapao',
        name: [keyword, city].filter(Boolean).join(' '),
      }),
      fallback,
    );
  }
  const fallback =
    place.mapLinks.baidu ||
    encodedUrl(`https://map.baidu.com/search/${encodeURIComponent(keyword)}`, {
      querytype: 's',
      wd: keyword,
    });
  const coords = hasCoordinates(gcj02)
    ? { point: gcj02, type: 'gcj02' }
    : hasCoordinates(wgs84)
      ? { point: wgs84, type: 'wgs84' }
      : hasCoordinates(bd09)
        ? { point: bd09, type: 'bd09ll' }
        : null;
  if (coords)
    return result(
      encodedUrl('baidumap://map/marker', {
        location: `${coords.point.lat},${coords.point.lon}`,
        title: name || keyword,
        content: web.address || name || keyword,
        coord_type: coords.type,
        src: 'ios.viagemchinajapao.app',
      }),
      fallback,
    );
  if (!place.mapSearch.baiduCity) return result(null);
  return result(
    encodedUrl('baidumap://map/place/search', {
      query: keyword,
      region: place.mapSearch.baiduCity,
      src: 'ios.viagemchinajapao.app',
    }),
    fallback,
  );
}
export function offlineInstruction(place: MapTarget): string {
  return [
    place.name.local || entityName(place),
    place.address.local ||
      place.address.default ||
      'Endereço ainda não preenchido. Confirme antes de sair.',
    place.notes,
  ]
    .filter(Boolean)
    .join('\n');
}
