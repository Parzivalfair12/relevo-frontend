import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleDTO } from '@/shared';
import { setAccessToken } from '@/lib/api';
import { toasts } from '@/lib/toast';
import { useEditor } from './editor';

const n = 30;
const base = (version: number): ScheduleDTO => ({
  id: 's1', serviceId: 'sv', year: 2026, month: 8, status: 'bor', ownerId: 'u', ownerName: 'Admin', version, seed: 3,
  coverage: { M: 1, T: 1, N: 1 }, rules: { seq: true, restAfterN: true, weekends: true, balance: true, maxConsec: 5, support: 'need' },
  prev: {}, busy: {}, occupied: {},
  members: ['a', 'b'].map(id => ({ therapistId: id, name: id.toUpperCase(), kind: 'fija' as const, targetHours: null, days: Array(n).fill('L'), locked: {} }))
});
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Servidor simulado: aplica los cambios de casillas, sube la versión y guarda el orden de las llamadas. */
function fakeServer(opts: { conflictOnce?: boolean } = {}) {
  let db = base(0), conflict = !!opts.conflictOnce, gate: Promise<void> | null = null;
  const calls: string[] = [];
  const f = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET', path = url.replace(/^.*\/api\/v1/, ''), body = init.body ? JSON.parse(String(init.body)) : {};
    calls.push(`${method} ${path.split('?')[0]}`);
    if (gate) await gate; // petición «en vuelo»: no responde hasta que se libere
    if (path.endsWith('/version')) return json(200, { version: db.version, updatedByName: 'Otra Persona' });
    if (method !== 'GET' && body.version !== db.version) return json(409, { code: 'VERSION_CONFLICT', message: 'x', details: { updatedByName: 'Otra Persona', version: db.version } });
    if (conflict && method !== 'GET') { conflict = false; db = { ...db, version: db.version + 1 }; return json(409, { code: 'VERSION_CONFLICT', message: 'x', details: { updatedByName: 'Otra Persona', version: db.version } }); }
    if (path.endsWith('/cells')) {
      for (const c of body.changes) { const m = db.members.find(x => x.therapistId === c.therapistId)!; if (c.code) { m.locked[c.day] = c.code; m.days[c.day] = c.code; } else delete m.locked[c.day]; }
      db = { ...db, version: db.version + 1 };
    } else if (method === 'POST' && path.endsWith('/generate')) db = { ...db, version: db.version + 1, seed: db.seed + 1 };
    else if (method === 'PATCH') db = { ...db, ...(body.coverage && { coverage: body.coverage }), ...(body.rules && { rules: body.rules }), ...(body.status && { status: body.status }), version: db.version + 1 };
    return json(200, structuredClone(db));
  });
  return { f, calls, get db() { return db; }, /** Otra persona guarda un cambio: sube la versión y toca una casilla */ bump() { db = structuredClone(db); db.version++; db.members[0].days[10] = 'T'; }, hold() { let release!: () => void; gate = new Promise<void>(r => { release = r; }); return () => { gate = null; release(); }; } };
}

beforeEach(() => { setActivePinia(createPinia()); setAccessToken('t'); vi.useFakeTimers(); toasts.length = 0; });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

async function opened(server = fakeServer()) {
  vi.stubGlobal('fetch', server.f);
  const ed = useEditor(); await ed.open('s1'); server.calls.length = 0;
  return { ed, server };
}

