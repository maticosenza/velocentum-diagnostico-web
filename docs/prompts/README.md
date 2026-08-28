# docs/prompts/ — prompts originales por bloque

Cada bloque de trabajo guarda acá el texto original de su prompt,
verbatim, sin editar ni reformatear, con una línea de encabezado que
indica desde qué HEAD se ejecutó y en qué commit se cerró (ver sección
5.6 de `docs/plan-maestro-fases.md`).

## Presentes

- `bloque-3-funcional.md` — ejecutado desde `7caa9bbb`, cerrado en
  `318c2ac`.

## Faltantes (no reconstruidos)

Los prompts de los siguientes bloques, anteriores al Bloque 3
Funcional, NO están preservados verbatim en el historial de sesión
disponible al momento de crear esta carpeta (2026-08-28). No se
reconstruyeron de memoria porque esta regla (guardar el prompt en
`docs/prompts/`) no existía cuando se ejecutaron:

- Bloque Visual 1
- Bloque Visual 2
- Bloque Visual 2.1
- Bloque Visual 2.2
- Bloque Visual 2.2.1
- Bloque Visual 2.2.2
- Bloque Visual 2.2.3

Los handoffs de estos bloques (con el resultado de cada ronda, no el
prompt de entrada) siguen disponibles en `docs/visual/`:
`handoff-bloque-visual-2.md`, `handoff-ronda-2.2.1.md`,
`handoff-ronda-2.2.2.md`, `handoff-ronda-2.2.3.md`. Si el texto
original de alguno de estos prompts existe en otro lugar (por ejemplo,
en el historial de una sesión de chat distinta), hay que pegarlo acá
manualmente con la misma línea de encabezado — no reconstruirlo por
aproximación desde el handoff.
