import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Status } from '../content/schema';
import type { MapTarget } from '../features/maps/links';
import { buildMapLinks } from '../features/maps/links';
import { handleMapClick, mapWebHref } from '../features/maps/open-app';
import { cities } from '../content';
export const statuses: Record<Status, string> = {
  confirmed: 'Confirmado',
  planned: 'Planejado',
  optional: 'Opcional',
  example: 'Exemplo',
  undecided: 'A decidir',
  cancelled: 'Cancelado',
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status-${status}`}>
      <span aria-hidden="true" className="status-dot" />
      {statuses[status]}
    </span>
  );
}
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
export function ExampleNotice() {
  return (
    <p className="example-notice">Conteúdo demonstrativo. Confira os dados reais antes de sair.</p>
  );
}
export function MapActions({
  place,
  kind = 'local',
  compact = false,
}: {
  place: MapTarget;
  kind?: 'local' | 'hotel';
  compact?: boolean;
}) {
  const country = cities.get(place.cityId)?.country;
  const providers = compact
    ? [{ id: 'apple', label: 'Apple Maps' }]
    : [
        { id: 'apple', label: 'Apple Maps' },
        ...(country === 'CN'
          ? [
              { id: 'amap', label: 'AMap' },
              { id: 'baidu', label: 'Baidu Maps' },
            ]
          : country === 'JP'
            ? [{ id: 'google', label: 'Google Maps' }]
            : []),
      ];
  return (
    <div className="map-actions">
      {providers.map((provider) => {
        const link = buildMapLinks(place, provider.id);
        const href = mapWebHref(link);
        return href ? (
          <a
            className="button button-small"
            key={provider.id}
            href={href}
            onClick={(event) => {
              handleMapClick(event, link);
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {provider.label}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : (
          !compact && (
            <span key={provider.id} className="unconfigured">
              {provider.label}: não configurado
            </span>
          )
        );
      })}
      <Link className="button button-small" to={`/endereco/${kind}/${place.id}`}>
        <MapPin size={16} aria-hidden="true" />
        Endereço local
      </Link>
    </div>
  );
}
export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
