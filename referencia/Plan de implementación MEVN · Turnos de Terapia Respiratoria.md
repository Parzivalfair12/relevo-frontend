# Plan de implementación MEVN · Turnos de Terapia Respiratoria

Oct 4, 2026 · @Someone

## Resumen y alcance

La aplicación se construye en 15 semanas sobre MEVN (MongoDB, Express, Vue 3 y Node) y reproduce el mockup aprobado: inicio de sesión con roles, un cuadro por servicio y mes, directorio de terapeutas, administración y un resumen de carga por persona. El motor de turnos se escribe una sola vez y lo usan el navegador (alertas en vivo) y el servidor (generación y validación final).

| Módulo | Qué incluye | Versión |
| --- | --- | --- |
| Acceso | Correo y contraseña, cuentas pendientes de aprobación, roles administrador y coordinadora | 1.0 |
| Directorio | Terapeutas con documento, cargo, planta o apoyo, servicios y estado | 1.0 |
| Servicios y usuarios | Crear servicios, asignar qué coordinadora gestiona cuáles | 1.0 |
| Cuadros | Un cuadro por servicio y mes, generación automática, pincel, ausencias por rango, Borrador y Publicado, continuidad con el mes anterior | 1.0 |
| Validaciones | Cobertura, descanso tras noche, secuencia, días seguidos, cruces entre servicios | 1.0 |
| Resumen | Horas, turnos M/T/N, noches, fines de semana, cada cuánto trabaja y descanso medio, con filtros | 1.0 |
| Excel y ODS | Importar el cuadro actual y exportar con el formato del hospital | 1.0 |
| Rol de consulta | Terapeutas ven su propio turno desde el celular | 1.1 |
| Festivos de Colombia | Calendario y reparto equitativo de esos días | 1.1 |
| Cambio de turnos | Solicitud entre terapeutas con aprobación de la coordinadora | 1.1 |
| Notificaciones | Correo cuando se publica un cuadro | 1.1 |

Quedan fuera de la primera versión el optimizador matemático (OR-Tools), el inicio de sesión corporativo (SSO) y la aplicación móvil nativa. El motor actual se cambia por otro sin tocar la API porque ambos cumplen la misma interfaz.

## Arquitectura MEVN

La web y la API se hablan solo por HTTPS y JSON, y el motor de turnos y los esquemas de validación se escriben una vez y los usan las dos. Decisiones que dan forma a esa arquitectura:

&#91;embedded content: arquitectura MEVN · 3 capas y paquetes compartidos\]

Las flechas hacia MongoDB y hacia el correo salen siempre de la API; el navegador nunca las toca.

- **API sin estado:** la sesión viaja en tokens, así se puede correr más de una copia detrás de un balanceador cuando haga falta.
- **Validación en el borde:** Zod revisa cada entrada; Mongoose define los modelos y sus índices.
- **Excel y ODS:** la API lee y escribe los archivos con SheetJS, así el navegador solo descarga o sube.
- **Generación de cuadros:** corre en un `worker_thread` para que una coordinadora generando no frene a las demás.
- **Un solo repositorio:** el motor y los esquemas son paquetes que importan la web y la API.

## Modelo de datos en MongoDB

Cinco colecciones cubren el mockup. Los turnos de un cuadro viven dentro del propio documento del cuadro, porque se leen y se guardan siempre juntos y son pequeños: unas 10 personas por 31 días son 310 códigos de una o dos letras.

| Colección | Campos principales | Índices |
| --- | --- | --- |
| users | name, email, passwordHash, role (admin o coord), status (activo o pendiente), serviceIds\[\] | email único |
| services | name, color, defaultCoverage {M,T,N}, defaultRules | name único |
| therapists | name, document, position, defaultKind (fija o apoyo), serviceIds\[\], active | document único y disperso, serviceIds, texto en name |
| schedules | serviceId, year, month (0 a 11), status (borrador o publicado), ownerId, coverage, rules, seed, members\[\], stats, version | único en {serviceId, year, month}, {status, year, month} |
| auditLogs | userId, action, entity, entityId, summary, createdAt | {entity, entityId, createdAt}, TTL opcional |

