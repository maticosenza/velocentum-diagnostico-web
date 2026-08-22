# Decisiones pendientes

Registro de decisiones de producto o de negocio que aparecieron durante el
trabajo autónomo del 2026-08-21 y que no estaban ya resueltas en los
documentos existentes. No se tomaron unilateralmente: se anota el contexto y
se sigue con lo que no depende de ellas.

## 1 · ¿Debe "margen total" en el motor de cálculo exigir 100% de cobertura de productos, igual que ya exige el documento? — **RESUELTA el 2026-08-22**

**Contexto original.** Durante la fase 5 (productos dinámicos y cobertura),
al separar "margen de la muestra" de "margen total" se habían encontrado dos
reglas distintas y ya aprobadas conviviendo en el repositorio, con alcances
distintos: el adaptador documental exigía 100% de cobertura de canales Y de
productos para publicar `margenTotal`; el motor de cálculo
(`derivados.margen_contribucion`) nunca exigió cobertura de productos, sólo
de canales.

**Resolución (auditoría externa, 2026-08-22).** Se unificó la semántica: el
motor de cálculo ahora exige exactamente lo mismo que ya exigía el
documento. Implementado en `src/lib/calculo-diagnostico.ts`
(`calcularDiagnostico`):

- `margen_contribucion` (el TOTAL) sólo se publica con 100% explícito de
  cobertura de productos (`coberturaProductos(d) >= 100`) **y** 100% de
  cobertura de canales aplicables (regla de canales ya existente, sin
  cambios). Con cobertura parcial de cualquiera de los dos, queda `null`
  (retenido).
- `margen_muestra` no cambió: sigue publicándose sobre lo que sí se cargó,
  sin exigir cobertura total, tal como ya funcionaba.
- Un solo producto sin porcentaje de facturación declarado ya NO equivale a
  un 100% implícito: `coberturaProductos` sólo suma participaciones
  declaradas (`> 0`), nunca las asume. Si el vendedor no declara
  explícitamente "100%" en el campo de porcentaje de ese único producto, el
  margen total queda retenido (el de la muestra sigue disponible).
- Cualquier cálculo aguas abajo que dependía de `margen_contribucion`
  (`breakeven_roas`, `cpa_breakeven`, `cpa_objetivo`, `roas_objetivo`,
  `contribucion_marginal`, el bloque completo de
  `presupuesto_arranque` — piso teórico y presupuesto de arranque por
  evento intermedio, fase 6 —, y las fugas que usan margen) queda retenido
  con él mientras la cobertura sea parcial, porque todos siguen leyendo la
  misma variable `margen` ya gateada. Esto es intencional y no un efecto
  colateral: el pedido explícito fue "cualquier cálculo dependiente del
  margen total debe quedar retenido mientras la cobertura sea parcial".
- **Corrección obligatoria (auditoría externa, 2026-08-22, ronda 2):** la
  primera versión de este bloque dejaba de evaluar la contradicción contra
  el margen declarado por el cliente (`evaluarContradiccion`) en cuanto la
  cobertura de productos era parcial, porque comparaba únicamente contra
  `margen_contribucion` (el total), que en ese caso es `null`. Eso era una
  regresión funcional real: el caso que originó la regla de contradicción
  (Titan Web, 60% de cobertura de productos, margen de la muestra negativo)
  dejaba de disparar la alerta si el cliente declaraba, por ejemplo, 10-12%
  de rentabilidad. Se corrigió en `src/lib/contradiccion.ts`:
  `evaluarContradiccion` ahora recibe `{ total, muestra }` y compara contra
  el margen total cuando está disponible; si está retenido, compara contra
  el margen de la MUESTRA en vez de dejar de evaluar. El resultado ahora
  registra `origen_margen` (`"total"` | `"muestra"`), `confianza_base`
  (`"alta"` con margen total, `"media"` — un nivel menos — con margen de la
  muestra) y la cobertura de productos/canales usada en la comparación. Los
  umbrales (0,05 validación, 0,10 crítica) y la regla de cambio de signo no
  cambiaron: sólo cambió contra qué margen se comparan. `confirmado`/`bloquea`
  siguen dependiendo únicamente de si el cliente confirmó su margen
  declarado — es un eje independiente de `origen_margen`: una contradicción
  puede estar confirmada y bloquear apoyándose en una muestra parcial. Ver
  `src/lib/contradiccion.test.ts` (incluye el caso Titan Web al 60%
  explícitamente) y la UI (`diagnosticos.$id.tsx`, `AvisoContradiccion`),
  que ahora aclara cuando la comparación se hizo contra la muestra.
- Los diagnósticos ya guardados NO se recalculan automáticamente: esta regla
  sólo se aplica cuando se calcula un diagnóstico nuevo o se usa la acción
  explícita "Editar y recalcular" (`diagnosticos.nuevo.tsx`), que crea una
  versión nueva. Leer un diagnóstico existente (`diagnosticos.$id.tsx`) sigue
  mostrando los `derivados` ya calculados y guardados en su momento, sin
  volver a ejecutar el motor.

**Impacto verificado.** Pantalla de diagnóstico
(`diagnosticos.$id.tsx`): "Margen total" y "Piso teórico"/"Presupuesto de
arranque" ya mostraban "—" (guión) para cualquier valor `null` mediante los
helpers existentes (`pesos`/`pct` en `vista-diagnostico.ts`) — no hizo falta
tocar la UI para eso. Cobertura de productos, la nota de cobertura parcial y
"Margen de la muestra" siguen visibles sin cambios. El aviso de contradicción
(`AvisoContradiccion`) sí se tocó: cuando `origen_margen` es `"muestra"`,
ahora aclara explícitamente que la comparación se hizo contra el margen de
la muestra y qué porcentaje del catálogo cubre, en vez de dar a entender que
se comparó contra un margen total.

