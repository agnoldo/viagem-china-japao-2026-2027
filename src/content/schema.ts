import { z } from 'zod';
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    'Data inválida',
  );
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida');
export const timezoneSchema = z.string().refine((v) => {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: v });
    return v.includes('/');
  } catch {
    return false;
  }
}, 'Fuso IANA inválido');
export const statusSchema = z.enum([
  'confirmed',
  'planned',
  'optional',
  'example',
  'undecided',
  'cancelled',
]);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const nullableText = text.nullable().default(null);
const name = z.object({ default: text, local: nullableText }).strict();
const address = z.object({ default: nullableText, local: nullableText }).strict();
const coordinate = z
  .object({
    lat: z.number().min(-90).max(90).nullable(),
    lon: z.number().min(-180).max(180).nullable(),
  })
  .strict()
  .refine(
    (v) => (v.lat === null) === (v.lon === null),
    'Coordenada exige latitude e longitude juntas',
  );
const coordinates = z.object({ wgs84: coordinate, gcj02: coordinate, bd09: coordinate }).strict();
const safeUrl = z.url().refine((v) => new URL(v).protocol === 'https:', 'Somente links HTTPS');
const mapSearch = z
  .object({
    apple: nullableText,
    amapKeyword: nullableText,
    amapCity: nullableText,
    baiduKeyword: nullableText,
    baiduCity: nullableText,
  })
  .strict();
const mapLinks = z.record(z.string(), safeUrl.nullable()).default({});
const basePlace = {
  id,
  cityId: id,
  name,
  status: statusSchema,
  address,
  phone: nullableText,
  coordinates,
  mapSearch,
  mapLinks,
  aliases: z.array(text).default([]),
  notes: z.string().default(''),
  officialUrl: safeUrl.nullable().default(null),
};
export const regionSchema = z
  .object({ id, name: text, localName: nullableText, country: z.enum(['BR', 'CN', 'JP', 'QA']) })
  .strict();
export const citySchema = z
  .object({
    id,
    regionId: id,
    country: z.enum(['BR', 'CN', 'JP', 'QA']),
    name,
    aliases: z.array(text).default([]),
    timezone: timezoneSchema,
    startDate: dateSchema.nullable(),
    endDate: dateSchema.nullable(),
    status: statusSchema,
    notes: z.string().default(''),
  })
  .strict()
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, 'Período invertido');
export const placeSchema = z
  .object({
    ...basePlace,
    category: z.enum(['attraction', 'airport', 'station', 'region', 'other']),
  })
  .strict();
export const hotelSchema = z
  .object({
    ...basePlace,
    name: z.object({ default: nullableText, local: nullableText }).strict(),
    type: z.enum(['hotel', 'resort']).default('hotel'),
    checkIn: timeSchema.nullable(),
    checkInUntil: timeSchema.nullable().default(null),
    checkOut: timeSchema.nullable(),
    checkInDate: dateSchema.nullable().default(null),
    checkOutDate: dateSchema.nullable().default(null),
  })
  .strict()
  .refine(
    (v) => !v.checkInDate || !v.checkOutDate || v.checkOutDate >= v.checkInDate,
    'Checkout anterior ao check-in',
  )
  .refine(
    (v) => !v.checkInUntil || (!!v.checkIn && v.checkInUntil >= v.checkIn),
    'Janela de check-in inválida',
  );
export const activityTypes = [
  'flight',
  'arrival',
  'train',
  'transfer',
  'metro',
  'bus',
  'taxi',
  'walk',
  'attraction',
  'meal',
  'hotel',
  'free-time',
  'note',
] as const;
export const activitySchema = z
  .object({
    id,
    title: text,
    type: z.enum(activityTypes),
    status: statusSchema,
    time: timeSchema.optional(),
    endTime: timeSchema.optional(),
    timezone: timezoneSchema.optional(),
    placeId: id.optional(),
    hotelId: id.optional(),
    transportId: id.optional(),
    travelBufferMinutes: z.number().int().min(0).max(1440).default(0),
    notes: z.string().default(''),
  })
  .strict()
  .refine(
    (v) => !v.endTime || (!!v.time && v.endTime >= v.time),
    'Fim anterior ao início; divida atividades noturnas entre os dias',
  );
export const daySchema = z
  .object({
    date: dateSchema,
    cityId: id,
    regionId: id,
    summary: text,
    status: statusSchema,
    hotelId: id.optional(),
    alternativeId: id.optional(),
    notes: z.string().default(''),
    activities: z.array(activitySchema),
  })
  .strict();
