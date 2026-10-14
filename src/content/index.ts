import { loadContentFiles } from './validate';
const files = import.meta.glob('../../data/**/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
export const content = loadContentFiles(files);
export const cities = new Map(content.trip.cities.map((v) => [v.id, v]));
export const places = new Map(content.places.map((v) => [v.id, v]));
export const hotels = new Map(content.hotels.map((v) => [v.id, v]));
export const transports = new Map(
  [...content.flights, ...content.trains, ...content.transfers].map((v) => [v.id, v]),
);
