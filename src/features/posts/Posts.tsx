import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImageOff, Images, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [params] = useSearchParams();
  const [actualSize, setActualSize] = useState(false);
  const category = content.posts.find((item) => item.images.some((image) => image.id === id));
  const image = category?.images.find((item) => item.id === id);
  const selected = params.get('categoria');
  const back =
    selected && content.posts.some((item) => item.id === selected)
      ? `/posts?categoria=${encodeURIComponent(selected)}`
      : '/posts';
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
            : 'Amplie para ler os detalhes. No iPhone, você também pode usar o gesto de pinça.'}
        </p>
      </div>
      <div
        className={`post-viewer${actualSize ? ' post-viewer-actual' : ''}`}
        role="region"
        aria-label="Imagem ampliada"
        tabIndex={0}
        key={image.id}
      >
        <PostImage {...image} />
      </div>
    </>
  );
}