describe('editor: pintar y guardar', () => {
  it('pinta al instante, fija la casilla y guarda en un solo lote tras la pausa', async () => {
    const { ed, server } = await opened();
    ed.paint('a', 3, 'M'); ed.paint('a', 4, 'N'); ed.paint('b', 3, 'T');
    expect(ed.s!.members[0].days.slice(3, 5)).toEqual(['M', 'N']);
    expect(ed.s!.members[0].locked).toEqual({ 3: 'M', 4: 'N' });
    expect(server.calls).toEqual([]); // todavía no se envió nada
    await vi.advanceTimersByTimeAsync(799); expect(server.calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(2);
    expect(server.calls).toEqual(['PUT /schedules/s1/cells']); // un solo lote
    expect(ed.s!.version).toBe(1);
    expect(ed.hasPending).toBe(false);
  });
  it('lo que se pinta mientras viaja un guardado no se pierde', async () => {
    const server = fakeServer(), { ed } = await opened(server);
    ed.paint('a', 1, 'M');
    const release = server.hold();
    const saving = ed.flush();
    await vi.advanceTimersByTimeAsync(0); // la petición ya salió y espera respuesta
    ed.paint('a', 2, 'T'); // llega mientras la primera petición está en vuelo
    release(); await saving; await vi.advanceTimersByTimeAsync(900);
    expect(ed.s!.members[0].days.slice(1, 3)).toEqual(['M', 'T']);
    expect(server.db.members[0].locked).toEqual({ 1: 'M', 2: 'T' }); // las dos terminaron en el servidor
    expect(ed.s!.version).toBe(2);
  });
  it('la goma suelta casillas fijadas y el servidor recalcula al guardar', async () => {
    const { ed, server } = await opened();
    ed.paint('a', 3, 'M'); await ed.flush(); server.calls.length = 0;
    expect(ed.erase('a', 3)).toBe(true);
    expect(ed.erase('a', 9)).toBe(false); // nada fijado ahí
    await ed.flush();
    expect(ed.s!.members[0].locked).toEqual({});
    expect(server.calls).toEqual(['PUT /schedules/s1/cells']);
  });
});

describe('editor: conflicto de versión', () => {
  it('muestra quién cambió, conserva lo pendiente y al recargar lo vuelve a aplicar', async () => {
    const server = fakeServer({ conflictOnce: true }), { ed } = await opened(server);
    ed.paint('a', 5, 'N');
    await ed.flush();
    expect(ed.conflict).toEqual({ by: 'Otra Persona' });
    expect(ed.hasPending).toBe(true);
    expect(ed.s!.members[0].days[5]).toBe('N'); // se sigue viendo
    ed.paint('a', 6, 'M'); expect(ed.s!.members[0].days[6]).toBe('L'); // con el conflicto abierto no se acepta pintar más
    await ed.reloadAfterConflict();
    expect(ed.conflict).toBeNull();
    expect(ed.hasPending).toBe(false);
    expect(server.db.members[0].locked).toEqual({ 5: 'N' }); // lo pendiente quedó guardado sobre la versión nueva
    expect(ed.s!.version).toBe(server.db.version);
  });
});

describe('editor: operaciones del servidor', () => {
  it('antes de recalcular se guarda lo pendiente y las llamadas van en orden', async () => {
    const { ed, server } = await opened();
    ed.paint('a', 2, 'M');
    const dto = await ed.generate(true);
    expect(dto).not.toBeNull();
    expect(server.calls).toEqual(['PUT /schedules/s1/cells', 'POST /schedules/s1/generate']);
    expect(ed.s!.seed).toBe(4);
    expect(ed.s!.members[0].locked).toEqual({ 2: 'M' });
  });
  it('cambiar una regla se ve al instante y viaja completa', async () => {
    const { ed, server } = await opened();
    const p = ed.setRules({ maxConsec: 4 });
    expect(ed.s!.rules.maxConsec).toBe(4);
    await p;
    expect(server.calls).toEqual(['PATCH /schedules/s1']);
    const sent = JSON.parse(String(server.f.mock.calls.at(-1)![1]!.body));
    expect(sent.rules).toMatchObject({ seq: true, maxConsec: 4, support: 'need' });
  });
  it('la cobertura no baja de 0 ni sube de 4', async () => {
    const { ed } = await opened();
    await ed.setCoverage('M', -5); expect(ed.s!.coverage.M).toBe(0);
    await ed.setCoverage('M', 9); expect(ed.s!.coverage.M).toBe(4);
  });
});

describe('editor: aviso de que otra persona cambió el cuadro (sondeo)', () => {
  it('sin cambios no hace nada más que preguntar la versión', async () => {
    const { ed, server } = await opened();
    expect(await ed.checkRemote()).toBe('same');
    expect(server.calls).toEqual(['GET /schedules/s1/version']);
    expect(ed.conflict).toBeNull(); expect(toasts).toHaveLength(0);
  });
  it('si otra persona guardó y aquí no hay nada pendiente, el cuadro se actualiza solo y se avisa', async () => {
    const { ed, server } = await opened();
    server.bump();
    expect(await ed.checkRemote()).toBe('refreshed');
    expect(server.calls).toEqual(['GET /schedules/s1/version', 'GET /schedules/s1']);
    expect(ed.s!.version).toBe(1); expect(ed.s!.members[0].days[10]).toBe('T');
    expect(ed.conflict).toBeNull();
    expect(toasts.map(x => x.text).join(' ')).toMatch(/Otra Persona cambió este cuadro y ya se actualizó aquí/);
  });
  it('con casillas sin guardar avisa del conflicto sin recargar ni perder lo pintado', async () => {
    const { ed, server } = await opened();
    ed.paint('a', 3, 'M');
    server.bump();
    expect(await ed.checkRemote()).toBe('conflict');
    expect(ed.conflict).toEqual({ by: 'Otra Persona' });
    expect(server.calls).toEqual(['GET /schedules/s1/version']); // no se recargó
    expect(ed.s!.members[0].days[3]).toBe('M'); expect(ed.hasPending).toBe(true);
    ed.reloadAfterConflict(); await vi.advanceTimersByTimeAsync(10); // «Recargar y aplicar mis cambios»
    expect(ed.s!.members[0].days[10]).toBe('T'); expect(ed.s!.members[0].days[3]).toBe('M'); expect(ed.conflict).toBeNull();
  });
  it('no pregunta mientras se guarda, hay un conflicto ya avisado o no hay cuadro abierto', async () => {
    const server = fakeServer(), { ed } = await opened(server);
    const release = server.hold();
    ed.paint('a', 1, 'M'); await vi.advanceTimersByTimeAsync(801); // el guardado queda en vuelo
    expect(ed.saving).toBe(true);
    expect(await ed.checkRemote()).toBe('skipped');
    expect(server.calls.filter(c => c.includes('/version'))).toEqual([]);
    release(); await vi.advanceTimersByTimeAsync(10);
    expect(ed.saving).toBe(false); expect(ed.s!.version).toBe(1);
    expect(await ed.checkRemote()).toBe('same'); // y al terminar vuelve a preguntar: la versión propia no se toma por ajena
    ed.conflict = { by: 'x' };
    expect(await ed.checkRemote()).toBe('skipped');
    ed.close();
    expect(await ed.checkRemote()).toBe('skipped');
  });
  it('si la consulta falla (sin conexión) no molesta', async () => {
    const { ed } = await opened();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network'); }));
    expect(await ed.checkRemote()).toBe('skipped');
    expect(ed.conflict).toBeNull();
  });
});
