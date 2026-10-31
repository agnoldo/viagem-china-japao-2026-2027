import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Globe2,
  MapPin,
  Plane,
  TrainFront,
} from 'lucide-react';
import { content, hotels } from '../../content';
import { StatusBadge } from '../../components/shared';
import { entityName } from '../../lib/labels';
import { formatDate } from '../../lib/time';
import { mapLabels, mapProjection, tripMapData } from '../../lib/trip-map';
import land from '../../assets/land.json';

const model = tripMapData(content);
export function TripMap() {
  const [params, setParams] = useSearchParams();
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 450 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(viewport.current!);
    return () => observer.disconnect();
  }, []);
  const all = params.get('area') === 'tudo';
  const visible = model.cities.filter((c) => all || ['CN', 'JP'].includes(c.country));
  const mapped = visible.filter((c) => c.mapPosition);
  const initial =
    content.days.find((day) => visible.some((c) => c.id === day.cityId))?.date ?? model.dates[0];
  const requested = params.get('dia') ?? '';
  const date = model.dates.includes(requested) ? requested : initial;
  const day = content.days.find((d) => d.date === date);
  const chosen =
    visible.find((c) => c.id === params.get('cidade')) ?? visible.find((c) => c.id === day?.cityId);
  const cityDays = content.days.filter((d) => d.cityId === chosen?.id);
  const hotel = hotels.get(day?.hotelId ?? '');
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (values.dia) next.set('mes', values.dia.slice(0, 7));
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const project = mapProjection(
    mapped.map((c) => c.mapPosition!),
    size.width,
    size.height,
  );
  const anchors = mapped.map((c) => project(c.mapPosition!.lon, c.mapPosition!.lat));
  const labels = mapLabels(anchors, size.width, size.height);
  const paths = (land as number[][][][])
    .map((polygon) =>
      polygon
        .map(
          (ring) =>
            ring
              .map(([lon, lat], index) => {
                const p = project(lon, lat);
                return `${index ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(' ') + 'Z',
        )
        .join(' '),
    )
    .join(' ');
  const edges = model.routes.filter(
    (r) => mapped.some((c) => c.id === r.from.cityId) && mapped.some((c) => c.id === r.to.cityId),
  );
  const selectedRoutes = model.routes.filter(
    (r) => r.from.cityId === chosen?.id || r.to.cityId === chosen?.id,
  );
  const selectCity = (id: string) =>
    update({ cidade: id, dia: content.days.find((d) => d.cityId === id)?.date ?? '' });
  return (
    <section className="journey-map" aria-label="Mapa da viagem">
      <div className="journey-map-heading">
        <div>
          <h2>O percurso da viagem</h2>
          <p>Explore as cidades e os dias do roteiro.</p>
        </div>
        <span className="journey-offline">
          <Globe2 size={16} aria-hidden="true" /> Disponível offline
        </span>
      </div>
      <div className="journey-map-scopes" role="group" aria-label="Área do mapa">
        <button type="button" aria-pressed={!all} onClick={() => update({ area: '', cidade: '' })}>
          China e Japão
        </button>
        <button
          type="button"
          aria-pressed={all}
          onClick={() => update({ area: 'tudo', cidade: '' })}
        >
          Toda a viagem
        </button>
      </div>
      <div className="journey-map-layout">
        <div>
          <div className="journey-map-canvas" ref={viewport}>
            {mapped.length > 0 ? (
              <>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${size.width} ${size.height}`}
                  aria-hidden="true"
                >
                  <path className="journey-land" d={paths} />
                  {edges.map((route) => {
                    const from = mapped.find((c) => c.id === route.from.cityId)!.mapPosition!;
                    const to = mapped.find((c) => c.id === route.to.cityId)!.mapPosition!;
                    const a = project(from.lon, from.lat),
                      b = project(to.lon, to.lat);
                    const active = route.from.date === date || route.to.date === date;
                    return (
                      <path
                        key={route.id}
                        className={`journey-edge ${route.status === 'confirmed' ? 'journey-edge-confirmed' : 'journey-edge-planned'}${active ? ' journey-edge-active' : ''}`}
                        d={`M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 - Math.min(55, Math.abs(a.x - b.x) / 6)} ${b.x},${b.y}`}
                      />
                    );
                  })}
                  {anchors.map((point, i) => (
                    <g key={mapped[i].id}>
                      <line
                        className="journey-leader"
                        x1={point.x}
                        y1={point.y}
                        x2={labels[i].x}
                        y2={labels[i].y}
                      />
                      <circle className="journey-anchor" cx={point.x} cy={point.y} r={3} />
                    </g>
                  ))}
                </svg>
                {mapped.map((city, i) => (
                  <button
                    type="button"
                    key={city.id}
                    className="journey-marker"
                    style={{ left: labels[i].x, top: labels[i].y }}
                    aria-label={`Selecionar ${city.name.default}`}
                    aria-pressed={chosen?.id === city.id}
                    onClick={() => selectCity(city.id)}
                  >
                    <MapPin size={15} aria-hidden="true" />
                    {city.name.default}
                  </button>
                ))}
              </>
            ) : (
              <p>Posições das cidades ainda não cadastradas.</p>
            )}
          </div>
          <div className="journey-map-caption">
            <span>
              <i className="journey-line-solid" />
              Confirmado
            </span>
            <span>
              <i className="journey-line-dashed" />
              Planejado
            </span>
            <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
              Base: Natural Earth
            </a>
          </div>
          <p className="journey-map-note">
            Referências aproximadas das cidades. Linhas ilustram os trechos cadastrados, sem
            representar o trajeto real de voo ou trem.
          </p>
          {visible.some((c) => !c.mapPosition) && (
            <p className="notice">
              Sem posição no mapa:{' '}
              {visible
                .filter((c) => !c.mapPosition)
                .map((c) => c.name.default)
                .join(', ')}
              .
            </p>
          )}
        </div>
        <div className="journey-map-detail" aria-live="polite">
          <label className="journey-date-label" htmlFor="map-date">
            Dia da viagem
          </label>
          <div className="journey-date-control">
            <button
              className="icon-button"
              type="button"
              aria-label="Dia anterior no mapa"
              disabled={date === model.dates[0]}
              onClick={() =>
                update({ dia: model.dates[model.dates.indexOf(date) - 1], cidade: '' })
              }
            >
              <ChevronLeft size={20} />
            </button>
            <input
              id="map-date"
              type="date"
              value={date}
              min={model.dates[0]}
              max={model.dates.at(-1)}
              onChange={(e) => {
                if (model.dates.includes(e.target.value))
                  update({ dia: e.target.value, cidade: '' });
              }}
            />
            <button
              className="icon-button"
              type="button"
              aria-label="Próximo dia no mapa"
              disabled={date === model.dates.at(-1)}
              onClick={() =>
                update({ dia: model.dates[model.dates.indexOf(date) + 1], cidade: '' })
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {chosen ? (
            <>
              <h3>
                {chosen.name.default}
                <span>{chosen.name.local}</span>
              </h3>
              {day && day.cityId === chosen.id && (
                <>
                  <p>{day.summary}</p>
                  <div className="journey-stay">
                    {day.overnightInTransit ? (
                      'Noite em trânsito · sem hotel'
                    ) : hotel ? (
                      <Link to={`/hotel/${hotel.id}`}>
                        {entityName(hotel)} <StatusBadge status={hotel.status} />
                      </Link>
                    ) : (
                      'Hospedagem a definir'
                    )}
                  </div>
                  <Link className="journey-day-link" to={`/hoje/${day.date}`}>
                    Ver programação do dia <ArrowRight size={17} />
                  </Link>
                </>
              )}
              {cityDays.length > 0 ? (
                <div className="journey-city-days">
                  <strong>Dias registrados nesta cidade</strong>
                  {cityDays.map((d) => (
                    <Link key={d.date} to={`/hoje/${d.date}`}>
                      {formatDate(d.date, { day: '2-digit', month: 'short' })}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>Sem dia-base registrado; consulte as conexões abaixo.</p>
              )}
              <div className="journey-city-routes">
                {selectedRoutes.map((r) => (
                  <Link key={r.id} to={`/trecho/${r.id}`}>
                    {r.kind === 'flight' ? <Plane size={16} /> : <TrainFront size={16} />}
                    <span>
                      {content.trip.cities.find((c) => c.id === r.from.cityId)?.name.default} →{' '}
                      {content.trip.cities.find((c) => c.id === r.to.cityId)?.name.default}
                      <small>{formatDate(r.from.date)}</small>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="journey-map-empty">
              <MapPin size={26} />
              <h3>{day ? 'Cidade fora deste enquadramento' : 'Sem programação cadastrada'}</h3>
              <p>
                {day
                  ? 'Use Toda a viagem para visualizar este dia.'
                  : 'Cidade, hospedagem e atividades continuam em aberto. Selecione outra data ou uma cidade no mapa.'}
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="journey-map-gaps">
        Plano parcial · {model.gaps.length}{' '}
        {model.gaps.length === 1 ? 'dia sem programação' : 'dias sem programação'} dentro do período
        da viagem. As lacunas não geram cidades, hospedagens ou trajetos presumidos.
      </p>
    </section>
  );
}
