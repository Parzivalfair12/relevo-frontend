# Relevo · frontend

Interfaz Vue 3 de los cuadros de turnos mensuales para terapeutas respiratorias: inicio de sesión, Resumen, Cuadros con su editor, importar y exportar Excel y ODS, Equipo y Administración. Estado: fases 0 a 6 listas (falta el piloto y el despliegue, fases 7 y 8 del plan).

## Arranque rápido (desarrollo)
Requisitos: Node 22 y Docker. **Primero el backend** (`../backend`), después este repo.

```bash
# 1. Backend (en ../backend)
npm install
npm run db:up            # MongoDB en Docker (127.0.0.1:27018)
npm run seed             # datos de ejemplo
npm run dev              # API en http://localhost:4000

# 2. Frontend (aquí)
npm install
cp .env.example .env     # VITE_DEMO_USERS=true muestra los usuarios de prueba en el login
npm run dev              # http://localhost:5173  (/api se redirige al backend)
```

**Con qué usuario entrar** (creados por el seed del backend):

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@turnos.demo` | `admin123` |
| Coordinadora (UCI y Hospitalización) | `coordinadora@turnos.demo` | `coord123` |
| Coordinador (Urgencias) | `urgencias@turnos.demo` | `urg123` |

Con `VITE_DEMO_USERS=true` el login ofrece botones que llenan los dos primeros.

## En contenedor (como en producción)
Primero la API (`../backend`: `docker compose --env-file .env.production --profile app up -d --build`, ver su README). Luego aquí:
```bash
docker compose up -d --build     # Nginx con la web compilada → http://localhost:8080
```
Nginx entrega la web, reenvía `/api` a la API por la red de Docker (un solo origen: sin CORS y con la cookie de sesión `SameSite=Strict`) y añade cabeceras de seguridad (CSP, `nosniff`, sin marcos, sin referrer). El HTTPS y el HSTS los pone quien publique la web (balanceador o proveedor).

## Identidad, tema e idiomas

- **Logo y nombre:** `src/components/BrandLogo.vue` (anillo mitad día y mitad noche con una onda de respiración) y `public/favicon.svg`.
- **Tema claro, oscuro o automático:** los colores son tokens en `src/styles/tokens.css`; el tema oscuro es el bloque `:root[data-theme="dark"]`. `public/theme-init.js` lo aplica antes de pintar (es un archivo aparte porque la CSP no admite scripts en línea) y `src/lib/theme.ts` guarda la elección en el navegador. Nunca pongas un color fijo en un componente: usa un token.
- **Idiomas (español e inglés):** `vue-i18n`; los textos están en `src/i18n/locales/<idioma>/<espacio>.ts`. El español es la base y siempre es el idioma de arranque; el botón ES/EN guarda la elección. Para un texto nuevo crea la clave en `es` y en `en` (la prueba `src/i18n/locales.test.ts` falla si no coinciden). Los mensajes que llegan en español desde el servidor o el motor se traducen con la tabla de `src/i18n/serverMessages.ts`.
- **Bienvenida:** `src/components/WelcomeDialog.vue` sale la primera vez que cada persona entra; el botón «?» de la barra la vuelve a abrir.

## Comandos
| Comando | Qué hace |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos (vue-tsc) |
| `npm test` | Vitest: cliente, stores, tabla de carga, importar, casos fijos del motor |
| `npm run build` | Tipos y build de producción |
| `npm run e2e` | **Extremo a extremo y accesibilidad (Playwright + axe).** Levanta su propia API (:4100) y web (:5183) sobre la base `turnos_e2e`: no toca tus datos ni tus servidores. Necesita el backend en `../backend` y `db:up` hecho. En un equipo sin Chromium de Playwright: `PW_CHANNEL=msedge npm run e2e` (o `chrome`) |
| `npm run sync:engine` / `engine:check` | Copia del motor y los esquemas desde `../backend`, y su verificación |

## Motor y esquemas: copia generada
`src/engine/`, `src/shared/`, `engine-golden.json` y `engine.sha256` **no se editan a mano**: vienen del backend. Para actualizarlos, `npm run sync:engine` con el backend al lado. Detalle en `CLAUDE.md`.

`referencia/` guarda el mockup aprobado, sus capturas, el motor original, el cuadro real del hospital y el plan.
