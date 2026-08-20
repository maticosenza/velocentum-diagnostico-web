# Motor documental Velocentum v1

## Objetivo

Generar documentos consistentes para cada cliente sin volver a diseñar ni copiar
números manualmente. El cálculo produce un expediente único; las plantillas sólo
deciden qué bloques mostrar; el renderer exporta el resultado.

La primera salida será 16:9 clara, optimizada para videollamada y envío digital.
Una variante A4 podrá agregarse después usando el mismo modelo de datos, sin
duplicar reglas de negocio.

## Regla principal

La IA puede redactar síntesis, pero no calcula, valida cifras, elige escenarios ni
selecciona precios. Ninguna plantilla vuelve a ejecutar fórmulas.

```text
Diagnóstico guardado
  -> adaptador conservador
  -> DocumentContextV1
  -> políticas de publicación
  -> bloques de una plantilla versionada
  -> preview y PDF
```

## Un expediente, tres documentos

### Diagnóstico

Responde dónde está hoy el negocio, qué está bien, qué pierde y qué no puede
evaluarse todavía.

1. Portada y alcance.
2. Cobertura y calidad de datos.
3. Foto actual del negocio.
4. Economía y canales.
5. Hallazgos priorizados.
6. Riesgos, contradicciones y restricciones.
7. Plan 30/60/90.
8. Próximos pasos y metodología.

### Proyección a 90 días

Responde qué puede ocurrir bajo supuestos explícitos y qué limita cada escenario.

1. Portada y baseline.
2. Cobertura y confianza.
3. Oportunidad valorizable y no valorizable.
4. Escenario conservador.
5. Escenario base.
6. Escenario potencial, sólo cuando corresponda.
7. Palancas sin doble conteo.
8. Restricciones, KPIs y roadmap.
9. Supuestos y metodología.

El acumulado de 90 días y el ritmo mensual al día 90 son métricas distintas y
nunca comparten una misma etiqueta.

### Propuesta

Responde qué hará Velocentum, qué recibe el cliente y bajo qué condiciones.

1. Contexto ejecutivo.
2. Hallazgo -> acción -> entregable -> métrica.
3. Solución seleccionada.
4. Alcance y exclusiones.
5. Roadmap y responsabilidades.
6. Inversión, sólo con aprobación manual.
7. Próximo paso.

La interfaz puede exportar los tres documentos por separado o componer
`Proyección + Propuesta` como un único archivo sin duplicar datos.

## Estados publicables

Toda cifra debe conservar su estado:

- `calculado`: tiene valor, confianza, evidencia y supuestos.
- `retenido`: el dato existe o fue estimado, pero no es publicable.
- `no_aplica`: el bloque no corresponde a ese negocio.

Un cero real siempre es `calculado` con valor `0`; nunca representa ausencia de
datos. Los datos de origen se distinguen como `verificado`, `declarado`,
`no_disponible` o `no_aplica`.

## Política de envío

- No absorbe costo: costo neto cero; no aparece como costo u oportunidad en los
  documentos.
- Sí absorbe costo: entra al margen cuando el neto está confirmado.
- Sin confirmar: no se inventa cero; las cifras dependientes quedan retenidas.
- Diagnóstico anterior con un monto guardado: conserva el cálculo legado, pero el
  documento debe indicar que la política no fue confirmada hasta actualizarlo.

## Diseño compartido

Tema inicial: `velocentum-light/v1`.

- Portada con gradiente negro, azul y violeta.
- Contenido en fondo claro para legibilidad en llamada y PDF.
- Transiciones oscuras entre secciones.
- KPIs en cards, hallazgos con prioridad y escenarios con confianza visible.
- Una sola biblioteca de bloques para diagnóstico, proyección y propuesta.
- Logo, tipografías, colores, espaciado, radios y pies de página versionados.

## Bloques reutilizables

- Portada.
- Grilla de KPIs.
- Calidad de datos.
- Canales.
- Hallazgos.
- Escenarios.
- Roadmap.
- Restricciones.
- Oferta comercial.
- Próximos pasos.
- Metodología.

Cada plantilla ordena bloques; ningún bloque conoce el formulario original ni
ejecuta cálculos.

## Validaciones antes de exportar

- Toda cifra visible apunta a evidencia o resultado calculado.
- Ningún dato retenido se transforma en cero.
- Ningún `no_aplica` se presenta como problema.
- Benchmark y estimación muestran origen y vigencia.
- No se publica margen total con cobertura parcial.
- MER y ROAS no se mezclan.
- Product Ads no se descuenta dos veces.
- Hallazgo y monto se relacionan por ID estable, no por coincidencia de texto.
- El escenario potencial se oculta con confianza insuficiente.
- Precio y paquete sólo aparecen con aprobación comercial manual.
- No quedan placeholders, `undefined`, `NaN` ni texto sin normalizar.
- El documento registra versión de plantilla y reglas.

## Implementación incremental

1. Tipos, estados y políticas con pruebas.
2. Adaptador desde el diagnóstico actual.
3. Motor de escenarios estable.
4. Plantillas como modelos de bloques, todavía sin PDF.
5. Preview web.
6. Renderer PDF cargado de forma diferida.
7. Formulario comercial manual.
8. Regresión de Titan Web y Snake Store.
9. QA visual página por página.

No se necesita una tabla nueva para la primera versión: se puede generar el PDF
bajo demanda y conservar la estructura versionada dentro del JSON existente.
