import type { Content } from '../content/schema';

// Calendar dates are civil dates. UTC arithmetic avoids device timezone/DST shifts.
export function calendarBounds(content: Content) {
  return {
    start: content.trip.startDate ?? content.days[0].date,
    end: content.trip.endDate ?? content.days[content.days.length - 1].date,
  };
}

export function calendarMonths(start: string, end: string): string[] {
  const months: string[] = [];
  const cursor = new Date(`${start.slice(0, 7)}-01T12:00:00Z`);
  while (cursor.toISOString().slice(0, 7) <= end.slice(0, 7)) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export function monthCells(month: string): (string | null)[] {
  const cursor = new Date(`${month}-01T12:00:00Z`);
  const cells: (string | null)[] = Array.from({ length: cursor.getUTCDay() }, () => null);
  while (cursor.toISOString().slice(0, 7) === month) {
    cells.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function initialCalendarMonth(start: string, end: string): string {
  // Open the month containing the largest part of the trip, even before departure.
  return calendarMonths(start, end).reduce((best, month) => {
    const count = (value: string) =>
      monthCells(value).filter((date) => date && date >= start && date <= end).length;
    return count(month) > count(best) ? month : best;
  });
}
