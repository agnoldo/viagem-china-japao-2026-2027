import { Link } from 'react-router-dom';
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
  return (
    <>
      <PageHeading
        title="A viagem inteira"
        description="30 dias, dois países para descobrir. Um roteiro que ainda está tomando forma."
      />
      <div className="trip-summary">
        <span>
          29 dez 2026 <ArrowRight size={17} /> 27 jan 2027
        </span>
        <span>China · 18 noites</span>
        <span>Japão · roteiro em definição</span>
      </div>
      <Alternatives />
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
                          · <BedDouble size={14} aria-label="Hospedagem" /> Exemplo de hospedagem
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
    </>
  );
}