Cada elemento de `members` guarda `therapistId`, `kind` (planta o apoyo en ese cuadro), `days[]` con un código por día (M, T, N, MT, L, V, I, P) y `locked[]` con los índices de día fijados a mano. Así una terapeuta puede ser planta en un servicio y apoyo en otro, como en el mockup.

- `stats` se recalcula al guardar: horas por persona, días sin cubrir y alertas críticas. Las tarjetas de la lista de cuadros se leen sin recorrer los turnos.
- `version` es el campo de control de versiones de Mongoose. Si dos coordinadoras editan el mismo cuadro, la segunda recibe un 409 y recarga.
- Las ausencias no tienen colección propia: son días con código V, I o P dentro de `days[]`, igual que en el mockup, y el rango se reconstruye al mostrarlo.
- Las consultas del resumen leen los cuadros del período y los agregan en Node con las funciones del motor. Con unos 20 cuadros por mes no hace falta un pipeline de agregación; se agrega si el volumen crece.
- `therapists` nunca se borra si aparece en un cuadro: se desactiva. El borrado devuelve 409.

## API REST con Express

La API tiene seis grupos de rutas bajo `/api/v1`, todas protegidas salvo el inicio de sesión y la solicitud de cuenta. Cada ruta valida su entrada con Zod, pasa por el control de rol y, para coordinadoras, por un filtro que limita los datos a sus servicios.

| Grupo | Rutas | Quién |
| --- | --- | --- |
| Acceso | POST /auth/register, /auth/login, /auth/refresh, /auth/logout; GET /auth/me | Público y sesión |
| Usuarios | GET y POST /users; PATCH y DELETE /users/:id; POST /users/:id/approve | Administrador |
| Servicios | GET /services; POST, PATCH y DELETE /services/:id | Lectura todos, escritura administrador |
| Terapeutas | GET /therapists?service=&kind=&active=&q=; POST; PATCH y DELETE /therapists/:id | Lectura todos, escritura administrador |
| Cuadros | GET y POST /schedules; GET y PATCH /schedules/:id; PUT /schedules/:id/cells; POST /schedules/:id/generate; POST y DELETE /schedules/:id/absences; GET /schedules/:id/validation; GET /schedules/:id/export?format=xlsx o ods; POST /schedules/import | Administrador y coordinadora de ese servicio |
| Resumen | GET /dashboard?service=&from=&to=; GET /dashboard/therapists/:id | Según servicios visibles |

Reglas de comportamiento de la API:

1. **Crear un cuadro** (`POST /schedules`) recibe servicio y mes, toma el equipo del mes anterior o del directorio del servicio, genera los turnos con continuidad y responde 409 si ya existe ese servicio y mes.
2. **Editar casillas** (`PUT /schedules/:id/cells`) recibe un lote de cambios con la `version` que el cliente conoce. Marca las casillas como fijadas, recalcula `stats` y devuelve las alertas.
3. **Generar** respeta las casillas fijadas y acepta `seed` para producir otra variante.
4. **Validar** incluye los cruces con otros cuadros del mismo mes, que solo el servidor puede calcular.
5. **Errores** usan un solo formato `{ code, message, details }` y códigos HTTP estándar: 400 validación, 401 sin sesión, 403 sin permiso, 404, 409 conflicto de versión o duplicado.
6. **Paginación** solo en terapeutas y registros de auditoría; el resto devuelve listas completas porque son cortas.
7. La API se documenta con OpenAPI generado desde los esquemas Zod, para que el frontend use tipos compartidos.

## Motor de turnos en Node

El motor es un paquete de TypeScript sin dependencias ni acceso a base de datos, compartido por la API y por Vue. Se porta del mockup, donde ya genera cuadros sin choques de descanso y con una diferencia de horas de 6 h o menos entre las personas de planta cuando el equipo está completo.

Su interfaz son cuatro funciones puras:

- `generate(config)` devuelve los códigos de cada persona por día. Recibe año, mes, equipo con tipo planta o apoyo, cobertura, reglas, casillas fijadas, `seed` y el final del mes anterior.
- `validate(config, grid)` devuelve la lista de alertas con persona, día y gravedad.
- `targets(config, grid)` devuelve la meta de horas de cada persona de planta, ajustada por ausencias y por lo que cubre el apoyo.
- `stats(config, grid)` devuelve horas, turnos por tipo, noches, fines de semana, cada cuánto trabaja y descanso medio.

