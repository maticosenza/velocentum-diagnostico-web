<!--
Recibido de Matías por chat el 2026-08-22 e incorporado a docs/ sin
modificaciones, para que la reconciliación de fases no dependa de un
archivo suelto fuera del repositorio. Contenido reproducido tal cual se
recibió; cualquier corrección de estado va en docs/plan-maestro-fases.md,
que reconcilia este plan contra el código real verificado en cada momento.
-->

# Plan maestro consolidado · Diagnóstico e-commerce Velocentum

**Fuente de verdad operativa · 21 de agosto de 2026**  
**Repositorio auditado:** `maticosenza/velocentum-diagnostico-web`  
**Rama:** `feat/noche-continuacion`  
**HEAD verificado:** `c4cb51a20e4e437f519ab934c55b92e329dfc398`  
**Base de producción / main:** sin modificar (`origin/main` en `92727e074d55d8657f2087993b79705b71812e4a`)

---

## 1. Decisión de gobernanza

Este documento reemplaza como fuente operativa a las numeraciones anteriores de 9, 11, 13 y 14 fases. Esos planes siguen siendo referencia histórica, pero ya no describen el orden real del código.

Desde ahora:

- El repositorio y sus pruebas determinan qué está implementado.
- Este plan determina qué falta y en qué orden se aprueba.
- Cada entrega debe indicar fase, commit, archivos, pruebas, riesgos y pendientes.
- Ninguna fase se considera completa por el texto de un chat: requiere evidencia en código y pruebas.
- `main`, producción, dominio, base, migraciones y secretos permanecen fuera de alcance hasta la fase 14.

## 2. Resumen ejecutivo del estado real

El proyecto no está empezando. Ya tiene un motor financiero considerablemente más sólido que el plan original, un contrato documental versionado, cuatro plantillas funcionales y exportación web/PDF.

### Línea base verificada

- 27 archivos de pruebas.
- 366 pruebas en verde y 1 `todo`.
- Typecheck limpio.
- Build de producción limpio.
- Árbol de trabajo limpio y rama sincronizada.
- Titan Web B2 no fue cerrado con datos inventados.
- Sin cambios en `main`, producción, base, migraciones, secretos o dominio.

### Qué ya está construido

- Envío calculado por pedido/ticket, con política triestado y compatibilidad con datos legados.
- Financiación y descuentos con reglas de participación, netos y anti doble descuento.
- Mix de canales, comisiones por canal y cero contaminación entre tienda y marketplace.
- Product Ads incorporado a inversión y MER por perímetro.
- Cascada de funnel sin doble conteo.
- Contradicción entre margen declarado y calculado.
- Evidencia estructurada y publicación selectiva de cifras.
- Separación económica estricta entre facturación incremental, contribución incremental y ahorro publicitario.
- Motor determinístico de escenarios a 90 días con curvas por magnitud.
- Detalle mensual en web y PDF.
- Cuatro plantillas versionadas: diagnóstico, proyección 90 días, propuesta y proyección + propuesta.
- Correcciones de redacción comercial, supuestos, dispersión y reinversión.
- Defaults y metadatos de planes/comisiones para Tiendanube, Shopify, WooCommerce, Empretienda y marketplaces.

### Qué todavía impide considerar la herramienta terminada

- Los productos siguen codificados como tres campos fijos.
- Falta presupuesto de arranque para negocios sin historial publicitario.
- Retención y recompra no tienen el bloque adaptativo completo.
- Mayorista y Mixto no tienen motor económico ni reglas comerciales implementadas.
- La auditoría de plataformas del último commit necesita revisión independiente y datos reales de liquidación.
- Las plantillas funcionan, pero todavía no aplican el sistema visual aprobado.
- Falta rediseñar la interfaz clara tipo cabina operativa.
- Falta QA visual, E2E, piloto real, integración y publicación controlada.

## 3. Decisiones funcionales confirmadas

### Tipos de diagnóstico

El usuario elige uno de tres alcances:

1. **Minorista:** tienda propia, marketplace y adquisición/retención B2C según canales activos.
2. **Mayorista:** economía B2B, pedido mínimo, descuentos, cuentas y capacidad.
3. **Mixto:** activa Minorista y Mayorista y los compara sin duplicar facturación, stock, capacidad ni hallazgos.

