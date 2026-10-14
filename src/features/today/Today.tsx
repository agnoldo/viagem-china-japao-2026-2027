import { entityName } from '../../lib/labels';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Clock3,
  MapPin,
  Plane,
  TrainFront,
  Utensils,
  Footprints,
  CalendarDays,
} from 'lucide-react';
import { content, cities, hotels, places } from '../../content';
import type { Activity } from '../../content/schema';
import { StatusBadge, Section, MapActions, Empty } from '../../components/shared';
import {
  currentTripDay,
  departureTime,
  formatDate,
  nextActivity,
  sortActivities,
} from '../../lib/time';
import { writePreference } from '../../lib/preferences';
function activityHref(a: Activity): string | undefined {
  return a.transportId
    ? `/trecho/${a.transportId}`
    : a.placeId
      ? `/local/${a.placeId}`
      : a.hotelId
        ? `/hotel/${a.hotelId}`
        : undefined;
}
function ActivityIcon({ type }: { type: Activity['type'] }) {
  const Icon =
    type === 'flight'
      ? Plane
      : type === 'train'
        ? TrainFront
        : type === 'meal'
          ? Utensils
          : type === 'hotel'
            ? BedDouble
            : type === 'walk'
              ? Footprints
              : MapPin;
  return <Icon size={19} aria-hidden="true" />;
}
export function Today({ now }: { now: Date }) {
  const { date } = useParams();
  const navigate = useNavigate();
  const current = currentTripDay(content, now);
  const index = content.days.findIndex((v) => v.date === (date ?? current.date));
  const day = content.days[index];
  if (!day)
    return (
      <>
        <h1>Dia fora da viagem</h1>
        <Link to="/viagem">Escolher um dia registrado</Link>
      </>
    );
  const city = cities.get(day.cityId)!;
  const alternative = content.trip.alternatives.find((a) => a.id === day.alternativeId);
  const hotel = hotels.get(day.hotelId ?? '');
  const next = nextActivity(day, city.timezone, now);
  const featured =
    next ??
    sortActivities(day.activities).find((a) => !['optional', 'cancelled'].includes(a.status));
  const preview = !!date && date !== current.date;
  const leave =
    next?.time && next.travelBufferMinutes
      ? departureTime(day.date, next.time, next.travelBufferMinutes)
      : undefined;
  const tripRoutes = [...content.flights, ...content.trains, ...content.transfers].filter(
    (r) => r.from.date === day.date,
  );
  const visit = (d: string) => {
    writePreference('last-day', d);
    navigate(`/hoje/${d}`);
  };
  return (
    <>
      <div className="day-navigation">
        <button
          className="icon-button"
          aria-label="Dia anterior"
          disabled={index === 0}
          onClick={() => visit(content.days[index - 1].date)}
        >
          <ChevronLeft size={23} />
        </button>
        <label className="date-control">
          <CalendarDays size={18} aria-hidden="true" />
          <span>{formatDate(day.date, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
          <input
            aria-label="Escolher dia"
            type="date"
            min={content.days[0].date}
            max={content.days[content.days.length - 1].date}
            value={day.date}
            onChange={(e) => {
              if (content.days.some((d) => d.date === e.target.value)) visit(e.target.value);
            }}
          />
        </label>
        <span className="day-count">
          {index + 1} de {content.days.length}
        </span>
        <button
          className="icon-button"
          aria-label="Próximo dia"
          disabled={index === content.days.length - 1}
          onClick={() => visit(content.days[index + 1].date)}
        >
          <ChevronRight size={23} />
        </button>
      </div>
      {current.phase === 'incomplete' && (
        <div className="notice">
          <strong>Plano parcial.</strong> Início e fim da viagem ainda não registrados. Exibindo os
          dias disponíveis; os demais trechos continuam em aberto.
        </div>
      )}
      {current.phase === 'before' && !preview && (
        <div className="notice preparation">
          <div>
            <strong>Preparação da viagem</strong>
            <span>
              A partida está prevista para {formatDate(content.trip.startDate)}. Explore o roteiro e
              substitua os exemplos.
            </span>
          </div>
          <Link to="/mais">
            Preparar o offline
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
      {current.phase === 'after' && !preview && (
        <div className="notice">
          <strong>Viagem encerrada.</strong> Consulte qualquer dia pelo calendário ou pela timeline.
        </div>
      )}
      {preview && (
        <div className="preview-notice">
          <span>Consultando outro dia</span>
          <Link to="/hoje">Voltar ao dia automático</Link>
        </div>
      )}
      <div className="today-heading">
        <div>
          <h1>
            {day.alternativeId
              ? (content.trip.regions.find((r) => r.id === day.regionId)?.name ??
                'Próximo capítulo')
              : city.name.default}
            <span className="heading-local" lang={city.country === 'CN' ? 'zh' : 'ja'}>
              {!day.alternativeId && city.name.local}
            </span>
          </h1>
          <p>{day.summary}</p>
        </div>
        <StatusBadge status={day.status} />
      </div>
      <div className="day-meta">
        <span>
          {formatDate(day.date, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <span>{city.timezone}</span>
      </div>
      {day.alternativeId && (
        <div className="notice">
          <strong>
            {alternative?.options.map((o) => o.label).join(' ou ')}: escolha ainda aberta.
          </strong>{' '}
          Hospedagem e deslocamentos não confirmados.{' '}
          <Link to="/viagem#alternativas">Ver as duas possibilidades</Link>
        </div>
      )}
      <div className="today-grid">
        <div>
          <section className="next-panel">
            <div className="next-panel-heading">
              <h2>{next ? 'Próxima atividade' : 'Referência do roteiro'}</h2>
              {featured && <StatusBadge status={featured.status} />}
            </div>
            {featured ? (
              <>
                <div className="next-time">
                  {featured.time ?? 'Sem horário'}
                  {featured.time && (
                    <span>horário local · {featured.timezone ?? city.timezone}</span>
                  )}
                </div>
                <h3>{featured.title}</h3>
                {leave && (
                  <p className="leave-time">
                    <Clock3 size={18} aria-hidden="true" />
                    Sair às <strong>{leave.time}</strong>
                    {leave.date !== day.date && ` de ${formatDate(leave.date)}`}
                    <span>
                      · {next?.status === 'example' ? 'margem de exemplo' : 'margem'}:{' '}
                      {next?.travelBufferMinutes} min
                    </span>
                  </p>
                )}
                {featured.notes && <p>{featured.notes}</p>}
                {activityHref(featured) && (
                  <Link className="button button-light" to={activityHref(featured)!}>
                    Ver detalhes
                    <ArrowRight size={17} />
                  </Link>
                )}
                {featured.placeId && places.get(featured.placeId) && (
                  <MapActions place={places.get(featured.placeId)!} compact />
                )}
              </>
            ) : (
              <>
                <h3>O dia ainda está em aberto.</h3>
                <p>
                  Adicione atividades no arquivo diário. O roteiro permanece disponível offline.
                </p>
              </>
            )}
            {featured?.status === 'example' && (
              <p className="sample-label">
                Exemplo · não representa reserva ou horário confirmado.
              </p>
            )}
            {!next && day.activities.length > 0 && (
              <p className="sample-label">
                Sem próximo compromisso com horário. Consulte a programação completa abaixo.
              </p>
            )}
          </section>
          <Section
            title="Programa do dia"
            action={
              <span className="muted">
                {day.activities.length} {day.activities.length === 1 ? 'item' : 'itens'}
              </span>
            }
          >
            <ol className="activity-list">
              {sortActivities(day.activities).map((a) => {
                const href = activityHref(a);
                return (
                  <li
                    key={a.id}
                    className={`activity ${a.status === 'cancelled' ? 'cancelled' : ''}`}
                  >
                    <div className="activity-time">
                      {a.time ?? 'A definir'}
                      {a.endTime && <span>até {a.endTime}</span>}
                    </div>
                    <div className="activity-marker">
                      <ActivityIcon type={a.type} />
                    </div>
                    <div className="activity-body">
                      <StatusBadge status={a.status} />
                      <h3>
                        {href ? (
                          <Link to={href}>
                            {a.title}
                            <ArrowUpRightIcon />
                          </Link>
                        ) : (
                          a.title
                        )}
                      </h3>
                      {a.time && <span className="timezone">{a.timezone ?? city.timezone}</span>}
                      {a.notes && <p>{a.notes}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {!day.activities.length && (
              <Empty>Nenhuma atividade definida. Este dia está reservado no roteiro-base.</Empty>
            )}
          </Section>
          <p className="muted day-notes">{day.notes}</p>
        </div>
        <aside className="day-aside">
          <Section title="Hotel da noite">
            <div className="stay-panel">
              <BedDouble size={25} aria-hidden="true" />
              {hotel ? (
                <>
                  <StatusBadge status={hotel.status} />
                  <h3>{entityName(hotel)}</h3>
                  <p>
                    {hotel.address.local ||
                      hotel.address.default ||
                      'Endereço e horários ainda não registrados.'}
                  </p>
                  <Link className="text-link" to={`/hotel/${hotel.id}`}>
                    Consultar hospedagem
                    <ArrowRight size={17} />
                  </Link>
                </>
              ) : (
                <>
                  <h3>Hospedagem a definir</h3>
                  <p>
                    {day.alternativeId
                      ? 'Depende da alternativa escolhida.'
                      : 'A hospedagem desta noite ainda não foi definida.'}
                  </p>
                  <Link className="text-link" to="/logistica?tipo=hotel">
                    Ver hospedagens
                    <ArrowRight size={17} />
                  </Link>
                </>
              )}
            </div>
          </Section>
          <Section title="Deslocamentos">
            {tripRoutes.length ? (
              tripRoutes.map((r) => (
                <Link className="aside-route" to={`/trecho/${r.id}`} key={r.id}>
                  <div>
                    <StatusBadge status={r.status} />
                    <strong>
                      {cities.get(r.from.cityId)?.name.default} →{' '}
                      {cities.get(r.to.cityId)?.name.default}
                    </strong>
                    <span>{r.from.time ?? 'Horário a definir'}</span>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              ))
            ) : (
              <Empty>Sem deslocamento entre cidades cadastrado para este dia.</Empty>
            )}
          </Section>
          <Link className="city-shortcut" to={`/cidades/${city.id}`}>
            <MapPin size={20} />
            <div>
              <strong>Guia de {city.name.default}</strong>
              <span>Locais e endereços</span>
            </div>
            <ArrowRight size={19} />
          </Link>
        </aside>
      </div>
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} aria-hidden="true" />;
}