Algoritmo, en el orden en que se aplica cada día:

1. Se fijan las casillas bloqueadas y las ausencias.
2. Para cada turno, en orden noche, tarde y mañana, se descarta a quien salió de noche, a quien llegó al máximo de días seguidos y a quien haría tarde y mañana pegadas.
3. Entre quienes quedan se elige a la de menor puntaje: pocas horas acumuladas y seguir la secuencia M, T, N, L bajan el puntaje; fines de semana y noches repetidas lo suben.
4. El apoyo se considera solo si no queda nadie de planta, o desde el primer día si se elige reparto por igual.
5. Al terminar el mes, un ajuste intercambia turnos entre dos personas el mismo día cuando baja la diferencia de horas sin romper reglas. Usa el mismo `seed`, así que el resultado se repite.

Mejoras previstas sobre el mockup:

- **Cruces entre servicios:** hoy solo se avisan. En la versión 1.0 el servidor pasa al motor los días ya ocupados por otros cuadros del mes para que no las asigne.
- **CPU:** la generación corre en un `worker_thread` para no bloquear Express mientras otra coordinadora usa la API.
- **Reglas configurables:** máximo de días seguidos, cobertura y modo de apoyo vienen del servicio y se pueden cambiar por cuadro.
- **Optimizador:** si aparecen reglas que el algoritmo no resuelve, se cambia por OR-Tools CP-SAT en un servicio aparte que implementa la misma interfaz.

Pruebas del motor: casos con resultado esperado (4 de planta sin ausencias deben dar 180 h cada una), pruebas de propiedades con `fast-check` (nunca trabaja el día siguiente a una noche, cobertura completa si el equipo supera el mínimo) y una prueba de regresión con los meses reales de mayo de 2025, abril de 2026 y septiembre de 2026 contra lo hecho a mano.

## Frontend Vue 3

El frontend usa Vue 3 con `<script setup>` y TypeScript, Vite, Vue Router y Pinia. No lleva librería de componentes: el mockup ya define el sistema visual (paleta clara, pasteles por turno, tipografía y espaciados) y pasa a variables CSS globales.

| Pantalla del mockup | Ruta | Componentes principales |
| --- | --- | --- |
| Inicio de sesión y solicitud de cuenta | /login | LoginForm, DemoUsers solo en desarrollo |
| Resumen | / | KpiCards, InsightsList, WorkloadTable, MonthlyHoursChart, ServiceHoursBars |
| Cuadros | /schedules | ScheduleCard, NewScheduleDialog, filtros |
| Editor de cuadro | /schedules/:id | ScheduleGrid, BrushToolbar, CellMenu, DayPopover, TeamPanel, AbsenceDialog, PersonDialog, CoverageControls, RulesPanel, EquityPanel, AlertsPanel, StepsGuide |
| Equipo | /team | TherapistTable, TherapistFormDialog |
| Administración | /admin | ServicesList, UsersList, UserFormDialog, PendingRequests |
| Plan de implementación | no se migra | Queda como documento aparte |

Decisiones de diseño del frontend:

- **Estado:** un store de Pinia por dominio: `auth`, `directory` (terapeutas y servicios), `schedules`, `editor` (cuadro abierto, pincel, menú y alertas) y `dashboard`. Las llamadas van por un cliente `fetch` con renovación de sesión automática.
- **Rutas protegidas:** un guard de Vue Router revisa sesión y rol. La coordinadora que abre una ruta de administración vuelve al resumen.
- **Editor en vivo:** al pintar o cambiar una casilla, el store aplica el cambio local, vuelve a validar con el paquete del motor y muestra alertas al instante. Un guardado con espera de unos 800 ms envía el lote a `PUT /cells`.
- **Pincel:** eventos de puntero sobre la grilla, con `touch-action: none` solo mientras hay un pincel activo, para que funcione con dedo y con mouse.
- **Conflictos:** si el servidor responde 409, el editor muestra quién cambió el cuadro y ofrece recargar sin perder las casillas pendientes.
- **Accesibilidad:** foco visible, etiquetas en cada casilla, contraste revisado con la paleta clara y la grilla navegable con teclado.
- **Responsive:** la grilla tiene desplazamiento horizontal con la columna de nombres fija, como en el mockup; el resto se apila bajo 900 px.
- **Gráficos:** barras y tiras de colores con CSS y SVG propios. No se agrega una librería de gráficos hasta que haga falta un tipo que el mockup no tiene.

