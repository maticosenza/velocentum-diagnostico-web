# Handoff · fases 4, 5 y 6 (plataformas, productos dinámicos, presupuesto de arranque) · 21 de agosto de 2026

Trabajo en loop autónomo, sin aprobación disponible durante la ejecución, rama
`feat/noche-continuacion`. Ciclo por bloque: implementación → pruebas +
typecheck + build → auditoría independiente read-only (subagente sin
contexto previo) → corrección de observaciones accionables → re-auditoría.
Máximo dos rondas de corrección por bloque.

## Estado del repositorio

- Rama: `feat/noche-continuacion`, pusheada a `origin/feat/noche-continuacion`.
- **HEAD: `1a1da1e`.**
- `main` no fue tocado. Sin integración, sin publicación, sin producción, sin
  base de datos, sin migraciones. Titan B2 sigue pendiente sin datos
  inventados (el `it.todo` en `regresion-2-6.test.ts` sigue intacto).
- Árbol de trabajo limpio.

## Pruebas, typecheck y build (estado final, verificado en HEAD)

```
npm test         # 389 passed | 1 todo (29 archivos)
npm run typecheck # limpio
npm run build     # exitoso (sólo warnings preexistentes de fontkit/@react-pdf)
```

Los tres comandos se verificaron además de forma **aislada** (worktrees
temporales) en cada auditoría, para no depender del estado del árbol de
trabajo en el momento exacto de la verificación.

## Commits de esta sesión (en orden)

| Commit | Contenido | Veredicto del auditor |
|---|---|---|
| `c4cb51a` | Fase 4: planes y comisiones de plataforma con metadatos completos (plan, vigencia, país, origen, evidencia) + estructura para cargar una liquidación real de Mercado Libre | **APROBADO** (ronda 1, sin observaciones) |
| `0217583` | Fase 5: productos codificados (3) → lista de uno a cinco, cobertura del catálogo analizado, margen de la muestra separado del margen total | **APROBADO** (ronda 1; una observación menor no bloqueante sobre un test parcialmente auto-referencial, no requirió corrección) |
| `12552ef` | Registra la primera decisión pendiente (`docs/decisiones-pendientes.md`) | documentación, sin código |
| `0b803af` | Fase 6: presupuesto de arranque (piso teórico por compra, presupuesto de arranque por evento intermedio como rango, supuestos, confianza) | APROBADO CON OBSERVACIONES → corregido |
| `f7a35a6` | Limpieza: nota en `cola-nocturna.md` sobre el ítem D3 desbloqueado | documentación, sin código |
| `1a1da1e` | Corrección de fase 6 (ronda 1): consumo del campo `piso_teorico_compra` en la UI + segunda entrada en `docs/decisiones-pendientes.md` | **APROBADO** (ronda 2, sin observaciones) |

Ningún bloque llegó al límite de 3 rondas de corrección. Fase 6 fue el único
bloque que necesitó una ronda de corrección; quedó aprobado en la segunda.

## Qué quedó hecho de cada bloque

### 1 · Auditoría de plataformas y comisiones — fase 4 (`c4cb51a`)

- ✅ `ComisionPlataforma`: tipo con metadatos completos (plan/tipo de
  publicación, vigencia desde/hasta, país, origen, evidencia, `verificado`).
- ✅ `COMISIONES_PLATAFORMA_DEFECTO`: cubre Tiendanube (inicial/esencial/impulso),
  Shopify (basic/grow/advanced/plus), WooCommerce y Empretienda — los mismos
  planes reales que ofrece el formulario (`PLANES_POR_PLATAFORMA`). Las 9
  entradas tienen `verificado: false` sin excepción; los valores numéricos
  son los que ya estaban en los fixtures de test (no se inventó ningún
  número nuevo, sólo se les agregó metadato).
- ✅ Estructura preparada para la liquidación real de Mercado Libre: una fila
  de configuración con `verificado: true` resuelve como `"liquidacion_verificada"`
  y pisa al benchmark del código, que sigue disponible sin tocar para
  cualquier cliente que todavía no tenga esa liquidación cargada.
