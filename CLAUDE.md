# Turnos Respiratoria · frontend (turnos-frontend)

Interfaz Vue 3 para armar los cuadros de turnos de terapeutas respiratorias de un hospital en Colombia. Toda la interfaz va en español. La API, el motor de turnos y los esquemas Zod viven en el repositorio de la carpeta hermana `../backend` (cada carpeta, `backend/` y `frontend/`, es un repositorio git independiente).

## NUNCA editar a mano: `src/engine/`, `src/shared/`, `engine-golden.json`, `engine.sha256`
Son una **copia generada** del backend (única fuente de verdad del motor y de los esquemas). Una edición a mano rompe `npm run engine:check` (y la CI) y se perdería en la siguiente sincronización.
- Para actualizarlos: `npm run sync:engine` con la carpeta `backend/` al lado (`../backend`, o `BACKEND_DIR=ruta`). El script copia, recalcula la huella sha256 y la compara con la del backend.
- `npm run engine:check` verifica dos cosas: que la copia local no se tocó (huella local) y que está al día con el backend (`BACKEND_HASH_URL`, con `BACKEND_HASH_TOKEN` si el repo es privado; sin URL usa la carpeta hermana; en CI la URL es obligatoria).
- Si necesitas un cambio en el motor o en un esquema: se hace en el backend (`npm run engine:hash`, y `npm run golden:update` si el comportamiento cambia a propósito), commit allí, y luego `npm run sync:engine` aquí.
- Se importan como `@/engine` y `@/shared`.
- `test/engine-golden.test.ts` ejecuta los casos fijos de `engine-golden.json`: garantiza que el motor se comporta igual en los dos repos.

## Fuentes de verdad (en `referencia/`)
- `mockup-referencia.html`: diseño y comportamiento aprobados. Ábrelo con Playwright y compara cada pantalla. Capturas en `referencia/capturas/`.
- `engine-referencia.js`: motor original en JS (ya portado al backend).
- `Plan de implementación MEVN · Turnos de Terapia Respiratoria.md` (el `CLAUDE.md` anterior lo llamaba `plan-mevn.md`): plan de implementación. Si falta, pídeselo al usuario.
- `SEPTIEMBRE_2026_2_1.ods`: cuadro real del hospital, ejemplo para importar/exportar.
- `DISENO.md` (en la raíz de este repo): guía visual con los tokens, tipografías y patrones reutilizables.

## Reglas de diseño (innegociables)
- Solo tema claro. Nunca modo oscuro.
- Los colores, espaciados, radios y tipografías salen de `src/styles/tokens.css`. No inventes valores nuevos; usa las variables.
- `src/styles/global.css` es el CSS del mockup tal cual. Al hacer cada componente Vue puedes mover su bloque a `<style scoped>` sin cambiar valores.
- Tipografías: Bricolage Grotesque (títulos) y Figtree (texto).
- Sin librería de componentes ni de estilos. Componentes Vue 3 con `<script setup lang="ts">`.
- Después de cada pantalla: captura con Playwright a 1440 px y 400 px y compárala con el mockup. Si algo no se puede igualar, dilo; no lo cambies en silencio.
- No agregues funciones que no estén en el mockup ni en el plan. Las ideas van a `MEJORAS.md`.

## Dominio (para la interfaz)
- Turnos: M 07–13 (6 h), T 13–19 (6 h), N 19–07 (12 h), MT doble (12 h), L libre. Ausencias: V vacaciones, I incapacidad, P permiso o licencia.
- Planta (`fija`) y apoyo (`apoyo`). Meses 0 a 11 en código; días de cuadro con índice 0 a n−1 en `locked`, día 1 a n en alertas.
- Roles: administrador ve todo; coordinadora ve y edita solo los cuadros de sus servicios y consulta el directorio.

