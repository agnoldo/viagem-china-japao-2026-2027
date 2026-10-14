import { parseDocument } from 'yaml';
import { contentSchema, type Content } from './schema';
export function parseYaml(source: string, file = 'YAML'): unknown {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length)
    throw new Error(`${file}: ${document.errors.map((e) => e.message).join('; ')}`);
  return document.toJS() as unknown;
}
export function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let time = Date.parse(start); time <= Date.parse(end); time += 86400000)
    dates.push(new Date(time).toISOString().slice(0, 10));
  return dates;
}
export function validateContent(input: unknown): Content {
  const c = contentSchema.parse(input);
  const errors: string[] = [];
  const unique = (values: string[], label: string) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) errors.push(`${label} duplicado: ${value}`);
      seen.add(value);
    }
  };
  unique(
    [
      c.trip.id,
      ...c.trip.travelers.map((v) => v.id),
      ...c.trip.regions.map((v) => v.id),
      ...c.trip.cities.map((v) => v.id),
      ...c.places.map((v) => v.id),
      ...c.hotels.map((v) => v.id),
      ...c.flights.map((v) => v.id),
      ...c.trains.map((v) => v.id),
      ...c.transfers.map((v) => v.id),
      ...c.trip.alternatives.flatMap((v) => [v.id, ...v.options.map((o) => o.id)]),
      ...c.days.flatMap((v) => v.activities.map((a) => a.id)),
    ],
    'ID',
  );
  unique(
    c.days.map((d) => d.date),
    'Dia',
  );
  const cities = new Map(c.trip.cities.map((v) => [v.id, v]));
  const regions = new Map(c.trip.regions.map((v) => [v.id, v]));
  const places = new Map(c.places.map((v) => [v.id, v]));
  const hotels = new Map(c.hotels.map((v) => [v.id, v]));
  const transports = new Map([...c.flights, ...c.trains, ...c.transfers].map((v) => [v.id, v]));
  const alternatives = new Set(c.trip.alternatives.map((v) => v.id));
  const reference = (exists: boolean, label: string) => {
    if (!exists) errors.push(`Referência inválida: ${label}`);
  };
  const inRange = (date: string, label: string) => {
    if (date < c.trip.startDate || date > c.trip.endDate)
      errors.push(`Data fora da viagem: ${label}`);
  };
  for (const city of c.trip.cities) {
    reference(regions.has(city.regionId), `região de ${city.id}`);
    if (regions.get(city.regionId)?.country !== city.country)
      errors.push(`País/região incompatível: ${city.id}`);
    inRange(city.startDate, city.id);
    inRange(city.endDate, city.id);
  }
  for (const place of [...c.places, ...c.hotels])
    reference(cities.has(place.cityId), `cidade de ${place.id}`);
  for (const day of c.days) {
    inRange(day.date, day.date);
    reference(cities.has(day.cityId), `cidade de ${day.date}`);
    reference(regions.has(day.regionId), `região de ${day.date}`);
    if (cities.get(day.cityId)?.regionId !== day.regionId)
      errors.push(`Região incompatível: ${day.date}`);
    if (day.hotelId) {
      reference(hotels.has(day.hotelId), `hotel de ${day.date}`);
      if (hotels.get(day.hotelId)?.cityId !== day.cityId)
        errors.push(`Hotel em outra cidade: ${day.date}`);
    }
    if (day.alternativeId) reference(alternatives.has(day.alternativeId), day.alternativeId);
    for (const a of day.activities) {
      if (a.placeId) reference(places.has(a.placeId), `local de ${a.id}`);
      if (a.hotelId) reference(hotels.has(a.hotelId), `hotel de ${a.id}`);
      if (a.transportId) {
        reference(transports.has(a.transportId), `transporte de ${a.id}`);
        if (transports.has(a.transportId) && transports.get(a.transportId)?.from.date !== day.date)
          errors.push(`Transporte em outro dia: ${a.id}`);
      }
    }
  }
  for (const date of datesBetween(c.trip.startDate, c.trip.endDate))
    reference(
      c.days.some((d) => d.date === date),
      `dia ${date}`,
    );
  for (const route of transports.values()) {
    for (const side of [route.from, route.to]) {
      reference(cities.has(side.cityId), `cidade de ${route.id}`);
      reference(places.has(side.placeId), `local de ${route.id}`);
      inRange(side.date, route.id);
      if (places.has(side.placeId) && places.get(side.placeId)?.cityId !== side.cityId)
        errors.push(`Local em outra cidade: ${route.id}`);
      if (route.kind === 'flight' && places.get(side.placeId)?.category !== 'airport')
        errors.push(`Voo exige aeroporto: ${route.id}`);
      if (
        route.kind === 'train' &&
        'trainNumber' in route &&
        places.get(side.placeId)?.category !== 'station'
      )
        errors.push(`Trem exige estação: ${route.id}`);
      if (cities.get(side.cityId)?.timezone !== side.timezone)
        errors.push(`Fuso incompatível com cidade: ${route.id}`);
    }
    if (route.to.date < route.from.date) errors.push(`Chegada anterior à partida: ${route.id}`);
    if (route.from.time && route.to.time) {
      const instant = (side: typeof route.from) => {
        const utc = Date.parse(`${side.date}T${side.time}:00Z`);
        const local = new Intl.DateTimeFormat('sv-SE', {
          timeZone: side.timezone,
          dateStyle: 'short',
          timeStyle: 'medium',
        })
          .format(new Date(utc))
          .replace(' ', 'T');
        return utc - (Date.parse(`${local}Z`) - utc);
      };
      if (instant(route.to) < instant(route.from))
        errors.push(`Horários de chegada/partida invertidos: ${route.id}`);
    }
  }
  for (const a of c.trip.alternatives) {
    inRange(a.startDate, a.id);
    inRange(a.endDate, a.id);
    if (a.endDate < a.startDate) errors.push(`Período invertido: ${a.id}`);
    for (const o of a.options)
      for (const cityId of o.cityIds) reference(cities.has(cityId), `cidade de ${o.id}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { ...c, days: c.days.sort((a, b) => a.date.localeCompare(b.date)) };
}
export function loadContentFiles(files: Record<string, string>): Content {
  const get = (name: string) => {
    const entry = Object.entries(files).find(
      ([path]) => path.endsWith(`/data/${name}.yaml`) || path === `data/${name}.yaml`,
    );
    if (!entry) throw new Error(`Arquivo ausente: ${name}.yaml`);
    return parseYaml(entry[1], entry[0]);
  };
  return validateContent({
    trip: get('trip'),
    places: get('places'),
    hotels: get('hotels'),
    flights: get('flights'),
    trains: get('trains'),
    transfers: get('transfers'),
    days: Object.entries(files)
      .filter(([path]) => /\/days\/[^/]+\.yaml$/.test(path))
      .map(([path, source]) => {
        const value = parseYaml(source, path);
        if (
          typeof value === 'object' &&
          value &&
          'date' in value &&
          path.split('/').pop() !== `${value.date}.yaml`
        )
          throw new Error(`Nome do arquivo diverge da data: ${path}`);
        return value;
      }),
  });
}
