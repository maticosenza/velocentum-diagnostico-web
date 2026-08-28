# docs/prompts/ — prompts originales por bloque

Cada bloque de trabajo guarda acá el texto original de su prompt,
verbatim, sin editar ni reformatear, con una línea de encabezado que
indica desde qué HEAD se ejecutó y en qué commit se cerró (ver sección
5.6 de `docs/plan-maestro-fases.md`).

## Presentes

- `bloque-3-funcional.md` — ejecutado desde `7caa9bbb`, cerrado en
  `318c2ac`.
- `bloque-visual-2.md` — ejecutado desde `e5080e2`, cerrado en
  `490d3e8`.
- `bloque-visual-2-1.md` — ejecutado desde `490d3e8`, cerrado en
  `89b2b7b`.
- `bloque-visual-2-2.md` — ejecutado desde `89b2b7b`, cerrado en
  `8d685ed`.
- `bloque-visual-2-2-1.md` — ejecutado desde `8d685ed`, cerrado en
  `84f4109`.
- `bloque-visual-2-2-3.md` — ejecutado desde `5e2edc9`, cerrado en
  `7caa9bb`.

Los cinco anteriores fueron reconstruidos el 2026-08-28 a partir de
archivos fuente aportados por el usuario en `~/Downloads/files/`,
verificados byte a byte contra el original con `diff` antes de
guardarse.

## Faltantes (nunca existieron como archivo)

- Bloque Visual 1
- Bloque Visual 2.2.2

Los handoffs de los bloques presentes (con el resultado de cada ronda,
no el prompt de entrada) siguen disponibles en `docs/visual/`:
`handoff-bloque-visual-2.md`, `handoff-ronda-2.2.1.md`,
`handoff-ronda-2.2.2.md`, `handoff-ronda-2.2.3.md`.