const endpoint = z
  .object({
    cityId: id,
    placeId: id.nullable(),
    date: dateSchema,
    time: timeSchema.nullable(),
    timezone: timezoneSchema,
    airportCode: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
    airportName: name.nullable().optional(),
    terminal: nullableText,
    station: name.nullable().optional(),
  })
  .strict();
const transportFields = {
  id,
  status: statusSchema,
  from: endpoint,
  to: endpoint,
  bookingReferenceHint: z.null().default(null),
  notes: text,
  offlineInstructions: text,
};
export const flightSchema = z
  .object({
    ...transportFields,
    kind: z.literal('flight'),
    airline: nullableText,
    flightNumber: nullableText,
    operatedBy: nullableText,
    cabin: nullableText,
    baggage: z
      .object({ pieces: z.number().int().positive(), weightKg: z.number().positive().nullable() })
      .strict()
      .nullable()
      .default(null),
    durationMinutes: z.number().int().positive().nullable().default(null),
    travelerIds: z.array(id).default([]),
    nextFlightId: id.nullable().default(null),
  })
  .strict()
  .refine(
    (v) =>
      [v.from, v.to].every((side) => !side.placeId || (!!side.airportCode && !!side.airportName)),
    'Voo exige aeroportos',
  );
export const trainSchema = z
  .object({
    ...transportFields,
    kind: z.literal('train'),
    trainNumber: nullableText,
    class: nullableText,
    recommendedArrivalMinutes: z.number().int().min(0).nullable(),
    service: z.object({ type: text, line: nullableText }).strict().optional(),
    reservationStatus: nullableText,
  })
  .strict()
  .refine(
    (v) => [v.from, v.to].every((side) => !side.placeId || !!side.station),
    'Estação conhecida exige nome',
  );
export const transferSchema = z
  .object({
    ...transportFields,
    kind: z.enum([
      'flight',
      'train',
      'metro',
      'bus',
      'taxi',
      'walk',
      'private',
      'airport-shuttle',
      'station-shuttle',
    ]),
    durationMinutes: z.number().int().positive().nullable(),
    safetyBufferMinutes: z.number().int().min(0),
  })
  .strict();
export const alternativeSchema = z
  .object({
    id,
    kind: z.literal('alternative'),
    status: z.literal('undecided'),
    label: text,
    startDate: dateSchema.nullable(),
    endDate: dateSchema.nullable(),
    options: z
      .array(
        z
          .object({
            id,
            label: text,
            status: z.enum(['optional', 'cancelled']),
            cityIds: z.array(id).min(1),
            notes: text,
          })
          .strict(),
      )
      .min(2),
  })
  .strict();
export const tripSchema = z
  .object({
    id,
    name: text,
    startDate: dateSchema.nullable(),
    endDate: dateSchema.nullable(),
    homeCity: text,
    year: z.number().int().optional(),
    status: z.enum(['planning', 'active', 'completed']).default('planning'),
    itineraryCoverage: z.enum(['complete', 'partial']).default('complete'),
    notes: z.array(text).default([]),
    countries: z.array(z.enum(['BR', 'CN', 'JP', 'QA'])).min(1),
    defaultLocale: z.literal('pt-BR'),
    defaultTimeZone: timezoneSchema,
    contentVersion: dateSchema,
    travelers: z.array(z.object({ id, label: text }).strict()).min(1),
    regions: z.array(regionSchema),
    cities: z.array(citySchema),
    alternatives: z.array(alternativeSchema),
    usefulInfo: z.array(z.object({ title: text, body: text }).strict()),
  })
  .strict()
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    'Período da viagem invertido',
  );
export const contentSchema = z
  .object({
    trip: tripSchema,
    places: z.array(placeSchema),
    hotels: z.array(hotelSchema),
    flights: z.array(flightSchema),
    trains: z.array(trainSchema),
    transfers: z.array(transferSchema),
    days: z.array(daySchema).min(1),
  })
  .strict();
export type Content = z.infer<typeof contentSchema>;
export type Trip = Content['trip'];
export type City = Trip['cities'][number];
export type Day = Content['days'][number];
export type Activity = Day['activities'][number];
export type Place = Content['places'][number];
export type Hotel = Content['hotels'][number];
export type Transport =
  Content['flights'][number] | Content['trains'][number] | Content['transfers'][number];
export type Status = z.infer<typeof statusSchema>;
