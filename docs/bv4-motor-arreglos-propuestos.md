# BV4 · Motor de cálculo: diseño de los cuatro arreglos propuestos

**Propuesta sin aprobar, fechada 2026-09-10, ninguno de los cuatro aplicado.**

Sale de la auditoría del motor de cálculo del 2026-09-10 (hallazgos H-28 a
H-37 en `docs/bv4-hallazgos-diferidos.md`). Cubre los hallazgos 1, 2, 3 y 7 de
esa auditoría (H-28, H-29, H-30 y H-34). La numeración de abajo es la del
reporte original. Nada de esto toca `src/`.

---

## Diseño de los cuatro arreglos

Todo verificado corriendo el motor actual sobre los fixtures compartidos (`fixtures-casos.ts`, los seis escenarios demo) y leyendo los tests que asertan sobre los campos tocados. Ningún archivo del árbol cambió.

**Resumen de lo que se rompe**

| Arreglo | Fixtures que cambian de valor | Tests que se ponen en rojo | F2a |
|---|---|---|---|
| 1 · cr_tienda / funnel | escenario demo 1 | `calculo-diagnostico.test.ts:1221` (espera compras 180) | verde |
| 2 · inversión parcial | ninguno, con la regla propuesta | ninguno, con la regla propuesta | verde |
| 3 · resultado después de pauta | ninguno | ninguno | verde |
| 7 · cobertura de productos > 100 | ninguno | ninguno | verde |

Snake Store y Titan Web B1 no tocan ninguna de las cuatro condiciones de disparo (verificado con el motor: Snake no tiene facturación ni visitas ni inversión; Titan tiene tienda en `no_aplica`, visitas null, ML con inversión conocida, productos al 60%). Los cuatro PDFs de F2a salen de esos dos casos, así que `generar-propuestas-f2a.test.ts` queda verde con los cuatro arreglos. La prueba de determinismo por doble corrida no depende de valores.

---

**1 · La conversión de tienda y el funnel usan la facturación de la tienda, no la del negocio**

a) Regla nueva: los pedidos que se comparan con visitas de tienda salen de la facturación de tienda propia (declarada, o derivada del porcentaje declarado), y solo caen a `facturacion_mensual` cuando no hay ningún canal declarado.
- `src/lib/calculo-diagnostico.ts:952-959`: `pedidos_mensuales` sigue siendo del negocio. `crTienda` pasa a usar `facturacionTienda` (ya existe en 970-972 con el fallback legado) dividido por el ticket de tienda (`canal_tienda_ticket ?? ticket_promedio`).
- `src/lib/funnel.ts:121-123`: la facturación cae a la derivada por porcentaje antes que al total. Como `facturacionCanal` vive en el motor y el motor importa `funnel.ts`, la derivación se mueve a `canales.ts` para que la usen los dos sin import circular. El formulario también llama a `evaluarFunnel` (`diagnosticos.nuevo.tsx:232`) y hereda el arreglo sin cambios.
- `funnel.ts:204`: cuando la facturación de tienda no se puede derivar, `faltantes` debe nombrar `canal_tienda_facturacion` o `canal_tienda_pct`, no `facturacion_mensual`.

b) Qué se rompe.
- Escenario demo 1 (tienda 30%, 150.000 visitas): `cr_tienda` pasa de 0,0033 a 0,001, `funnel.compras` de 500 a 150, y los tres tramos del funnel bajan (la probabilidad de compra dado checkout pasa de 0,83 a 0,25). El propio comentario del fixture ya dice "150 pedidos, CR global 0,1%": hoy el motor lo contradice. Los montos del escenario 1 en `docs/loop-nocturno-2026-08-22-escenarios.md:137-142` quedan desactualizados.
- `calculo-diagnostico.test.ts:1221` espera `compras` 180 con mix 60/30 y facturación 9M; pasa a 108. Es el único assert numérico que cae. Los tests de `real` y `base` no declaran canales y quedan en el fallback legado.
- `bloque-visual-3-1-verificacion.test.ts:91`, `correccion-incoherencias-escenarios.test.ts` y `fixtures-escenarios-demo.test.ts` usan el escenario 1 pero solo asertan estructura y consistencia interna, no valores.