La falta de datos no crea un cuarto diagnóstico. Es una **modalidad de evidencia**:

- Verificada.
- Declarada.
- Parcial.
- No disponible.
- No aplica.

### Reglas económicas no negociables

- Nunca sumar magnitudes incompatibles.
- Facturación incremental responde “cuánto vende de más”.
- Contribución incremental responde “cuánto deja después de costos variables”.
- Ahorro publicitario responde “cuánto gasto improductivo se evita”.
- El diagnóstico describe la situación actual; no proyecta.
- Proyección y propuesta comunican contribución como magnitud principal y facturación como contexto secundario.
- El ahorro por consolidación se trata conservadoramente como ahorro/reasignación explicada, no como facturación.
- Meta y Google se proyectan como pool combinado mientras no exista atribución reconciliada.
- MER de tienda usa facturación e inversión de tienda; MER de marketplace usa facturación e inversión de marketplace.
- Retargeting, email y WhatsApp son palancas sobre un mismo universo, no tres oportunidades sumables.
- Un cupón sólo se recomienda si la contribución post descuento sigue siendo positiva.
- Contenido, stock y capacidad son restricciones o modificadores de viabilidad; no generan cifras por sí solos.

### Envío

El formulario debe conservar un estado explícito:

- **Sí, el vendedor absorbe costo:** se carga bruto, cobrado al comprador y neto derivado.
- **No, el vendedor no absorbe costo:** no afecta el margen ni aparece como palanca económica en proyección/propuesta.
- **Sin confirmar:** retiene las cifras dependientes; nunca asume cero.

### Productos

- Lista dinámica de 1 a 5 productos.
- Los tres primeros son el mínimo sugerido, no un límite técnico.
- Se muestra cobertura del catálogo analizado.
- Una muestra parcial no se normaliza como si fuera el 100% del negocio.
- Si no se conoce el resto del catálogo, el margen total queda retenido; se publica sólo el margen de la muestra.

### Propuesta comercial

- El motor determina hallazgos y servicios sugeridos.
- El vendedor elige alcance, paquete, precio y si el bloque comercial se incluye.
- El sistema nunca inventa precios.
- Diagnóstico, proyección y propuesta son documentos separados, aunque exista una salida combinada opcional.

## 4. Plan maestro normalizado · 14 fases

### Fase 1 · Baseline, fixtures y gobernanza — COMPLETA

**Incluye:** Snake Store, Titan Web B1, casos sintéticos, reglas de ausencia, cero/false/null, compatibilidad y handoffs.  
**Evidencia:** suite actual de 366 pruebas + 1 pendiente.  
**Pendiente externo:** Titan Web B2 sólo se completa con envío neto y liquidación reales.

### Fase 2 · Corrección económica y canales — COMPLETA

**Incluye:** envío, financiación, descuentos, mix de canales, comisiones, Product Ads, MER por perímetro, cascada del funnel, contradicción de margen y precisión decimal.  
**Cierre:** técnicamente completo y cubierto por regresión.

### Fase 3 · Productos dinámicos y cobertura — PENDIENTE

**Estado comprobado:** el formulario y el cálculo siguen leyendo `producto_1`, `producto_2` y `producto_3`.  
**Entregables:** modelo dinámico 1–5, migración compatible dentro del JSON versionado, cobertura, margen de muestra vs total, confianza y pruebas de catálogo parcial.  
**Criterio de aceptación:** Titan Web con 60% de cobertura no puede presentarse como margen total del negocio.

### Fase 4 · Evidencia, notas y hallazgos — MAYORMENTE COMPLETA

**Completo:** evidencia estructurada, estados ausente/no aplica, notas visibles, contradicción, creativos evaluados por contenido, clips de ML con campo triestado, financiación sólo con evidencia.  
**Pendiente:** “plan mal dimensionado” permanece bloqueado hasta relevar costo actual, alternativa, límite usado y ahorro verificable. No debe aparecer sin esos datos.

### Fase 5 · Plataformas y comisiones — EN AUDITORÍA

