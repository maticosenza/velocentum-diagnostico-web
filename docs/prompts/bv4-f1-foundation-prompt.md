<!-- Ejecutado desde 831ef34. Texto original sin modificar. Actualizado al 2026-08-31: fuente de assets y DH-6/DH-7/DH-8. -->
# BV4 · F1 Foundation — Prompt de ejecución (versión final)

Ejecutás únicamente la fase F1 del Bloque Visual 4 · Rebranding, más su
preflight. El contrato normativo es `bv4-contrato-maestro.md`; si algo de este
prompt lo contradice, gana el contrato y frenás. Sos ejecutor: implementás y
commiteás **en local**. **No ejecutás `git push` en ningún punto de F1**: el
push llega recién con la autorización expresa de Matías, después de la
auditoría externa y de su veredicto sobre el isotipo y la muestra visual. La
auditoría externa la hace otro agente contra artefactos crudos.

Frenás y reportás, sin improvisar, ante: cualquier decisión de producto no
listada acá; cualquier contradicción real entre branding, contrato funcional,
accesibilidad, legibilidad o render PDF; cualquier archivo o dato faltante.
Nada se inventa: ni cifras, ni claims, ni assets sustitutos, ni umbrales.

## Invariantes (verificás su cumplimiento antes de cada commit)

- `main` intacto. Sin publicación, sin base de datos, sin migraciones, sin
  secretos.
- **Sin `git push` en toda la fase.** La rama `feat/bv4-rebranding` permanece
  solo local hasta autorización expresa posterior al gate humano.
- Cadena v1 intacta: `velocentum-light-v1.ts`, su test, `renderers/pdf/`,
  `document-renderer.css` no se modifican.
- `MOTOR_DOCUMENTAL_ACTIVO` queda en `"v1"` en todo commit. Podés activar
  `"v2"` localmente para pruebas, pero jamás lo commiteás.
- Máximo dos rondas de corrección por etapa auditada.

---

## Etapa 0 · Preflight y registro

0.1 Verificá base: `git log --oneline -1` debe mostrar `831ef34`.
`git status --short` debe mostrar únicamente
`src/documents/motor-activo.ts` modificado. Si aparece cualquier otro cambio,
frenás y reportás sin tocar nada.

0.2 Restaurá exclusivamente ese archivo a `"v1"`
(`git checkout -- src/documents/motor-activo.ts`) y verificá árbol limpio.

0.3 Creá la rama **`feat/bv4-rebranding`** desde `831ef34`. Solo local: no la
publicás en origin.

0.4 Guardá este prompt verbatim en
`docs/prompts/bv4-f1-foundation-prompt.md` y el contrato en
`docs/bv4-contrato-maestro.md`. Commit propio (local).

0.5 Arreglá el script `dev` (E-22): `"dev": "vite dev"` no existe en Vite 8 y
cuelga tomando `dev` como raíz. Reemplazalo por el equivalente correcto
(`vite --port 8080 --strictPort` o el patrón que el repo ya use en otros
scripts). Verificá que `npm run dev` levanta y responde.

0.6 Registrá en `docs/visual/auditoria-visual-2026-08-23.md` los hallazgos de
abajo, **copiando el formato exacto de E-21** (encabezado, campos Hallazgo /
Resolución / Capa / Bloque de corrección). Antes de escribir, verificá en el
archivo vivo cuál es el último ID registrado; la numeración de abajo presume
que es E-21 (línea 697 al 2026-08-30). Si el último ID fuera otro, corré la
serie completa y reportalo en el handoff. Aclaración vinculante: la
observación de ligaduras fi/fl fue descartada **antes** de recibir ID (era
artefacto de extracción de texto, no del render) — no existe ningún "E-26
ligaduras" y no ocupa lugar en la serie:

- **E-22** · script `dev` roto con Vite 8 (corregido en 0.5; dejalo asentado
  como corregido en F1-preflight).
- **E-23** · no existe pantalla/panel para confirmar la selección comercial;
  el candado de exportación de propuesta existe, la llave no. Bloque de
  corrección: F2a.
- **E-24** · `factor_costo_evento_intermedio` en 20% sin respaldo de datos
  reales. Alcance documental: PENDIENTE DE VERIFICAR (¿llega a documento de
  cliente o solo a pantalla interna?). Decisión de negocio de Matías.
- **E-25** · las 9 entradas de `COMISIONES_PLATAFORMA_DEFECTO` con
  `verificado: false`. Mismo alcance pendiente. Decisión de negocio de Matías.
- **E-26 / E-27 / E-28** · planitud tipográfica, ausencia de iconografía y
  columna única en apaisado, observadas en los artefactos del 2026-08-28
  (motor v2 activo). **Antes de escribirlas**, verificá los valores reales en
  `src/documents/renderers/pdf-v2/document.tsx` (escala tipográfica efectiva,
  presencia o no de iconografía, estructura de columnas por perfil) y
  registrá los números de pdf-v2, no los de v1. Si pdf-v2 contradice alguna
  de las tres observaciones, registrala igual con la evidencia del artefacto
  y la discrepancia anotada. Bloque de corrección: F3.

