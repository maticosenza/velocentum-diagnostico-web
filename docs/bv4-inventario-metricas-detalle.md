# BV4 · Inventario de métricas de la pantalla de detalle

Mapa de la pantalla de detalle (`src/routes/_authenticated/diagnosticos.$id.tsx`) al 2026-09-11, tal como vino con el reporte de la auditoría de las salidas de ese día, con las dos filas que cambió `ccbd98e` el 2026-09-15: sale "Reserva aplicada" de Economía y "Inversión actual mensual" pasa a "Presupuesto diario de Meta × 30". Sin juicio: qué muestra cada fila, de dónde sale y cuándo se retiene. Los hallazgos de esa auditoría están en `docs/bv4-hallazgos-diferidos.md` (H-38 a H-48). Las referencias `:NNN` sin archivo apuntan a `diagnosticos.$id.tsx` o, cuando la fila dice "motor", a `calculo-diagnostico.ts`, siguiendo la convención del reporte.

## Inventario del detalle

| Sección | Métrica en pantalla | De dónde sale | Se retiene cuando |
|---|---|---|---|
| Encabezado | Tienda, vertical, plataforma, fecha, versión | oportunidad., datos., data.fecha, data.version (:176-185) | Se omite el tramo que falte |
| Número principal | Oportunidad mensual estimada, conservador a total | oportunidad_total y ×0,6 (:189-190; motor :1642-1687) | Contradicción confirmada: "No valorizamos"; medición en rojo: "No podemos valorizar todavía"; total 0 con fugas pendientes: "Todavía no podemos…" (:555-624) |
| Aviso contradicción | Margen calculado, rango declarado, diferencia, cobertura de la muestra | derivados.contradiccion_margen (contradiccion.ts:35-60) | Nivel sin_alerta o nulo (:495) |
| Semáforo | Medición: desvío Pixel vs facturación | delta_medicion (:864-874) | Sin facturacion_pixel > 0 o sin facturacion_mensual > 0 → "Sin datos" |
| Semáforo | Economía: MER contra breakeven | mer_actual (:989-992), breakeven_roas (:937) | MER nulo o breakeven nulo → "Breakeven ROAS X" o "Sin datos" (:700-705) |
| Semáforo | Cuenta: conjuntos activos y sostenibles | datos.conjuntos_activos, conjuntos_sostenibles (:1007-1010) | Falta presupuesto diario, conjuntos o CPA objetivo → "Sin datos" (:1152-1163) |
| Semáforo | Funnel web: conversión de la tienda | cr_tienda = pedidos ÷ visitas (:952-959) | Sin visitas, sin pedidos, sin umbral por ticket o funnel en error (:1167-1172) |
| Semáforo | Contenido: creativos nuevos | datos.frecuencia_creativos; evaluarEstadoCreativos (:139-152) | Texto vacío → "Sin datos de contenido" |
| Notas | Texto por bloque | notas vía notasVisibles (diagnostico-form.ts:554-566) | Sección oculta sin notas |
| Fugas | Etiqueta, explicación, monto, marca parcial | fugas[] (:1191-1555), EXPLICACION_FUGA (:90-96) | Sin monto finito no entra a la lista principal; calculable: false va abajo con faltantes; monto 0 en tramos se descarta (:1196) |
| Fugas | Riesgo de medición | Fuga tipo riesgo (:1544-1555) | Sólo con medición en rojo |
| Canales | Cobertura declarada | cobertura_canales (canales.ts:565-568) | Nunca; sin canales imprime 0 % |
| Canales | Canal principal | canal_principal (canales.ts:589-595) | Empate o sin canales → "sin definir" |
| Canales | Participación del canal | canal.pct (canales.ts:545-550) | Estado no_aplica → "No aplica"; ausente → "Sin datos" y sin filas |
| Canales | Margen del canal | canal.margen (:778-797, 841) | Falta ticket, envío neto, comisión, financiación o descuento (:706-736) |
| Canales | Comisión efectiva, origen, evidencia, vigencia | comisionEfectivaCanal (:714, campos :828-833) | Vigencia sólo si la configuración la trae |
| Canales | MER del canal | canal.mer (:801-802) | Sin facturación del canal o inversión ≤ 0 |
| Canales | Contribución antes de publicidad | facturación × margen (:806-807) | Sin facturación o sin margen |
| Canales | Inversión publicitaria del canal | inversionCanal (:596-599) | Sin dato de inversión |
| Canales | Resultado después de publicidad | contribución − inversión (:808) | Sin contribución; inversión nula cuenta 0 (H-30) |
| Canales | ROAS de Product Ads, sólo ML | canal.roas_pauta (:812-817) | Sin ventas atribuidas o inversión ≤ 0 → "Sin datos" |
| Canales | Breakeven del canal | 1 ÷ margen del canal (:848) | Margen nulo o ≤ 0 |
| Canales | Avisos comisión provisional y cargo fijo | comision_provisional, cargo_fijo_disponible (:830, 836) | Sólo si la regla es benchmark o hay cargo sin verificar |
| Funnel | Visitas, agregados, checkouts | datos.visitas_mensuales, agregados_carrito, checkouts_iniciados (funnel.ts:125-127) | Sección oculta sólo en no_aplica (:949); nulos → "—" |
| Funnel | Compras estimadas | facturación de tienda ÷ ticket (funnel.ts:116-129) | Sin facturación o ticket |
| Funnel | Tres tasas por tramo y conversión global | tasa() (funnel.ts:208-214) | Estado sin_datos (sin visitas o compras, :201-205) → todas en "—"; error → mensaje |
| Funnel | Nota "faltan etapas intermedias" | desglosado y estado combinado (:975-980) | Sólo en combinado |
| Economía | Ticket y pasarela | datos.ticket_promedio, datos.pasarela | Pasarela vacía → "Pasarela sin definir" |
| Economía | Margen de la muestra | margen_muestra (:903, 915) | Sin canal calculable o mix > 100 % |
| Economía | Margen total | margen_contribucion (:904, 918) | Cobertura de productos < 100 % o de canales < 100 % |
| Economía | Cobertura del catálogo analizado | coberturaProductos (:412-418) | Nunca; sin porcentajes imprime 0 % |
| Economía | Breakeven ROAS, CPA breakeven | :937-941 | Margen total nulo o ≤ 0; CPA además sin ticket |
| Economía | CPA objetivo, ROAS objetivo | :944-949 | Sin CPA breakeven o reserva ≥ 1 |
| Economía | MER actual, MER tienda, MER ML | :974-992 | Sin facturación del perímetro o inversión ≤ 0 |
| Economía | ROAS de Product Ads | :984-987 | Sin ventas atribuidas o inversión ≤ 0 → "Sin datos" |
| Economía | Inversión publicitaria total | inversionPublicitariaTotal (:578-583) | hay_inversion_publicitaria nulo → "Sin datos"; parcial se publica (H-29) |
| Economía | Pedidos mensuales estimados | facturación ÷ ticket (:952-955) | Sin facturación o ticket ≤ 0 |
| Economía | Nota de muestra parcial | cobertura_productos < 100 y más de un producto con peso (:880-887) | Con un solo producto no aparece |
| Presupuesto | Piso teórico mensual | piso_teorico_compra = 50 × CPA objetivo × 4,3 (:1011, 1058) | Sin CPA objetivo |
| Presupuesto | Presupuesto de arranque, rango | arranque_evento_intermedio (:1029-1039) | Sin CPA objetivo → "Sin datos" |
| Presupuesto | Presupuesto diario de Meta × 30 | presupuesto diario × 30 (:1000-1012) | Sin presupuesto ni gasto diario |
| Presupuesto | Conjuntos activos vs sostenibles | datos.conjuntos_activos, conjuntos_sostenibles (:1007-1010) | Cada mitad en "—" por separado |
| Presupuesto | Compras semanales estimadas | pedidos ÷ 4,3 (:1015) | Sin pedidos |
| Presupuesto | Supuestos usados y confianza | presupuesto_arranque.supuestos, .confianza (:1041-1064) | Sin CPA objetivo la lista queda vacía y no se muestra |
| Presupuesto | Lectura textual | lecturaPresupuesto (:333-344) | Sin piso o sin inversión actual → "Faltan datos de presupuesto…" |
| Propuesta IA | Resumen, hallazgos, plan, servicios, próximos pasos | JSON del modelo (propuesta.functions.ts:113, normalizarPropuesta) | Sin propuesta generada → aviso; monto por palabra clave (propuesta-seccion.tsx:22-30) |
| Selección comercial y paquetes | Líneas sugeridas, escalera | lineasSugeridasV2(mapearHallazgos(...)), generarEscaleraPaquetes (:340, 414-415) | No son métricas; precios siempre manuales |

Nota del reporte: normalicé el inventario a tabla completa. En el original la sección Economía venía mezclada entre dos formatos por un problema de render, pero el contenido es el mismo.
