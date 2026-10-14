import { describe, it, expect } from 'vitest';
import { readContent } from '../scripts/read-content';
import { validateContent } from '../src/content/validate';
import { currentTripDay, formatDate } from '../src/lib/time';
import { buildMapLinks } from '../src/features/maps/links';
const content = readContent();
describe('plano atual com dados incompletos', () => {
  it('usa as datas do bilhete sem preencher lacunas da programação', () => {
    expect(content.trip.startDate).toBe('2026-12-29');
    expect(content.trip.endDate).toBe('2027-01-28');
    expect(content.trip.itineraryCoverage).toBe('partial');
    expect(currentTripDay(content, new Date('2026-10-14T12:00:00Z'))).toEqual({
      date: '2026-12-29',
      phase: 'before',
    });
    expect(currentTripDay(content, new Date('2027-02-01T12:00:00Z')).phase).toBe('after');
    expect(currentTripDay(content, new Date('2027-01-10T12:00:00Z')).phase).toBe('incomplete');
    expect(content.days.map((d) => d.date)).toEqual([
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-18',
      '2027-01-19',
      '2027-01-27',
      '2027-01-28',
    ]);
    expect(formatDate(null)).toBe('A definir');
    const copy = structuredClone(content);
    copy.trip.itineraryCoverage = 'complete';
    expect(() => validateContent(copy)).toThrow(/dia 2027-01-01/);
  });
  it('mantém pernoite em Tokyo no dia 18 e início do resort no dia 19', () => {
    const arrival = content.days.find((d) => d.date === '2027-01-18')!;
    const snow = content.days.find((d) => d.date === '2027-01-19')!;
    expect(arrival.cityId).toBe('tokyo');
    expect(arrival.hotelId).toBeUndefined();
    expect(snow.cityId).toBe('echigo-yuzawa');
    expect(snow.hotelId).toBe('echigo-yuzawa-resort');
    expect(arrival.activities.some((a) => a.type === 'train')).toBe(false);
  });
  it('preserva Haneda, deixando aeroporto de Shanghai e horários em aberto', () => {
    const flight = content.flights.find((f) => f.id === 'flight-shanghai-tokyo-2027-01-18')!;
    expect(flight.status).toBe('planned');
    expect(flight.from.placeId).toBeNull();
    expect(flight.from.airportCode).toBeNull();
    expect(flight.to.airportCode).toBe('HND');
    expect(flight.to.placeId).toBe('tokyo-haneda');
    expect(flight.from.time).toBeNull();
    expect(flight.to.time).toBeNull();
  });
  it('não preenche estação de Tokyo nem antecipa trem para o dia 18', () => {
    const train = content.trains[0];
    expect(train.from.date).toBe('2027-01-19');
    expect(train.from.placeId).toBeNull();
    expect(train.from.station).toBeNull();
    expect(train.service?.line).toBe('Joetsu Shinkansen');
    expect(train.to.placeId).toBe('echigo-yuzawa-station');
    expect(train.recommendedArrivalMinutes).toBeNull();
  });
  it('reserva confirmada não implica nome, endereço, horário ou checkout conhecido', () => {
    const hotel = content.hotels[0];
    expect(hotel.status).toBe('confirmed');
    expect(hotel.name.default).toBeNull();
    expect(hotel.checkInDate).toBe('2027-01-19');
    expect(hotel.checkOutDate).toBeNull();
    expect(hotel.checkIn).toBeNull();
    expect(buildMapLinks(hotel, 'apple').url).toBeNull();
  });
  it('não publica demos antigas, alternativas ou conexões não informadas', () => {
    expect(content.trip.cities.map((c) => c.id)).toEqual([
      'belo-horizonte',
      'sao-paulo',
      'doha',
      'beijing',
      'shanghai',
      'tokyo',
      'echigo-yuzawa',
    ]);
    expect(content.trip.alternatives).toEqual([]);
    expect(content.transfers).toEqual([]);
    expect(
      [...content.flights, ...content.trains, ...content.hotels].some(
        (v) => v.status === 'example',
      ),
    ).toBe(false);
  });
  it('ainda rejeita referência inexistente, mesmo aceitando um local desconhecido', () => {
    const copy = structuredClone(content);
    copy.flights[0].from.placeId = 'airport-missing';
    expect(() => validateContent(copy)).toThrow();
  });
  it('rejeita checkout anterior ao check-in', () => {
    const copy = structuredClone(content);
    copy.hotels[0].checkOutDate = '2027-01-18';
    expect(() => validateContent(copy)).toThrow(/Checkout/);
  });
});