Commit propio del registro (local). Con esto cierra el preflight.

## Etapa 1 · Inventario (los [NV] de la auditoría aprobada)

Sin cambiar código, relevá y volcá en `docs/bv4-f1-inventario.md`:

1. Interior de `renderers/pdf-v2/`: escala tipográfica real por perfil, hexes
   fuera de tema, estructura de página `pantalla` vs `impresion`, consumo del
   tema centralizado, assets embebidos.
2. Renderer web v2: ruta, perfiles, tokens que consume.
3. `src/styles.css` y rutas de la herramienta: qué tokens existen, qué colores
   están hardcodeados fuera de tokens, adjudicación real de cada hoja de
   estilos.
4. Fuentes presentes: familias, pesos y formatos exactos en
   `src/documents/theme/fuentes/`, y cobertura de glyphs
   `á é í ó ú ü ñ ¿ ¡ · — † × % $` por archivo (verificación real, no
   supuesta).
5. Logos/favicon/assets de marca existentes en el repo.

Commit propio (local). Este inventario alimenta las etapas siguientes y el
registro de E-26/E-28 si detectás algo que los matice.

## Etapa 2 · Tema `velocentum-crystal/v1`

Creá el tema **al lado** del existente, mismo contrato de tipos (extendé
`types.ts` solo de forma aditiva y retrocompatible si faltan campos):

| Token | Valor |
|---|---|
| action | #FF4B8D |
| accentSoft | #FF85B8 |
| accentDeep | #D92F6E |
| ink | #0E0E13 |
| surfaceDark | #1A1A23 |
| surface | #FFFFFF |
| surfaceSoft | #F5F5F7 |
| borderLight | #E9E9EE |
| borderDark | #2A2A35 |
| muted | #6E6E7A |
| success / warning / risk | los de v1, con su par de contraste web (patrón `--vdoc-*` actual) |
| disabled / info / chart / tabla / impresión | derivalos de la familia anterior, documentando cada derivación en el inventario |

Reglas vinculantes dentro del tema (documentalas en el propio archivo):

- `accentDeep` es el único acento permitido como texto chico sobre claro.
- `action` jamás como texto chico sobre blanco; sí CTA, display, gráfica.
- Estados funcionales nunca en pink.
- Composición 70% ink/surface · 20% neutro · 10% pink como guía, no como
  reemplazo uno a uno.

Agregá un **switch de tema** revertible, patrón `motor-activo`: archivo propio
con el tema activo por defecto en el actual; el crystal se activa explícito.
Ningún commit deja crystal activo por defecto.

Verificación automática de contraste (test o script en la suite): pares
mínimos `ink/surface`, `muted/surface`, `muted/surfaceSoft`,
`accentDeep/surface`, `surface/ink`, `accentSoft/ink`, `action/ink`,
`action/surface` (este último solo como large/graphic ≥3:1), y los tres
funcionales sobre claro y oscuro. Umbral: AA 4,5:1 texto normal, 3:1 texto
grande/gráfico. Si un par de neutros falla, ajustá el neutro dentro de su
familia (documentando el hex final) sin cambiar la dirección visual — está
preaprobado por DH-4. Si falla un par que involucra los pinks vinculantes,
frenás y reportás: esos hexes no se ajustan sin decisión humana.

Escribí el test del tema nuevo (análogo a `velocentum-light-v1.test.ts`) sin
tocar el de v1. Commit propio (local).

## Etapa 3 · Geist Mono

Obtenela **exclusivamente de la fuente oficial** (repositorio oficial de
Vercel), en archivos estáticos TTF/OTF, con su archivo de licencia incluido y
commiteado junto a las fuentes. Sin CDN en ningún punto del render. Registrala
con el mismo mecanismo de `registrar-fuentes.ts` (data URI, determinista).
Verificá glyphs `á é í ó ú ü ñ ¿ ¡ · — † × % $` y dígitos tabulares. Rol:
labels, estados, identificadores, microcopy técnico — el rol se **define** acá
(token tipográfico en el tema); su aplicación a superficies es de F2/F3.

Si tu entorno no puede descargar de la fuente oficial: frenás esta etapa, la
reportás como dependencia para que Matías provea los archivos, y seguís con
las demás etapas. No la sustituís por otra mono.

Commit propio (local).

## Etapa 4 · Assets de marca al repo + gate del isotipo

4.1 **FUENTE DE ASSETS ACTUALIZADA (2026-08-31).** Los assets están en
`~/Desktop/BV4_BRANDING_CONFIRMADO/assets/`. Es la biblioteca oficial
aprobada (manifiestos del 2026-08-30 incluidos en esa carpeta). El paquete
anterior "Velocentum_Brand_Assets_V2_Board_Exact" **queda retirado y no se
usa**: sus versiones de `bars` y `target` eran más pobres (845 vs 3289 bytes
y 624 vs 1180 respectivamente).

