import { describe, expect, it } from 'vitest';
import { i18n } from './index';

/** Todas las claves de un objeto de textos, como rutas («welcome.step1.title»). */
const keys = (o: unknown, prefix = ''): string[] =>
  o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k)) : [prefix];
const at = (o: unknown, path: string) => path.split('.').reduce((a: any, p) => a?.[p], o);

describe('idiomas', () => {
  const es = i18n.global.getLocaleMessage('es') as Record<string, unknown>;
  const en = i18n.global.getLocaleMessage('en') as Record<string, unknown>;

  it('el inglés tiene las mismas claves que el español, en los mismos archivos', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });
  it('ninguna frase queda vacía', () => {
    for (const m of [es, en]) expect(keys(m).filter(k => String(at(m, k)).trim() === '')).toEqual([]);
  });
});
