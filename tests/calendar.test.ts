import { describe, expect, it } from 'vitest';
import { readContent } from '../scripts/read-content';
import {
  calendarBounds,
  calendarMonths,
  initialCalendarMonth,
  monthCells,
} from '../src/lib/calendar';

describe('calendário de datas civis', () => {
  it('atravessa a virada do ano e abre o mês com mais dias da viagem', () => {
    expect(calendarMonths('2026-12-29', '2027-01-28')).toEqual(['2026-12', '2027-01']);
    expect(initialCalendarMonth('2026-12-29', '2027-01-28')).toBe('2027-01');
  });
  it('alinha sexta-feira em janeiro e completa semanas sem criar datas', () => {
    const cells = monthCells('2027-01');
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(cells[5]).toBe('2027-01-01');
    expect(cells.filter(Boolean)).toHaveLength(31);
    expect(cells.length % 7).toBe(0);
  });
  it('preserva fevereiro bissexto e meses de 28 dias', () => {
    expect(monthCells('2028-02').filter(Boolean)).toHaveLength(29);
    expect(monthCells('2027-02').filter(Boolean)).toHaveLength(28);
  });
  it('mantém as sete lacunas no intervalo conhecido sem preencher o plano', () => {
    const content = readContent();
    const { start, end } = calendarBounds(content);
    const dates = calendarMonths(start, end)
      .flatMap(monthCells)
      .filter((date): date is string => !!date && date >= start && date <= end);
    expect(dates).toHaveLength(31);
    expect(dates.filter((date) => !content.days.some((day) => day.date === date))).toEqual(
      Array.from({ length: 7 }, (_, i) => `2027-01-${20 + i}`),
    );
    expect(content.days).toHaveLength(24);
  });
  it('usa dias registrados quando os limites gerais não foram informados', () => {
    const content = readContent();
    content.trip.startDate = null;
    content.trip.endDate = null;
    expect(calendarBounds(content)).toEqual({
      start: content.days[0].date,
      end: content.days.at(-1)!.date,
    });
  });
});