**Último commit:** `c4cb51a`.  
**Construido:** metadatos de plan, país, vigencia, origen, verificación y provisionalidad; compatibilidad con configuración legada; defaults para plataformas; estructura para liquidación real.  
**Falta para cerrar:** auditoría independiente del commit, revisar vigencia de benchmarks, mostrar metadatos relevantes en interfaz y cargar liquidaciones reales sin confundir benchmark con evidencia del cliente.

### Fase 6 · Presupuesto de arranque — PENDIENTE

Separar:

1. Piso teórico de optimización por compra.
2. Presupuesto de arranque por evento intermedio.
3. Supuestos y origen de cada benchmark.
4. Rango y confianza.

Sin historial se publica un rango condicionado, nunca “la inversión que necesitás”.

### Fase 7 · Medición y publicidad por plataforma — PARCIAL

**Completo:** Product Ads, inversión publicitaria total, MER por perímetro, Meta/Google como pool y no doble conteo.  
**Pendiente:** campos y lecturas homogéneas por plataforma, atribución conciliada cuando exista, calidad de tracking, presupuesto por campaña/producto y reglas de contenido como viabilidad.

### Fase 8 · Retención, carrito y recompra — PARCIAL

**Completo:** cascada disjunta de navegación, carrito y checkout; flags básicos de recuperación y retargeting.  
**Pendiente:** canales activos, secuencia, incentivo, tasa actual, bloque de segunda compra, costos y reglas de contribución post descuento.  
**Regla:** recuperación de carrito es una sola oportunidad con varias palancas.

### Fase 9 · Mayorista y Mixto — PENDIENTE

**Mayorista requiere:** precios/escalas, pedido mínimo, costos B2B, condiciones de pago, funnel de cuentas, recompra, capacidad, concentración y adquisición.  
**Mixto requiere:** canales activables, variables compartidas una sola vez, comparabilidad y anti-canibalización.  
**Bloqueo comercial:** definir qué servicios B2B vende Velocentum y cuáles quedan como recomendación.

### Fase 10 · Motor de escenarios a 90 días — TÉCNICAMENTE COMPLETA

**Construido:** escenarios conservador/base/potencial; detalle mensual; separación entre acumulado 90 días y ritmo mensual; curvas distintas por magnitud; retención por evidencia/margen/envío; límites y supuestos visibles.  
**Curvas vigentes:**

- Facturación/contribución: conservador 25/50/75; base 40/70/100; potencial 50/85/100.
- Ahorro: conservador 50/75/100; base 75/100/100; potencial 85/100/100.

**Falta de producto:** validar el lenguaje y los escenarios con 2–3 casos reales antes de integrarlo.

### Fase 11 · Documento de diagnóstico — FUNCIONAL / VISUAL PENDIENTE

**Construido:** plantilla versionada, modelo documental, render web/PDF, guardrails y descarga.  
**Debe mostrar:** alcance, calidad de datos, foto actual, hallazgos, canales activos/inactivos, riesgos, prioridades y próximos pasos.  
**No debe mostrar:** escenarios, promesas futuras, paquete o precio.

### Fase 12 · Documento de proyección — FUNCIONAL / VISUAL PENDIENTE

**Construido:** plantilla versionada, escenarios y tabla mensual.  
**Debe mostrar:** punto de partida, restricciones, conservador/base/potencial, contribución como cifra dominante, facturación incremental secundaria, ahorro separado, supuestos, 30/60/90 y condiciones de viabilidad.

### Fase 13 · Propuesta comercial y rediseño visual — PARCIAL

**Construido:** plantilla de propuesta y salida combinada.  
**Pendiente funcional:** selector manual de servicios, alcance, paquete, precio y visibilidad.  
**Pendiente visual:** aplicar el sistema aprobado a PDFs y herramienta; generar variantes 16:9 y A4; modernizar navegación y resultados.

### Fase 14 · QA final, integración y publicación — PENDIENTE

Orden obligatorio:

1. QA numérico completo y fixtures reales/sintéticos.
2. QA visual de todas las páginas y resoluciones.
3. E2E de formulario → cálculo → documento → PDF.
4. Piloto con Snake Store y Titan Web verificado.
5. Revisión de seguridad, compatibilidad Lovable y rollback.
6. Pull request a `main`.
7. Publicación controlada y smoke test.

