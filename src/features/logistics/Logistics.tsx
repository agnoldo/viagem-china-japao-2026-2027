import { entityName } from '../../lib/labels';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Plane, TrainFront, BedDouble, Route } from 'lucide-react';
import { content, cities, hotels, places, transports } from '../../content';
import type { Transport } from '../../content/schema';
import {
  PageHeading,
  StatusBadge,
  Section,
  MapActions,
  ExampleNotice,
  Empty,
} from '../../components/shared';
import { formatDate } from '../../lib/time';
export function TransportRow({ route }: { route: Transport }) {
  return (
    <Link className="transport-row" to={`/trecho/${route.id}`}>
      <span className="row-icon">
        {route.kind === 'flight' ? <Plane size={21} /> : <TrainFront size={21} />}
      </span>
      <div className="row-main">
        <strong>
          {cities.get(route.from.cityId)?.name.default} <span aria-label="para">→</span>{' '}
          {cities.get(route.to.cityId)?.name.default}
        </strong>
        <span>
          {formatDate(route.from.date, { day: '2-digit', month: 'short' })} ·{' '}
          {route.from.time ?? 'Horário a definir'} ·{' '}
          {places.get(route.from.placeId ?? '')?.name.default ??
            (route.kind === 'flight'
              ? 'Aeroporto de saída a definir'
              : 'Estação de embarque a definir')}
        </span>
      </div>
      <StatusBadge status={route.status} />
      <ArrowUpRight className="row-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}
export function Logistics() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('tipo') ?? 'all';
  const options = [
    ['all', 'Tudo'],
    ['flight', 'Voos'],
    ['train', 'Trens'],
    ['hotel', 'Hotéis'],
    ['transfer', 'Deslocamentos'],
    ['places', 'Aeroportos e estações'],
  ];
  return (
    <>
      <PageHeading title="Logística" description="O essencial para chegar, seguir e descansar." />
      <div className="filters" aria-label="Filtrar logística">
        {options.map(([id, label]) => (
          <button
            className={filter === id ? 'selected' : ''}
            key={id}
            onClick={() => setParams({ tipo: id })}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="notice">
        Dados ainda incompletos. Uma reserva confirmada pode continuar sem nome, endereço ou horário
        registrados. Consulte as pendências de cada item.
      </div>
      {(filter === 'all' || filter === 'flight') && (
        <Section title="Voos">
          <div className="list-surface">
            {content.flights.map((v) => (
              <TransportRow key={v.id} route={v} />
            ))}
          </div>
        </Section>
      )}
      {(filter === 'all' || filter === 'train') && (
        <Section title="Trens">
          <div className="list-surface">
            {content.trains.map((v) => (
              <TransportRow key={v.id} route={v} />
            ))}
          </div>
        </Section>
      )}
      {(filter === 'all' || filter === 'transfer') && (
        <Section title="Entre cidades">
          <div className="list-surface">
            {content.transfers.map((v) => (
              <TransportRow key={v.id} route={v} />
            ))}
          </div>
        </Section>
      )}
      {(filter === 'all' || filter === 'hotel') && (
        <Section title="Hospedagens">
          <div className="list-surface">
            {content.hotels.map((h) => (
              <Link className="entity-row" to={`/hotel/${h.id}`} key={h.id}>
                <BedDouble className="row-icon" size={21} />
                <div className="row-main">
                  <strong>{cities.get(h.cityId)?.name.default}</strong>
                  <span>{entityName(h)}</span>
                </div>
                <StatusBadge status={h.status} />
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Section>
      )}
      {(filter === 'all' || filter === 'places') && (
        <Section title="Aeroportos e estações">
          <div className="list-surface">
            {content.places
              .filter((v) => ['airport', 'station'].includes(v.category))
              .map((p) => (
                <Link className="entity-row" to={`/local/${p.id}`} key={p.id}>
                  <div className="row-main">
                    <strong>{p.name.default}</strong>
                    <span lang={cities.get(p.cityId)?.country === 'CN' ? 'zh' : 'ja'}>
                      {p.name.local}
                    </span>
                  </div>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ))}
          </div>
        </Section>
      )}
    </>
  );
}
export function TransportDetail() {
  const { id } = useParams();
  const route = transports.get(id ?? '');
  if (!route)
    return (
      <>
        <PageHeading title="Trecho não encontrado" />
        <Link to="/logistica">Voltar à logística</Link>
      </>
    );
  return (
    <>
      <Link className="back-link" to="/logistica">
        ← Logística
      </Link>
      <PageHeading
        title={`${cities.get(route.from.cityId)?.name.default} → ${cities.get(route.to.cityId)?.name.default}`}
        description={
          route.kind === 'flight'
            ? 'Deslocamento aéreo'
            : route.kind === 'train'
              ? 'Deslocamento de trem'
              : 'Deslocamento'
        }
      />
      <StatusBadge status={route.status} />
      {route.status === 'example' && <ExampleNotice />}
      <div className="route-detail">
        {(
          [
            ['Partida', route.from],
            ['Chegada', route.to],
          ] as const
        ).map(([label, side]) => {
          const p = places.get(side.placeId ?? '');
          return (
            <section className="route-endpoint" key={label}>
              <h2>{label}</h2>
              <p className="large-time">{side.time ?? 'A definir'}</p>
              <p>
                {formatDate(side.date)} · <span className="timezone">{side.timezone}</span>
              </p>
              <h3>
                {p?.name.default ??
                  (route.kind === 'flight' ? 'Aeroporto a definir' : 'Estação a definir')}
              </h3>
              <p className="local-name">{p?.name.local}</p>
              <p>
                {side.terminal ? `Terminal ${side.terminal}` : 'Terminal / plataforma a confirmar'}
              </p>
              {p && <MapActions place={p} />}
            </section>
          );
        })}
      </div>
      <Section title="Antes de sair">
        <p>{route.notes}</p>
        {'recommendedArrivalMinutes' in route && route.recommendedArrivalMinutes !== null && (
          <p>
            Chegar à estação com {route.recommendedArrivalMinutes} minutos de antecedência. Some o
            tempo de trajeto.
          </p>
        )}
        {'safetyBufferMinutes' in route && (
          <p>
            Margem demonstrativa: {route.safetyBufferMinutes} minutos. Duração:{' '}
            {route.durationMinutes === null ? 'a definir' : `${route.durationMinutes} minutos`}.
          </p>
        )}
        {'service' in route && route.service && (
          <p>Serviço: {route.service.line || route.service.type}</p>
        )}
        {'recommendedArrivalMinutes' in route && route.recommendedArrivalMinutes === null && (
          <p>Antecedência na estação: a definir.</p>
        )}
        {'trainNumber' in route && (
          <p>
            Trem: {route.trainNumber ?? 'a definir'} · Classe: {route.class ?? 'a definir'}
          </p>
        )}
        {'flightNumber' in route && (
          <p>
            Voo: {route.flightNumber ?? 'a definir'} · Companhia: {route.airline ?? 'a definir'}
          </p>
        )}
      </Section>
      <Section title="Instrução offline">
        <div className="offline-instructions">
          <Route size={22} aria-hidden="true" />
          <p>{route.offlineInstructions}</p>
        </div>
      </Section>
    </>
  );
}
export function PlaceDetail({ hotel = false }: { hotel?: boolean }) {
  const { id } = useParams();
  const place = hotel ? hotels.get(id ?? '') : places.get(id ?? '');
  if (!place)
    return (
      <>
        <PageHeading title="Local não encontrado" />
        <Link to="/cidades">Ver cidades</Link>
      </>
    );
  const city = cities.get(place.cityId);
  const days = content.days.filter(
    (d) =>
      d.hotelId === place.id ||
      d.activities.some((a) => a.placeId === place.id || a.hotelId === place.id),
  );
  return (
    <>
      <Link className="back-link" to={`/cidades/${place.cityId}`}>
        ← {city?.name.default}
      </Link>
      <PageHeading title={entityName(place)} description={place.name.local ?? undefined} />
      <StatusBadge status={place.status} />
      {place.status === 'example' && <ExampleNotice />}
      <Section title="Endereço">
        <p className="address-preview" lang={city?.country === 'CN' ? 'zh' : 'ja'}>
          {place.address.local ?? place.address.default ?? 'Endereço ainda não registrado.'}
        </p>
        <MapActions place={place} kind={hotel ? 'hotel' : 'local'} />
        <p className="muted">
          Os mapas abrem fora da PWA e podem precisar de rede. O endereço continua disponível aqui.
        </p>
      </Section>
      {hotel && 'checkIn' in place && (
        <Section title="Estadia">
          <p>
            Check-in: {formatDate(place.checkInDate)} · {place.checkIn ?? 'horário a definir'}
            <br />
            Check-out: {formatDate(place.checkOutDate)} · {place.checkOut ?? 'horário a definir'}
          </p>
          <p>Telefone: {place.phone ?? 'a preencher'}</p>
        </Section>
      )}
      <Section title="Instruções">
        <p>{place.notes}</p>
        {place.officialUrl && (
          <a className="button" href={place.officialUrl} target="_blank" rel="noopener noreferrer">
            Site oficial <ArrowUpRight size={16} />
          </a>
        )}
      </Section>
      <Section title="No roteiro">
        {days.length ? (
          days.map((d) => (
            <Link className="simple-row" key={d.date} to={`/hoje/${d.date}`}>
              {formatDate(d.date)} · {d.summary}
              <ArrowRight size={17} />
            </Link>
          ))
        ) : (
          <Empty>Sem dia associado. Local disponível para planejamento.</Empty>
        )}
      </Section>
    </>
  );
}
