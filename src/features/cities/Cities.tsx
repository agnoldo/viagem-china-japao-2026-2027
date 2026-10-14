import { entityName } from '../../lib/labels';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, BedDouble } from 'lucide-react';
import { content, cities } from '../../content';
import { PageHeading, StatusBadge, Section, Empty } from '../../components/shared';
import { formatDate } from '../../lib/time';
import { Alternatives } from '../itinerary/Itinerary';
import { TransportRow } from '../logistics/Logistics';
export function Cities() {
  return (
    <>
      <PageHeading
        title="Cidades e regiões"
        description="Endereços, estadias e dias do roteiro, reunidos por destino."
      />
      {content.trip.regions.map((region) => (
        <Section key={region.id} title={region.name}>
          <div className="city-directory">
            {content.trip.cities
              .filter((c) => c.regionId === region.id)
              .map((c) => (
                <Link className="city-entry" to={`/cidades/${c.id}`} key={c.id}>
                  <div className="city-entry-names">
                    <span
                      className="city-local"
                      lang={c.country === 'CN' ? 'zh' : c.country === 'JP' ? 'ja' : 'pt'}
                    >
                      {c.name.local}
                    </span>
                    <h3>{c.name.default}</h3>
                  </div>
                  <p>
                    {formatDate(c.startDate, { day: '2-digit', month: 'short' })} —{' '}
                    {formatDate(c.endDate, { day: '2-digit', month: 'short' })}
                  </p>
                  <div className="city-entry-bottom">
                    <StatusBadge status={c.status} />
                    <ArrowUpRight size={21} />
                  </div>
                </Link>
              ))}
          </div>
        </Section>
      ))}
    </>
  );
}
export function CityDetail() {
  const { id } = useParams();
  const city = cities.get(id ?? '');
  if (!city)
    return (
      <>
        <PageHeading title="Cidade não encontrada" />
        <Link to="/cidades">Ver todas as cidades</Link>
      </>
    );
  const days = content.days.filter((d) => d.cityId === city.id);
  const hotels = content.hotels.filter((h) => h.cityId === city.id);
  const places = content.places.filter((p) => p.cityId === city.id);
  const routes = [...content.flights, ...content.trains, ...content.transfers].filter(
    (r) => r.from.cityId === city.id || r.to.cityId === city.id,
  );
  return (
    <>
      <Link className="back-link" to="/cidades">
        ← Cidades
      </Link>
      <PageHeading
        title={city.name.default}
        description={`${city.name.local ?? ''} · ${content.trip.regions.find((v) => v.id === city.regionId)?.name}`}
      />
      <div className="city-detail-meta">
        <StatusBadge status={city.status} />
        <span>
          {formatDate(city.startDate)} a {formatDate(city.endDate)}
        </span>
        <span className="timezone">{city.timezone}</span>
      </div>
      <p className="city-notes">{city.notes}</p>
      <Alternatives cityId={city.id} />
      <div className="detail-grid">
        <div>
          <Section title="Dias neste destino">
            {days.length ? (
              days.map((d) => (
                <Link key={d.date} className="simple-row" to={`/hoje/${d.date}`}>
                  <div>
                    <strong>{formatDate(d.date, { day: '2-digit', month: 'short' })}</strong>
                    <span>{d.summary}</span>
                  </div>
                  <StatusBadge status={d.status} />
                  <ArrowRight size={17} />
                </Link>
              ))
            ) : (
              <Empty>
                Nenhum dia registrado neste destino. Datas e programação ainda incompletas.
              </Empty>
            )}
          </Section>
          <Section title="Locais e endereços">
            {places.map((p) => (
              <Link className="simple-row" key={p.id} to={`/local/${p.id}`}>
                <div>
                  <strong>{p.name.default}</strong>
                  <span>{p.name.local}</span>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </Section>
        </div>
        <aside>
          <Section title="Hospedagens">
            {hotels.length ? (
              hotels.map((h) => (
                <Link className="simple-row" key={h.id} to={`/hotel/${h.id}`}>
                  <BedDouble size={21} />
                  <div>
                    <strong>{entityName(h)}</strong>
                    <StatusBadge status={h.status} />
                  </div>
                  <ArrowRight size={18} />
                </Link>
              ))
            ) : (
              <Empty>Hospedagem ainda não cadastrada.</Empty>
            )}
          </Section>
          <Section title="Chegadas e partidas">
            {routes.length ? (
              routes.map((r) => <TransportRow key={r.id} route={r} />)
            ) : (
              <Empty>Deslocamentos a definir.</Empty>
            )}
          </Section>
        </aside>
      </div>
    </>
  );
}
