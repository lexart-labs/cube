# Cube

Plataforma de **evaluaciones de desarrolladores** de Lexart Labs, con el estándar **IDEAL LEXART**:
bloques con peso según el rol, promedio ponderado de 1,00 a 5,00 y una redacción en español e inglés
generada con Gemini.

El código vive en [`cube/`](./cube) — una sola aplicación Nuxt 4 (Vue 3 + Nitro + MySQL), 19
endpoints y 6 tablas. Empieza por [`cube/README.md`](./cube/README.md) para ponerla en marcha.

| Documento | Para qué |
|---|---|
| [`cube/README.md`](./cube/README.md) | Puesta en marcha, cuentas de prueba, inventario de lo implementado |
| [`Roadmap.md`](./Roadmap.md) | Las seis decisiones de arquitectura, las fases y el estado de cada una |
| [`Security.md`](./Security.md) | Auditoría de 32 hallazgos de v1, el estado de cada uno en v2 y la especificación que el código cumple |
| [`CLAUDE.md`](./CLAUDE.md) | Guía para trabajar en este repositorio |

## Estado

v2 está escrita entera y **no se ha desplegado nunca**. Lo que sigue pendiente está en
`cube/README.md` → *Pendientes conocidos*; en corto: nada de esto está commiteado, el CI nunca ha
corrido en GitHub, la migración de datos nunca se ha ejecutado y **v1 sigue siendo el sistema que
funciona en producción**, con tres hallazgos críticos abiertos (`Security.md` §10.1).

## Historia

Hasta el 2026-09-25 este repositorio contenía también el sistema v1 —`backend/` en Express,
`webapp/` en Vue 2 y `ext/onboarding/` en Nuxt 3—, el módulo de onboarding/offboarding y un segundo
modelo de evaluación, el de 27 indicadores sobre 135 heredado de v1. Los tres se retiraron del árbol
el mismo día (**AD-06** y la revisión de **AD-05** en `Roadmap.md`):

- el **onboarding/offboarding** pasa a la plataforma de Lexart;
- el **modelo de 27 indicadores** se retira entero en favor de IDEAL, porque las dos escalas no son
  comparables y mantener ambas obligaba a desambiguar en cada consulta y en cada gráfico;
- **v1** se conserva en el historial de git y en las ramas `main` y `develop`, **que es desde donde
  despliega producción hoy**. Retirar el código de esta rama no apagó ningún servicio.

El histórico de evaluaciones anteriores y los datos de onboarding se quedan en las bases de v1 y en
sus copias de seguridad: no se migran a v2.