## Seguridad, roles y datos personales

La aplicación guarda nombres, documentos de identidad y horarios de personal, no datos de pacientes. Aun así son datos personales y se tratan con acceso mínimo desde el primer sprint.

| Tema | Decisión |
| --- | --- |
| Contraseñas | Hash con argon2id; mínimo de 8 caracteres; nunca se devuelven en la API |
| Sesión | Token de acceso corto (15 minutos) en memoria y token de renovación en cookie `httpOnly`, `Secure` y `SameSite=Strict`, con rotación en cada uso |
| Roles | Administrador, coordinadora y, en la 1.1, consulta; revisados en un middleware por ruta, nunca solo en el frontend |
| Alcance por servicio | Cada consulta de coordinadora se filtra por sus `serviceIds`; un intento fuera de su alcance responde 403 |
| Entradas | Zod en cada ruta y saneamiento contra inyección de operadores de Mongo (`$`, `.`) |
| Fuerza bruta | Límite de intentos por IP y por correo en el inicio de sesión con `express-rate-limit` |
| Cabeceras y CORS | `helmet`, lista de orígenes permitidos, HTTPS obligatorio |
| Auditoría | Registro de quién creó, editó, publicó o eliminó cuadros, terapeutas y usuarios |
| Secretos | Variables de entorno fuera del repositorio, rotación al cambiar de responsable |
| Recuperar contraseña | Enlace por correo con vencimiento; requiere definir el proveedor de correo |

Cumplimiento: en Colombia aplica la Ley 1581 de 2012 de protección de datos personales. Antes del piloto, el hospital debe confirmar con su área jurídica la política de tratamiento, la autorización de las terapeutas y cuánto tiempo se conservan los cuadros históricos. Este plan no sustituye esa revisión.

## Estructura del repositorio

Un solo repositorio con espacios de trabajo de npm separa la API, la web y el motor compartido. El motor y los esquemas de Zod viven en `packages`, así un cambio de regla se prueba una vez y llega a los dos lados.

```text
turnos-respiratoria/
  apps/
    api/                 Express + Mongoose
      src/
        config/          variables de entorno validadas
        modules/         auth, users, services, therapists, schedules, dashboard
          schedules/     routes, controller, service, model, schema
        middleware/      auth, roles, alcance por servicio, errores
        workers/         generación de cuadros en worker_thread
      test/              integración con Supertest y MongoDB en memoria
    web/                 Vue 3 + Vite
      src/
        views/           Login, Dashboard, Schedules, Editor, Team, Admin
        components/      grilla, pincel, diálogos, tarjetas, tablas
        stores/          auth, directory, schedules, editor, dashboard
        styles/          variables CSS del mockup
      e2e/               Playwright
  packages/
    engine/              generate, validate, targets, stats (TypeScript puro)
    shared/              esquemas Zod y tipos de la API
  docker-compose.yml     api, web y MongoDB
  .github/workflows/     lint, tipos, pruebas, build
```

Convenciones: TypeScript estricto en todo el repositorio, ESLint y Prettier, commits convencionales, una rama por tarea con revisión antes de unir a `main`, y migraciones de datos como scripts numerados con `migrate-mongo`.

## Fases y cronograma

El trabajo se reparte en nueve fases de 15 semanas. El piloto de cuatro semanas corre en paralelo con el cuadro manual y es la única fase que depende de las coordinadoras, así que las fases 0 a 6 se organizan para llegar a él con el editor completo y el Excel funcionando.

