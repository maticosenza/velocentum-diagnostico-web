# Fase 11/12 · Diseño técnico previo (los cinco puntos pedidos)

Entregado antes de escribir código, tal como pide
`docs/especificacion-visual-pdfs-fases-11-13.md`, sección 12: "Cuando
llegue la fase 11, primero devolver: inventario de componentes, estructura
de datos, wireframes, estrategia de exportación, criterios de prueba." Este
documento cubre los cinco. No requiere aprobación para seguir con la
estructura de contenido (instrucción explícita del bloque), pero queda acá
para revisión.

Alcance de este documento: diseño para los TRES PDFs (diagnóstico,
proyección, propuesta), aunque la implementación de este bloque (fase
11/12, "parte funcional") sólo cubre diagnóstico y proyección — la
propuesta es fase 13 (bloque 4 de este mismo loop).

---

## 1 · Inventario de componentes

Reutiliza el vocabulario de bloques que ya existe en
`src/documents/templates/velocentum-v1/types.ts` (`DocumentBlock`) en vez
de inventar uno nuevo — son 14 tipos ya implementados con su renderer en
`renderers/pdf/document.tsx` y `renderers/web/document-renderer.tsx`.
Este bloque (11/12, sólo estructura y contenido, sin capa visual) reutiliza
esos 14 tipos para toda la expansión de secciones: no agrega ningún tipo de
bloque nuevo, así que no toca ningún renderer.

| Componente (spec visual) | Bloque existente reutilizado | Notas |
|---|---|---|
| Portada | `cover` | Sin cambios. |
| KPI principal / secundario | `metric-grid` | Ya soporta N items con formato money/percent/number/ratio. |
| Card de hallazgo | `findings` | Ya trae capa, prioridad, confianza, magnitud, evidencia. |
| Card de oportunidad | `findings` (con `amount`) | Un hallazgo con monto es una "oportunidad". |
| Badge de evidencia / confianza | Ya vive dentro de `ValorPublicable`/`Evidencia`, consumido por cualquier bloque | No es un bloque aparte, es un atributo de cada valor publicado. |
| Alerta de contradicción | `restrictions` (filtrado por `bloquea.length > 0`) | Ver punto 2: se separa de "datos faltantes" por ese filtro, no por un tipo nuevo. |
| Comparación entre canales | `metric-grid` (uno por canal) | Pendiente de dato — ver "qué falta" más abajo. |
| Proceso con flechas | `roadmap` | Ya existe (30/60/90). |
| Tabla compacta | `metric-grid` / `findings` | Ambos ya se renderizan como tabla/lista compacta. |
| Gráfico de escenarios | `scenarios` | Ya completo (fase 10). |
| Roadmap 30/60/90 | `roadmap` | Sin cambios. |
| Restricción visible | `restrictions` | Sin cambios. |
| Servicio recomendado | `services` | Ya existe, alimentado por `mapearHallazgos` + `SERVICIOS`. |
| Próximo paso | `next-step` (tipo ya declarado en `types.ts`, sin builder todavía) | Se activa en este bloque para la sección "Próximo paso" del diagnóstico y la proyección. |

**Componentes sin bloque hoy (requieren dato nuevo, no sólo tipo nuevo):**
comparación entre canales con cifras reales (hoy sólo hay el placeholder de
arriba), cobertura de catálogo por producto, publicidad/medición
desglosada, funnel + retención actual. Ver punto 2.

---

## 2 · Estructura de datos que consume cada componente

`DocumentContextV1` (`src/documents/domain/types.ts`) hoy NO tiene: mix por
canal, catálogo de productos, desglose de publicidad/medición, ni funnel o
retención. Todo eso SÍ existe ya en el motor
(`ResultadoCalculo.derivados.canales`, `productosCargados()`,
`derivados.funnel`, los campos `retencion_*`/`recompra_*` de
`DatosDiagnostico`) — el trabajo es de **plomería** (publicar lo que el
motor ya calculó), no de cálculo nuevo.

Diseño de los campos nuevos que haría falta agregar a `DocumentContextV1`
para una futura vuelta con la profundidad completa (no implementados en
este bloque, ver alcance real en la sección "Qué se implementó" del
handoff):

