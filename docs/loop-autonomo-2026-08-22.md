# Loop autónomo · 22 de agosto de 2026

Registro de bloques ejecutados en modo autónomo (varios bloques encadenados
sin aprobación entre sí, por instrucción explícita). Handoff corto por
bloque; el cierre consolidado va al final del archivo.

## Bloque 1 · Deuda menor de fase 8 — **COMMITEADO**

**Commit:** `07d4753`.

- Costo de campaña de recompra separado del cupón (campo nuevo
  `recompra_costo_campana_mensual`, opcional, se resta en agregado, no
  bloquea calculabilidad).
- Catálogo `SERVICIOS` reconciliado EXACTO al texto de la decisión
  comercial 5: "Product Ads en Mercado Libre" → "Product Ads",
  "Planificación de contenido" → "Planificación y creación de contenido".
- Auditoría: APROBADO CON OBSERVACIONES (2 no bloqueantes, ambas
  corregidas: `dependencias` del impacto tipado + aclaración de paréntesis
  en `decisiones-pendientes.md`).
- Suite: 442 passed | 1 todo. Typecheck y build limpios.
- Nota menor: los comentarios de este bloque quedaron fechados
  "2026-08-23" por error de mi parte (la fecha real de ejecución es
  2026-08-22); es sólo un detalle de fecha en comentarios, no afecta
  lógica ni datos. No se corrigió con un commit aparte para no abrir un
  frente por un detalle cosmético.

## Bloque 2 · Fase 9, mayorista y mixto — **COMMITEADO**

**Commit:** `f1cf10a`.

- Mayorista como canal combinable (`venta_mayorista_activa`), no un tipo de
  diagnóstico separado; retrocompatible (default minorista sin cambios).
- Módulo nuevo `src/lib/mayorista.ts`: piso de precio cost-plus, descuento
  máximo viable, margen real, pedido mínimo rentable, contribución por
  pedido, cartera actual vs. escenario de activación SIEMPRE separados,
  capacidad máxima, recupero de CAC. Detección de canal por plataforma
  reutilizando el relevamiento de fase 6.
- Mapeo de hallazgos con el mismo catálogo de seis servicios (decisión
  comercial 6): sin servicios B2B nuevos.
- Auditoría: APROBADO CON OBSERVACIONES (2 no bloqueantes, 1 corregida:
  tipo de confianza del escenario de activación estrechado a "baja" fijo;
  la otra es sólo una nota de alcance, sin acción).
- Suite: 483 passed | 1 todo (41 nuevos). Typecheck y build limpios.
- Pendiente explícito: la capa documental (`build-context.ts`) todavía no
  consume `derivados.mayorista` — el `modalidad` que ve el PDF sigue
  hardcodeado en `{ minorista: true, mayorista: false }`. Se integrará
  cuando se trabajen las fases 11-13 con la capa documental.