c) Decisión de producto: ninguna. La regla dura de `funnel.ts:10-11` ya dice que las etapas son del mismo canal. Sí conviene decidir si `pedidos_mensuales` se mantiene como cifra del negocio: la vista muestra "Pedidos mensuales estimados" y "Compras estimadas" en filas distintas (`diagnosticos.$id.tsx:878` y `:969`), y tras el arreglo van a diferir en negocios mixtos. Recomiendo mantenerlo y etiquetar.

---

**2 · La inversión total se retiene cuando falta un componente de un canal que participa**

a) Regla nueva, por componente: un valor cargado cuenta; el componente de un canal en `no_aplica` cuenta cero; el componente de un canal ausente cuyo mix ya está cubierto al 100% por los otros cuenta cero; cualquier otro componente sin cargar retiene el total. Sin ningún canal declarado, se conserva el comportamiento actual.
- `calculo-diagnostico.ts:578-583`: `inversionPublicitariaTotal` aplica la regla con `estadoCanal` y `coberturaCanales`.
- `calculo-diagnostico.ts:589-593`: `hayInversionPublicitaria` devuelve null, no false, cuando la suma es cero y algún componente quedó sin resolver (hoy Meta 0 y Google null dan "declaró que no invierte").
- `calculo-diagnostico.ts:566-572`: el par Meta/Google queda como está, salvo el punto anterior. Ver (c).

b) Qué se rompe: nada, con esa regla. Lo verifiqué contra los seis escenarios demo, los seis casos de `fixtures-casos.ts`, `entrega-2-5.test.ts:47-135` (los tres estados de Product Ads, Meta y Google en cero, perímetros), `regresion-2-6.test.ts:37`, `qa-numerica-bloque2.test.ts:264-267` y los tests de inversión elegible en `calculo-diagnostico.test.ts:1540-1620`. Ningún fixture tiene un canal declarado con inversión null mientras el otro está cargado. Una versión más estricta, que retenga también para canales ausentes, pone en rojo `correccion-incoherencias-escenarios.test.ts:94` y `:259` (economía verde y amarillo en los escenarios 5 y 3) y `calculo-diagnostico.test.ts:368` (MER 5,8 del caso real), porque esos fixtures tienen Mercado Libre ausente sin Product Ads.

c) Decisiones de producto. Dos.
- Inferir "no invierte en ML" de "ML no participa del mix" (canal ausente con los demás al 100%). Alternativa: exigir `no_aplica` explícito y agregar `canal_ml_no_aplica: true` a los escenarios demo 2 a 5. La segunda es más honesta y el costo es tocar cuatro fixtures.
- Qué significa Google vacío con Meta cargado. No hay campo que distinga "no pauta en Google" de "no lo relevé" (`diagnostico-form.ts:171-172` son dos números sin bandera). Hoy se suma como cero. Si se decide retener, hace falta un campo o una convención en el formulario.
  **Cerrada el 2026-09-12.** Identificación pregunta "¿Pauta en Meta?" y "¿Pauta en Google?" (`pauta_meta`, `pauta_google`). Con el monto vacío, "no" cuenta cero y "sí" retiene `inversionPublicitariaTotal` y `hayInversionPublicitaria` (también `inversionMetaGoogle`, así que el perímetro de la tienda queda sin inversión). Sin respuesta, que es lo que traen los diagnósticos guardados antes, se suma como cero igual que antes. "¿Tiene tienda propia?" escribe `canal_tienda_no_aplica`. Tests en `src/lib/preguntas-tienda-pauta.test.ts`.

**El caso Titan Web B1.** El motor sí distingue "no aplica" de "no relevado": `canales.ts:552-555` devuelve `no_aplica` cuando `canal_tienda_no_aplica === true`, `declarado` con porcentaje cargado, y `ausente` en el resto. Titan trae `canal_tienda_no_aplica: true` (`fixtures-casos.ts:96`). Con la regla propuesta, tienda propia cuenta cero por `no_aplica`, ML está declarado con Product Ads cargado, y el total sigue en 1.800.000. Lo que rompería Titan es un arreglo naive que retenga ante cualquier null sin mirar `estadoCanal`. Ese arreglo naive también cambiaría los hallazgos de Titan (MER y estructura de cuenta dependen de `hay_inversion_publicitaria`, `propuesta.ts:133`) y con eso el plan 30/60/90 impreso en los PDFs de F2a.

---

