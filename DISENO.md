# Guía visual

Todo sale del mockup (`referencia/mockup-referencia.html`). Solo tema claro: fondo azul hielo, tarjetas blancas, turnos en pasteles, acento verde azulado.

## Tokens (`apps/web/src/styles/tokens.css`)
| Variable | Valor |
| --- | --- |
| `--bg` | `#F3F8FC` |
| `--surface` | `#FFFFFF` |
| `--surface2` | `#F7FAFD` |
| `--ink` | `#1B2B3A` |
| `--muted` | `#5E7284` |
| `--line` | `#E0E9F1` |
| `--accent` | `#0A8791` |
| `--accent-soft` | `#DCF3F5` |
| `--accent-ink` | `#FFFFFF` |
| `--sky` | `#E4F1FB` |
| `--sky-fg` | `#1D5E8E` |
| `--m` | `#F7C948` |
| `--m-bg` | `#FFEDB0` |
| `--m-fg` | `#6F5000` |
| `--t` | `#F59A74` |
| `--t-bg` | `#FFD8C6` |
| `--t-fg` | `#8B3512` |
| `--n` | `#7C8CE0` |
| `--n-bg` | `#D9DFFC` |
| `--n-fg` | `#313C8C` |
| `--l-bg` | `#F0F5F9` |
| `--l-fg` | `#A5B5C2` |
| `--v-bg` | `#CFF0DB` |
| `--v-fg` | `#1D6A44` |
| `--i-bg` | `#FFD6DE` |
| `--i-fg` | `#9A2A46` |
| `--p-bg` | `#E8DCF9` |
| `--p-fg` | `#59399A` |
| `--ok` | `#1F9D63` |
| `--warn` | `#C98A0B` |
| `--err` | `#D6405C` |
| `--we` | `#EEF4F9` |
| `--shadow` | `0 1px 2px rgba(27,43,58,.05),0 8px 24px rgba(27,43,58,.06)` |
| `--display` | `'Bricolage Grotesque',system-ui,sans-serif` |
| `--body` | `'Figtree',system-ui,sans-serif` |

## Tipografía
Bricolage Grotesque 500/700 para títulos y números grandes (`--display`); Figtree 400/500/600 para texto (`--body`). Base 14 px, interlineado 1.5.

## Código de color de turnos
M mañana amarillo (`--m`), T tarde durazno (`--t`), N noche violeta azulado (`--n`), L libre gris claro, V verde menta, I rosa, P lila. Chips `.chip.c-M`, celdas `.s-M`, etc.

## Patrones reutilizables (clases en `global.css`)
`.wrap` contenedor 1440 px · `.top` barra superior fija · `.tabs/.tab` navegación · `.pagehead` encabezado de página · `.btn` (`.primary`, `.sm`) · `.panel` tarjeta · `.stats/.stat` indicadores · `.tbl` tablas · `.chip` · `.filters` · `.cards` · `.login/.lcard` pantalla de acceso · `.banner` aviso · `.note` texto de ayuda.

## Reglas
1. No agregar colores ni tamaños nuevos: usar variables.
2. Foco visible siempre (`:focus-visible` ya definido).
3. Responsive: la grilla del editor hace scroll horizontal con la columna de nombres fija; el resto se apila bajo 900 px.
4. Comparar cada pantalla con `referencia/capturas/` a 1440 px y 400 px.