## Estructura
- `src/` Vue 3 + Vite + Pinia + Vue Router: `views/`, `components/`, `stores/`, `lib/` (cliente de la API con renovación de sesión), `router/`, `layouts/`, `styles/`.
- `src/engine/`, `src/shared/`: copia generada (ver arriba).
- `test/`: pruebas que no pertenecen a un módulo (casos fijos del motor). Las del cliente están junto al código (`src/lib/api.test.ts`).
- `scripts/sync-engine.mjs`: sincroniza y verifica la copia del backend.
- `referencia/`: mockup, capturas, motor original, cuadro real y prompts.

## Comandos
Primero el backend (`../backend`: `npm run db:up`, `npm run seed`, `npm run dev`) y luego:
```bash
npm install
npm run dev            # http://localhost:5173 ; /api se redirige al backend en :4000
npm run lint           # ESLint
npm run typecheck      # vue-tsc
npm test               # Vitest
npm run build
npm run e2e            # Playwright + axe sobre su propia API (:4100), web (:5183) y base turnos_e2e. PW_CHANNEL=msedge si no hay Chromium de Playwright
npm run sync:engine    # copiar motor y esquemas desde ../backend
npm run engine:check   # copia íntegra y al día
```
`.env` (copia de `.env.example`): `VITE_DEMO_USERS=true` muestra los botones de usuarios de prueba; `VITE_API_URL` solo si la API está en otro dominio. Los botones de usuarios de prueba solo existen con `VITE_DEMO_USERS=true`.

## Forma de trabajar
1. Fases del plan: 0 arranque, 1 motor, 2 cuentas y directorio (hecha), 3 cuadros y editor (hecha), 4 resumen (hecha), 5 Excel y ODS (hecha), 6 endurecimiento (hecha). Siguen el piloto en paralelo y el despliegue (fases 7 y 8 del plan). Detenerse al terminar cada una.
2. Al terminar cada fase: tipos, pruebas, levantar backend y frontend juntos, comparar con el mockup e informar qué difiere.
3. Commits pequeños con mensajes claros.

