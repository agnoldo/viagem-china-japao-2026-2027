import { entityName } from '../../lib/labels';
import type { Hotel, Place } from '../../content/schema';
export type MapTarget = Place | Hotel;
export type MapProvider = 'apple' | 'amap' | 'baidu' | 'google';
export type MapLinkResult = {
  status: 'available' | 'not-configured';
  url: string | null;
  address: string | null;
  addressAvailable: boolean;
  coordinateAvailable: boolean;
};
const url = (base: string, params: Record<string, string>) =>
  `${base}?${new URLSearchParams(params).toString()}`;
export function buildMapLinks(place: MapTarget, provider: string): MapLinkResult {
  const address = place.address.local || place.address.default;
  const coords =
    provider === 'amap'
      ? place.coordinates.gcj02
      : provider === 'baidu'
        ? place.coordinates.bd09
        : place.coordinates.wgs84;
  const available = coords.lat !== null && coords.lon !== null;
  const result = (link: string | null): MapLinkResult => ({
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
        url('https://uri.amap.com/search', {
          keyword: place.mapSearch.amapKeyword,
          ...(place.mapSearch.amapCity ? { city: place.mapSearch.amapCity } : {}),
        }),
      );
    if (available)
      return result(
        url('https://uri.amap.com/marker', {
          position: `${coords.lon},${coords.lat}`,
          name: place.name.local || entityName(place),
        }),
      );
  }
  if (provider === 'baidu') {
    if (place.mapSearch.baiduKeyword && place.mapSearch.baiduCity)
      return result(
        url('https://api.map.baidu.com/place/search', {
          query: place.mapSearch.baiduKeyword,
          region: place.mapSearch.baiduCity,
          output: 'html',
          src: 'webapp.family.chinajapan',
        }),
      );
    if (available)
      return result(
        url('https://api.map.baidu.com/marker', {
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
