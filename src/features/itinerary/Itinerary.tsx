import { Link, useSearchParams } from 'react-router-dom';
import { Calendar } from './Calendar';
import { CalendarDays, List } from 'lucide-react';
import { ArrowRight, BedDouble, Plane, TrainFront, MapPin, GitBranch } from 'lucide-react';
import { content, cities } from '../../content';
import { PageHeading, StatusBadge, Section } from '../../components/shared';
import { formatDate } from '../../lib/time';
export function Alternatives({ cityId }: { cityId?: string }) {
  const alternatives = content.trip.alternatives.filter(
    (a) => !cityId || a.options.some((o) => o.cityIds.includes(cityId)),
  );
  return (
    <>
      {alternatives.map((a) => (
        <section className="alternative-panel" key={a.id} id="alternativas">
          <div className="alternative-title">
            <GitBranch size={24} aria-hidden="true" />
            <h2>{a.label}</h2>
            <StatusBadge status={a.status} />
          </div>
          <p>
            {formatDate(a.startDate)} a {formatDate(a.endDate)}. As duas opções estão em avaliação.
          </p>
          <div className="alternative-options">
            {a.options.map((o) => (
              <div className="alternative-option" key={o.id}>
                <StatusBadge status={o.status} />
                <h3>{o.label}</h3>
                <p>{o.notes}</p>
                <div className="inline-links">
                  {o.cityIds.map((id) => (
                    <Link key={id} to={`/cidades/${id}`}>
                      {cities.get(id)?.name.default}
                      <ArrowRight size={15} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
export function Itinerary() {
  const [params, setParams] = useSearchParams();
  const view = params.get('visao') === 'lista' ? 'lista' : 'calendario';
  return (
    <>
      <PageHeading
        title="Plano da viagem"
        description={`${content.days.length} dias registrados. Os trechos ainda não informados permanecem em aberto.`}
      />
      <div className="trip-summary">
        <span>
          {formatDate(content.trip.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
          <ArrowRight size={17} />{' '}
          {formatDate(content.trip.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {(!content.trip.startDate || !content.trip.endDate) && (
          <span>Datas gerais da viagem a definir</span>
        )}
        <span>China e Japão · roteiro em definição</span>
      </div>
      <div className="itinerary-views" role="group" aria-label="Visualização do roteiro">
        {(
          [
            ['calendario', 'Calendário', CalendarDays],
            ['lista', 'Lista', List],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('visao', value);
              setParams(next, { replace: true, preventScrollReset: true });
            }}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {view === 'calendario' ? (
        <Calendar />
      ) : (
        <Section title="Dia a dia">
          <div className="trip-timeline">
            {content.days.map((day, index) => {
              const city = cities.get(day.cityId)!;
              const routes = [...content.flights, ...content.trains, ...content.transfers].filter(
                (r) => r.from.date === day.date,
              );
              const newCity = index === 0 || content.days[index - 1].cityId !== day.cityId;
              return (
                <div className="trip-day" key={day.date}>
                  {newCity && (
                    <Link className="timeline-city" to={`/cidades/${city.id}`}>
                      <MapPin size={18} />
                      <strong>{city.name.default}</strong>
                      <span>{city.name.local}</span>
                      <StatusBadge status={city.status} />
                    </Link>
                  )}
                  <Link className="trip-day-main" to={`/hoje/${day.date}`}>
                    <div className="timeline-date">
                      <strong>{formatDate(day.date, { day: '2-digit' })}</strong>
                      <span>{formatDate(day.date, { month: 'short' })}</span>
                    </div>
                    <div className="row-main">
                      <strong>{day.summary}</strong>
                      <span>
                        {day.activities.length
                          ? `${day.activities.length} itens no roteiro`
                          : 'Programação a definir'}
                        {day.hotelId && (
                          <>
                            {' '}
                            · <BedDouble size={14} aria-label="Hospedagem" /> Hospedagem cadastrada
                          </>
                        )}
                      </span>
                    </div>
                    <StatusBadge status={day.status} />
                    <ArrowRight size={18} />
                  </Link>
                  {routes.map((r) => (
                    <Link className="timeline-transport" to={`/trecho/${r.id}`} key={r.id}>
                      {r.kind === 'flight' ? <Plane size={16} /> : <TrainFront size={16} />}
                      <span>
                        {cities.get(r.from.cityId)?.name.default} →{' '}
                        {cities.get(r.to.cityId)?.name.default}
                      </span>
                      <StatusBadge status={r.status} />
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      <div className="notice">
        {content.trip.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
      <Alternatives />
    </>
  );
}
