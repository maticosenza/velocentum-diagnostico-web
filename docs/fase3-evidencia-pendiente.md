# Fase 3 · Hallazgos pendientes de evidencia

Estado: no requieren migración para ser desactivados. Se documentan los datos necesarios antes de volver a habilitarlos.

## Plan de plataforma mal dimensionado

El nombre del plan contratado no demuestra que esté mal dimensionado. Para justificar el hallazgo hacen falta, como mínimo:

- costo mensual real del plan actual;
- costo de una alternativa comparable;
- función o límite concreto que el negocio usa o necesita;
- ahorro o beneficio verificable de cambiar de plan.

Hasta incorporar esa comparación estructurada, el hallazgo no se genera.

## Clips de Mercado Libre

Vender en Mercado Libre no demuestra que las publicaciones carezcan de clips. Para justificar el hallazgo hace falta un campo triestado específico, por ejemplo `ml_tiene_clips: true | false | null`, donde solo `false` explícito lo active.

Hasta incorporar ese campo al formulario y al modelo de datos, el hallazgo no se genera.
