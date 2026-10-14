import type { Content } from '../content/schema';
export type Flight = Content['flights'][number];
/** Converte uma hora local para cálculo de duração; a apresentação preserva o horário do bilhete. */
export function endpointInstant(side: {
  date: string;
  time: string | null;
  timezone: string;
}): number | null {
  if (!side.time) return null;
  const utc = Date.parse(`${side.date}T${side.time}:00Z`);
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: side.timezone,
    dateStyle: 'short',
    timeStyle: 'medium',
  })
    .format(new Date(utc))
    .replace(' ', 'T');
  return utc - (Date.parse(`${local}Z`) - utc);
}
export function connectionMinutes(flight: Flight, next: Flight): number | null {
  const arrival = endpointInstant(flight.to),
    departure = endpointInstant(next.from);
  return arrival === null || departure === null ? null : (departure - arrival) / 60000;
}
export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60),
    remainder = minutes % 60;
  return hours
    ? `${hours}h${remainder ? String(remainder).padStart(2, '0') : ''}`
    : `${remainder} min`;
}
