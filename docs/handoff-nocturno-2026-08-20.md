# Handoff nocturno · 20 de agosto de 2026

## Estado general

El trabajo quedó aislado en ramas, con `main`, producción, dominio, base de datos,
migraciones y secretos sin modificar. No se publicaron cifras no verificadas ni se
cerró el fixture B2 de Titan Web.

## Patagonia Vessels

- Rama: `feat/admin-mvp-reunion`
- SHA: `786c5977b53f9c114c4dcb8d369b5e1ad2fd8201`
- QA: typecheck, build de producción y 4 pruebas de imágenes correctos.
- Incluye navegación simplificada y móvil, contenido agrupado, edición de textos e
  imágenes, carga y reemplazo en galerías, contactos derivados de consultas y
  adjuntos alineados al límite real de 10 MB.
- Pendiente para la reunión: prueba real formulario → panel → correo, incluyendo
  spam y `Reply-To`.
- Presupuestos manuales salientes requieren una tabla propia. La especificación está
  en `docs/presupuestos-manuales-propuesta.md` del repositorio de Patagonia; no se
  reutilizó `cotizaciones` para evitar contaminar métricas de solicitudes entrantes.

## Diagnóstico Velocentum

- Rama de integración: `feat/fase3-auditoria-diagnostico`
- Base protegida: `main` continúa en `92727e0`.
- Regresión final integrada: 183 pruebas correctas y 1 `todo` explícito para B2.
- Typecheck y build cliente/SSR/Nitro correctos.

### Bloques terminados

1. Regresión compartida de fase 2 con fixtures Snake Store, Titan Web B1 y casos
   sintéticos; B2 permanece pendiente de datos reales.
2. Costo de envío triestado: incluido, excluido o no confirmado. La ausencia de
   confirmación no se publica como cero.
3. Correcciones de fase 3: notas visibles, creativos evaluados por contenido y
   cuotas solamente con participación y costo confirmados. Hallazgos sin evidencia
   de clips de Mercado Libre y plan mal dimensionado quedaron desactivados.
4. Contexto documental normalizado y versionado, separado del cálculo y de la
   presentación.
5. Cuatro plantillas: diagnóstico, proyección 90 días, propuesta y combinación
   proyección + propuesta.
6. Vista web responsive e imprimible en 16:9, con tema claro y transiciones oscuras.
7. Renderer PDF real con `@react-pdf/renderer`, carga diferida compatible con SSR,
   exportación a Buffer/Blob y nombres de archivo portables.

### Política documental aplicada

- Un cero real se conserva como cero.
- `no_aplica` se omite.
- Un dato retenido o sin confirmar aparece como restricción, nunca como cero.
- El escenario potencial se oculta si no existe confianza suficiente.
- Envío y precio comercial solo aparecen cuando fueron habilitados explícitamente.
- Los cálculos provienen del motor determinístico; las plantillas no recalculan.

### QA visual

- Combinado Snake Store: 11 páginas revisadas.
- Caso condicionado Titan Web: 9 páginas revisadas.
- Todas las páginas: 960 × 540, sin hojas vacías, cortes ni solapes.

### Pendientes deliberados

- Conectar las plantillas a una ruta/botones de la interfaz y a diagnósticos vivos.
- Incorporar logo y tipografías oficiales cuando los assets estén en el repositorio.
- Completar el motor de escenarios 90 días y el alcance comercial antes de generar
  una propuesta final de Titan Web.
- Cerrar Titan Web B2 únicamente con envío neto confirmado y liquidación real de
  Mercado Libre.
- Continuar las fases de auditoría por plataforma, mayorista/mixto, retención y
  rediseño integral previstas en el plan.

