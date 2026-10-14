import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ImageOff, Images, X } from 'lucide-react';
import { content } from '../../content';
import { PageHeading } from '../../components/shared';

type GalleryImage = (typeof content.posts)[number]['images'][number];
function PostImage({ src, title, width, height }: GalleryImage) {
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

function ImageViewer({
  images,
  initialIndex,
  close,
}: {
  images: GalleryImage[];
  initialIndex: number;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(initialIndex);
  const image = images[index];
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element?.open) return;
    const focused = document.activeElement;
    // A newly disabled boundary button can send focus to body in Chromium/WebKit.
    if (!element.contains(focused) || (focused instanceof HTMLButtonElement && focused.disabled)) {
      element
        .querySelector<HTMLButtonElement>('button:not(:disabled)')
        ?.focus({ preventScroll: true });
    }
  }, [index]);
  useEffect(() => {
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  const canSwipe = () => images.length > 1 && (window.visualViewport?.scale ?? 1) <= 1.01;
  const visit = (step: number) =>
    setIndex((current) => Math.max(0, Math.min(images.length - 1, current + step)));
  return (
    <dialog
      ref={dialog}
      className="post-lightbox"
      aria-label="Visualizador de imagens"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
          ];
          const current = controls.indexOf(document.activeElement as HTMLButtonElement);
          event.preventDefault();
          controls[
            (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
          ]?.focus();
          return;
        }
        if (!canSwipe() || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        visit(event.key === 'ArrowLeft' ? -1 : 1);
      }}
    >
      <div
        className="post-lightbox-stage"
        role="group"
        aria-label="Imagem em tela cheia"
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
        <PostImage key={image.id} {...image} />
      </div>
      <span
        className="post-lightbox-count"
        role="status"
        aria-label="Posição da imagem"
        aria-live="polite"
        aria-atomic="true"
      >
        {index + 1} de {images.length}
      </span>
      <button
        className="post-lightbox-close"
        type="button"
        aria-label="Fechar imagens"
        onClick={close}
      >
        <X size={24} aria-hidden="true" />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="post-lightbox-prev"
            type="button"
            aria-label="Imagem anterior"
            disabled={index === 0}
            onClick={() => visit(-1)}
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
          <button
            className="post-lightbox-next"
            type="button"
            aria-label="Próxima imagem"
            disabled={index === images.length - 1}
            onClick={() => visit(1)}
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        </>
      )}
    </dialog>
  );
}

function Gallery({ categoryId }: { categoryId?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const category = content.posts.find((item) => item.id === categoryId);
  const images = content.posts
    .filter((item) => !category || item.id === category.id)
    .flatMap((item) => item.images.map((image) => ({ ...image, category: item })));
  const close = () => {
    setActive(null);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  };
  return (
    <>
      {images.length ? (
        <div className="post-gallery" aria-label={category?.title ?? 'Todos os posts'}>
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              className="post-item"
              data-post-id={image.id}
              aria-label={`Ampliar ${image.title} · ${image.category.title}`}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setActive(index);
              }}
            >
              <span className="post-thumbnail">
                <PostImage {...image} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="post-empty">
          <Images size={32} aria-hidden="true" />
          <h2>
            {category ? 'Esta categoria ainda não tem prints' : 'Nenhum print adicionado ainda'}
          </h2>
          <p>As imagens aparecerão aqui quando forem adicionadas à galeria.</p>
        </div>
      )}
      {active !== null && <ImageViewer images={images} initialIndex={active} close={close} />}
    </>
  );
}

export function Posts() {
  const [params] = useSearchParams();
  const selected = params.get('categoria');
  const category = content.posts.find((item) => item.id === selected);
  const total = content.posts.reduce((sum, item) => sum + item.images.length, 0);
  return (
    <>
      <PageHeading title="Posts" />
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
      <Gallery key={category?.id ?? ''} categoryId={category?.id} />
    </>
  );
}
