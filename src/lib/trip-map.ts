import type { Content } from '../content/schema';
import { calendarBounds, calendarMonths, monthCells } from './calendar';

export function tripMapData(content: Content) {
  const routes = [...content.flights, ...content.trains, ...content.transfers].filter(
    (r) => r.status !== 'cancelled',
  );
  const ids = new Set([
    ...content.days.map((d) => d.cityId),
    ...routes.flatMap((r) => [r.from.cityId, r.to.cityId]),
  ]);
  const cities = content.trip.cities.filter((c) => ids.has(c.id));
  const { start, end } = calendarBounds(content);
  const dates = calendarMonths(start, end)
    .flatMap(monthCells)
    .filter((d): d is string => !!d && d >= start && d <= end);
  return {
    cities,
    routes,
    dates,
    gaps: dates.filter((date) => !content.days.some((d) => d.date === date)),
  };
}

const mercator = (lat: number) =>
  (Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * Math.PI) / 360)) * 180) /
  Math.PI;
export function mapProjection(
  points: { lat: number; lon: number }[],
  width: number,
  height: number,
) {
  if (!points.length) return () => ({ x: width / 2, y: height / 2 });
  const xs = points.map((p) => p.lon),
    ys = points.map((p) => mercator(p.lat));
  const minX = Math.min(...xs) - 3,
    maxX = Math.max(...xs) + 3;
  const minY = Math.min(...ys) - 3,
    maxY = Math.max(...ys) + 3;
  const scale = Math.min((width - 70) / (maxX - minX), (height - 90) / (maxY - minY));
  return (lon: number, lat: number) => ({
    x: width / 2 + (lon - (minX + maxX) / 2) * scale,
    y: height / 2 - (mercator(lat) - (minY + maxY) / 2) * scale,
  });
}

export function mapLabels(points: { x: number; y: number }[], width: number, height: number) {
  const placed: { x: number; y: number }[] = [];
  const order = points
    .map((point, index) => ({ ...point, index }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const result: { x: number; y: number }[] = [];
  for (const point of order) {
    let best = {
      x: Math.max(67, Math.min(width - 67, point.x)),
      y: Math.max(28, Math.min(height - 28, point.y)),
    };
    let score = Infinity;
    for (let dy = -180; dy <= 180; dy += 48)
      for (let dx = -140; dx <= 140; dx += 70) {
        const candidate = {
          x:
            width < 500
              ? point.x + dx < width / 2
                ? 67
                : width - 67
              : Math.max(67, Math.min(width - 67, point.x + dx)),
          y: Math.max(28, Math.min(height - 28, point.y + dy)),
        };
        const overlaps = placed.filter(
          (p) => Math.abs(p.x - candidate.x) < 130 && Math.abs(p.y - candidate.y) < 46,
        ).length;
        const cost = overlaps * 100000 + Math.hypot(candidate.x - point.x, candidate.y - point.y);
        if (cost < score) {
          best = candidate;
          score = cost;
        }
      }
    placed.push(best);
    result[point.index] = best;
  }
  return result;
}
