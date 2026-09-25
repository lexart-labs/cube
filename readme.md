# Cube

Plataforma de **evaluaciones de desarrolladores** de Lexart Labs.

El código vive en [`cube/`](./cube) — una sola aplicación Nuxt 4 (Vue 3 + Nitro + MySQL). Empieza
por [`cube/README.md`](./cube/README.md) para ponerla en marcha.

| Documento | Para qué |
|---|---|
| [`cube/README.md`](./cube/README.md) | Puesta en marcha, cuentas de prueba, inventario de lo implementado |
| [`Roadmap.md`](./Roadmap.md) | Las seis decisiones de arquitectura, las fases y el estado de cada una |
| [`Security.md`](./Security.md) | Auditoría de 32 hallazgos y especificación de seguridad que el código cumple |
| [`CLAUDE.md`](./CLAUDE.md) | Guía para trabajar en este repositorio |

## Historia

Hasta el 2026-09-25 este repositorio contenía también el sistema v1 (`backend/` en Express,
`webapp/` en Vue 2 y `ext/onboarding/` en Nuxt 3) y el módulo de onboarding/offboarding. Ambos se
retiraron del árbol (ver **AD-06** en `Roadmap.md`): el onboarding pasa a la plataforma de Lexart, y
v1 se conserva en el historial de git y en las ramas `main` y `develop`, **que es desde donde
despliega producción hoy**. Retirar el código de esta rama no apagó ningún servicio.
