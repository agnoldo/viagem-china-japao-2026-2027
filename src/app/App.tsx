import { useEffect, useRef, useState } from 'react';
import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  CalendarDays,
  Route as RouteIcon,
  TrainFront,
  MapPin,
  Ellipsis,
  Search as SearchIcon,
  WifiOff,
  Check,
  ArrowRight,
  Images,
} from 'lucide-react';
import { Today } from '../features/today/Today';
import { Itinerary } from '../features/itinerary/Itinerary';
import { Cities, CityDetail } from '../features/cities/Cities';
import { Logistics, PlaceDetail, TransportDetail } from '../features/logistics/Logistics';
import { Address } from '../features/maps/Address';
import { More } from '../features/More';
import { Search } from '../features/Search';
import { content } from '../content';
import { Posts } from '../features/posts/Posts';
import { activateUpdate, startPwa } from '../lib/pwa';
const navigation = [
  { to: '/hoje', label: 'Hoje', icon: CalendarDays },
  { to: '/viagem', label: 'Viagem', icon: RouteIcon },
  { to: '/logistica', label: 'Logística', icon: TrainFront },
  { to: '/cidades', label: 'Cidades', icon: MapPin },
  { to: '/posts', label: 'Posts', icon: Images },
  { to: '/mais', label: 'Mais', icon: Ellipsis },
];
function AppShell() {
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [update, setUpdate] = useState(false);
  const [pwaStatus, setPwaStatus] = useState('Preparando conteúdo offline…');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const initial = useRef(true);
  useEffect(() => {
    startPwa(() => setUpdate(true), setPwaStatus);
    const on = () => {
      setOnline(navigator.onLine);
      setNow(new Date());
    };
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    document.addEventListener('visibilitychange', on);
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
      document.removeEventListener('visibilitychange', on);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (initial.current) initial.current = false;
    else if (location.pathname !== '/buscar') mainRef.current?.focus();
  }, [location.pathname]);
  const address = location.pathname.startsWith('/endereco');
  return (
    <div className={`app-shell ${address ? 'showing-address' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Pular para conteúdo
      </a>
      <aside className="sidebar">
        <Link to="/hoje" className="brand">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M8 29V12h10v17m4 0V12h10v17M4 20h32M11 8h18M5 32h30" />
          </svg>
          <span>{content.trip.name}</span>
        </Link>
        <nav aria-label="Navegação principal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              key={to}
              to={to}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="offline-status">
            {online ? <Check size={16} /> : <WifiOff size={16} />}
            <span>{online ? 'Consulta em família' : 'Sem conexão de rede'}</span>
          </div>
          <p>
            Roteiro público de consulta.
            <br />
            Documentos ficam no iCloud.
          </p>
          <Link to="/mais">
            Conteúdo: {content.trip.contentVersion}
            <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link to="/hoje" className="mobile-brand">
            {content.trip.name}
          </Link>
          <form
            className="search-form"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/buscar?q=${encodeURIComponent(query)}`);
            }}
          >
            <SearchIcon size={18} aria-hidden="true" />
            <input
              aria-label="Buscar no roteiro"
              placeholder="Cidade, lugar ou data"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" aria-label="Buscar">
              <ArrowRight size={18} />
            </button>
          </form>
          <Link
            className={`connection ${online ? '' : 'disconnected'}`}
            to="/mais"
            title={pwaStatus}
          >
            {online ? <Check size={15} /> : <WifiOff size={15} />}
            <span>
              {!online
                ? 'Sem rede'
                : pwaStatus === 'Conteúdo disponível offline'
                  ? 'Offline pronto'
                  : 'Verificar offline'}
            </span>
          </Link>
        </header>
        {update && (
          <div className="update-banner" role="status">
            <span>Uma nova versão foi preparada. Atualize para usar o novo conteúdo.</span>
            <button className="button button-primary button-small" onClick={activateUpdate}>
              Atualizar agora
            </button>
          </div>
        )}
        <main id="main-content" tabIndex={-1} ref={mainRef}>
          <Routes>
            <Route path="/" element={<Navigate to="/hoje" replace />} />
            <Route path="/hoje/:date?" element={<Today now={now} />} />
            <Route path="/viagem" element={<Itinerary />} />
            <Route path="/posts" element={<Posts />} />
            <Route
              path="/posts/imagem/:id"
              element={<Navigate to={`/posts${location.search}`} replace />}
            />
            <Route path="/cidades" element={<Cities />} />
            <Route path="/cidades/:id" element={<CityDetail />} />
            <Route path="/logistica" element={<Logistics />} />
            <Route path="/trecho/:id" element={<TransportDetail />} />
            <Route path="/local/:id" element={<PlaceDetail />} />
            <Route path="/hotel/:id" element={<PlaceDetail hotel />} />
            <Route path="/endereco/:kind/:id" element={<Address />} />
            <Route path="/mais" element={<More />} />
            <Route path="/buscar" element={<Search />} />
            <Route
              path="*"
              element={
                <>
                  <h1>Página não encontrada</h1>
                  <Link to="/hoje">Voltar ao roteiro</Link>
                </>
              }
            />
          </Routes>
          <footer className="page-footer">
            <span>Conteúdo atualizado em {content.trip.contentVersion}</span>
            <span>Horários locais · Pendências sinalizadas</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navegação no celular">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} key={to} to={to}>
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
export function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
