import type { ApiError } from '@/shared';

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

export class ApiException extends Error {
  constructor(public status: number, public body: ApiError) { super(body.message); }
}

async function raw(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(BASE + path, { ...init, headers, credentials: 'include' });
}

/**
 * Renueva el token de acceso con la cookie httpOnly. Cada token de renovación sirve una sola vez,
 * así que las llamadas simultáneas comparten una sola petición (si no, la segunda se leería como reutilización).
 */
let refreshing: Promise<boolean> | null = null;
export function refreshSession(): Promise<boolean> {
  refreshing ??= raw('/auth/refresh', { method: 'POST' })
    .then(async r => { if (!r.ok) return false; setAccessToken((await r.json()).accessToken); return true; })
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

let sessionLost: () => void = () => {};
/** La app registra qué hacer cuando la sesión ya no se puede renovar (volver al login). */
export const onSessionLost = (cb: () => void) => { sessionLost = cb; };

/** Hace la petición y, ante un 401, renueva la sesión y la repite una vez. */
async function call(path: string, init: RequestInit): Promise<Response> {
  let res = await raw(path, init);
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshSession()) res = await raw(path, init);
    else { setAccessToken(null); sessionLost(); }
  }
  return res;
}
const failure = async (res: Response) => new ApiException(res.status, (await res.json().catch(() => null)) ?? { code: 'NETWORK', message: 'No se pudo conectar con el servidor' });

/** Cliente fetch con renovación automática de sesión. */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await call(path, init);
  if (!res.ok) throw await failure(res);
  return (res.status === 204 ? null : await res.json().catch(() => null)) as T;
}
const withBody = (method: string) => <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
export const post = withBody('POST');
export const patch = withBody('PATCH');
export const put = withBody('PUT');
export const del = <T = unknown>(path: string) => api<T>(path, { method: 'DELETE' });

/** Sube un archivo tal cual (sin JSON): el servidor lo lee como bytes. */
export const upload = <T = unknown>(path: string, file: Blob) =>
  api<T>(path, { method: 'POST', body: file, headers: { 'Content-Type': 'application/octet-stream' } });

/** Nombre de archivo que propone el servidor en Content-Disposition (filename*=UTF-8''… o filename=…). */
export function fileNameFrom(disposition: string | null, fallback: string): string {
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition ?? '');
  if (star) { try { return decodeURIComponent(star[1]); } catch { /* cae al nombre simple */ } }
  return /filename="?([^";]+)"?/i.exec(disposition ?? '')?.[1] ?? fallback;
}

/** Descarga un archivo protegido con la sesión: se pide con el token y se entrega al navegador como descarga. */
export async function download(path: string, fallbackName: string): Promise<string> {
  const res = await call(path, {});
  if (!res.ok) throw await failure(res);
  const name = fileNameFrom(res.headers.get('Content-Disposition'), fallbackName);
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return name;
}

/** Mensaje para mostrar al usuario a partir de cualquier error. */
export const errorText = (e: unknown) => (e instanceof ApiException ? e.message : 'No se pudo conectar con el servidor.');