### Decisiones tomadas
- **Modo quirks a propósito.** `index.html` no lleva `<!doctype>` porque el mockup tampoco: su CSS se aprobó en modo quirks (las tablas no heredan tamaño de letra ni interlineado, los `<form>` llevan margen inferior de 1 em, etc.). Con doctype, las tablas salen a 14 px y los paneles pierden 14 px de aire; sin él la app queda a 0 px de diferencia en Equipo y Administración. Los `<form>` nuevos heredan `margin-bottom:1em`.
- Contraseña mínima de 8 caracteres (el plan), no 6 como el mockup.
- La web en desarrollo usa el proxy de Vite (`/api` → :4000): mismo origen, sin CORS. El token de renovación va en cookie `httpOnly` que gestiona el backend; el cliente comparte una sola renovación entre llamadas simultáneas.
- Diferencias con el mockup, confirmadas en la fase 2: la pestaña «Plan de implementación» no se migra (el plan lo dice); la nota de usuarios de prueba del login ya no dice «se reinician al recargar»; los diálogos enfocan el primer campo al abrir (accesibilidad) y las filas del directorio se abren con teclado.
- Separación de repositorios: el frontend lleva copia del motor y de los esquemas generada desde el backend, vigilada con huella sha256 y casos fijos (`engine-golden.json`).
- **Fase 3 (cuadros y editor) hecha.** Vistas `SchedulesView` y `ScheduleEditorView`; componentes del editor en `src/components/editor/` (grilla, pincel, menú de casilla, ventana del día, equipo, reglas, equidad, alertas, diálogos de ausencia y persona); `NewScheduleDialog`; stores `schedules` (tarjetas) y `editor`.
- **Editor local primero:** pintar cambia la casilla al instante y las alertas se recalculan en vivo con el motor (`@/engine`, solo `validate` y `targets`; el frontend nunca genera). Lo pintado se guarda en un solo lote 800 ms después (`PUT /cells`); soltar casillas con la goma y todo lo que recalcula (reglas, cobertura, equipo, ausencias, generar) va al servidor al instante. Todas las llamadas del editor se encolan para usar la versión que dejó la anterior; antes de recalcular se guarda lo pendiente. Al salir de la pantalla también se guarda lo pendiente (y se pregunta si no se pudo).
- **Conflicto de versión (409):** aparece un aviso (`.banner`) con quién cambió el cuadro y el botón «Recargar y aplicar mis cambios»: vuelve a leer el cuadro, reaplica las casillas pendientes y las guarda. Es la única pieza nueva respecto al mockup (la pide el plan). Mientras hay conflicto no se acepta pintar más.
- **Mes en «Nuevo cuadro»:** nueve meses desde tres atrás hasta cinco adelante, con el actual por defecto (el mockup lo tenía fijo en octubre de 2026; hoy da la misma lista).
- **Diferencias con el mockup, confirmadas en la fase 3:** sin pestaña «Plan»; el diálogo enfoca su primer campo; el cuadro de octubre generado por continuidad difiere en 2 casillas del día 1 respecto al mockup porque el motor corregido ya no pone a trabajar el día 1 a quien cerró septiembre en noche (la corrección documentada arriba).
- Copiar para Excel usa el portapapeles del navegador (TSV: nombres, un código por día con el libre vacío, y horas).
- **Fase 4 (resumen) hecha.** `DashboardView` con componentes en `src/components/dashboard/` (indicadores, tarjetas de atención, tabla de carga ordenable, horas por mes, horas por servicio, detalle de persona) y store `dashboard`. Todo se calcula en el servidor; el frontend solo pinta y ordena la tabla.
- **Períodos del filtro:** salen de los cuadros que la usuaria ve (`lib/dashboard.ts`): los tres meses más recientes con cuadros y, si hay más de uno, el rango completo («Julio a septiembre»); el más reciente es el predeterminado. El mockup los tenía fijos (julio a septiembre de 2026); hoy dan la misma lista y se actualizan al crear un cuadro nuevo.
- Mientras se vuelve a consultar al volver a la pantalla se ve el resultado anterior (no parpadea en blanco); si la consulta falla, aviso con el mensaje del servidor. Sin ningún cuadro se muestran ceros y «No hay cuadros en este período», como el mockup.
- Diferencias con el mockup en esta fase: solo la pestaña «Plan» (no se migra); fuera de eso, a 1440 y 400 px las capturas del resumen, el orden de columnas, el detalle y los filtros coinciden píxel a píxel.
- **Fase 5 (Excel y ODS) hecha.** El mockup solo tenía «Copiar para Excel»; el plan pide importar y exportar, así que hay tres elementos nuevos con el estilo de los existentes (`.btn`, `.btn.sm`, diálogo `.mod`): **«↑ Importar cuadro»** junto a «Nuevo cuadro» en la lista, y **«↓ Exportar Excel»** y **«↓ Exportar ODS»** junto a «Copiar para Excel» en el editor. No se hizo captura contra el mockup de estos tres porque el mockup no los tiene.
- **Exportar:** `download()` en `lib/api.ts` pide el archivo con la sesión (el token no puede ir en un enlace simple) y lo entrega al navegador con el nombre que propone el servidor («UCI Neurocrítica - Septiembre 2026.xlsx»). Antes de exportar se guarda lo pendiente del editor.
- **Importar (`ImportScheduleDialog`):** paso 1 servicio y archivo (`upload()` manda los bytes tal cual); paso 2 muestra cómo se leyó: tabla del archivo (se propone la del mes más reciente), mes y año detectados (editables), y una lista con cada nombre del archivo y la terapeuta del directorio que le corresponde (editable, «No importar» por defecto si no hay coincidencia), con el detalle de las casillas que no se entendieron. Se bloquea si el mes ya existe, si se elige dos veces a la misma persona o si hay menos de 2. Al crear se abre el editor con el cuadro en borrador.
- El mapeo y los totales viven en `lib/import.ts` (con pruebas); el resto es presentación.
- **Fase 6 (seguridad y pulido) hecha.**
- **Contenedor:** `Dockerfile` (compila con Vite y sirve con `nginx-unprivileged`), `nginx/default.conf` (reenvía `/api` a la API por la red `turnos`, `client_max_body_size 9m`, caché de un año solo para `/assets/` con huella, `index.html` sin caché y rutas de Vue Router resueltas con `try_files`) y `nginx/security-headers.conf` (CSP con `script-src 'self'`; `style-src` con `'unsafe-inline'` porque Vue asigna estilos en línea, y con Google Fonts porque el diseño aprobado las pide; `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`). Nginx no hereda `add_header` entre niveles: el archivo se incluye en cada `location` que define las suyas. HSTS lo pone quien termina el HTTPS. Probado de punta a punta (Nginx + API de producción + MongoDB de Docker): las cuatro suites de navegador pasan, sin violaciones de CSP, tipografías cargadas y la cookie de renovación `httpOnly; Secure; SameSite=Strict`.
- **Extremo a extremo y accesibilidad** (`e2e/`, Playwright + `@axe-core/playwright`): entrar y salir, recargar sin perder la sesión, cuenta nueva → aprobación → ingreso, permisos por rol, armar un mes de principio a fin (crear, pintar, guardar, publicar, ver el resumen), exportar a Excel y ODS, y protección de cuadros ajenos; más una auditoría axe (WCAG 2.0/2.1 A y AA) de login, crear cuenta, resumen y su detalle, cuadros, importar, nuevo cuadro, equipo y su formulario, administración y sus diálogos, editor con menú de casilla, reglas, ausencia y detalle de persona, y el resumen y el editor a 400 px. Falla ante cualquier infracción seria o crítica **excepto el contraste de color** (ver abajo). `playwright.config.ts` levanta sus propios servidores en puertos y base de datos aparte (`turnos_e2e`), nunca reutiliza los de desarrollo y su `global-setup` se niega a sembrar una base que no se llame `turnos_e2e`. CI: `.github/workflows/e2e.yml` (manual y cada noche, con Chromium; necesita el repo del backend).
- **Accesibilidad arreglada:** las pestañas eran enlaces con `aria-selected` (inválido en un enlace; lo encontró axe, crítico): ahora `aria-current="page"` con el mismo estilo; el interruptor «Activa» del formulario de terapeuta y los de las reglas del editor no tenían nombre: ahora `aria-label`.
- **CONTRASTE DE COLOR, PENDIENTE DE DECISIÓN DE DISEÑO.** Todo el incumplimiento de WCAG AA que queda sale de los tokens aprobados: el acento `--accent #0A8791` da 3,72:1 sobre `--accent-soft` (texto de píldoras y avatares), 4,29:1 el texto blanco de los botones primarios y el texto de enlace sobre blanco, y 4,0–4,1:1 sobre los fondos claros; además `--err #D6405C` sobre blanco da 4,42:1 (un elemento). AA pide 4,5:1 en texto pequeño. Las reglas de diseño prohíben cambiar los tokens sin aprobación, así que **no se tocaron**. Propuesta mínima, casi imperceptible: `--accent: #087680` (da 4,6:1 sobre `--accent-soft` y 5,4:1 con texto blanco; `--accent-soft` y los demás no cambian) y `--err: #CF3A56`. Si se aprueba, basta cambiar esos dos valores en `tokens.css`, quitar la excepción de contraste de `e2e/a11y.spec.ts` y volver a correr `npm run e2e`.
- **Calidad y dependencias:** ESLint (`eslint.config.js`; ignora la copia generada `src/engine` y `src/shared`); 0 vulnerabilidades en producción y en desarrollo; Vite 7, `@vitejs/plugin-vue` 6 y vitest 5. CI: lint, auditoría de producción, tipos, pruebas, build y construcción de la imagen. Vitest excluye `e2e/` (lo corre Playwright).
- Peso de la web: ~110 KB de JavaScript principal (43 KB comprimido) más una carga por pantalla; sin librerías de componentes ni de gráficos.
