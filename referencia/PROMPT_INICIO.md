# Prompt para empezar con Claude Code

Abre esta carpeta (`turnos-respiratoria/`) en Claude Code y pega esto:

---

Lee `CLAUDE.md`, `README.md`, `DISENO.md` y `referencia/plan-mevn.md`. Abre `referencia/mockup-referencia.html` con Playwright, recorre cada pantalla (entra con admin@turnos.demo / admin123) y compáralas con `referencia/capturas/`.

El proyecto ya tiene el esqueleto: monorepo, estilos del mockup en `apps/web/src/styles`, motor en `packages/engine` con pruebas, modelos y seed en `apps/api`, y vistas stub en `apps/web`. No lo reestructures.

1. Corre `npm install`, `npm run db:up`, `npm run seed`, `npm run typecheck` y `npm test`. Dime si algo falla.
2. Resúmeme en una página qué vas a construir y en qué orden, y qué dudas tienes. Espera mi confirmación.
3. Empieza por la **fase 2 (cuentas y directorio)**: rutas de `/auth`, `/users`, `/services`, `/therapists` en la API y las vistas Login, Equipo y Administración idénticas al mockup. Detente al terminar y muéstrame las diferencias contra el mockup.

La interfaz debe quedar idéntica al mockup (mismos textos, orden, colores y estados vacíos). No agregues funciones que no estén en el mockup o en el plan; anótalas en `MEJORAS.md`.

---

Después, una fase por mensaje: "Sigue con la fase 3" (cuadros y editor), "fase 4" (resumen), "fase 5" (Excel y ODS), "fase 6" (endurecimiento).
