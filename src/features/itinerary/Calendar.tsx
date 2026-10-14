import { Link, useSearchParams } from 'react-router-dom';
import { useRef } from 'react';
import {
  ArrowRight,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Moon,
  Plane,
  TrainFront,
} from 'lucide-react';
import { content, cities, hotels } from '../../content';
import { StatusBadge } from '../../components/shared';
import {
  calendarBounds,
  calendarMonths,
  initialCalendarMonth,
  monthCells,
} from '../../lib/calendar';
import { formatDate } from '../../lib/time';
import { entityName } from '../../lib/labels';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Calendar() {
  const detail = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const { start, end } = calendarBounds(content);
  const months = calendarMonths(start, end);
  const requestedMonth = params.get('mes') ?? '';
  const month = months.includes(requestedMonth) ? requestedMonth : initialCalendarMonth(start, end);
  const monthIndex = months.indexOf(month);
  const dates = monthCells(month);
  const requestedDate = params.get('dia') ?? '';
  const selected =
    dates.includes(requestedDate) && requestedDate >= start && requestedDate <= end
      ? requestedDate
      : dates.find((date) => date && date >= start && date <= end)!;
  const day = content.days.find((item) => item.date === selected);
  const city = day && cities.get(day.cityId);
  const hotel = hotels.get(day?.hotelId ?? '');
  const routes = [...content.flights, ...content.trains, ...content.transfers];
  const monthCities = [
    ...new Set(content.days.filter((d) => d.date.startsWith(month)).map((d) => d.cityId)),
  ].map((id) => cities.get(id)!);
  const cityCode = (id: string) => {
    const name = cities.get(id)!.name.default;
    const code = name.slice(0, 3);
    const matching = monthCities.filter((city) => city.name.default.slice(0, 3) === code);
    return matching.length > 1
      ? `${code.slice(0, 2)}${matching.findIndex((city) => city.id === id) + 1}`
      : code;
  };
  // Both local endpoint dates matter: an overnight flight may arrive the next day.
  const routesOn = (date: string) =>
    routes.filter((r) => r.from.date === date || r.to.date === date);
  const update = (next: Record<string, string>) => {
    const updated = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) updated.set(key, value);
    setParams(updated, { replace: true, preventScrollReset: true });
  };
  return (
    <section className="trip-calendar" aria-label="Calendário da viagem">
      <div className="calendar-toolbar">
        <h2 aria-live="polite">{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</h2>
        <div className="calendar-month-buttons">
          <button
            className="icon-button"
            aria-label="Mês anterior"
            disabled={monthIndex === 0}
            onClick={() => update({ mes: months[monthIndex - 1], dia: '' })}
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            aria-label="Próximo mês"
            disabled={monthIndex === months.length - 1}
            onClick={() => update({ mes: months[monthIndex + 1], dia: '' })}
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="calendar-help">
        Selecione um dia para consultar o resumo e abrir a programação.
      </p>
      <div className="calendar-weekdays" aria-hidden="true">
        {weekdays.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div
        className="calendar-grid"
        role="group"
        aria-label={formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}
      >
        {dates.map((date, index) => {
          if (!date) return <span className="calendar-blank" key={`blank-${index}`} />;
          if (date < start || date > end)
            return (
              <span
                className="calendar-outside"
                key={date}
                aria-label={`${formatDate(date)} · fora da viagem`}
              >
                {Number(date.slice(8))}
              </span>
            );
          const entry = content.days.find((item) => item.date === date);
          const baseCity = entry && cities.get(entry.cityId);
          const transports = routesOn(date).filter((r) => r.status !== 'cancelled');
          const stay = hotels.get(entry?.hotelId ?? '');
          const statuses = [
            ...(entry?.activities ?? []),
            ...transports,
            ...(stay ? [stay] : []),
          ].map((item) => item.status);
          const confirmed = statuses.includes('confirmed');
          const proposed =
            statuses.some((status) =>
              ['planned', 'optional', 'undecided', 'example'].includes(status),
            ) || entry?.status === 'planned';
          const label = [
            formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            baseCity?.name.default ?? 'Sem programação cadastrada',
            confirmed && 'Há itens confirmados',
            proposed && 'Há propostas',
            entry?.overnightInTransit && 'Noite em trânsito',
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day${!entry ? ' calendar-gap' : ''}`}
              aria-label={label}
              aria-pressed={date === selected}
              aria-controls="calendar-day-summary"
              onClick={() => {
                update({ mes: month, dia: date });
                requestAnimationFrame(() => detail.current?.scrollIntoView({ block: 'nearest' }));
              }}
            >
              <strong className="calendar-number">{Number(date.slice(8))}</strong>
              <span className="calendar-city">{baseCity?.name.default ?? 'Em aberto'}</span>
              <abbr
                className="calendar-city-code"
                title={baseCity?.name.default ?? 'Sem programação cadastrada'}
                aria-hidden="true"
              >
                {baseCity ? cityCode(baseCity.id) : '?'}
              </abbr>
              <span className="calendar-symbols" aria-hidden="true">
                {transports.some((r) => r.kind === 'flight') && <Plane size={15} />}
                {transports.some((r) => r.kind === 'train') && <TrainFront size={15} />}
                {entry?.overnightInTransit && <Moon size={15} />}
              </span>
              <span className="calendar-certainty" aria-hidden="true">
                {confirmed && <CircleCheck size={14} />}
                {proposed && <CircleDashed size={14} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="calendar-city-key" aria-label="Cidades do mês">
        {monthCities.map((city) => (
          <span key={city.id}>
            <strong>{cityCode(city.id)}</strong> {city.name.default}
          </span>
        ))}
        {dates.some(
          (date) =>
            date && date >= start && date <= end && !content.days.some((day) => day.date === date),
        ) && (
          <span>
            <strong>?</strong> Em aberto
          </span>
        )}
      </div>
      <div className="calendar-legend">
        <span>
          <CircleCheck size={16} aria-hidden="true" /> Há itens confirmados
        </span>
        <span>
          <CircleDashed size={16} aria-hidden="true" /> Há propostas
        </span>
        <span>
          <Moon size={16} aria-hidden="true" /> Noite em trânsito
        </span>
      </div>
      <section
        ref={detail}
        id="calendar-day-summary"
        className="calendar-detail"
        aria-label="Resumo do dia selecionado"
        aria-live="polite"
      >
        <h3>
          {formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
          {city && ` · ${city.name.default}`}
        </h3>
        {day ? (
          <>
            <p>{day.summary}</p>
            {!day.activities.length && (
              <p className="muted">Passeios e horários ainda não definidos.</p>
            )}
            {routesOn(selected).map((route) => (
              <Link className="calendar-route" key={route.id} to={`/trecho/${route.id}`}>
                {route.kind === 'flight' ? (
                  <Plane size={18} aria-hidden="true" />
                ) : (
                  <TrainFront size={18} aria-hidden="true" />
                )}
                <span>
                  {cities.get(route.from.cityId)?.name.default} →{' '}
                  {cities.get(route.to.cityId)?.name.default}
                  {route.from.date !== selected && (
                    <small>Chegada neste dia · saída em {formatDate(route.from.date)}</small>
                  )}
                </span>
                <StatusBadge status={route.status} />
              </Link>
            ))}
            <div className="calendar-stay">
              {day.overnightInTransit ? (
                <>
                  <Moon size={18} aria-hidden="true" /> Noite em trânsito · sem pernoite em hotel
                </>
              ) : hotel ? (
                <>
                  <BedDouble size={18} aria-hidden="true" />
                  <Link to={`/hotel/${hotel.id}`}>{entityName(hotel)}</Link>
                  <StatusBadge status={hotel.status} />
                </>
              ) : (
                <>
                  <BedDouble size={18} aria-hidden="true" /> Hospedagem a definir
                </>
              )}
            </div>
            <Link className="calendar-open" to={`/hoje/${selected}`}>
              Ver programação do dia <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p>Sem programação cadastrada. Cidade, hospedagem e atividades permanecem em aberto.</p>
        )}
      </section>
    </section>
  );
}