## 5. Sistema visual aprobado

### Dirección

Estética de consultoría premium + software de crecimiento: clara, moderna, con lavanda/violeta, tarjetas redondeadas, KPIs compactos, mucha jerarquía y espacio en blanco. El dark queda como opción interna posterior; resultados y PDFs son claros por legibilidad en videollamada e impresión.

### Paleta consolidada

| Token | Color | Uso |
|---|---:|---|
| Violeta principal | `#3B2EF5` | acciones, selección, cifras clave |
| Violeta brillante | `#4B39FF` | énfasis y gráficos |
| Violeta suave | `#7A6BFF` | estados y degradados |
| Azul noche | `#0D0B2D` | títulos y fondos de contraste |
| Texto principal | `#171437` | cuerpo destacado |
| Texto secundario | `#55546B` | explicaciones |
| Fondo | `#FAF9FF` | página |
| Fondo lavanda | `#F2EFFF` | secciones |
| Tarjeta | `#FFFFFF` | superficies |
| Borde | `#D9D3FF` / `#E9E5FF` | divisores suaves |
| Advertencia | `#FBBF24` | dato a validar |
| Éxito | `#20A464` | condición saludable |
| Riesgo | `#D64A4A` | bloqueo o pérdida |

**Tipografía:** Satoshi para títulos/cifras; Inter para texto, formularios y tablas.

### Componentes reutilizables

- Portada con eyebrow, título grande, subtítulo y chips de alcance.
- Tarjetas KPI con origen y nivel de confianza.
- Hallazgos con prioridad, evidencia, magnitud y acción.
- Bloque de contradicción.
- Comparación por canal.
- Escenarios con tabla mensual y acumulado 90 días.
- Roadmap 30/60/90.
- Restricciones y supuestos.
- Servicios recomendados ligados a hallazgos.
- Próximo paso y cierre.

### Dos formatos, una misma fuente de datos

- **16:9:** para pantalla, llamada y presentación.
- **A4:** para descarga, impresión y envío.

No se escala un formato para obtener el otro: se reutilizan componentes y datos, pero cada uno tiene layout propio.

## 6. Estructura aprobada de los tres PDFs

### PDF 1 · Diagnóstico

1. Portada y alcance.
2. Calidad/cobertura de evidencia.
3. Foto actual y canales.
4. Economía y rentabilidad.
5. Productos y cobertura.
6. Publicidad/medición.
7. Funnel y retención actual.
8. Hallazgos priorizados.
9. Riesgos y contradicciones.
10. Prioridades inmediatas.
11. Datos faltantes.
12. Próximo paso.

### PDF 2 · Proyección a 90 días

1. Portada.
2. Punto de partida.
3. Restricciones.
4. Tres escenarios.
5. Detalle mes 1, 2 y 3.
6. Contribución incremental dominante.
7. Facturación incremental secundaria.
8. Ahorro publicitario separado.
9. Palancas y supuestos.
10. Roadmap 30/60/90.
11. Condiciones para escalar y recalcular.

### PDF 3 · Propuesta

1. Portada.
2. Objetivo comercial.
3. Hallazgos que justifican el alcance.
4. Servicios recomendados.
5. Qué incluye / qué no incluye.
6. Metodología de trabajo.
7. Entregables.
8. Roadmap y gobernanza.
9. KPIs de seguimiento.
10. Paquete y precio manual.
11. Condiciones.
12. Próximo paso.

## 7. Orden inmediato recomendado

1. **Detener nuevas funcionalidades después del bloque actual.**
2. Auditar `c4cb51a` y documentar la fase 5.
3. Incorporar este plan al repositorio como fuente de verdad.
4. Ejecutar fase 3: productos dinámicos y cobertura.
5. Ejecutar fase 6: presupuesto de arranque.
6. Completar fases 7 y 8 en bloques independientes.
7. Definir comercialmente mayorista antes de fase 9.
8. Aplicar el diseño a documentos antes del rediseño general de la interfaz.
9. Cerrar con QA visual/E2E y piloto.