| Fase | Semanas | Entregables | Se cierra cuando |
| --- | --- | --- | --- |
| 0 Arranque y reglas | 1 | Taller de reglas, repositorio con CI, Docker Compose con MongoDB, variables CSS del mockup | Coordinación y talento humano firman las reglas |
| 1 Motor de turnos | 2 a 3 | Paquete `engine` en TypeScript, pruebas de propiedades, regresión con tres meses reales | Los tres meses reales cumplen los criterios de aceptación |
| 2 Cuentas y directorio | 3 a 5 | Sesión con tokens, aprobación de cuentas, usuarios, servicios y terapeutas en API y pantallas | Un administrador registra el equipo y una coordinadora solo ve sus servicios |
| 3 Cuadros y editor | 5 a 8 | Crear con continuidad, grilla, pincel, ausencias, alertas, guardado con control de versiones, publicar, cruces entre servicios | Un mes completo se arma, edita y publica de principio a fin |
| 4 Resumen | 8 a 9 | Tablero con filtros, detalle por persona e indicadores de atención | Las cifras coinciden con las de los cuadros |
| 5 Excel y ODS | 9 a 10 | Importar el cuadro actual y exportar con el formato del hospital | Un cuadro exportado se abre sin cambios en el programa del hospital |
| 6 Endurecimiento | 10 a 11 | Seguridad, rendimiento, accesibilidad, pruebas de extremo a extremo, copias con prueba de restauración | Pruebas en verde y restauración comprobada |
| 7 Piloto en paralelo | 11 a 14 | Un mes real con la herramienta y a mano, ajustes semanales | Se cumplen los criterios de aceptación |
| 8 Despliegue | 14 a 15 | Producción, capacitación de 30 minutos y guía de una página | Las coordinadoras arman el mes siguiente sin ayuda |

&#91;embedded content: cronograma · 9 fases en 15 semanas\]

Las fases se solapan donde no dependen una de otra; el piloto, resaltado, necesita al equipo real y por eso marca el ritmo del plan.

Las versiones 1.1 (rol de consulta, festivos, cambio de turnos y notificaciones) empiezan después de la semana 15 y se planifican con lo aprendido en el piloto.

## Estrategia de pruebas y calidad

El riesgo mayor es que el cuadro generado sea injusto o inseguro sin que nadie lo note, así que las pruebas del motor pesan más que las de pantalla.

| Nivel | Herramienta | Qué cubre |
| --- | --- | --- |
| Unitarias | Vitest | Motor, validaciones, cálculo de metas y estadísticas, utilidades de fechas |
| Propiedades | fast-check | Descanso tras noche, cobertura completa, días seguidos, horas de apoyo solo cuando falta alguien |
| Regresión con datos reales | Vitest | Mayo de 2025, abril y septiembre de 2026 comparados con el cuadro manual |
| API | Vitest, Supertest y MongoDB en memoria | Permisos por rol y servicio, duplicados, conflicto de versión, cruces entre cuadros |
| Componentes | Vue Test Utils | Grilla, pincel, diálogos de ausencia y de persona |
| Extremo a extremo | Playwright | Entrar, crear cuadro, pintar, publicar, ver el resumen, aprobar una cuenta |
| Accesibilidad | axe en Playwright | Contraste, foco, etiquetas |

Criterios de aceptación para pasar de piloto a despliegue:

- Diferencia máxima de 6 h entre personas de planta cuando no hay ausencias.
- Cero turnos de trabajo después de una noche y cero días sin cubrir si el equipo supera el mínimo.
- Una coordinadora arma un mes completo en menos de 15 minutos, con ajustes manuales incluidos.
- Dos meses seguidos del piloto sin diferencias que las coordinadoras consideren inaceptables frente al cuadro manual.

La integración continua corre lint, tipos y todas las pruebas en cada solicitud de unión; nada pasa a `main` en rojo.

## Despliegue, operación y respaldos

Todo se empaqueta en contenedores Docker y hay tres entornos: desarrollo en cada computador con `docker compose`, pruebas con datos de ejemplo y producción. La imagen de la web se sirve con Nginx y la API corre detrás del mismo dominio para evitar problemas de CORS.

| Decisión | Opción recomendada | Alternativa |
| --- | --- | --- |
| Base de datos | MongoDB Atlas con copias automáticas (verificar qué plan las incluye) | MongoDB en servidor del hospital con `mongodump` diario |
| Hosting de API y web | Contenedores en un proveedor administrado | Servidor propio del hospital con Docker |
| Correo | Proveedor SMTP transaccional para recuperar contraseña y avisos | Sin correo en la 1.0 y restablecimiento por el administrador |
| Integración continua | GitHub Actions: lint, tipos, pruebas, build y publicación de imágenes | La del proveedor de código que ya use el hospital |

