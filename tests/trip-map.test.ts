import { describe, expect, it } from 'vitest';
import { readContent } from '../scripts/read-content';
import { mapLabels, mapProjection, tripMapData } from '../src/lib/trip-map';
import { validateContent } from '../src/content/validate';

describe('mapa derivado do roteiro', () => {
  it('inclui conexões sem dia-base e preserva as lacunas', () => {
    const c = readContent(),
      model = tripMapData(c);
    expect(model.cities.some((city) => city.id === 'doha')).toBe(true);
    expect(model.dates).toHaveLength(31);
    expect(model.gaps).toHaveLength(7);
    expect(model.routes).toHaveLength(c.flights.length + c.trains.length + c.transfers.length);
  });
  it('acompanha edição dos dias sem inventar transportes nas lacunas', () => {
    const c = readContent();
    c.days.push({
      ...c.days.find((d) => d.date === '2027-01-19')!,
      date: '2027-01-20',
      activities: [],
    });
    const before = tripMapData(readContent()),
      after = tripMapData(c);
    expect(after.gaps).toHaveLength(before.gaps.length - 1);
    expect(after.routes).toEqual(before.routes);
  });
  it('exclui trechos cancelados, aceita posição desconhecida e valida WGS84', () => {
    const c = readContent();
    c.flights[0].status = 'cancelled';
    expect(tripMapData(c).routes.some((r) => r.id === c.flights[0].id)).toBe(false);
    c.trip.cities[0].mapPosition = null;
    expect(() => validateContent(c)).not.toThrow();
    c.trip.cities[0].mapPosition = { ...c.trip.cities[1].mapPosition!, lat: 91 };
    expect(() => validateContent(c)).toThrow();
  });
  it('mantém projeção e rótulos finitos dentro da tela com pontos próximos', () => {
    const p = mapProjection(
      [
        { lat: 35, lon: 139 },
        { lat: 36, lon: 138 },
      ],
      280,
      440,
    );
    const points = [p(139, 35), p(138, 36)];
    const labels = mapLabels(points, 280, 440);
    for (const label of labels) {
      expect(label.x).toBeGreaterThanOrEqual(67);
      expect(label.x).toBeLessThanOrEqual(213);
      expect(label.y).toBeGreaterThan(0);
    }
    expect(mapProjection([], 280, 440)(0, 0)).toEqual({ x: 140, y: 220 });
  });
});