No conviene iniciar el rediseño total mientras todavía cambien campos y lógica de productos, presupuesto, retención y mayorista. Sí conviene construir desde ya los tokens y componentes documentales reutilizables.

## 8. Riesgos y decisiones pendientes

| Tema | Estado | Decisión necesaria |
|---|---|---|
| Titan Web B2 | Bloqueado por datos | envío neto y liquidación real |
| Plan mal dimensionado | Bloqueado por evidencia | costo, alternativa, límite y ahorro |
| Retención | Comercial | si Velocentum vende email/WhatsApp/automatización |
| Mayorista | Comercial | servicios B2B ofrecidos y alcance |
| Paquetes/precios | Comercial | catálogo manual de ofertas |
| Benchmarks de plataforma | Mantenimiento | responsable y periodicidad de vigencia |
| Assets de marca | Diseño | logo vectorial y fuentes licenciadas/embebibles |

Ninguna de estas decisiones habilita inventar datos. Si falta evidencia, la cifra se retiene y la recomendación queda cualitativa.

## 9. Prompt de control para Claude Code

Pegarlo en la sesión que trabaja sobre `velocentum-diagnostico-web-local`:

> Detené la implementación de nuevas funcionalidades al terminar cualquier operación segura que esté en curso. No descartes trabajo ni reescribas historia.
>
> Antes de continuar, verificá rama, HEAD, árbol limpio y sincronización. La referencia auditada al 21/08/2026 es rama `feat/noche-continuacion`, HEAD `c4cb51a20e4e437f519ab934c55b92e329dfc398`, `origin/main` `92727e074d55d8657f2087993b79705b71812e4a`, con 366 pruebas en verde y 1 todo, typecheck y build limpios. Si el HEAD actual es posterior, enumerá los commits adicionales y auditá su alcance; no retrocedas.
>
> Leé `AGENTS.md`, todos los handoffs de `docs/` y el archivo “Plan maestro consolidado · Diagnóstico e-commerce Velocentum · 21/08/2026”. Creá o actualizá en `docs/` una única fuente de verdad con las 14 fases normalizadas. No copies numeraciones históricas sin reconciliarlas.
>
> Entregá una matriz con: fase, requisito, estado real, evidencia archivo:línea, pruebas existentes, pruebas faltantes, riesgo, bloqueo y siguiente acción. Auditá especialmente el commit `c4cb51a` de plataformas/comisiones con un agente read-only independiente y verificá que benchmark, liquidación de configuración y liquidación del cliente no se confundan.
>
> No implementes todavía las fases siguientes. No toques `main`, producción, dominio, base, migraciones, secretos ni Titan Web B2. No publiques. No inventes precios, benchmarks, liquidaciones ni decisiones comerciales.
>
> Ejecutá suite completa, typecheck y build. Hacé commit y push únicamente del documento reconciliado y de pruebas/documentación estrictamente necesarias para auditar el bloque actual. Terminá con un handoff que indique HEAD, pruebas, observaciones, bloque actual y orden recomendado. Esperá aprobación antes de empezar productos dinámicos.

## 10. Criterio de cierre del plan

La herramienta se considera terminada cuando:

- Los tres tipos de diagnóstico funcionan con evidencia parcial sin afirmar de más.
- Ninguna cifra mezcla facturación, contribución y ahorro.
- Productos, presupuesto, retención, mayorista y canales son adaptativos.
- Diagnóstico, proyección y propuesta se generan desde una única capa de datos versionada.
- Los tres PDFs respetan la estructura y el sistema visual aprobado en 16:9 y A4.
- La interfaz clara funciona en llamada de 45 minutos y muestra estados/orígenes con claridad.
- Las pruebas numéricas, visuales y E2E pasan.
- Snake Store y Titan Web verificado producen resultados defendibles.
- Existe rollback y la integración/publicación fue autorizada expresamente.

---

**Conclusión:** el proyecto está en un punto intermedio-avanzado. El núcleo financiero y documental ya existe; el próximo trabajo correcto no es “seguir la fase 4” a ciegas, sino cerrar su auditoría, adoptar este plan como fuente de verdad y luego completar los módulos de producto que aún faltan antes del rediseño y la publicación.