```ts
canales: {
  id: CanalId;
  facturacion: ValorPublicable<number>;
  margen: ValorPublicable<number>;
  comisionEfectiva: ValorPublicable<number>;
  mer: ValorPublicable<number>;
}[];

productos: {
  indice: number;
  nombre: string;
  margen: ValorPublicable<number>;
  pctFacturacion: ValorPublicable<number>;
}[];

publicidadMedicion: {
  deltaMedicion: ValorPublicable<number>;
  cpaObjetivo: ValorPublicable<number>;
  roasObjetivo: ValorPublicable<number>;
  inversionTotal: ValorPublicable<number>;
};

funnelRetencion: {
  tramos: { id: string; etiqueta: string; conversion: ValorPublicable<number> }[];
  recuperacionCarritoPctActual: ValorPublicable<number>;
  recompraTasaActual: ValorPublicable<number>;
};
```

Cada campo sigue el mismo contrato `ValorPublicable<T>` que ya usa
`MetricasActualesDocumento`: nunca un número crudo, siempre con
confianza/evidencia/retención explícita.

**Lo que este bloque SÍ implementa con datos que ya existían en el
contexto documental** (sin agregar los campos de arriba): reordenar y
etiquetar las secciones exactamente como pide el plan maestro, separar
"riesgos y contradicciones" de "datos faltantes" filtrando el mismo array
`restricciones` por `bloquea.length > 0` (riesgo/contradicción, ya bloquea
algo) vs. `bloquea.length === 0` (dato faltante sin bloquear nada crítico),
y agregar "prioridades inmediatas" filtrando `hallazgos` por
`prioridad === "alta"`. Estas tres son reestructuraciones de datos que ya
están en `DocumentContextV1`, cero cálculo nuevo, cero campo nuevo.

---

## 3 · Wireframes de los tres documentos

Representación textual (no hay herramienta de diseño en este entorno; el
wireframe real de referencia visual es `Dropnkicks propuesta.pdf`, ya
guardado). Una fila = una sección = una página o bloque de páginas.

### PDF de diagnóstico (12 secciones)

```
┌─────────────────────────────────────┐
│ 1. Portada y alcance                 │  cover
│ 2. Calidad y cobertura de evidencia   │  coverage
│ 3. Foto actual y canales              │  metric-grid (general + placeholder canales)
│ 4. Economía y rentabilidad            │  metric-grid (margen, mer, breakeven)
│ 5. Productos y cobertura              │  metric-grid (placeholder por producto)
│ 6. Publicidad y medición              │  metric-grid (inversión, delta medición)
│ 7. Funnel y retención actual          │  metric-grid + findings (retención)
│ 8. Hallazgos priorizados              │  findings
│ 9. Riesgos y contradicciones          │  restrictions (bloquea != [])
│ 10. Prioridades inmediatas            │  findings (prioridad alta)
│ 11. Datos faltantes                   │  restrictions (bloquea == [])
│ 12. Próximo paso                      │  next-step
└─────────────────────────────────────┘
```

No muestra (regla dura del bloque): escenarios, promesas futuras, paquete
ni precio — el diagnóstico nunca importa `buildScenarios`/
`buildCommercialSummary`/`buildCommercialOffer`.

### PDF de proyección a 90 días (11 secciones)

```
┌─────────────────────────────────────┐
│ 1. Portada                            │  cover
│ 2. Punto de partida                   │  metric-grid + shipping
│ 3. Restricciones                      │  restrictions
│ 4. Tres escenarios                    │  scenarios
│ 5. Detalle mes 1, 2 y 3               │  scenarios.monthly (ya incluido en el bloque scenarios)
│ 6. Contribución incremental dominante │  commercial-summary
│ 7. Facturación incremental secundaria │  scenarios (línea revenue, ya separada)
│ 8. Ahorro publicitario separado       │  scenarios (línea adSavings, ya separada)
│ 9. Palancas y supuestos               │  scenarios.levers + methodology
│ 10. Roadmap 30/60/90                  │  roadmap
│ 11. Condiciones para escalar/recalcular│ restrictions (bloquea contiene "escalamiento")
└─────────────────────────────────────┘
```

Los puntos 5, 7 y 8 ya están adentro del bloque `scenarios` existente (no
son secciones de página completa nuevas): la "estructura de contenido" acá
es reordenar/titular la sección `scenarios` para que el eyebrow/título
comunique las tres lecturas por separado, no fusionarlas.

### PDF de propuesta comercial (fase 13, bloque 4 — sólo diseño acá)

