<!--
Recibido de Matías por chat el 2026-08-22 e incorporado a docs/ sin
modificaciones, como material de referencia para las fases 11, 12 y 13.
No implementar a partir de este documento sin aprobación explícita del
bloque técnico correspondiente (ver docs/plan-maestro-fases.md).
-->

# Especificacion visual · PDFs Velocentum

Referencia preparada para las fases 11, 12 y 13 del plan de evolucion del diagnostico e-commerce.

Estado: especificacion para conservar y aplicar mas adelante. **No implementar durante la fase 2.**

Material visual de referencia: `Dropnkicks propuesta.pdf` (9 paginas, formato horizontal 16:9).

---

## 1. Objetivo

Crear un sistema de entregables reconocible como Velocentum, con tres salidas diferentes que compartan identidad visual pero no mezclen objetivos:

1. PDF de diagnostico.
2. PDF de proyeccion a 90 dias.
3. PDF de propuesta comercial final.

El resultado debe sentirse como consultoria y growth premium con una capa SaaS: moderno, claro, tecnologico y profesional. No debe parecer una plantilla generica ni un documento generado automaticamente.

---

## 2. Principio estructural

Los calculos y el contenido se mantienen separados del diseño:

```text
motor deterministico
  -> datos estructurados aprobados
  -> plantilla visual Velocentum
  -> PDF
```

El modelo de lenguaje puede redactar, resumir y explicar. No puede:

- calcular cifras;
- inventar montos o porcentajes;
- modificar resultados del motor;
- decidir precios;
- cambiar libremente posiciones, tamaños o jerarquias visuales.

Las plantillas deben ser deterministicas y reutilizables.

---

## 3. Sistema visual comun

### Direccion

- Fondo blanco u off-white con lavanda muy claro.
- Violeta-azul intenso como acento principal.
- Texto principal azul noche casi negro.
- Cards blancas con borde lavanda sutil.
- Esquinas amplias y sombras muy suaves.
- Iconos lineales violetas dentro de circulos claros.
- Lineas, puntos, grids y curvas geometricas apenas visibles.
- Mucho espacio negativo y una idea principal por pagina.
- Branding discreto, sin repetir el dominio en cada pagina.

### Paleta unica propuesta

| Token | Valor | Uso |
|---|---:|---|
| Primario | `#3B2EF5` | Acciones, cifras y palabras destacadas |
| Primario brillante | `#4B39FF` | Gradientes y estados activos |
| Primario suave | `#7A6BFF` | Graficos y elementos secundarios |
| Navy | `#0D0B2D` | Titulos y cifras principales |
| Texto | `#171437` | Cuerpo principal |
| Texto secundario | `#55546B` | Explicaciones con contraste suficiente |
| Fondo | `#FAF9FF` | Fondo general |
| Fondo lavanda | `#F2EFFF` | Secciones y destacados |
| Card | `#FFFFFF` | Superficies |
| Borde | `#D9D3FF` | Bordes visibles |
| Borde suave | `#E9E5FF` | Separadores |
| Advertencia | `#FBBF24` | Datos pendientes y validaciones |
| Exito | `#20A464` | Estado saludable |
| Riesgo | `#D64A4A` | Alertas criticas |

Esta tabla reemplaza combinaciones anteriores. Antes de implementar se valida contraste y reproduccion impresa.

### Tipografia

- Titulos y cifras: Satoshi Bold/ExtraBold.
- Cuerpo, tablas e interfaz: Inter.
- Fallback si Satoshi no esta disponible: Inter.
- Pocos tamaños y jerarquia consistente.
- Titulos grandes con tracking negativo, sin ocupar espacio necesario para los datos.

### Componentes compartidos

- Portada con cliente, tipo de documento, fecha y version.
- KPI principal.
- KPI secundario.
- Card de hallazgo.
- Card de oportunidad.
- Badge de evidencia.
- Badge de confianza.
- Alerta de contradiccion.
- Comparacion entre canales.
- Proceso con flechas.
- Tabla compacta.
- Grafico de escenarios.
- Roadmap 30/60/90.
- Restriccion visible.
- Servicio recomendado.
- Proximo paso.

---

## 4. Estados y lenguaje de evidencia

Cada numero o afirmacion relevante debe poder mostrar:

- Verificado.
- Declarado.
- Estimado por configuracion.
- No disponible.
- No aplica.

El color nunca funciona solo. Se acompana con texto e icono.

La cobertura y la confianza deben aparecer cerca del resultado, no escondidas al final.

---

## 5. PDF de diagnostico

### Objetivo

Mostrar que esta pasando hoy, con que evidencia y que problemas requieren prioridad. No vender todavia.

### Estructura recomendada

1. Portada y alcance.
2. Resumen ejecutivo.
3. Cobertura y calidad de la informacion.
4. Foto economica actual.
5. Desempeno por canal.
6. Funnel y fugas sin solapamiento.
7. Productos y cobertura analizada.
8. Publicidad y medicion.
9. Retencion, recompra y contenido.
10. Hallazgos priorizados.
11. Alertas, contradicciones y datos por validar.
12. Proximos pasos.

### Reglas

