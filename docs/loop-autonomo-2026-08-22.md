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

## Bloque 3 · Fases 11/12, estructura de contenido de los PDFs — **COMMITEADO**

**Commit:** `33945d2`.

- Cinco puntos previos entregados en `docs/fase11-12-diseno-tecnico.md`
  (inventario, estructura de datos, wireframes, exportación 16:9/A4,
  criterios de prueba) antes de tocar código, como pide la especificación.
- `diagnostico.ts` (12 secciones) y `proyeccion-90d.ts` (11 secciones)
  reestructurados reutilizando el vocabulario de bloques existente: cero
  tipos de bloque nuevos, cero cambios en los renderers — "no capa visual"
  respetado arquitectónicamente.
- Riesgos/contradicciones y datos faltantes: mismo array de restricciones,
  particiones disjuntas. Prioridades inmediatas: subconjunto filtrado de
  hallazgos. Próximo paso activado con el bloque `next-step` ya existente.
- Auditoría: APROBADO CON OBSERVACIONES (2 no bloqueantes, ambas
  corregidas con datasets que sí ejercitan las ramas antes no probadas).
- Suite: 515 passed | 1 todo. Typecheck y build limpios.
- Pendiente documentado a propósito: desglose real por canal/producto/
  publicidad/funnel-retención sigue usando el `metric-grid` general —
  requiere campos nuevos en `DocumentContextV1`, diseño ya especificado en
  `docs/fase11-12-diseno-tecnico.md` punto 2 para un bloque posterior.

## Bloque 4 · Fase 13, generador de paquetes — **COMMITEADO**

**Commit:** `451b168`.

- `src/lib/paquetes.ts`: escalera de hasta tres niveles (IMPULSO/
  TRACCIÓN/ESCALA), acumulativa, cada servicio ligado a un hallazgo
  concreto, unidades propias por servicio, precios siempre `null`.
- `src/components/confirmacion-paquetes.tsx`: pantalla de confirmación
  manual obligatoria, wireada en `diagnosticos.$id.tsx` con datos ya
  persistidos, sin recalcular nada.
- Auditoría: APROBADO, sin observaciones.
- Suite: 519 passed | 1 todo (21 + 4 nuevos). Typecheck y build limpios.
- Dos decisiones pendientes nuevas quedaron registradas (entradas 8 y 9 de
  `docs/decisiones-pendientes.md`): el algoritmo de reparto entre niveles
  no estaba especificado por la decisión cerrada (se usó un default
  editable en la UI); la persistencia de la selección confirmada requiere
  una migración de base de datos, fuera del alcance autónomo.

---

## CIERRE — Handoff consolidado del loop autónomo (2026-08-22)

**HEAD final:** `451b168193ddf29814e1059485c3262edb2f857c` (rama
`feat/noche-continuacion`, pusheada).

**Cifra real de pruebas al cierre:** 519 passed | 1 todo (520), en 35
archivos de test. Typecheck y build limpios en cada bloque, verificado de
forma independiente en cada auditoría (no sólo confiado del bloque
anterior).

**Commits de este loop, en orden:**

1. `07d4753` — Bloque 1 (deuda menor de fase 8).
2. `acdba29` — handoff bloque 1.
3. `f1cf10a` — Bloque 2 (fase 9, mayorista y mixto).
4. `f85d146` — handoff bloque 2.
5. `33945d2` — Bloque 3 (fases 11/12, estructura de contenido).
6. `ddc610a` — handoff bloque 3.
7. `451b168` — Bloque 4 (fase 13, generador de paquetes).

**Qué quedó hecho de cada bloque:**

- **Bloque 1:** costo de campaña de recompra separado del cupón (campo
  nuevo, opcional, se resta en agregado); catálogo `SERVICIOS`
  reconciliado exacto al texto de la decisión comercial 5.
- **Bloque 2:** mayorista como canal combinable (`venta_mayorista_activa`),
  retrocompatible; motor de piso de precio cost-plus completo
  (`src/lib/mayorista.ts`); mapeo de hallazgos con el mismo catálogo de
  seis servicios; cartera actual y escenario de activación siempre
  separados.
