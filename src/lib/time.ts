import type { Activity, Content, Day } from '../content/schema';
export function localDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function localTime(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}
export function currentTripDay(
  c: Content,
  now = new Date(),
): { date: string; phase: 'before' | 'during' | 'after' | 'incomplete' } {
  const zone = (day: Day) =>
    c.trip.cities.find((v) => v.id === day.cityId)?.timezone ?? c.trip.defaultTimeZone;
  const first = c.days[0];
  const last = c.days[c.days.length - 1];
  if (c.trip.startDate && localDate(now, zone(first)) < c.trip.startDate)
    return { date: first.date, phase: 'before' };
  if (c.trip.endDate && localDate(now, zone(last)) > c.trip.endDate)
    return { date: last.date, phase: 'after' };
  const matching = c.days.filter((day) => localDate(now, zone(day)) === day.date);
  if (matching.length) return { date: matching[matching.length - 1].date, phase: 'during' };
  const upcoming = c.days.find((day) => localDate(now, zone(day)) < day.date);
  return { date: upcoming?.date ?? last.date, phase: 'incomplete' };
}
export function formatDate(
  date: string | null,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
): string {
  if (!date) return 'A definir';
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}
export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
}
export function nextActivity(day: Day, timezone: string, now = new Date()): Activity | undefined {
  return sortActivities(day.activities).find((a) => {
    if (a.status === 'optional' || a.status === 'cancelled' || !a.time) return false;
    const date = localDate(now, a.timezone ?? timezone);
    return (
      day.date > date || (day.date === date && a.time >= localTime(now, a.timezone ?? timezone))
    );
  });
}
export function departureTime(
  date: string,
  time: string,
  minutes: number,
): { date: string; time: string } {
  const value = new Date(Date.parse(`${date}T${time}:00Z`) - minutes * 60000);
  return { date: value.toISOString().slice(0, 10), time: value.toISOString().slice(11, 16) };
}