Copiá al repo (ubicación coherente con la estructura existente, p. ej.
`src/documents/theme/marca/`) únicamente los **SVG**:

- `isotipo-approved.svg` — identidad
- `objects/prism.svg` · `bars.svg` · `target.svg` · `lightning.svg`
- `fragments/fragment-cluster-system.svg`
- `scroll/scroll-axis.svg`
- `pills/*.svg` (6: strategy, acquisition, content, analysis, web, design)
- `treatments/*.svg` (4: solid, outline, graded, translucent)

Los PNG **no entran al repo**: son preview y QA. Agregá nota de procedencia
("biblioteca oficial aprobada, 2026-08-30"). Reglas heredadas de sus
manifiestos, que respetás: los archivos no se modifican para pruebas, y **el
isotipo es identidad y no se fragmenta**.

Anotá junto al Prisma la excepción DH-7: conserva el espectro multicolor
(#7C5CFF, #7DFF6A, #50C9FF, #FFE76D), encapsulado en el asset, sin generar
tokens.

4.1 bis **Verificaciones obligatorias sobre los assets, a reportar en el
handoff:**

(a) **Filtros SVG en cinco assets.** `isotipo-approved`, `prism`, `bars`,
`target` y `lightning` contienen `feGaussianBlur`. react-pdf soporta filtros
SVG de forma limitada. **Verificá el render en PDF contra el del navegador**
para los cinco. Si alguno no coincide, reportalo y proponé variante sin
filtro — **no lo decidas vos**, es parada.

(b) **Encuadre del isotipo.** Su `viewBox` es 220×210, **no cuadrado**.
Definí y documentá cómo se encuadra para favicon y avatar (padding centrado,
sin recortar el glifo ni deformarlo).

(c) **Colores fuera de paleta.** El isotipo usa 35 tonos propios de facetado
y `bars` usa 16; ninguno de la paleta vinculante. Se aplica la excepción de
encapsulamiento de DH-7: material interno del asset, no genera tokens.

4.2 **Test del isotipo (gate DH-6):** rasterizá `isotipo-approved.svg` a
16, 24 y 32 px, en color, monocromo sobre claro y monocromo sobre oscuro, más
una composición tipo avatar (círculo y cuadrado redondeado). Generá una única
lámina comparativa (`docs/bv4-f1-isotipo-test.png` o PDF) para el veredicto de
Matías. **No declarás el resultado vos: el veredicto es humano.** Hasta ese
veredicto, todo uso del isotipo queda marcado provisional.

Commit propio (local).

## Etapa 5 · Lockup tipográfico

Construí el lockup de la herramienta: isotipo (provisional) + "Velocentum" en
Satoshi + descriptor "Equipo de crecimiento" según DH-11. Solo el componente y
sus variantes (claro/oscuro, con y sin descriptor); **no** lo aplicás todavía
a navegación, portadas ni documentos — eso es F2/F3. El claim "Estamos en el
negocio de hacer crecer negocios" no se usa en F1.

Commit propio (local).

## Etapa 6 · Muestra visual, QA y cierre — commit candidato local, SIN push

6.1 Generá una **muestra visual** autocontenida (HTML estático o PDF generado
con el mecanismo existente, sin tocar superficies de producción): paleta con
sus pares de contraste medidos, escala tipográfica de las tres familias con
los glyphs verificados, lockup en sus variantes, lámina del isotipo, y los
objetos SVG sobre claro y oscuro. Es el artefacto del gate de aprobación
visual de Matías.

6.2 QA: `npm test`, typecheck y build limpios (documentá el estado de los
warnings de fontkit antes y después). Suite v1 intacta y verde. Doble corrida
de la muestra/registro de fuentes con hash idéntico si el mecanismo lo
permite.

6.3 Cerrá el **commit candidato, exclusivamente local**. Desde un **worktree
limpio de ese commit**, generá el ZIP de artefactos para auditoría externa:
inventario, lámina del isotipo, muestra visual, salida de la verificación de
contraste, y logs de QA.

6.4 Handoff de **máximo 10 líneas**: hash local del commit candidato, conteo
de pruebas, qué cambió, qué se encontró, qué queda pendiente (incluido el
veredicto humano del isotipo y cualquier dependencia reportada).

6.5 **Detención completa. Sin push.** La secuencia que sigue no es tuya:
auditoría externa contra los artefactos crudos → veredicto humano de Matías
sobre isotipo y muestra → correcciones si corresponden (máximo dos rondas) →
y solo después de APROBADO **y** de una autorización expresa de Matías,
ejecutás el push a `feat/bv4-rebranding`. Hasta esa autorización, no tocás
origin.

## Qué NO hacés en F1

Ejecutar `git push` en cualquier punto de la fase. Migrar UI o documentos al
tema nuevo. Tocar pdf-v2 más allá de leerlo para el inventario y E-26/E-28.
Implementar el panel comercial. Aplicar lockup o claim a superficie alguna.
Modificar la cadena v1 o sus tests. Promover el motor v2. Integrar a `main`.
Publicar. Redactar o ejecutar F2/F3/F4.
