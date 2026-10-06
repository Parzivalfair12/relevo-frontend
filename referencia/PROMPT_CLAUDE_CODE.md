# Prompt para Claude Code · Turnos Respiratoria (MEVN)

Versión larga. Si el esqueleto ya está creado, usa `PROMPT_INICIO.md`. Esta versión sirve de lista completa de pantallas y comportamientos.

## Archivos a anexar (ponlos en una carpeta `referencia/` del proyecto)

| Archivo | Para qué sirve |
| --- | --- |
| `mockup-referencia.html` | El mockup aprobado, completo y funcionando. Es la fuente de verdad del diseño y del comportamiento. Ábrelo en el navegador para verlo. |
| `engine-referencia.js` | El motor de turnos ya probado. Se porta a TypeScript sin cambiar su lógica. |
| `plan-mevn.md` | El plan de implementación (exporta el documento a Markdown desde el menú del documento). |
| `SEPTIEMBRE_2026_2_1.ods` | El cuadro original del hospital. Sirve de ejemplo para importar y exportar a Excel/ODS. |

---

## PROMPT

Vas a construir una aplicación web MEVN (MongoDB, Express, Vue 3, Node) de gestión de turnos para terapeutas respiratorias de un hospital en Colombia. Todo el texto de la interfaz va en español.

### 1. Antes de escribir código

1. Lee `referencia/plan-mevn.md` completo: define arquitectura, modelo de datos, API, fases y criterios de aceptación.
2. Abre `referencia/mockup-referencia.html` en un navegador con Playwright, recorre cada pantalla y toma capturas. Ese mockup es la referencia visual y de comportamiento.
3. Lee `referencia/engine-referencia.js`. Es el motor de turnos que ya funciona.
4. Resúmeme en una página qué vas a construir, en qué orden y qué dudas tienes. Espera mi confirmación antes de empezar la fase 1.

### 2. Regla principal: la interfaz debe quedar idéntica al mockup

- Copia del `<style>` del mockup las variables CSS (colores, tipografías, radios, sombras) a `apps/web/src/styles/tokens.css` y úsalas tal cual. No cambies colores, espaciados, tamaños ni tipografías (Bricolage Grotesque para títulos y Figtree para texto, desde Google Fonts).
- Solo tema claro. No agregues modo oscuro.
- Conserva la estructura de pantallas, textos, etiquetas, orden de elementos, estados vacíos, mensajes y avisos del mockup.
- Convierte cada bloque del mockup en un componente Vue 3 con `<script setup lang="ts">`, sin librería de componentes ni de estilos. Usa CSS propio con las variables.
- Después de construir cada pantalla, compárala con el mockup con capturas de Playwright al mismo ancho (1440 px y 400 px) y corrige hasta que coincidan. Si algo del mockup no se puede reproducir, dímelo en vez de cambiarlo.

### 3. Pantallas y comportamiento a reproducir

- **Inicio de sesión:** panel izquierdo con degradado y mensaje, formulario a la derecha con mostrar contraseña, alternar entre "Inicia sesión" y "Crea tu cuenta". Las cuentas nuevas quedan pendientes hasta que un administrador las aprueba. Los botones de usuarios de prueba solo existen en desarrollo.
- **Resumen:** filtros por servicio y período (mes o trimestre), 5 indicadores, tarjetas de atención, tabla de carga por terapeuta ordenable con patrón de colores, barras de horas por mes y por servicio, detalle de persona en ventana emergente.
- **Cuadros:** tarjetas por servicio y mes con estado Borrador o Publicado, filtros, tarjeta "Nuevo cuadro" que copia el equipo del mes anterior y continúa su secuencia.
- **Editor de cuadro:** paso a paso de 4 pasos, indicadores, grilla con columna de nombres fija y fines de semana sombreados, pincel (elegir, M, T, N, L, V, I, P, goma) con arrastre, menú de casilla, ventana del día, ausencias por rango, panel de equipo con planta y apoyo, modo de uso del apoyo, reglas, equidad de horas, alertas que llevan a la casilla, publicar, copiar para Excel.
- **Equipo:** directorio con búsqueda y filtros, formulario de terapeuta (nombre, documento, cargo, tipo por defecto, servicios, activa). Solo el administrador edita.
- **Administración:** servicios (nombre y color), usuarios (rol y servicios), solicitudes pendientes. Solo administrador.
- **Roles:** administrador ve todo; coordinadora ve y edita solo los cuadros de sus servicios y consulta el directorio.

### 4. Motor de turnos

- Crea `packages/engine` en TypeScript puro (sin dependencias) portando `engine-referencia.js` sin cambiar la lógica: `generate`, `validate`, `targets`, `stats`.
- Pruebas con Vitest: 4 de planta sin ausencias deben dar 180 h cada una en un mes de 30 días con cobertura 1/1/1; nunca se trabaja el día siguiente a una noche; con 7 personas (4 de planta y 3 de apoyo) y ausencias, no queda ningún día sin cubrir; el apoyo solo aparece cuando falta alguien.
- El servidor ejecuta la generación en un `worker_thread`.

### 5. Stack y estructura

- Monorepo con npm workspaces: `apps/api` (Express, TypeScript, Mongoose, Zod), `apps/web` (Vue 3, Vite, Pinia, Vue Router, TypeScript), `packages/engine`, `packages/shared` (esquemas Zod y tipos).
- Sesión con token de acceso de 15 minutos y token de renovación en cookie httpOnly, contraseñas con argon2id, `helmet`, límite de intentos en el login, validación de entradas y saneamiento contra inyección en MongoDB.
- Colecciones: users, services, therapists, schedules (con `members[]` embebidos), auditLogs. Control de versiones de Mongoose en cuadros (409 en conflicto).
- Un script `npm run seed` que cargue exactamente los datos de ejemplo del mockup: los 3 usuarios (administrador, coordinadora, coordinador de urgencias), los 3 servicios, los 18 terapeutas y los cuadros de julio, agosto y septiembre de 2026.
- `docker-compose.yml` con MongoDB (conjunto de réplicas de un nodo), API y web.

### 6. Forma de trabajar

- Trabaja por fases en el orden del plan y detente al terminar cada una para que yo la revise: 0 arranque, 1 motor, 2 cuentas y directorio, 3 cuadros y editor, 4 resumen, 5 Excel y ODS, 6 endurecimiento.
- Al terminar cada fase: corre lint, tipos y pruebas, levanta la app, compara con el mockup y dime qué difiere.
- Crea un `CLAUDE.md` en la raíz con estas reglas, los comandos para correr todo y las decisiones tomadas.
- No agregues funciones que no estén en el mockup ni en el plan. Si ves algo que mejorar, anótalo en `MEJORAS.md` y pregúntame.
- Haz commits pequeños con mensajes claros.
