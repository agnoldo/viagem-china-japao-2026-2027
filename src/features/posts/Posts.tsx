import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Images,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { content } from '../../content';
import { PageHeading } from '../../components/shared';

function PostImage({
  src,
  title,
  width,
  height,
}: {
  src: string;
  title: string;
  width: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="post-image-error">
      <ImageOff size={28} aria-hidden="true" />
      <span>Imagem indisponível. Reconecte e verifique o offline em Mais.</span>
    </div>
  ) : (
    <img
      src={`${import.meta.env.BASE_URL}${src}`}
      alt={title}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function Posts() {
  const [params] = useSearchParams();
  const selected = params.get('categoria');
  const category = content.posts.find((item) => item.id === selected);
  const images = content.posts
    .filter((item) => !category || item.id === category.id)
    .flatMap((item) => item.images.map((image) => ({ ...image, category: item })));
  const total = content.posts.reduce((sum, item) => sum + item.images.length, 0);
  return (
    <>
      <PageHeading
        title="Posts"
        description="Prints e referências para consultar durante a viagem."
      />
      <nav className="post-categories" aria-label="Categorias de posts">
        <Link to="/posts" aria-current={!category ? 'page' : undefined}>
          Todos <span>{total}</span>
        </Link>
        {content.posts.map((item) => (
          <Link
            key={item.id}
            to={`/posts?categoria=${encodeURIComponent(item.id)}`}
            aria-current={category?.id === item.id ? 'page' : undefined}
          >
            {item.title} <span>{item.images.length}</span>
          </Link>
        ))}
      </nav>
      <div className="post-section-heading">
        <h2>{category?.title ?? 'Todos os posts'}</h2>
        <span>
          {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
        </span>
      </div>
      {images.length ? (
        <div className="post-gallery">
          {images.map((image) => (
            <figure key={image.id} className="post-item">
              <Link
                to={`/posts/imagem/${image.id}${category ? `?categoria=${encodeURIComponent(category.id)}` : ''}`}
                aria-label={`Ampliar ${image.title} · ${image.category.title}`}
              >
                <div className="post-thumbnail">
                  <PostImage {...image} />
                </div>
                <figcaption>
                  <strong>{image.title}</strong>
                  {!category && <span>{image.category.title}</span>}
                </figcaption>
              </Link>
            </figure>
          ))}
        </div>
      ) : (
        <div className="post-empty">
          <Images size={32} aria-hidden="true" />
          <h3>
            {category ? 'Esta categoria ainda não tem prints' : 'Nenhum print adicionado ainda'}
          </h3>
          <p>As imagens aparecerão aqui quando forem adicionadas à galeria.</p>
        </div>
      )}
    </>
  );
}

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [actualSize, setActualSize] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const category = content.posts.find((item) => item.images.some((image) => image.id === id));
  const image = category?.images.find((item) => item.id === id);
  const selected = params.get('categoria');
  const scope = selected === category?.id ? selected : null;
  const query = scope ? `?categoria=${encodeURIComponent(scope)}` : '';
  const back = `/posts${query}`;
  const images = content.posts
    .filter((item) => !scope || item.id === scope)
    .flatMap((item) => item.images);
  const index = images.findIndex((item) => item.id === id);
  const canSwipe = () =>
    !actualSize && images.length > 1 && (window.visualViewport?.scale ?? 1) <= 1.01;
  const visit = (step: number) => {
    const next = images[index + step];
    if (next) navigate(`/posts/imagem/${next.id}${query}`, { replace: true });
  };
  if (!image || !category)
    return (
      <>
        <PageHeading title="Print não encontrado" />
        <Link className="back-link" to={back}>
          Voltar aos posts
        </Link>
      </>
    );
  return (
    <>
      <Link className="back-link" to={back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar aos posts
      </Link>
      <PageHeading title={image.title} description={category.title} />
      <div className="post-viewer-toolbar">
        <button
          type="button"
          className="button button-secondary"
          aria-pressed={actualSize}
          onClick={() => setActualSize((value) => !value)}
        >
          {actualSize ? (
            <ZoomOut size={18} aria-hidden="true" />
          ) : (
            <ZoomIn size={18} aria-hidden="true" />
          )}
          {actualSize ? 'Ajustar à tela' : 'Ampliar imagem'}
        </button>
        <p>
          {actualSize
            ? 'Deslize para ler os detalhes da imagem.'
            : images.length > 1
              ? 'Deslize a imagem para os lados para trocar de print. Amplie para ler os detalhes.'
              : 'Amplie para ler os detalhes. No iPhone, você também pode usar o gesto de pinça.'}
        </p>
      </div>
      {images.length > 1 && (
        <nav className="post-image-nav" aria-label="Navegação entre imagens">
          <button
            type="button"
            className="button button-secondary"
            aria-label="Imagem anterior"
            disabled={index <= 0}
            onClick={() => visit(-1)}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Anterior
          </button>
          <span aria-live="polite" aria-atomic="true">
            {index + 1} de {images.length}
          </span>
          <button
            type="button"
            className="button button-secondary"
            aria-label="Próxima imagem"
            disabled={index === images.length - 1}
            onClick={() => visit(1)}
          >
            Próxima
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </nav>
      )}
      <div
        className={`post-viewer${actualSize ? ' post-viewer-actual' : ''}`}
        role="region"
        aria-label="Imagem ampliada"
        tabIndex={0}
        key={image.id}
        onKeyDown={(event) => {
          if (!canSwipe() || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          visit(event.key === 'ArrowLeft' ? -1 : 1);
        }}
        onTouchStart={(event) => {
          touch.current =
            canSwipe() && event.touches.length === 1
              ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
              : null;
        }}
        onTouchMove={(event) => {
          if (!touch.current) return;
          if (!canSwipe() || event.touches.length !== 1) {
            touch.current = null;
            return;
          }
          const dx = event.touches[0].clientX - touch.current.x;
          const dy = event.touches[0].clientY - touch.current.y;
          // Once a gesture becomes vertical, reserve it for scrolling to its end.
          if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) touch.current = null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start || !canSwipe() || event.touches.length || event.changedTouches.length !== 1)
            return;
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 2) visit(dx < 0 ? 1 : -1);
        }}
      >
        <PostImage {...image} />
      </div>
    </>
  );
}
