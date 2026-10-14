export function versionHash(entries: { url: string; revision?: string | null }[]): string {
  const value = JSON.stringify(entries);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
export function canOfferUpdate(state: string | undefined): boolean {
  return state === 'installed';
}
export function cacheNames(scope: string, version: string): [string, string] {
  const namespace = encodeURIComponent(scope);
  return [`trip:${namespace}:${version}:main`, `trip:${namespace}:${version}:rescue`];
}
