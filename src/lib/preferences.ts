export function readPreference(key: string): string | null {
  try {
    const value = localStorage.getItem(`trip:${key}`);
    return value && value.length <= 200 ? value : null;
  } catch {
    return null;
  }
}
export function writePreference(key: string, value: string): void {
  try {
    localStorage.setItem(`trip:${key}`, value);
  } catch {
    /* Preferências são dispensáveis para consulta. */
  }
}
