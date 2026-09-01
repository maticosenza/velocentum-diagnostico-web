# BV4 · F2a ronda 3 — Reparto del plan 30/60/90

Excepción autorizada al límite de dos rondas por fase. La autoriza Matías por
motivo explícito: el reparto temporal es **lógica de negocio, no
presentación**, y por eso no puede diferirse a F3b, que es una fase de arte.

Base: `feat/bv4-rebranding` en `5c063e4`. Sin push. Commit candidato local,
artefactos desde worktree limpio, detención.

## El defecto

En los cuatro PDFs del commit candidato, el plan de acción reparte mal:
Titan tiene como única etapa "DÍAS 61-90"; Snake no tiene 1-30 y su 31-60
tiene una sola línea. Causa: la regla preexistente manda a la etapa 90 toda
línea sin hallazgo que la justifique, y con el modelo v2 las líneas vienen de
la selección comercial, no del mapeo de hallazgos.

## Las tres reglas (confirmadas por Matías)

R1 · INFRAESTRUCTURA ANTES QUE PAUTA. Si `diseno_web` está seleccionado, va
completo en 1-30. El ecosistema debe estar listo antes de invertir en pauta.

R2 · CONTENIDO EN LOS TRES MESES. `contenido_audiovisual`,
`contenido_estatico` y `planificacion_contenido` aparecen en las tres etapas.
La producción se coordina en las dos primeras semanas de cada mes.

R3 · LOS SERVICIOS DE PAUTA PROGRESAN activar → optimizar → escalar.

## El reparto

Los textos salen de las viñetas de `docs/funcional/f2a-textos-servicios.md`,
repartidas. NO se inventa ninguna frase nueva.

| Servicio | 1-30 Activar | 31-60 Optimizar | 61-90 Escalar |
|---|---|---|---|
| meta_ads | configuración de cuenta, píxel y CAPI; estrategia de campañas y audiencias | validación creativa y redistribución de inversión según señales | retargeting progresivo |
| google_ads | cuenta, conversiones y Google Tag; palabras clave y negativas; feed a Merchant Center | optimización de pujas y presupuesto según resultados | escala de las campañas con mejor señal |
| product_ads | campañas por publicación y catálogo; selección según rotación y margen | ajuste de ACOS objetivo y presupuesto | participación de mercado y lectura contra la liquidación |
| contenido_audiovisual | planificación, validación de ángulos con el cliente, envío y coordinación | variantes de los ángulos con mejor rendimiento en pauta y orgánico | escala de los formatos ganadores |
| contenido_estatico | ídem audiovisual | ídem audiovisual | ídem audiovisual |
| planificacion_contenido | calendario mensual y definición de ángulos | lectura de resultados y ajuste del calendario | ídem, cíclico |
| influencer_marketing | búsqueda y selección de perfiles; coordinación de entregas y envíos | definición de ángulos y publicación | reutilización del material en campañas |
| diseno_web | COMPLETO ACÁ (R1) | — | — |
| branding | COMPLETO ACÁ | — | — |
| desarrollo_web_custom | relevamiento y maquetado | implementación | pruebas y puesta en producción |

EXCEPCIÓN de `desarrollo_web_custom`: el reparto vale para el caso de varios
meses. Si su duración fuera de un mes, iría completo en 1-30. Como el modelo
hoy no tiene campo de duración, usá el reparto de tres etapas y registralo
como supuesto en el handoff. No inventes un campo.

## Restricciones

- SOLO el camino v2. `context.roadmap` no se toca: la salida v1 sigue
  idéntica. Trabajás sobre `context.roadmapV2`. Prueba de regresión.
- Los hallazgos siguen alimentando el plan como hasta ahora. Esta regla se
  suma para las líneas de la selección comercial, no las reemplaza.
- Ninguna etapa queda vacía si hay un servicio seleccionado que le
  corresponda. Prueba.
- Nada se inventa: ni frases, ni campos, ni duraciones.
- Sin `git push`. Commit candidato local, ZIP desde worktree limpio.

## Fuera de alcance, registrar como hallazgos

H-1 · RESTRICCIONES MEZCLADAS CON SERVICIOS. Hoy "Muestra de productos
parcial" y "Política de envío sin confirmar" aparecen con la misma viñeta que
"Meta Ads". El modelo las distingue, el render no. Es presentación: va a F3b.
Registrar con ID, no corregir acá.

H-2 · PAGO PARTIDO 60/40 EN WEBS DE CERO. La condición comercial real para
desarrollo custom desde cero es 60% adelantado y 40% al finalizar. El modelo
solo tiene `recurrencia: mensual | unica`, así que no es representable.
Registrar con ID; se resuelve más adelante. No tocar el modelo de F2a.

H-3 · TENSIÓN DE CALENDARIO EN DESARROLLO CUSTOM. Si el desarrollo lleva
hasta 3 meses y la pauta se cobra desde el mes 1, el documento mostrará esa
superposición. Es decisión comercial, no defecto. Registrar como nota.

## Gate

Regenerar los cuatro PDFs y verificar sobre el texto extraído que: existe la
etapa 1-30 en los dos clientes; ninguna etapa con servicios seleccionados
queda vacía; el plan nombra QUÉ SE HACE y no solo el servicio; y ninguna
frase del plan está fuera de `f2a-textos-servicios.md`.

Handoff ≤10 líneas. ZIP desde worktree limpio. Detención, sin push.
