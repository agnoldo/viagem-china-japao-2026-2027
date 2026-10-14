import type { MapLinkResult } from './links';
export type MapDevice = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>;
export function isIOSDevice(device: MapDevice = navigator): boolean {
  return (
    /iPad|iPhone|iPod/i.test(device.userAgent) ||
    ((device.platform === 'MacIntel' || /Macintosh/i.test(device.userAgent)) &&
      device.maxTouchPoints > 1)
  );
}
export function mapWebHref(link: MapLinkResult, device: MapDevice = navigator): string | null {
  return isIOSDevice(device) && link.appUrl ? link.fallbackUrl : link.url;
}
export type MapAppEnvironment = {
  window: Pick<Window, 'setTimeout' | 'clearTimeout' | 'addEventListener' | 'removeEventListener'>;
  document: Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'>;
  navigate: (url: string) => void;
};
const browserEnvironment = (): MapAppEnvironment => ({
  window,
  document,
  navigate: (url) => {
    window.location.href = url;
  },
});
let cancelPending: (() => void) | undefined;
/** Same-window navigation preserves the user gesture in Safari and Home Screen PWAs. */
export function openMapApp(
  appUrl: string,
  webUrl: string,
  environment: MapAppEnvironment = browserEnvironment(),
): () => void {
  cancelPending?.();
  const { window: win, document: doc, navigate } = environment;
  const onVisibility = () => {
    if (doc.hidden) cancel();
  };
  const cancel = () => {
    win.clearTimeout(timer);
    win.removeEventListener('pagehide', cancel);
    doc.removeEventListener('visibilitychange', onVisibility);
    if (cancelPending === cancel) cancelPending = undefined;
  };
  const timer = win.setTimeout(() => {
    const hidden = doc.hidden;
    cancel();
    if (!hidden) navigate(webUrl);
  }, 1500);
  cancelPending = cancel;
  win.addEventListener('pagehide', cancel, { once: true });
  doc.addEventListener('visibilitychange', onVisibility);
  try {
    navigate(appUrl);
  } catch {
    /* Unsupported schemes still reach the timed web fallback. */
  }
  return cancel;
}
type MapClick = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
};
export function handleMapClick(
  event: MapClick,
  link: MapLinkResult,
  device: MapDevice = navigator,
  environment?: MapAppEnvironment,
): boolean {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !isIOSDevice(device) ||
    !link.appUrl ||
    !link.fallbackUrl
  )
    return false;
  event.preventDefault();
  openMapApp(link.appUrl, link.fallbackUrl, environment);
  return true;
}
