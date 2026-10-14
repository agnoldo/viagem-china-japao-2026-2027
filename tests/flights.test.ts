import { describe, it, expect } from 'vitest';
import { readContent } from '../scripts/read-content';
import { validateContent } from '../src/content/validate';
import { connectionMinutes, durationLabel, endpointInstant } from '../src/lib/flights';
const content = readContent();
const confirmed = content.flights.filter((f) => f.status === 'confirmed');
const flight = (number: string) => content.flights.find((f) => f.flightNumber === number)!;
describe('bilhete familiar de ida e volta', () => {
  it('preserva seis voos, horários locais, duração e quatro passageiros', () => {
    expect(
      confirmed.map((f) => [
        f.flightNumber,
        f.from.date,
        f.from.time,
        f.to.date,
        f.to.time,
        f.durationMinutes,
      ]),
    ).toEqual([
      ['QR7251', '2026-12-29', '15:20', '2026-12-29', '16:35', 75],
      ['QR774', '2026-12-30', '02:10', '2026-12-30', '21:40', 810],
      ['QR892', '2026-12-31', '02:05', '2026-12-31', '14:45', 460],
      ['QR809', '2027-01-27', '16:55', '2027-01-27', '23:40', 765],
      ['QR785', '2027-01-28', '00:25', '2027-01-28', '09:30', 905],
      ['QR4834', '2027-01-28', '11:15', '2027-01-28', '12:25', 70],
    ]);
    for (const f of confirmed) {
      expect((endpointInstant(f.to)! - endpointInstant(f.from)!) / 60000).toBe(f.durationMinutes);
      expect(f.travelerIds).toEqual(content.trip.travelers.map((t) => t.id));
      expect(f.baggage).toEqual({ pieces: 2, weightKg: null });
      expect(f.cabin).toBe('Economy');
      expect(f.airline).toBe('Qatar Airways');
      expect(f.operatedBy).toBe(
        ['QR7251', 'QR4834'].includes(f.flightNumber!) ? 'LATAM AIRLINES BRASIL' : 'Qatar Airways',
      );
    }
  });
  it('distingue Daxing, Narita e Haneda, sem deduzir terminais ausentes', () => {
    expect(flight('QR892').to.airportCode).toBe('PKX');
    expect(flight('QR809').from.airportCode).toBe('NRT');
    expect(flight('QR809').from.terminal).toBe('2');
    expect(flight('QR809').to.terminal).toBeNull();
    expect(flight('QR7251').from.terminal).toBeNull();
  });
  it('calcula quatro conexões, inclusive viradas de dia e trocas de terminal', () => {
    expect(
      confirmed
        .filter((f) => f.nextFlightId)
        .map((f) =>
          connectionMinutes(
            f,
            content.flights.find((n) => n.id === f.nextFlightId)!,
          ),
        ),
    ).toEqual([575, 265, 45, 105]);
    expect([flight('QR7251').to.terminal, flight('QR774').from.terminal]).toEqual(['2', '3']);
    expect([flight('QR785').to.terminal, flight('QR4834').from.terminal]).toEqual(['3', '2']);
    expect([45, 105, 575, 265, 810].map(durationLabel)).toEqual([
      '45 min',
      '1h45',
      '9h35',
      '4h25',
      '13h30',
    ]);
  });
  it('rejeita duração incorreta e viajante inexistente', () => {
    const badDuration = structuredClone(content);
    badDuration.flights[0].durationMinutes = 1;
    expect(() => validateContent(badDuration)).toThrow(/Duração inconsistente/);
    const badTraveler = structuredClone(content);
    badTraveler.flights[0].travelerIds = ['unknown-traveler'];
    expect(() => validateContent(badTraveler)).toThrow(/viajante/);
  });
  it('rejeita conexão inexistente, em outro aeroporto, anterior ou cíclica', () => {
    const invalid = structuredClone(content);
    invalid.flights[0].nextFlightId = 'unknown-flight';
    expect(() => validateContent(invalid)).toThrow(/conexão/);
    const wrongAirport = structuredClone(content);
    wrongAirport.flights[0].nextFlightId = flight('QR892').id;
    expect(() => validateContent(wrongAirport)).toThrow(/Aeroportos incompatíveis/);
    const backwards = structuredClone(content);
    backwards.flights.find((f) => f.flightNumber === 'QR4834')!.nextFlightId = flight('QR7251').id;
    expect(() => validateContent(backwards)).toThrow(/Conexão anterior/);
    const cycle = structuredClone(content);
    cycle.flights[0].nextFlightId = cycle.flights[0].id;
    expect(() => validateContent(cycle)).toThrow(/Ciclo/);
  });
  it('não aceita campos privados do recibo no schema público', () => {
    const privateField = structuredClone(content);
    Object.assign(privateField.flights[0], {
      frequentFlyerNumber: 'private',
      fareBasis: 'private',
    });
    expect(() => validateContent(privateField)).toThrow();
    expect(confirmed.every((f) => f.bookingReferenceHint === null)).toBe(true);
  });
});