```
┌─────────────────────────────────────┐
│ 1. Portada                            │  cover
│ 2. Contexto y oportunidad principal   │  commercial-summary
│ 3. Problemas priorizados              │  findings (prioridad alta)
│ 4. Solución recomendada               │  services + texto de síntesis (IA)
│ 5. Servicios incluidos                │  services (por nivel del paquete)
│ 6. Entregables                        │  commercial-offer.deliverables
│ 7. Implementación por etapas          │  roadmap
│ 8. Métricas y seguimiento             │  metric-grid (KPIs de seguimiento)
│ 9. Responsabilidades                  │  texto libre (IA, sin cifras)
│ 10. Paquete, alcance y precio          │  commercial-offer (por nivel)
│ 11. Condiciones y exclusiones         │  commercial-offer.exclusions
│ 12. Próximo paso                      │  next-step
└─────────────────────────────────────┘
```

---

## 4 · Estrategia de exportación 16:9 y A4

Dos perfiles desde el MISMO `DocumentModel` (el modelo de contenido ya es
independiente de la plantilla visual — ver `types.ts`): un tema/layout por
perfil, no una reducción del otro.

- **Pantalla (16:9):** el `renderers/web/document-renderer.tsx` actual ya
  renderiza para pantalla; la plantilla PDF horizontal es la extensión
  natural de ese layout en `renderers/pdf/document.tsx` con una página
  1920×1080pt (o el equivalente en puntos de PDF) por sección de alto
  impacto (portada, KPI principal, escenarios) y layout de dos columnas
  para tablas/tarjetas.
- **Impresión (A4):** una segunda maqueta, NO una escala del layout 16:9:
  cabecera compacta, cuerpo tipográfico mayor para lectura en papel, tablas
  con salto de página (`wrap` de `@react-pdf/renderer`, ya usado en el
  proyecto) en vez de recorte horizontal.
- **Selector de perfil:** un parámetro `outputProfile: "pantalla" | "impresion"`
  en la función de export (`src/documents/renderers/pdf/export-client.ts`),
  que elige la hoja de estilos/estructura de página sin tocar
  `DocumentModel` ni el motor de cálculo — coherente con el principio
  "motor determinístico → datos → plantilla visual → PDF" de la
  especificación.
- Este bloque (11/12, sólo estructura y contenido) NO implementa el
  selector ni las dos maquetas: es trabajo de la capa visual, explícitamente
  diferido. Se deja diseñado acá para que la fase visual no arranque de
  cero.

---

## 5 · Criterios de prueba visual y numérica

**Numérica (implementable y exigible ya, sin esperar la capa visual):**

- Todo `DocumentBlock` que publique un número pasa por `publishValue()`
  (ya existe): nunca un número crudo sin `ValorPublicable`.
- Extender la prueba de frases prohibidas (ya existe en el repo para la
  redacción comercial de 90 días) para que cubra también la redacción
  obligatoria de proyección introducida en este bloque: "Con los datos
  disponibles y bajo estos supuestos, existe un rango de contribución
  incremental potencial de X a Y durante los próximos 90 días" — y que seguya
  rechazando "vas a facturar", "vas a ganar", "el retorno esperado es",
  "vas a recuperar" en cualquier bloque nuevo (riesgos, prioridades,
  próximo paso incluidos).
- El diagnóstico nunca importa `scenarios`/`commercial-summary`/
  `commercial-offer` — prueba de tipo "el documento de diagnóstico no
  contiene ninguno de estos tres bloques", corriendo sobre datasets reales
  (Snake Store, Titan B1/B2).
- "Riesgos y contradicciones" y "datos faltantes" son conjuntos disjuntos
  del mismo array de restricciones (una restricción no puede aparecer en
  los dos) — prueba de invariante estructural.
- "Prioridades inmediatas" ⊆ "Hallazgos priorizados" (todo lo que aparece
  en prioridades inmediatas ya apareció en hallazgos) — prueba de
  invariante estructural.

**Visual (criterios para cuando se implemente la capa visual, no en este
bloque):**

- Sin texto cortado, solapado o fuera de página (ya listado en la
  especificación, sección 10) — se verifica con un render real
  página por página, inspección visual manual o captura automatizada,
  no con una prueba unitaria.
- Nombres largos de cliente y montos grandes no rompen la composición —
  requiere un dataset de prueba con un nombre de cliente artificialmente
  largo y una facturación de 8+ dígitos.
- Estados comprensibles sin color (para accesibilidad e impresión en
  blanco y negro) — requiere revisión manual de cada badge de
  evidencia/confianza.
- Las tres salidas (diagnóstico, proyección, propuesta) se reconocen como
  parte del mismo sistema — revisión manual comparativa, no automatizable.
