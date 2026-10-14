import { describe, it, expect } from 'vitest';
import { fullPlanFixture } from './fixtures/full-plan';
import { parseYaml, validateContent, datesBetween } from '../src/content/validate';
import { dateSchema, timeSchema, timezoneSchema, contentSchema } from '../src/content/schema';
const fixture = fullPlanFixture();
const copy = () => structuredClone(fixture);
describe('YAML e schemas', () => {
  it('lê YAML e rejeita sintaxe e chaves duplicadas', () => {
    expect(parseYaml('name: Viagem')).toEqual({ name: 'Viagem' });
    expect(() => parseYaml('a: [')).toThrow();
    expect(() => parseYaml('id: a\nid: b')).toThrow();
  });
  it.each(['2027-02-29', '2027-13-01', '2027-1-01', '2026-02-30'])(
    'rejeita data impossível %s',
    (value) => {
      expect(dateSchema.safeParse(value).success).toBe(false);
    },
  );
  it.each(['24:00', '12:60', '9:00'])('rejeita hora inválida %s', (value) => {
    expect(timeSchema.safeParse(value).success).toBe(false);
  });
  it('valida fusos IANA', () => {
    expect(timezoneSchema.safeParse('Asia/Shanghai').success).toBe(true);
    expect(timezoneSchema.safeParse('Asia/Tokyo').success).toBe(true);
    expect(timezoneSchema.safeParse('Brazil/Inexistente').success).toBe(false);
  });
  it('rejeita status e título vazio', () => {
    const c = copy();
    c.days[0].activities[0].title = ' ';
    expect(contentSchema.safeParse(c).success).toBe(false);
    expect(
      contentSchema.safeParse({ ...c, days: [{ ...c.days[0], status: 'booked' }] }).success,
    ).toBe(false);
  });
  it('exige origem, destino e estações distinguíveis', () => {
    const c = copy();
    expect(
      contentSchema.safeParse({ ...c, flights: [{ ...c.flights[0], from: undefined }] }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...c,
        trains: [{ ...c.trains[0], from: { ...c.trains[0].from, station: undefined } }],
      }).success,
    ).toBe(false);
  });
  it('rejeita links executáveis e reserva privada', () => {
    const c = copy();
    c.places[0].mapLinks.apple = 'javascript:alert(1)';
    expect(contentSchema.safeParse(c).success).toBe(false);
    expect(
      contentSchema.safeParse({
        ...fixture,
        flights: [{ ...fixture.flights[0], bookingReferenceHint: 'ABC123' }],
      }).success,
    ).toBe(false);
  });
});
describe('integridade do roteiro', () => {
  it('inclui todos os 30 dias, China e Japão, sem lacunas', () => {
    expect(fixture.days.map((d) => d.date)).toEqual(datesBetween('2026-12-29', '2027-01-27'));
    expect(fixture.days).toHaveLength(30);
    expect(fixture.trip.countries).toContain('CN');
    expect(fixture.trip.countries).toContain('JP');
  });
  it.each(['cityId', 'hotelId'] as const)('rejeita referência quebrada %s', (field) => {
    const c = copy();
    c.days[3][field] = 'missing';
    expect(() => validateContent(c)).toThrow(/Referência/);
  });
  it('rejeita local e transporte inexistentes', () => {
    const c = copy();
    c.days[0].activities[0].placeId = 'missing';
    expect(() => validateContent(c)).toThrow(/Referência/);
  });
  it('rejeita ID duplicado entre entidades e dias duplicados', () => {
    const c = copy();
    c.places.push(c.places[0]);
    expect(() => validateContent(c)).toThrow(/duplicado/);
    const d = copy();
    d.days.push(d.days[0]);
    expect(() => validateContent(d)).toThrow(/duplicado/);
  });
  it('rejeita arquivo diário ausente', () => {
    const c = copy();
    c.days.splice(4, 1);
    expect(() => validateContent(c)).toThrow(/dia 2027-01-02/);
  });
  it('rejeita fuso e estação incompatíveis no transporte', () => {
    const c = copy();
    c.trains[0].from.timezone = 'Asia/Tokyo';
    expect(() => validateContent(c)).toThrow(/Fuso incompatível/);
    const d = copy();
    d.trains[0].from.placeId = 'forbidden-city';
    expect(() => validateContent(d)).toThrow(/estação/);
  });
  it('considera os fusos ao validar chegada e partida', () => {
    const c = copy();
    c.flights[1].to.time = '10:30';
    expect(() => validateContent(c)).toThrow(/invertidos/);
  });
  it('conta as 18 noites nas seis bases chinesas', () => {
    expect(fixture.days.filter((d) => d.regionId === 'china')).toHaveLength(18);
    expect(fixture.trip.cities.filter((c) => c.country === 'CN').map((c) => c.id)).toEqual([
      'beijing',
      'xian',
      'chengdu',
      'chongqing',
      'zhangjiajie',
      'shanghai',
    ]);
  });
  it('mantém alternativas japonesas opcionais e abertas', () => {
    const a = fixture.trip.alternatives[0];
    expect(a.status).toBe('undecided');
    expect(a.options.map((o) => o.status)).toEqual(['optional', 'optional']);
    expect(fixture.days.filter((d) => d.alternativeId === a.id)).toHaveLength(5);
    const c = copy();
    c.trip.alternatives[0].options = [];
    expect(() => validateContent(c)).toThrow();
  });
  it('não apresenta reserva inventada como confirmada', () => {
    expect(
      [...fixture.flights, ...fixture.trains, ...fixture.hotels, ...fixture.transfers].every(
        (v) => v.status === 'example',
      ),
    ).toBe(true);
  });
});