## 2 · Valor por defecto del costo por evento intermedio (fase 6, presupuesto de arranque)

**Contexto.** El "presupuesto de arranque optimizando por evento intermedio"
(`derivados.presupuesto_arranque.arranque_evento_intermedio`,
`src/lib/calculo-diagnostico.ts`) necesita un costo estimado por evento
intermedio (agregar al carrito o iniciar checkout). Por instrucción explícita
del usuario, ese costo "sale de configuración marcado como benchmark" — se
implementó como una proporción del CPA objetivo
(`factor_costo_evento_intermedio`, config), con un default de código
(`FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO = 0,2`, es decir 20% del CPA
objetivo) documentado en `src/lib/calculo-diagnostico.ts`.

**Por qué se anota igual, sin bloquear el bloque.** El patrón en sí (config
primero, default de código marcado como benchmark, nunca cifra única, nunca
confianza "alta") es exactamente lo que pidió el usuario y no requería
autorización adicional. Pero el número concreto, 20%, no tiene respaldo de
datos reales de ningún cliente — es una estimación razonable de que un
evento intermedio (más frecuente, más barato) cuesta una fracción del costo
de una compra, no una cifra derivada de benchmarks de la industria ni de
datos propios. Hoy el radio de impacto es acotado: este valor sólo alimenta
la pantalla interna de diagnóstico (`diagnosticos.$id.tsx`), no ningún
documento cliente-facing (`src/documents/`). Auditoría independiente de fase
6 (commit `0b803af`) recomendó dejarlo trazable acá antes de que, en el
futuro, se conecte a un documento que llegue a un cliente.

**Qué decidir.** Si Matías tiene una referencia mejor (data de campañas
propias con optimización por agregar-al-carrito o iniciar-checkout vs.
compra), reemplazar el 20% por ese número en la fila `configuracion` de la
base (clave `factor_costo_evento_intermedio`) — no requiere tocar código. Si
no hay objeción, el valor por defecto queda como está.

## 3 · Nueve de las catorce fases del plan maestro no tienen definición verificable en este repositorio — **RESUELTA el 2026-08-22**

**Resolución.** Matías compartió el plan maestro consolidado completo
(`docs/plan-maestro-consolidado-2026-08-21.md`, incorporado al repositorio
tal cual) y la especificación visual de las fases 11 a 13
(`docs/especificacion-visual-pdfs-fases-11-13.md`). Con esa fuente, las
nueve fases quedaron reconciliadas contra el código real en
`docs/plan-maestro-fases.md`: fase 1 y 2 **COMPLETA**, fase 4
**MAYORMENTE COMPLETA** (ya cubiertas antes, sólo faltaba el nombre), fase 9
**PENDIENTE**, fase 10 **TÉCNICAMENTE COMPLETA**, fases 11 y 12
**FUNCIONAL / VISUAL PENDIENTE**, fase 13 **PARCIAL**, fase 14
**PENDIENTE**. Ninguna quedó con contenido inventado: cada estado tiene
evidencia archivo:línea verificada contra el HEAD `d07fcac`, no contra la
línea base de 366 pruebas que el plan maestro usó (`c4cb51a`).

**Contexto original.** La reconciliación del plan maestro (2026-08-22,
`docs/plan-maestro-fases.md`) pidió un único documento con las catorce
fases normalizadas. La instrucción dio nombre y estado real para cinco:
fase 3 (productos dinámicos y cobertura), fase 5 (plataformas y
comisiones), fase 6 (presupuesto de arranque), fase 7 (medición y
publicidad por plataforma) y fase 8 (retención, carrito y recompra). Para
las fases 1, 2, 4, 9, 10, 11, 12, 13 y 14, este repositorio no tiene ningún
nombre, alcance ni evidencia — ni en el código, ni en los tests, ni en
ningún documento de `docs/`, ni en los handoffs de sesiones anteriores.

**Por qué no se completó igual.** Completar esas nueve filas habría exigido
inventar nombres y alcances de fase sin ninguna fuente que los respalde —
exactamente el tipo de dato no resuelto en los documentos existentes que la
regla de parada de este trabajo pide no asumir unilateralmente. El plan
maestro consolidado que las define vive fuera de este repositorio (en el
controlador o en la documentación de producto de Matías), no acá.

**Qué se hizo en su lugar.** Se dejaron las nueve filas explícitamente
marcadas "SIN DEFINICIÓN VERIFICABLE ACÁ" en `docs/plan-maestro-fases.md`,
en vez de completarlas con contenido plausible pero no verificado. Se
señaló, sin asumirla, una posible relación entre esas fases y el trabajo
mencionado sin numeración ni alcance en `docs/cola-nocturna.md`
("mayorista/mixto, retención y rediseño integral").

**Qué decidir.** Si Matías comparte el nombre y alcance real de las fases
1, 2, 4 y 9 a 14 (o el documento completo del plan maestro), se puede
completar `docs/plan-maestro-fases.md` sin tocar código.

---

*(Este archivo se actualiza a medida que aparecen nuevas decisiones
pendientes durante el trabajo autónomo. Cada entrada queda numerada y no se
borra hasta que Matías la resuelve.)*
