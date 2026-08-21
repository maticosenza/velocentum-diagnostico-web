# Fase 3 · Hallazgos pendientes de evidencia

Estado: no requieren migración para ser desactivados. Se documentan los datos necesarios antes de volver a habilitarlos.

## Plan de plataforma mal dimensionado

El nombre del plan contratado no demuestra que esté mal dimensionado. Para justificar el hallazgo hacen falta, como mínimo:

- costo mensual real del plan actual;
- costo de una alternativa comparable;
- función o límite concreto que el negocio usa o necesita;
- ahorro o beneficio verificable de cambiar de plan.

Hasta incorporar esa comparación estructurada, el hallazgo no se genera.

## Clips de Mercado Libre — resuelto (2026-08-20)

Se incorporó el campo triestado `ml_tiene_clips: boolean | null` al formulario y al modelo de
datos. El hallazgo `clips_ml` sólo se genera cuando `vende_mercado_libre` es `true` y
`ml_tiene_clips` es `false` explícito; `null` (no preguntado) o `true` no lo activan. No requirió
migración: `datos` es una columna JSON.
