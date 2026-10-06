#!/usr/bin/env node
/**
 * Sincroniza (y vigila) la copia del motor de turnos y de los esquemas que viene del backend.
 *
 * src/engine, src/shared, engine-golden.json y engine.sha256 son COPIAS GENERADAS: nunca se editan a mano.
 * La única fuente de verdad es el repositorio del backend (carpeta ../backend).
 *
 *   npm run sync:engine     copia desde el backend (carpeta hermana ../backend, o BACKEND_DIR)
 *   npm run engine:check    verifica la copia:
 *                             1. los archivos locales coinciden con engine.sha256  (detecta ediciones a mano)
 *                             2. engine.sha256 coincide con el del backend         (detecta que quedó desactualizada)
 *                           El backend se consulta en BACKEND_HASH_URL (con BACKEND_HASH_TOKEN si el repo es privado)
 *                           o, si no hay URL, en la carpeta hermana. En CI (CI=true) la URL es obligatoria.
 *
 * Algoritmo de la huella (idéntico en backend/scripts/engine-hash.mjs; si se cambia, cambiar en los dos):
 *   archivos = todo lo que hay bajo src/engine y src/shared + engine-golden.json, ordenados por ruta (con "/")
 *   por cada archivo se alimenta el hash con:  ruta \0 contenido-con-saltos-LF \0
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIRS = ['src/engine', 'src/shared'];
const FILES = ['engine-golden.json'];
const HASH_NAME = 'engine.sha256';

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? listFiles(p) : [p];
  });
}

function computeHash(root) {
  const rels = [
    ...DIRS.flatMap(d => (existsSync(join(root, d)) ? listFiles(join(root, d)).map(f => relative(root, f).split(sep).join('/')) : [])),
    ...FILES.filter(f => existsSync(join(root, f)))
  ].sort();
  if (!rels.length) throw new Error(`No hay archivos del motor bajo ${root}`);
  const h = createHash('sha256');
  for (const rel of rels) h.update(rel).update('\0').update(readFileSync(join(root, rel), 'utf8').replace(/\r\n/g, '\n')).update('\0');
  return h.digest('hex');
}
const readSaved = root => (existsSync(join(root, HASH_NAME)) ? readFileSync(join(root, HASH_NAME), 'utf8').trim().split(/\s+/)[0] : null);
const fail = msg => { console.error(`✖ ${msg}`); process.exit(1); };

const backendDir = resolve(process.env.BACKEND_DIR || join(ROOT, '..', 'backend'));

if (process.argv.includes('--check')) {
  // 1. La copia local no se tocó a mano
  const local = computeHash(ROOT), saved = readSaved(ROOT);
  if (!saved) fail(`Falta ${HASH_NAME}. Corre npm run sync:engine con el backend al lado.`);
  if (local !== saved) fail(`src/engine, src/shared o engine-golden.json no coinciden con ${HASH_NAME} (¿editados a mano?).\n  guardada: ${saved}\n  actual:   ${local}\nNo se editan a mano: revierte el cambio o corre npm run sync:engine.`);
  console.log(`✔ copia local íntegra (${local.slice(0, 12)}…)`);

  // 2. Está al día respecto del backend
  let remote = null, from = '';
  const url = process.env.BACKEND_HASH_URL;
  if (url) {
    const headers = process.env.BACKEND_HASH_TOKEN ? { Authorization: `Bearer ${process.env.BACKEND_HASH_TOKEN}` } : {};
    let res;
    try { res = await fetch(url, { headers }); } catch (e) { fail(`No se pudo leer ${url}: ${e.message}`); }
    if (!res.ok) fail(`No se pudo leer ${url}: HTTP ${res.status}${res.status === 404 ? ' (¿repo privado sin BACKEND_HASH_TOKEN?)' : ''}`);
    remote = (await res.text()).trim().split(/\s+/)[0]; from = url;
  } else if (process.env.CI) {
    fail('En CI falta BACKEND_HASH_URL (URL del engine.sha256 de main del backend).');
  } else if (existsSync(join(backendDir, HASH_NAME))) {
    remote = readSaved(backendDir); from = backendDir;
  }
  if (remote === null) console.log('• Sin backend al lado ni BACKEND_HASH_URL: solo se verificó la copia local.');
  else if (remote !== saved) fail(`La copia está desactualizada respecto del backend (${from}).\n  copia:   ${saved}\n  backend: ${remote}\nCorre npm run sync:engine con el backend al lado.`);
  else console.log(`✔ al día con el backend (${from})`);
} else {
  if (!existsSync(join(backendDir, 'src/engine/index.ts'))) fail(`No encuentro el backend en ${backendDir}. Debe estar en la carpeta hermana ../backend o define BACKEND_DIR.`);
  // El backend debe tener su huella al día: si no, se copiaría algo sin firmar
  const bHash = computeHash(backendDir), bSaved = readSaved(backendDir);
  if (bHash !== bSaved) fail(`En el backend, engine.sha256 no coincide con sus archivos. Corre allí npm run engine:hash y vuelve a sincronizar.`);
  for (const d of DIRS) { rmSync(join(ROOT, d), { recursive: true, force: true }); mkdirSync(dirname(join(ROOT, d)), { recursive: true }); cpSync(join(backendDir, d), join(ROOT, d), { recursive: true }); }
  for (const f of [...FILES, HASH_NAME]) cpSync(join(backendDir, f), join(ROOT, f));
  const local = computeHash(ROOT);
  if (local !== readSaved(ROOT)) fail('La copia no coincide con engine.sha256 después de copiar (algoritmos distintos entre repos).');
  console.log(`✔ sincronizado desde ${backendDir}\n  src/engine, src/shared, engine-golden.json, ${HASH_NAME} (${local.slice(0, 12)}…)\n  Recuerda: no se editan a mano.`);
}
