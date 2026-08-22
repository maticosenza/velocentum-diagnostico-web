# Decisiones pendientes

Registro de decisiones de producto o de negocio que aparecieron durante el
trabajo autónomo del 2026-08-21 y que no estaban ya resueltas en los
documentos existentes. No se tomaron unilateralmente: se anota el contexto y
se sigue con lo que no depende de ellas.

## 1 · ¿Debe "margen total" en el motor de cálculo exigir 100% de cobertura de productos, igual que ya exige el documento?

**Contexto.** Durante la fase 5 (productos dinámicos y cobertura), al separar
"margen de la muestra" de "margen total" se encontraron dos reglas distintas
y ya aprobadas conviviendo en el repositorio, con alcances distintos:

1. **En el adaptador documental** (`src/documents/domain/build-context.ts`),
   `margenTotal` sólo se publica cuando la cobertura de canales Y de
   productos llega al 100%; si no, queda `retenido` (sin_datos) y sólo se
   publica `margenMuestra`. Esta regla ya estaba implementada y testeada
   antes de esta sesión.
2. **En el motor de cálculo** (`src/lib/calculo-diagnostico.ts`,
   `derivados.margen_contribucion`), el margen "total" nunca estuvo
   condicionado a la cobertura de PRODUCTOS (sólo a la cobertura de
   CANALES). Cuando sólo se conoce un producto sin porcentaje de facturación
   declarado, el motor lo trata como representativo del 100% del negocio y
   calcula un margen total real. Cuando se cargan varios productos sin
   porcentaje, los pondera por partes iguales y también calcula un total
   real, aunque esos productos no sumen el 100% de la facturación declarada
   como participación. Este comportamiento está confirmado por más de diez
   pruebas preexistentes en `calculo-diagnostico.test.ts`
   (`"con un solo producto usa su margen..."`,
   `"sin porcentajes cargados usa el promedio simple de los márgenes"`,
   `"un producto con costo y precio pero sin porcentaje queda fuera del
   ponderado"`, entre otras) y es, en la práctica, el flujo más común: en
   modo B (conversado, sin pantalla compartida) sólo se carga costo y precio
   del producto principal.

**Por qué no se resolvió en este bloque.** El pedido de fase 5 fue "separar
margen de la muestra de margen estimado total, y mantener la regla ya
aprobada: si sólo se conoce una muestra, el total queda en sin_datos". Esa
frase describe exactamente la regla (1), ya implementada y aprobada en el
documento. Extenderla también al motor de cálculo (regla 2) — es decir, que
`margen_contribucion` deje de calcularse cuando la cobertura de productos es
parcial — habría roto el flujo de diagnóstico más común (un solo producto,
modo B) para toda la base de diagnósticos ya cargados: hoy esos casos
muestran un margen calculado en la pantalla del diagnóstico
(`diagnosticos.$id.tsx`), y pasarían a mostrar "sin datos" salvo que el
vendedor declare explícitamente que ese producto es el 100% de la
facturación. Cambiar esto es una decisión de producto real (qué tan estricta
debe ser la evidencia para mostrarle un número al equipo comercial en la
pantalla interna de diagnóstico, más allá de lo que ya se exige para el PDF
que llega al cliente) y no estaba resuelta en ningún documento existente.

**Qué se hizo en su lugar.** Se generalizó la lista de productos de tres a
cinco sin tocar esta semántica preexistente del motor. Se agregó un nuevo
derivado explícito, `derivados.cobertura_productos` (0 a 100), que ahora es
la fuente única también para el adaptador documental (antes duplicaba la
fórmula). Se lo muestra en `diagnosticos.$id.tsx` junto con "Margen de la
muestra" y "Margen total" por separado, con una nota visible cuando hay más
de un producto cargado y la cobertura no llega al 100%, para que quede claro
qué tan completa es la evidencia sin bloquear el número.

**Qué decidir.** Si Matías quiere unificar ambas semánticas (que
`margen_contribucion` también quede en `null` sin 100% de cobertura de
productos, igual que ya ocurre con `margenTotal` en el documento), hay que
decidir además qué pasa con el caso de un solo producto sin porcentaje
declarado: ¿se lo sigue tratando como el 100% del negocio (como hoy), o pasa
a exigir que el vendedor declare explícitamente "100%" en el campo de
porcentaje para que el margen deje de estar retenido? Esto afecta
directamente la pantalla interna de diagnóstico para clientes reales que
todavía no tengan ese campo cargado.

## 2 · Valor por defecto del costo por evento intermedio (fase 6, presupuesto de arranque)

**Contexto.** El "presupuesto de arranque optimizando por evento intermedio"
(`derivados.presupuesto_arranque.arranque_evento_intermedio`,
`src/lib/calculo-diagnostico.ts`) necesita un costo estimado por evento
intermedio (agregar al carrito o iniciar checkout). Por instrucción explícita
del usuario, ese costo "sale de configuración marcado como benchmark" — se
implementó como una proporción del CPA objetivo
(`factor_costo_evento_intermedio`, config), con un default de código
(`FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO = 0,2`, es decir 20% del CPA
objetivo) documentado en `src/lib/calculo-diagnostico.ts`.

**Por qué se anota igual, sin bloquear el bloque.** El patrón en sí (config
primero, default de código marcado como benchmark, nunca cifra única, nunca
confianza "alta") es exactamente lo que pidió el usuario y no requería
autorización adicional. Pero el número concreto, 20%, no tiene respaldo de
datos reales de ningún cliente — es una estimación razonable de que un
evento intermedio (más frecuente, más barato) cuesta una fracción del costo
de una compra, no una cifra derivada de benchmarks de la industria ni de
datos propios. Hoy el radio de impacto es acotado: este valor sólo alimenta
la pantalla interna de diagnóstico (`diagnosticos.$id.tsx`), no ningún
documento cliente-facing (`src/documents/`). Auditoría independiente de fase
6 (commit `0b803af`) recomendó dejarlo trazable acá antes de que, en el
futuro, se conecte a un documento que llegue a un cliente.

**Qué decidir.** Si Matías tiene una referencia mejor (data de campañas
propias con optimización por agregar-al-carrito o iniciar-checkout vs.
compra), reemplazar el 20% por ese número en la fila `configuracion` de la
base (clave `factor_costo_evento_intermedio`) — no requiere tocar código. Si
no hay objeción, el valor por defecto queda como está.

---

*(Este archivo se actualiza a medida que aparecen nuevas decisiones
pendientes durante el trabajo autónomo. Cada entrada queda numerada y no se
borra hasta que Matías la resuelve.)*