**Alojamiento gratis para el piloto.** Sirve para las primeras semanas con pocos datos, pero no para producción: la API se duerme y la base de datos gratis no hace copias automáticas. Datos de septiembre de 2026; los planes cambian, así que se confirman en cada proveedor antes de decidir.

| Pieza | Opción gratis | Límites | Para producción |
| --- | --- | --- | --- |
| Base de datos | MongoDB Atlas M0 | 0,5 GB, 100 operaciones por segundo, 500 conexiones, sin copias automáticas, se pausa tras 30 días sin conexiones, un clúster gratis por proyecto | No, por falta de copias |
| API Express | Render gratis | 512 MB de RAM y 750 horas al mes; se duerme tras 15 minutos sin visitas y tarda cerca de 1 minuto en despertar; no pide tarjeta | No, por la espera de la primera visita |
| Web Vue | Cloudflare Pages | Solicitudes de archivos estáticos sin límite; no pide tarjeta | Sí |
| Descartadas | Vercel Hobby, Netlify, Railway, Fly.io | Vercel solo para uso personal; Netlify con créditos y tarjeta; Railway con 1 dólar de crédito al mes; Fly.io con prueba de 7 días | No |

Con unos 20 cuadros al mes de unos 10 KB cada uno (estimación del plan, no dato del proveedor), 0,5 GB alcanza para años. El límite real es la falta de copias, así que durante el piloto se hace un respaldo semanal con `mongodump`. Los precios de los planes pagados no se verificaron y quedan por revisar antes de producción. Fuentes: documentación de MongoDB Atlas y una comparación de planes gratis revisada en septiembre de 2026.

Operación:

- **Salud:** ruta `/health` para monitoreo y aviso si cae.
- **Registros:** logs en JSON con `pino`, sin contraseñas ni documentos.
- **Copias:** diaria, con prueba de restauración antes del piloto y cada trimestre.
- **MongoDB:** las transacciones exigen un conjunto de réplicas; Atlas lo trae, y en servidor propio se configura aunque sea de un nodo.
- **Datos iniciales:** un script crea el administrador, los servicios y el directorio a partir del cuadro actual, con revisión antes de cargarlo.
- **Reversa:** cada despliegue conserva la imagen anterior para volver atrás en minutos.

## Riesgos y decisiones pendientes

Hay siete decisiones pendientes; las de alojamiento y de cruces entre servicios condicionan el diseño y deben cerrarse antes de la fase 2.

| Riesgo | Efecto | Qué se hace |
| --- | --- | --- |
| Reglas laborales incompletas | El cuadro cumple las reglas del motor pero no las del hospital | Taller en la semana 1 con coordinación y talento humano; límites configurables por servicio |
| Dos coordinadoras editan el mismo cuadro | Se pierden cambios | Control de versiones con 409 y recarga guiada |
| Terapeuta en dos servicios el mismo día | Doble asignación | El motor recibe los días ocupados; la validación final queda en el servidor |
| Generación lenta con muchos cuadros | La API se siente lenta | `worker_thread` y medición en el sprint del motor |
| Rechazo por perder control | La herramienta no se usa | Coordinadora siempre edita y publica; piloto en paralelo de 4 semanas |
| Datos personales | Incumplimiento y pérdida de confianza | Acceso mínimo, auditoría, política aprobada antes del piloto |

Decisiones que necesito del hospital:

- [ ] Dónde se aloja: MongoDB Atlas y nube administrada, o servidor del propio hospital.
- [ ] Si una terapeuta puede trabajar en dos servicios el mismo mes.
- [ ] Si el apoyo tiene un mínimo de horas garantizado al mes.
- [ ] Si se permiten los turnos dobles MT y MN, o solo en emergencias.
- [ ] Quién aprueba y publica el cuadro final, y con cuánta anticipación.
- [ ] Si las terapeutas verán su turno desde el celular (rol de consulta en la 1.1).
- [ ] Qué proveedor de correo se usa para recuperar contraseñas.