- **Bloque 3:** los cinco puntos de diseño previo entregados
  (`docs/fase11-12-diseno-tecnico.md`); `diagnostico.ts` (12 secciones) y
  `proyeccion-90d.ts` (11 secciones) reestructurados reutilizando bloques
  existentes, cero cambios en la capa visual/renderers.
- **Bloque 4:** generador de paquetes (`src/lib/paquetes.ts`) y pantalla de
  confirmación manual obligatoria (`src/components/confirmacion-paquetes.tsx`),
  wireados en la pantalla de diagnóstico.

**Qué bloques se detuvieron y por qué:** ninguno. Los cuatro bloques se
completaron, se auditaron y quedaron en estado APROBADO o APROBADO CON
OBSERVACIONES (todas las observaciones accionables se corrigieron dentro
del mismo bloque, dentro del límite de dos rondas).

**Contenido completo de `docs/decisiones-pendientes.md` al cierre:**

*Abiertas (3):*

- **2 · Valor por defecto del costo por evento intermedio** (previa a este
  loop, sin cambios): el 20% del CPA objetivo para el costo de un evento
  intermedio (agregar al carrito/iniciar checkout) es una estimación
  razonable, no un benchmark de datos reales. Impacto acotado: sólo
  alimenta la pantalla interna de diagnóstico. Se reemplaza sin tocar
  código, cargando `factor_costo_evento_intermedio` en la config.
- **8 · Algoritmo de reparto de servicios en la escalera de paquetes**
  (nueva, bloque 4): la decisión comercial 7 no especifica en qué orden ni
  con qué factor de escala se reparten los servicios justificados entre
  los tres niveles. Se implementó un default razonable (orden fijo del
  catálogo, reparto parejo, cantidad × índice de nivel), documentado y
  completamente editable en la pantalla de confirmación.
- **9 · Persistencia de la selección comercial confirmada** (nueva,
  bloque 4, requiere cambio de base): la confirmación de paquetes sólo
  vive en memoria de React; guardarla para que sobreviva un recargue y
  alimente el PDF de propuesta real necesita una migración de base de
  datos (columna o tabla nueva) — fuera del alcance de este trabajo
  autónomo por la restricción permanente de no tocar la base ni
  migraciones.

*Cerradas (7):* 1 (margen total exige 100% de cobertura de productos,
igual que el documento — con la corrección de contradicción de ronda 2),
3 (nueve fases del plan maestro sin definición verificable, reconciliadas
con el plan maestro consolidado que Matías compartió), 4 (retención:
recuperación de carrito y recompra por integraciones nativas, sin
automatizaciones complejas), 5 (catálogo cerrado de seis servicios), 6
(mayorista usa el mismo catálogo de seis, ningún servicio B2B nuevo), 7
(escalera de paquetes con las ocho reglas cerradas, confirmación manual
obligatoria).

**Orden recomendado para retomar:**

1. **Decisión 9 primero** (persistencia de paquetes): es la que más
   valor práctico libera — sin ella, el generador de paquetes del bloque
   4 no llega a ningún documento real. Requiere que Matías apruebe
   explícitamente una migración de base de datos.
2. **Decisión 8** (algoritmo de reparto): más rápida de resolver en
   paralelo si Matías tiene una preferencia — cambio acotado a una función
   en `src/lib/paquetes.ts`.
3. **Desglose real por canal/producto/publicidad/funnel-retención en los
   documentos** (pendiente de fase 11/12, diseño ya listo en
   `docs/fase11-12-diseno-tecnico.md` punto 2): requiere agregar campos a
   `DocumentContextV1` y wirearlos desde el motor de cálculo, que ya los
   tiene calculados.
4. **Integración de `derivados.mayorista` a la capa documental**
   (pendiente desde el bloque 2): `modalidad` en `build-context.ts` sigue
   hardcodeado a minorista puro.
5. **Capa visual** (paleta, perfil A4, rediseño de la interfaz): fuera de
   alcance de este loop por instrucción explícita (freno obligatorio);
   diseño de exportación ya especificado en
   `docs/fase11-12-diseno-tecnico.md` punto 4.
6. **Fase 14** (lo que sea que el plan maestro defina): no arrancar sin
   revisión presencial, por la misma instrucción.
7. **Decisión 2** (costo por evento intermedio): la de menor urgencia,
   impacto acotado y ya trazada; resolver cuando Matías tenga una
   referencia mejor, sin apuro.

