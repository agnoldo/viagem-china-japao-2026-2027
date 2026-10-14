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
import { connectionMinutes, durationLabel, type Flight } from '../../lib/flights';
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
        {'flightNumber' in route && (
          <span>
            {route.flightNumber ?? 'Voo a definir'} · {route.from.airportCode ?? '?'} →{' '}
            {route.to.airportCode ?? '?'}
          </span>
        )}
        <span>
          {formatDate(route.from.date, { day: '2-digit', month: 'short' })} ·{' '}
          {route.from.time ?? 'Horário a definir'}
          {route.to.time ? ` → ${route.to.time} (horários locais)` : ''} ·{' '}
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
      {(filter === 'all' || filter === 'flight') &&
        content.flights
          .filter((f) => {
            const next = content.flights.find((n) => n.id === f.nextFlightId);
            const minutes = next ? connectionMinutes(f, next) : null;
            return minutes !== null && minutes <= 60;
          })
          .map((f) => <FlightConnection key={f.id} flight={f} />)}
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
function FlightConnection({ flight }: { flight: Flight }) {
  const next = content.flights.find((f) => f.id === flight.nextFlightId);
  if (!next) return null;
  const minutes = connectionMinutes(flight, next);
  if (minutes === null) return null;
  return (
    <section className="notice flight-connection" aria-label="Conexão entre voos">
      <h2>
        {minutes <= 60 ? 'Conexão curta' : 'Próxima conexão'} · {durationLabel(minutes)}
      </h2>
      <p>
        {flight.to.airportCode} · {cities.get(flight.to.cityId)?.name.default} ·{' '}
        {flight.flightNumber} → {next.flightNumber}
      </p>
      <p>
        Chegada: {formatDate(flight.to.date)} às {flight.to.time}. Partida:{' '}
        {formatDate(next.from.date)} às {next.from.time}. Horários locais ({flight.to.timezone}).
      </p>
      {flight.to.terminal && next.from.terminal && (
        <p>
          Terminal {flight.to.terminal} → terminal {next.from.terminal}.
        </p>
      )}
      {minutes <= 60 && (
        <p>Confirme a conexão e as orientações com {flight.airline ?? 'a companhia'}.</p>
      )}
      <Link className="text-link" to={`/trecho/${next.id}`}>
        Ver próximo voo · {next.flightNumber}
        <ArrowRight size={17} />
      </Link>
    </section>
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
            ? `Voo ${'flightNumber' in route ? (route.flightNumber ?? 'a definir') : 'a definir'} · Horários locais em cada aeroporto`
            : route.kind === 'train'
              ? 'Deslocamento de trem'
              : 'Deslocamento'
        }
      />
      <StatusBadge status={route.status} />
      {route.status === 'example' && <ExampleNotice />}
      {'flightNumber' in route && <FlightConnection flight={route} />}
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
                {formatDate(side.date, { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                <span className="timezone">{side.timezone}</span>
              </p>
              <h3>
                {side.airportCode && `${side.airportCode} · `}
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
      {'flightNumber' in route && (
        <Section title="Dados do voo">
          <p>
            Voo: {route.flightNumber ?? 'a definir'} · Comercializado por:{' '}
            {route.airline ?? 'a definir'}
          </p>
          <p>
            Operado por: {route.operatedBy ?? 'a definir'} · Cabine: {route.cabin ?? 'a definir'}
          </p>
          <p>
            Duração:{' '}
            {route.durationMinutes === null ? 'a definir' : durationLabel(route.durationMinutes)}
          </p>
          <p>
            Bagagem despachada:{' '}
            {route.baggage
              ? `${route.baggage.pieces} volumes por passageiro · ${route.baggage.weightKg === null ? 'peso não informado no recibo' : `${route.baggage.weightKg} kg por volume`}`
              : 'a definir'}
          </p>
          {!!route.travelerIds.length && (
            <p>Mesmo voo para os {route.travelerIds.length} viajantes.</p>
          )}
        </Section>
      )}
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
            {place.checkInUntil && `–${place.checkInUntil}`}
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
