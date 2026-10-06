import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, download, fileNameFrom, onSessionLost, refreshSession, setAccessToken, upload } from './api';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => { vi.unstubAllGlobals(); setAccessToken(null); onSessionLost(() => {}); });

describe('cliente de la API', () => {
  it('llamadas simultáneas comparten una sola renovación (el token de renovación sirve una vez)', async () => {
    const f = vi.fn(async () => json(200, { accessToken: 'nuevo' }));
    vi.stubGlobal('fetch', f);
    const [a, b, c] = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    expect([a, b, c]).toEqual([true, true, true]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('ante un 401 renueva la sesión y repite la petición con el token nuevo', async () => {
    const calls: { url: string; auth: string | null }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, auth: new Headers(init.headers).get('Authorization') });
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'nuevo' });
      return calls.filter(c => c.url.endsWith('/therapists')).length === 1 ? json(401, { code: 'UNAUTHENTICATED', message: 'La sesión venció' }) : json(200, [{ id: '1' }]);
    }));
    setAccessToken('viejo');
    expect(await api('/therapists')).toEqual([{ id: '1' }]);
    // la renovación va con el token viejo, que el servidor ignora
    expect(calls.map(c => c.auth)).toEqual(['Bearer viejo', 'Bearer viejo', 'Bearer nuevo']);
  });

  it('si la renovación falla avisa de la sesión perdida y lanza el error de la API', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.endsWith('/auth/refresh') ? json(401, { code: 'UNAUTHENTICATED', message: 'x' }) : json(401, { code: 'UNAUTHENTICATED', message: 'La sesión venció' }))));
    const lost = vi.fn(); onSessionLost(lost);
    await expect(api('/users')).rejects.toMatchObject({ status: 401, message: 'La sesión venció' });
    expect(lost).toHaveBeenCalledOnce();
  });

  it('no intenta renovar cuando el 401 viene del propio login', async () => {
    const f = vi.fn(async () => json(401, { code: 'BAD_CREDENTIALS', message: 'Correo o contraseña incorrectos.' }));
    vi.stubGlobal('fetch', f);
    await expect(api('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({ message: 'Correo o contraseña incorrectos.' });
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe('archivos', () => {
  it('toma el nombre de Content-Disposition (con tildes y espacios) o usa el de respaldo', () => {
    expect(fileNameFrom(`attachment; filename="cuadro.xlsx"; filename*=UTF-8''UCI%20Neurocr%C3%ADtica%20-%20Septiembre%202026.xlsx`, 'x.xlsx')).toBe('UCI Neurocrítica - Septiembre 2026.xlsx');
    expect(fileNameFrom('attachment; filename="cuadro.ods"', 'x')).toBe('cuadro.ods');
    expect(fileNameFrom(null, 'respaldo.ods')).toBe('respaldo.ods');
    expect(fileNameFrom("attachment; filename*=UTF-8''%E0%A4%A", 'x')).toBe('x'); // codificación rota: no revienta
  });

  it('subir manda los bytes tal cual, sin JSON, con la sesión', async () => {
    const f = vi.fn(async () => json(200, { ok: true }));
    vi.stubGlobal('fetch', f); setAccessToken('tok');
    const file = new Blob(['abc']);
    expect(await upload('/schedules/import/preview?serviceId=1', file)).toEqual({ ok: true });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1], h = new Headers(init.headers);
    expect(init.body).toBe(file);
    expect(h.get('Content-Type')).toBe('application/octet-stream');
    expect(h.get('Authorization')).toBe('Bearer tok');
  });

  it('descargar pide el archivo con la sesión y lo entrega con el nombre del servidor', async () => {
    const f = vi.fn(async () => new Response('x', { status: 200, headers: { 'Content-Disposition': `attachment; filename*=UTF-8''Cuadro%20Octubre.ods` } }));
    vi.stubGlobal('fetch', f); setAccessToken('tok');
    const created: string[] = [];
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { created.push(this.download); });
    expect(await download('/schedules/1/export?format=ods', 'cuadro.ods')).toBe('Cuadro Octubre.ods');
    expect(created).toEqual(['Cuadro Octubre.ods']);
    expect(new Headers((f.mock.calls[0] as unknown as [string, RequestInit])[1].headers).get('Authorization')).toBe('Bearer tok');
    click.mockRestore();
  });

  it('si la descarga falla muestra el mensaje del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(403, { code: 'FORBIDDEN', message: 'No tienes permiso sobre los cuadros de este servicio' })));
    await expect(download('/schedules/1/export', 'x')).rejects.toMatchObject({ status: 403, message: 'No tienes permiso sobre los cuadros de este servicio' });
  });
});
