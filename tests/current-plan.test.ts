import { describe, it, expect } from 'vitest';
import { readContent } from '../scripts/read-content';
import { datesBetween, validateContent } from '../src/content/validate';
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
    expect(currentTripDay(content, new Date('2027-01-24T12:00:00Z')).phase).toBe('during');
    expect(content.days.map((d) => d.date)).toEqual(datesBetween('2026-12-29', '2027-01-28'));
    expect(formatDate(null)).toBe('A definir');
    const copy = structuredClone(content);
    copy.days = copy.days.filter((d) => d.date !== '2027-01-24');
    expect(currentTripDay(copy, new Date('2027-01-24T12:00:00Z')).phase).toBe('incomplete');
    copy.trip.itineraryCoverage = 'complete';
    expect(() => validateContent(copy)).toThrow(/dia 2027-01-24/);
  });
  it('cobre cinco noites em Beijing sem transformar disponibilidade de check-in em chegada agendada', () => {
    const hotel = content.hotels.find((h) => h.id === 'pan-pacific-beijing')!;
    expect([hotel.checkInDate, hotel.checkIn, hotel.checkOutDate, hotel.checkOut]).toEqual([
      '2026-12-31',
      '15:00',
      '2027-01-05',
      '12:00',
    ]);
    expect(content.days.filter((d) => d.hotelId === hotel.id).map((d) => d.date)).toEqual([
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
    ]);
    const checkin = content.days
      .find((d) => d.date === '2026-12-31')!
      .activities.find((a) => a.hotelId === hotel.id)!;
    expect(checkin.time).toBeUndefined();
    const checkout = content.days.find((d) => d.date === '2027-01-05')!;
    expect(checkout.hotelId).toBe('chengdu-hotel');
    expect(checkout.activities[0].time).toBeUndefined();
    expect(hotel.name.local).toBe('北京泛太平洋酒店');
    expect(hotel.address.local).toContain('华远街2号');
    for (const provider of ['apple', 'amap', 'baidu'])
      expect(buildMapLinks(hotel, provider).url).toMatch(/^https:/);
    expect(
      Object.values(hotel.coordinates).every((pair) => pair.lat === null && pair.lon === null),
    ).toBe(true);
  });
  it('distingue noites em trânsito de hospedagem pendente e rejeita hotel simultâneo', () => {
    expect(content.days.filter((d) => d.overnightInTransit).map((d) => d.date)).toEqual([
      '2026-12-29',
      '2026-12-30',
      '2027-01-27',
    ]);
    expect(content.days.find((d) => d.date === '2027-01-04')!.overnightInTransit).toBe(false);
    const copy = structuredClone(content);
    copy.days.find((d) => d.date === '2027-01-18')!.overnightInTransit = true;
    expect(() => validateContent(copy)).toThrow(/Pernoite em trânsito/);
  });
  it('mantém pernoite em Tokyo no dia 18 e início do resort no dia 19', () => {
    const arrival = content.days.find((d) => d.date === '2027-01-18')!;
    const snow = content.days.find((d) => d.date === '2027-01-19')!;
    expect(arrival.cityId).toBe('tokyo');
    expect(arrival.hotelId).toBe('ueno-woo-hotel');
    expect(snow.cityId).toBe('echigo-yuzawa');
    expect(snow.hotelId).toBe('echigo-yuzawa-resort');
    expect(arrival.activities.some((a) => a.type === 'train')).toBe(false);
  });
  it('preserva janela de check-in e checkout de Tokyo sem mudar o hotel da noite seguinte', () => {
    const hotel = content.hotels.find((h) => h.id === 'ueno-woo-hotel')!;
    expect([
      hotel.checkInDate,
      hotel.checkIn,
      hotel.checkInUntil,
      hotel.checkOutDate,
      hotel.checkOut,
    ]).toEqual(['2027-01-18', '15:00', '21:00', '2027-01-19', '11:00']);
    expect(hotel.notes).toContain('2 quartos Double Room');
    expect(content.days.filter((d) => d.hotelId === hotel.id).map((d) => d.date)).toEqual([
      '2027-01-18',
    ]);
    const checkin = content.days
      .find((d) => d.date === '2027-01-18')!
      .activities.find((a) => a.hotelId === hotel.id)!;
    expect(checkin.time).toBeUndefined();
    expect(
      content.days
        .find((d) => d.date === '2027-01-19')!
        .activities.find((a) => a.hotelId === hotel.id)!.time,
    ).toBe('11:00');
    const invalid = structuredClone(content);
    invalid.hotels.find((h) => h.id === hotel.id)!.checkInUntil = '14:00';
    expect(() => validateContent(invalid)).toThrow(/Janela de check-in/);
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
  it('associa somente as noites reservadas em Yuzawa e Kawaguchiko, preservando retorno a Tokyo', () => {
    const snow = content.hotels.find((h) => h.id === 'echigo-yuzawa-resort')!;
    const regina = content.hotels.find((h) => h.id === 'hotel-regina-kawaguchiko')!;
    expect([snow.checkInDate, snow.checkOutDate, snow.checkOut]).toEqual([
      '2027-01-19',
      '2027-01-21',
      '10:00',
    ]);
    expect([
      regina.checkInDate,
      regina.checkOutDate,
      regina.checkIn,
      regina.checkInUntil,
      regina.checkOut,
    ]).toEqual(['2027-01-21', '2027-01-23', '15:00', '20:00', '11:00']);
    for (const [hotel, nights] of [
      [snow, ['2027-01-19', '2027-01-20']],
      [regina, ['2027-01-21', '2027-01-22']],
    ] as const) {
      expect(content.days.filter((d) => d.hotelId === hotel.id).map((d) => d.date)).toEqual(nights);
      expect(buildMapLinks(hotel, 'apple').url).toMatch(/^https:/);
    }
    const arrival = content.days.find((d) => d.date === '2027-01-21')!;
    expect(arrival.activities.find((a) => a.id === 'regina-checkin')!.time).toBeUndefined();
    const departure = content.days.find((d) => d.date === '2027-01-23')!;
    expect(departure.cityId).toBe('tokyo');
    expect(departure.hotelId).toBe('hotel-monterey-hanzomon');
    expect(departure.overnightInTransit).toBe(false);
    expect(departure.activities.find((a) => a.type === 'transfer')!.status).toBe('planned');
  });
  it('cobre quatro noites em dois quartos no Monterey e mantém a noite de volta em trânsito', () => {
    const hotel = content.hotels.find((h) => h.id === 'hotel-monterey-hanzomon')!;
    expect([hotel.checkInDate, hotel.checkOutDate, hotel.checkIn, hotel.checkOut]).toEqual([
      '2027-01-23',
      '2027-01-27',
      '15:00',
      '11:00',
    ]);
    expect(content.days.filter((d) => d.hotelId === hotel.id).map((d) => d.date)).toEqual([
      '2027-01-23',
      '2027-01-24',
      '2027-01-25',
      '2027-01-26',
    ]);
    expect(hotel.notes).toContain('Hollywood Twin Room');
    expect(hotel.notes).toContain('Queen Double Room');
    expect(hotel.notes).toContain('sem garantia');
    const checkin = content.days
      .find((d) => d.date === '2027-01-23')!
      .activities.find((a) => a.id === 'monterey-checkin')!;
    expect(checkin.time).toBeUndefined();
    for (const date of ['2027-01-24', '2027-01-25', '2027-01-26', '2027-01-27']) {
      const day = content.days.find((d) => d.date === date)!;
      const breakfast = day.activities.find((a) => a.hotelId === hotel.id && a.type === 'meal')!;
      expect(breakfast.status).toBe('confirmed');
      expect(breakfast.title).toContain('quatro');
      expect(breakfast.time).toBeUndefined();
    }
    const departure = content.days.find((d) => d.date === '2027-01-27')!;
    expect(departure.hotelId).toBeUndefined();
    expect(departure.overnightInTransit).toBe(true);
    expect(departure.activities.some((a) => a.id === 'monterey-checkout')).toBe(true);
  });
  it('reserva confirmada não implica nome, endereço, horário ou checkout conhecido', () => {
    const copy = structuredClone(content);
    const hotel = copy.hotels[0];
    hotel.name = { default: null, local: null };
    hotel.address = { default: null, local: null };
    hotel.mapSearch.apple = null;
    hotel.checkIn = null;
    hotel.checkOutDate = null;
    expect(() => validateContent(copy)).not.toThrow();
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
      'chengdu',
      'chongqing',
      'zhangjiajie',
      'shanghai',
      'tokyo',
      'echigo-yuzawa',
      'fujikawaguchiko',
    ]);
    expect(content.trip.alternatives).toEqual([]);
    expect(content.transfers).toEqual([]);
    expect(
      [...content.flights, ...content.trains, ...content.hotels].some(
        (v) => v.status === 'example',
      ),
    ).toBe(false);
  });
  it('incorpora a sequência chinesa como proposta sem confirmar bilhetes ou hotéis pendentes', () => {
    expect(
      content.trip.cities
        .filter((c) => c.country === 'CN')
        .map((c) => [c.id, c.startDate, c.endDate]),
    ).toEqual([
      ['beijing', '2026-12-31', '2027-01-05'],
      ['chengdu', '2027-01-05', '2027-01-08'],
      ['chongqing', '2027-01-08', '2027-01-11'],
      ['zhangjiajie', '2027-01-11', '2027-01-14'],
      ['shanghai', '2027-01-14', '2027-01-18'],
    ]);
    const trains = content.trains.filter((t) => t.from.timezone === 'Asia/Shanghai');
    expect(trains.map((t) => [t.from.cityId, t.to.cityId])).toEqual([
      ['chengdu', 'chongqing'],
      ['chongqing', 'zhangjiajie'],
    ]);
    for (const t of trains) {
      expect(t.status).toBe('planned');
      expect(t.from.placeId).toBeNull();
      expect(t.to.placeId).toBeNull();
      expect(t.from.time).toBeNull();
      expect(t.to.time).toBeNull();
      expect(t.trainNumber).toBeNull();
    }
    const flight = content.flights.find((f) => f.id === 'zhangjiajie-shanghai-2027-01-14')!;
    expect(flight.status).toBe('planned');
    expect(flight.from.airportCode).toBeNull();
    expect(flight.to.airportCode).toBeNull();
    expect(flight.flightNumber).toBeNull();
    expect(content.hotels.filter((h) => h.status === 'confirmed').map((h) => h.id)).toEqual([
      'echigo-yuzawa-resort',
      'pan-pacific-beijing',
      'ueno-woo-hotel',
      'chengdu-hotel',
      'chongqing-hotel',
      'chongqing-ji-east',
      'zhangjiajie-hotel',
      'shanghai-hotel',
      'hotel-regina-kawaguchiko',
      'hotel-monterey-hanzomon',
    ]);
    expect(content.hotels.filter((h) => h.status === 'planned')).toHaveLength(0);
    expect(content.days.filter((d) => d.hotelId === 'chongqing-hotel').map((d) => d.date)).toEqual([
      '2027-01-08',
      '2027-01-09',
    ]);
    expect(
      content.days.filter((d) => d.hotelId === 'chongqing-ji-east').map((d) => d.date),
    ).toEqual(['2027-01-10']);
    expect(
      content.days.filter((d) => d.hotelId === 'zhangjiajie-hotel').map((d) => d.date),
    ).toEqual(['2027-01-11', '2027-01-12', '2027-01-13']);
    expect(content.days.filter((d) => d.hotelId === 'shanghai-hotel').map((d) => d.date)).toEqual([
      '2027-01-14',
      '2027-01-15',
      '2027-01-16',
      '2027-01-17',
    ]);
    const shanghaiHotel = content.hotels.find((h) => h.id === 'shanghai-hotel')!;
    expect(shanghaiHotel.checkInDate).toBe('2027-01-14');
    expect(shanghaiHotel.checkOutDate).toBe('2027-01-18');
    expect(content.days.find((d) => d.date === '2027-01-18')!.hotelId).toBe('ueno-woo-hotel');
    expect(content.trip.cities.filter((c) => c.country === 'JP').map((c) => c.id)).toEqual([
      'tokyo',
      'echigo-yuzawa',
      'fujikawaguchiko',
    ]);
    expect(content.hotels.find((h) => h.id === 'echigo-yuzawa-resort')!.checkOutDate).toBe(
      '2027-01-21',
    );
  });
  it('remove Xi’an e preserva o voo doméstico confirmado sem inventar volumes de bagagem', () => {
    expect(content.places.some((p) => p.cityId === 'xian')).toBe(false);
    expect(content.days.some((d) => d.cityId === 'xian')).toBe(false);
    const flight = content.flights.find((f) => f.id === 'beijing-chengdu-2027-01-05')!;
    expect(flight.status).toBe('confirmed');
    expect(flight.flightNumber).toBe('3U8894');
    expect([flight.from.airportCode, flight.from.terminal, flight.from.time]).toEqual([
      'PEK',
      '2',
      '11:40',
    ]);
    expect([flight.to.airportCode, flight.to.terminal, flight.to.time]).toEqual([
      'CTU',
      '1',
      '14:40',
    ]);
    expect(flight.durationMinutes).toBe(180);
    expect(flight.baggage).toBeNull();
    expect(flight.notes).toContain('20 kg por pessoa');
    expect(flight.travelerIds).toEqual(content.trip.travelers.map((t) => t.id));
    expect(flight.bookingReferenceHint).toBeNull();
    expect(content.days.filter((d) => d.cityId === 'chongqing').map((d) => d.date)).toEqual([
      '2027-01-08',
      '2027-01-09',
      '2027-01-10',
    ]);
  });
  it('mantém opções como opções e permite mapas chineses sem inventar endereços ou coordenadas', () => {
    for (const id of [
      'leshan-option',
      'chongqing-elsewhere',
      '2027-01-16-shanghai-disney',
      '2027-01-16-shanghai-pudong',
      'shanghai-water-town',
    ])
      expect(content.days.flatMap((d) => d.activities).find((a) => a.id === id)!.status).toBe(
        'optional',
      );
    const panda = content.places.find((p) => p.id === 'chengdu-panda-base')!;
    expect(panda.address.local).toBeNull();
    expect(
      Object.values(panda.coordinates).every((pair) => pair.lat === null && pair.lon === null),
    ).toBe(true);
    expect(new URL(buildMapLinks(panda, 'baidu').url!).searchParams.get('region')).toBe('成都');
    const leshan = content.places.find((p) => p.id === 'leshan-buddha')!;
    expect(new URL(buildMapLinks(leshan, 'baidu').url!).searchParams.get('region')).toBe('乐山');
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
