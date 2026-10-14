import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { content } from '../content';
import { PageHeading, Empty } from '../components/shared';
import { formatDate } from '../lib/time';
const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function Search() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const q = normalized(query.trim());
  const entries = [
    ...content.trip.cities.map((c) => ({
      id: c.id,
      title: c.name.default,
      subtitle: `Cidade · ${c.name.local ?? ''}`,
      search: [c.name.default, c.name.local, ...c.aliases].join(' '),
      href: `/cidades/${c.id}`,
    })),
    ...content.places.map((p) => ({
      id: p.id,
      title: p.name.default,
      subtitle: `Local · ${p.name.local ?? ''}`,
      search: [p.name.default, p.name.local, p.address.local, ...p.aliases].join(' '),
      href: `/local/${p.id}`,
    })),
    ...content.hotels.map((h) => ({
      id: h.id,
      title: h.name.default,
      subtitle: 'Hospedagem · Exemplo',
      search: [h.name.default, h.name.local, ...h.aliases].join(' '),
      href: `/hotel/${h.id}`,
    })),
    ...content.days.map((d) => ({
      id: d.date,
      title: d.summary,
      subtitle: formatDate(d.date),
      search: [d.date, formatDate(d.date), d.summary, ...d.activities.map((a) => a.title)].join(
        ' ',
      ),
      href: `/hoje/${d.date}`,
    })),
  ];
  const results = q ? entries.filter((v) => normalized(v.search).includes(q)) : [];
  return (
    <>
      <PageHeading
        title="Buscar na viagem"
        description={
          q
            ? `${results.length} resultados para “${query}”`
            : 'Digite uma cidade, local, atividade, nome local ou data no campo de busca.'
        }
      />
      {results.map((r) => (
        <Link className="simple-row" to={r.href} key={r.id}>
          <div>
            <strong>{r.title}</strong>
            <span>{r.subtitle}</span>
          </div>
          <ArrowRight size={18} />
        </Link>
      ))}
      {q && !results.length && (
        <Empty>Nenhum resultado. Tente um nome local, um alias ou uma data como 2027-01-18.</Empty>
      )}
    </>
  );
}