- Distinguir dato observado, calculo, interpretacion y accion.
- No mostrar oportunidad monetaria cuando la base economica tenga una contradiccion critica.
- No presentar margen de muestra como margen total.
- Minorista y Mayorista se muestran separados en Mixto antes de cualquier total combinado.
- El semaforo no reemplaza la explicacion.

---

## 6. PDF de proyeccion a 90 dias

### Objetivo

Mostrar que podria capturarse bajo supuestos visibles, sin prometer resultados.

### Estructura recomendada

1. Portada y alcance.
2. Punto de partida validado.
3. Restricciones actuales.
4. Escenarios conservador, base y potencial.
5. Contribucion acumulada durante 90 dias.
6. Ritmo mensual alcanzado al dia 90.
7. Proyeccion por canal y palanca.
8. Supuestos utilizados.
9. Roadmap 30/60/90.
10. Riesgos y condiciones.
11. Metricas que se revisaran.

### Reglas

- El conservador es escenario de planificacion, no garantia.
- El potencial solo aparece con cobertura alta.
- Acumulado y ritmo mensual final nunca se mezclan.
- Mostrar que restriccion recorta cada escenario: stock, capacidad, presupuesto, contenido o evidencia.
- Retargeting es una palanca, no una oportunidad adicional.
- No sumar conversiones atribuidas por Meta y Google.
- No combinar tienda y marketplace si periodo, moneda o perimetro no son compatibles.
- Todo numero debe provenir del motor deterministico.

---

## 7. PDF de propuesta comercial final

### Objetivo

Convertir hallazgos ya demostrados en una solucion, alcance, etapas y decision comercial.

### Estructura recomendada

1. Portada.
2. Contexto y oportunidad principal.
3. Problemas priorizados que se van a resolver.
4. Solucion recomendada.
5. Servicios incluidos.
6. Entregables.
7. Implementacion por etapas.
8. Metricas y forma de seguimiento.
9. Responsabilidades de Velocentum y del cliente.
10. Paquete, alcance y precio.
11. Condiciones y exclusiones.
12. Proximo paso.

### Reglas

- Cada servicio debe estar conectado con un hallazgo.
- No mostrar servicios que Velocentum no haya habilitado comercialmente.
- Precio, paquete y alcance requieren seleccion manual.
- El sistema nunca inventa precios.
- La propuesta no repite todo el diagnostico: resume solo lo necesario para justificar la solucion.

---

## 8. Dos formatos de salida

La referencia Drop'n Kicks esta disenada como presentacion horizontal 16:9. Funciona muy bien en pantalla, pero no debe escalarse automaticamente para imprimir.

Crear dos perfiles desde el mismo contenido estructurado:

### Pantalla

- Formato 16:9 horizontal.
- Para videollamada, presentacion y lectura digital.
- Titulos grandes, procesos y comparaciones visuales.

### Impresion

- Formato A4.
- Maquetacion propia, no reduccion de la version 16:9.
- Mayor contraste y cuerpos tipograficos adecuados para papel.
- Tablas que puedan continuar entre paginas.

---

## 9. Adaptacion por diagnostico

### Minorista

- Funnel de tienda.
- Margen y productos.
- Meta, Google y marketplace.
- Carritos, recompra y contenido.
- Presupuesto de arranque.

### Mayorista

- Margen mayorista.
- Pedido minimo rentable.
- Funnel B2B.
- Cartera, recompra y concentracion.
- Capacidad y recupero de CAC.

### Mixto

- Dos lecturas separadas y comparables.
- Resumen combinado solo cuando no haya duplicacion.
- Restricciones compartidas mostradas una sola vez.

---

## 10. Criterios de aceptacion visual

- Sin texto cortado, solapado o fuera de pagina.
- Sin tablas ilegibles.
- Sin numeros inventados o diferentes del motor.
- Contraste suficiente en pantalla, impresion y videollamada.
- Una idea principal por pagina.
- Alineaciones, margenes y padding consistentes.
- Branding y logo correctos.
- Estados comprensibles tambien sin color.
- Nombres largos de clientes y montos grandes no rompen la composicion.
- Valores `sin_datos` y `no_aplica` tienen presentacion propia.
- Las tres salidas se reconocen como parte del mismo sistema.
- El PDF final se renderiza pagina por pagina y se inspecciona visualmente antes de entregarse.

---

## 11. Integracion con el plan

- Fase 11: construir las plantillas de diagnostico y proyeccion.
- Fase 12: agregar la plantilla de propuesta comercial y el control manual de paquetes/precios.
- Fase 13: llevar el mismo sistema visual a la interfaz de la herramienta.

Esta especificacion no cambia el orden actual ni agrega trabajo a la fase 2.

---

## 12. Instruccion para Claude

Guardar esta especificacion y el PDF `Dropnkicks propuesta.pdf` como material de referencia para las fases 11, 12 y 13.

No implementar ahora, no interrumpir la fase 2 y no modificar calculos a partir de esta referencia.

Cuando llegue la fase 11, primero devolver:

1. inventario de componentes;
2. estructura de datos que consume cada componente;
3. wireframes de los tres documentos;
4. estrategia de exportacion 16:9 y A4;
5. criterios de prueba visual y numerica.

La implementacion comienza solamente despues de aprobar esos cinco puntos.