**3 · El resultado después de publicidad se retiene si la inversión del canal no se conoce**

a) `calculo-diagnostico.ts:808`: `resultadoDespues` exige `inversion !== null`, igual que el MER del canal en la línea 802. Regla: un resultado neto de pauta solo existe si la pauta se conoce, y un cero explícito sigue siendo cero.

b) Qué se rompe: nada. En todos los fixtures, cada canal con contribución calculada tiene inversión cargada (escenario 6 la tiene en cero explícito, que sigue publicando). `entrega-2-5.test.ts:133` usa ML con 1,8M y no cambia. El único consumidor fuera del motor es la vista (`diagnosticos.$id.tsx:1096`) y su helper ya imprime guión ante null (`vista-diagnostico.ts:21-23`).

c) Decisión de producto: ninguna. Es la misma asimetría que el motor ya resuelve para el MER dos líneas arriba.

---

**7 · Porcentajes de producto que suman más de 100 no cuentan como cobertura completa**

a) Regla nueva: un catálogo cuyos porcentajes declarados superan 100 es un mix imposible, igual que en canales, y retiene el margen total con los campos de porcentaje en faltantes.
- `calculo-diagnostico.ts:412-418`: `coberturaProductos` deja de recortar; agregar `productosSuperan100(d)` al lado de `canalesSuperan100` (`canales.ts:575-577`).
- `calculo-diagnostico.ts:898`: cobertura completa es exactamente 100, no "mayor o igual".
- `calculo-diagnostico.ts:533-550`: `faltantesMargen` agrega los `producto_N_pct_facturacion` cargados cuando superan 100, espejo de lo que hace en 541-543 con canales.
- `build-context.ts:274-281`: restricción nueva `mix_productos_invalido`, espejo de `mix_canales_invalido`, porque `limitarCobertura` (`build-context.ts:149-151`) también recorta a 100 y hoy taparía el caso en el documento.

b) Qué se rompe: nada. Ningún fixture suma más de 100 (todos suman 60 o 100). Los tests de cobertura en `calculo-diagnostico.test.ts:111-180` y `producto-dinamico.test.ts:123-250` usan 95, 0, 60 y 100. No existe test del recorte. La vista muestra el porcentaje crudo (`diagnosticos.$id.tsx:849`) y va a imprimir "120%" hasta que se decida (c).

c) Decisión de producto: si el formulario debe impedirlo. No encontré validación de la suma en `diagnostico-form.ts` ni en las rutas (`camposPorBloque` en 616-644 solo mide completitud). Si el formulario lo bloquea, el arreglo del motor es defensivo. Si no, hay que decidir qué ve el usuario: "120% del catálogo" o la restricción "mix de productos inconsistente" con el porcentaje escondido.

---

Orden que recomiendo si entran todos: 3, 7, 2, 1. Los tres primeros no mueven ningún fixture. El 1 es el de mayor impacto comercial pero es el único que cambia números ya publicados en docs y un assert.

---

## Fuera del registro: lo que la auditoría dejó afuera y las sospechas sin verificar

Ninguno de estos seis puntos tiene ID. Quedan acá para que no se pierdan.

**Quedaron afuera del reporte verificado (3):** empate exacto 50/50 deja `canal_principal` null pero publica envío y márgenes por producto de tienda propia sin decirlo (885, 1097, 1109); sobrefragmentación lista `cpa_objetivo` como faltante, que no es un campo del formulario (1263), y margen calculado exactamente 0 lista `margen_contribucion` como faltante (935-937, 1216); en `funnel.ts:445-464`, con agregados y checkouts cargados como 0 los faltantes nombran esos mismos campos.

**Sospechas sin verificar (3):**

- Si el formulario permite guardar `facturacion_pixel` en 0 como dato real o lo normaliza a null. No entré al formulario; el hallazgo 9 solo describe lo que hace el motor con un 0.
- Si la capa de documentos etiqueta `margenes_producto`, `pesos_producto` y `envio_neto_vendedor` como pertenecientes al canal principal. En `derivados` salen sin canal (922-924, 1097, 1109-1110).
- Si la lectura del margen "total" con `cpa_breakeven` sobre `ticket_promedio` global (938-941) mientras cada canal usa su propio ticket produce un CPA objetivo inconsistente en negocios mixtos con tickets muy distintos. No lo cuantifiqué.