- ✅ Precedencia conservada: un valor verificado por el cliente en ESE
  diagnóstico le sigue ganando a cualquier liquidación de configuración o
  benchmark — confirmado por el auditor como la primera rama evaluada, sin
  excepción.
- ✅ Compatibilidad hacia atrás: el cambio de comportamiento (plataformas sin
  configuración explícita ahora resuelven con el benchmark del código, antes
  devolvían `null`) está reconocido explícitamente en el commit y no rompió
  ningún test preexistente (verificado explícitamente contra `vtex` y otras
  plataformas no cubiertas, que siguen devolviendo `null`: "no se inventa un
  número").

### 2 · Productos dinámicos y cobertura — fase 5 (`0217583`)

- ✅ Los tres productos codificados (`producto_1..3`) generalizados a una
  lista de uno a cinco (`producto_1..5`), con un nuevo campo
  `cantidad_productos` (1 a 5, `cantidadProductosDe()` lo acota) para que el
  formulario y el indicador de completitud traten la lista como progresiva.
  Default: 3, para compatibilidad exacta con diagnósticos ya guardados —
  confirmado por el auditor comparando `camposPorBloque` línea por línea
  contra la versión anterior.
- ✅ Cobertura del catálogo analizado: nuevo derivado
  `derivados.cobertura_productos`, misma fórmula que ya usaba el adaptador
  documental (ahora consumida desde una fuente única). Visible en
  `diagnosticos.$id.tsx`.
- ✅ Margen de la muestra separado del margen total, visibles como dos filas
  distintas en la pantalla de diagnóstico.
- ⚠️ **No se tocó** la semántica preexistente de `margen_contribucion` en el
  motor de cálculo (no exige cobertura de productos, a diferencia del
  documento) — ver decisión pendiente 1, abajo.

### 3 · Presupuesto de arranque — fase 6 (`0b803af` + corrección `1a1da1e`)

- ✅ Las cuatro piezas separadas dentro de `derivados.presupuesto_arranque`:
  `piso_teorico_compra` (mismo valor que el ya existente
  `piso_mensual_un_conjunto`), `arranque_evento_intermedio` (siempre un rango
  `{bajo, alto}`, nunca cifra única), `supuestos` (lista en lenguaje llano) y
  `confianza` (nunca `"alta"` mientras dependa del benchmark sin verificar).
- ✅ El costo por evento intermedio sale de configuración
  (`factor_costo_evento_intermedio`) marcado como benchmark, expresado como
  proporción del CPA objetivo (no un monto fijo en pesos) para no inventar un
  segundo número absoluto sin relación con el negocio del cliente.
- ✅ Todos los campos preexistentes (`piso_mensual_un_conjunto`,
  `inversion_actual_mensual`, `volumen_suficiente`, etc.) intactos;
  `propuesta.ts` no fue tocado y sigue funcionando.
- ⚠️ **Corregido en ronda 1**: la UI ahora consume `piso_teorico_compra` (no
  duplicaba el cálculo, pero el campo nuevo quedaba sin consumidor) y se
  documentó el valor por defecto del 20% en decisiones pendientes — ver
  decisión pendiente 2, abajo.

### 4 · Limpieza y consistencia

- ✅ Revisados todos los documentos de `docs/` en busca de referencias a fases
  con numeración vieja. Único hallazgo: el ítem D3 de `cola-nocturna.md`
  (cierre de la sesión del 20 de agosto) decía que "las fases de auditoría
  por plataforma / mayorista-mixto / retención / rediseño integral" no tenían
  alcance documentado — ahora desactualizado para la parte de plataformas,
  ya que esta sesión les dio alcance directamente y las implementó como fase
  4/5/6. Se agregó una nota posterior sobre esa fila, sin reescribir el texto
  original (mayorista-mixto, retención y rediseño integral siguen sin
  alcance documentado, eso no cambió).
- El resto de los documentos (`motor-documental-v1.md`,
  `fase3-evidencia-pendiente.md`, los handoffs del 21 de agosto) usan
  numeraciones internas propias y consistentes con su alcance, o ya estaban
  correctamente resueltos — no se encontró nada más para corregir.

## Contenido de `docs/decisiones-pendientes.md`

Dos decisiones de negocio quedaron anotadas, no resueltas unilateralmente:

---

### 1 · ¿Debe "margen total" en el motor de cálculo exigir 100% de cobertura de productos, igual que ya exige el documento?

**Contexto.** Al separar "margen de la muestra" de "margen total" (fase 5),
se encontraron dos reglas ya aprobadas conviviendo con alcances distintos: el
adaptador documental (`build-context.ts`) exige 100% de cobertura de canales
Y productos para publicar `margenTotal`; el motor de cálculo
(`derivados.margen_contribucion`) nunca exigió cobertura de productos (sólo
de canales), y ese comportamiento está confirmado por más de diez tests
preexistentes — es, en la práctica, el flujo más común (modo B, un solo
producto).

**Por qué no se resolvió.** Extender la regla del documento al motor habría
roto el flujo de diagnóstico más común para toda la base ya cargada
(mostrarían "sin datos" en lugar de un margen calculado en la pantalla
interna), un cambio de comportamiento real que ningún documento pedía
explícitamente.

**Qué se hizo en su lugar.** Se generalizó la lista de productos sin tocar
esa semántica; se agregó `cobertura_productos` como derivado visible y una
nota en la UI cuando la cobertura es parcial, sin bloquear el número.

**Qué decidir.** Si Matías quiere unificar ambas reglas, falta decidir además
qué pasa con un solo producto sin porcentaje declarado (¿se lo sigue
tratando como 100% del negocio, o hay que declarar "100%" explícitamente?).

### 2 · Valor por defecto del costo por evento intermedio (fase 6)

**Contexto.** El presupuesto de arranque por evento intermedio necesita un
costo estimado por evento (agregar al carrito o iniciar checkout). Se
implementó como el 20% del CPA objetivo (`FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO`),
configurable, marcado benchmark.

**Por qué no bloquea.** El patrón (config primero, benchmark marcado, nunca
cifra única, confianza nunca "alta") fue autorizado explícitamente por el
usuario. El valor concreto (20%) no tiene respaldo de datos reales, pero hoy
sólo alimenta la pantalla interna de diagnóstico, no ningún documento
cliente-facing.

**Qué decidir.** Si Matías tiene una referencia mejor (datos propios de
campañas optimizadas por evento intermedio vs. compra), reemplazar el 20%
cargando una fila en `configuracion` con la clave
`factor_costo_evento_intermedio` — no requiere tocar código.

---

*(El archivo completo, con el detalle íntegro de cada entrada, vive en
`docs/decisiones-pendientes.md` y se sigue actualizando a medida que aparecen
nuevas decisiones pendientes.)*

## Confirmación de restricciones

No se tocó `main`, producción, base de datos ni migraciones (todos los
campos nuevos de esta sesión —metadatos de comisión, `producto_4/5`,
`cantidad_productos`, `cobertura_productos`, `presupuesto_arranque`— viven en
columnas `Json` ya existentes: `configuracion.valor`, `diagnostico.datos`,
`diagnostico.derivados`). No se publicó a ningún entorno. No se inventaron
datos de Titan B2 (el `it.todo` sigue intacto). No se desactivó ninguna
prueba ni se redujo ninguna validación para forzar un verde. Ningún commit ya
respaldado fue reescrito.

## Recomendación

Los tres bloques de trabajo (fases 4, 5 y 6) están implementados, auditados
de forma independiente (read-only, sin contexto previo por cada auditor,
máximo dos rondas por bloque) y verificados con test/typecheck/build tanto
en el árbol de trabajo como en worktrees aislados. Quedan dos decisiones de
negocio explícitas para que Matías las resuelva (arriba). No se integró a
`main` ni se actualizó el plan maestro, por instrucción explícita: la
ejecución se detiene acá.
