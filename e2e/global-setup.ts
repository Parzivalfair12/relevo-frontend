import { execSync } from 'node:child_process';

/** Antes de empezar: base `turnos_e2e` con los datos de ejemplo (el seed borra y recarga solo esa base). */
export default function globalSetup() {
  const uri = process.env.E2E_MONGO_URI ?? 'mongodb://127.0.0.1:27018/turnos_e2e?replicaSet=rs0&directConnection=true';
  if (!/turnos_e2e/.test(uri)) throw new Error('E2E_MONGO_URI debe apuntar a una base llamada turnos_e2e: el seed BORRA la base a la que apunte.');
  execSync('npm run seed', { cwd: '../backend', stdio: 'inherit', env: { ...process.env, MONGO_URI: uri } });
}
