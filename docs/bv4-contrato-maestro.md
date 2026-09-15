# Bloque Visual 4 · Rebranding — Contrato maestro (versión final)

Base: cierre de Fase 14.1, HEAD `831ef34`, sobre rama nueva
**`feat/bv4-rebranding`** creada desde ese commit;
`feat/noche-continuacion` queda congelada como ancla de Fase 14.1.

Este documento consolida todas las decisiones aprobadas el 2026-08-30 y es la
fuente de verdad del bloque. Ante contradicción entre este contrato y
cualquier otro documento del rebranding, gana este contrato; ante
contradicción entre este contrato y el contrato funcional/pruebas vigentes,
se frena y se consulta.

---

## 1 · Roadmap consolidado

| Fase | Alcance | Gate de salida |
|---|---|---|
| **0 · Preflight y registro** (viaja dentro del prompt de F1) | Restaurar `motor-activo.ts` a `"v1"` (único cambio local); árbol limpio en `831ef34`; rama `feat/bv4-rebranding`; fix del script `dev` (E-22); registrar E-22..E-25 con el formato de E-21, y E-26/E-27/E-28 con valores re-verificados contra pdf-v2; guardar el prompt en `docs/prompts/` | registro escrito y commiteado en local; árbol reproducible |
| **F1 · Foundation** | Inventario de los [NV]; tema `velocentum-crystal/v1` + switch; neutros DH-4 con verificación automática de contraste; Geist Mono (DH-9); assets SVG al repo; test del isotipo (DH-6); lockup tipográfico Satoshi; muestra visual. *(Enmienda 2026-09-15: F1 se cerró con el sistema crystal, retirado por DH-10. Lo que construyó para crystal —el tema `velocentum-crystal/v1`, sus neutros, `isotipo-approved.svg` y su test, el lockup en Satoshi, la muestra visual— queda como referencia histórica: no es fuente ni destino de migración. Sigue sirviendo lo que no era de crystal: Geist Mono con su licencia, el interruptor `tema-activo.ts` y el test automático de contraste como patrón. La foundation del sistema nuevo se hace en F2b.)* | commit candidato **local, sin push** → auditoría externa contra artefactos crudos → **aprobación visual de Matías** (muestra + isotipo) → push solo con autorización expresa |
| **F2a · Panel de selección comercial** | Implementar el panel según `f2a-panel-comercial-reconciliado.md`, una vez resueltas sus preguntas (ver sección 1.1); nace sin hexadecimales propios, sobre los tokens del tema activo (`velocentum-light-v1`), y migra a `velocentum-web/v1` con el resto de la interfaz en F2b. *(Enmienda 2026-09-15: decía "nace con tokens crystal". Crystal nunca se activó y el panel se construyó sobre el tema activo —`src/components/panel-seleccion-comercial.tsx`—; con crystal retirado (DH-10), la frase no describía ni lo hecho ni lo que viene.)* | flujo diagnóstico → proyección → selección confirmada → propuesta → PDF descargado en **pantalla y A4**, dos perfiles de cliente, y **el contenido extraído del PDF de la interfaz dice lo mismo que el del pipeline**, con la fecha del diagnóstico como única exclusión declarada. *(Enmienda 2026-09-05: el criterio original era "SHA-256 interfaz = pipeline" y queda sin efecto por **H-14** — la app genera la fecha del diagnóstico al vuelo y la imprime, así que la igualdad byte a byte es imposible de cumplir. Pasos en `docs/bv4-f2a-gate-navegador.md`.)* |
| **F2b · Resto de la interfaz** | Migración UI al esquema híbrido DH-3. *(Enmienda 2026-09-15: la migración del tema a `velocentum-web/v1` —esquema DH-3, paleta DH-4, CTA y estados DH-5, isotipo DH-6, variantes DH-8, tipografías DH-9, escalas DH-13— se hace en F2b; crystal queda retirado, DH-10.)* | antes/después desktop+mobile, contraste AA, focus visible, estados funcionales intactos |
| **F3a · Paginación y densidad documental** | E-21, E-28: fusión de secciones, continuaciones, grilla, ambos perfiles | matriz de 54 PDFs sin páginas <50% de ocupación salvo excepción registrada; cero cortes/solapes |
| **F3b · Rebranding de documentos** | Jerarquía tipográfica, objetos semánticos, portadas, cierres, claim (DH-11), A4/16:9 y web v2. *(Enmienda 2026-09-15: los PDF adoptan el sistema nuevo recién en F3b. Hoy `src/documents/motor-activo.ts` está en `"v1"` y la cadena v2 no se sirve; hasta F3b los PDF salen de la cadena v1 tal como está, con Satoshi e Inter, DH-9. Las formas onduladas (DH-12) entran acá. El wordmark en SVG, del que F3b dependía, está en el repo desde el 2026-09-15; ver "Dependencias verificadas" en la sección 2.)* | matriz de 54 rasterizada e inspeccionada, ambos perfiles, paridad PDF/web |
| **F4 · Verificación integral** | QA §10 completo de la directiva; determinismo por doble corrida SHA; worktree limpio; ZIP a auditoría externa | veredicto de auditoría externa; nada a `main` ni publicación sin autorización humana expresa |

**F3b no empieza hasta aprobar F3a. F2a debe estar disponible antes de F3.**
Los prompts de F2a en adelante se redactan recién después de la aprobación
visual de F1.

### 1.1 · F2a requiere reconciliación funcional previa

El prompt ejecutable de F2a **no** se redacta contra
`paso-1-panel-seleccion-comercial.md` a secas: ese documento contiene
ambigüedades comerciales y referencias de secuencia y de estado técnico
anteriores a la verificación del repo (Helvetica, paginación como paso 2,
tokens como paso 3, gate en un solo formato). La entrada vigente es
`f2a-panel-comercial-reconciliado.md`, que conserva lo confirmado, corrige lo
desactualizado y cierra las diez decisiones comerciales pendientes
(Q1–Q10: mapeo de contenido, activadores de líneas nuevas, precio unitario,
moneda, configuración fiscal, totales no editables, agregados por nivel, ruta
de Diseño web, impuesto independiente de la moneda, y separación obligatoria
entre líneas mensuales y de pago único). Al 2026-08-30 ese documento no tiene
contradicciones internas ni preguntas abiertas. El prompt de F2a se redacta
únicamente después del cierre y la auditoría aprobada de F1.

### Secuencia obligatoria de cierre de F1

1. Implementación y pruebas.
2. Commit candidato **exclusivamente local**.
3. Muestra visual, lámina del isotipo y ZIP generados desde un worktree
   limpio de ese commit.
4. Entrega del hash local, handoff y ZIP.
5. **Detención completa, sin push.**
6. Auditoría externa en este chat contra los artefactos crudos.
7. Veredicto humano de Matías sobre el isotipo y la muestra visual.
8. Correcciones, si corresponden, con máximo dos rondas.
9. Únicamente después de APROBADO y de una autorización expresa de Matías,
   Claude Code ejecuta el push a `feat/bv4-rebranding`.

## 2 · Decisiones cerradas (vinculantes)

| ID | Resolución |
|---|---|
| DH-1 | El bloque se llama **Bloque Visual 4 · Rebranding**, base Fase 14.1 |
| DH-2 | A4 existe: perfil `impresion`, `pdf-v2`, matriz de 54 (9 casos × 3 documentos × 2 perfiles). Se preserva y migra, no se crea |
| DH-3 | **ENMENDADA 2026-09-15.** UI **híbrida**: superficies de trabajo/formularios/tablas/diagnóstico/lectura prolongada claras, sobre fondo `#FDFCFA` con tinta `#141024`; navegación/acceso/transiciones/momentos de marca en navy `#0F2050`, con el logotipo blanco. **Portadas en navy o cielo** `#65AAF5`; cierres en azul o navy (docx). El criterio es **un color dominante y un solo acento por página**; los cinco acentos juntos solo en un resumen general, nunca repetidos en cada página (docx). Los acentos funcionan como **capítulos del diagnóstico**, no como secciones del sitio: las etiquetas de `tokens.css` (INICIO, MÉTODO, CASOS, CONTACTO, ciclos) no se trasladan. La asignación de partida es la del docx: azul para diagnóstico y estrategia, bermellón para método, verde para resultados y medición, violeta para recomendaciones y próximos pasos, amarillo para datos destacados y prioridades. Ningún acento funciona como baño general. **Capítulo y estado (decisión de Matías, 2026-09-15, F2b):** los acentos como capítulo se usan en portadas, divisores y encabezados de sección, no en el cuerpo; los estados viven siempre sobre el fondo crema, así que el color hace su trabajo. Como capítulo, el acento va siempre como relleno con su par de texto (DH-4): como texto sobre el fondo solo el violeta llega a AA. En la herramienta, cada pestaña del detalle es un capítulo con su acento en el encabezado y en ningún otro lugar: Resumen amarillo, Detalle azul, Propuesta violeta, Proyección verde, Comercial bermellón (`ACENTO_PESTANA`, `src/lib/pestanas-diagnostico.ts`). *(Enmienda 2026-09-15: la resolución original decía "navegación/acceso/portadas/cierres/transiciones/momentos de marca en ink/surface; pink como energía controlada, nunca baño general". Ink/surface y el pink eran vocabulario de crystal, que se retira (DH-10); el esquema híbrido se mantiene.)* |
| DH-4 | **ENMENDADA 2026-09-15.** La paleta es la del sistema nuevo (`src/documents/theme/fuente-web-v1/tokens.css`, fuente de verdad de los valores): fondo `#FDFCFA`, tinta `#141024` (18.1:1 sobre fondo), texto de apoyo `#6B6880` (5.2:1 sobre fondo). Cinco acentos, cada uno con su par de texto **obligatorio** —también en hover, footer, chips y estados activos—: azul `#1F6BFF` / `#FFFFFF` (4.56:1), bermellón `#F5451F` / `#141024` (5.09:1), verde `#00C878` / `#141024` (8.44:1), violeta `#8A3FFC` / `#FFFFFF` (5.00:1), amarillo `#FFC300` / `#141024` (11.56:1). Cielo `#65AAF5` es tono de fondo, no acento (`tokens.css`); con tinta da 7.63:1. **Navy `#0F2050` entra como token** por decisión de Matías del 2026-09-15: el docx lo usa para portadas oscuras y separadores y como fondo del logotipo blanco, y `tokens.css` no lo trae; con blanco da 15.64:1 y con fondo, 15.25:1. Los contrastes de cielo y navy los calculé hoy, porque `tokens.css` no los trae. **El rosa de marca `#FF1F6B` no se usa en la herramienta** (DH-5). El contraste de los demás pares viene verificado en `tokens.css`; al implementarse se vuelve a verificar con el test automático de contraste, como en F1. Un color que el docx nombre y `tokens.css` no traiga no entra como token sin decisión humana; navy es la única que existe hoy. **Rebajados (F2b, 2026-09-15, pendiente de validación de Matías):** las superficies suaves de la interfaz —hover, pestañas y rieles, selección, filetes, texto de apoyo y hover sobre navy— son un color de la paleta rebajado sobre la superficie donde se apoya, que el docx pide como "acento rebajado"; se escriben como `color-mix` en `src/styles.css` y no son tonos nuevos. Son seis: tinta al 4 % y al 14 % sobre fondo, violeta al 5 % sobre fondo, y blanco al 72 %, 10 % y 14 % sobre navy. Cada porcentaje es el más alto que deja pasar AA a todo el texto que va encima; el test de contraste lo mide sobre la hoja real. *(Enmienda 2026-09-15: la resolución original era "Neutros aprobados: surfaceSoft `#F5F5F7`, borderLight `#E9E9EE`, borderDark `#2A2A35`, muted `#6E6E7A`; si un par no alcanza AA, se ajusta el neutro dentro de la misma familia" y queda sin efecto porque Matías aprobó un sistema de branding nuevo que reemplaza por completo al de F1 — esos neutros pertenecían a la familia crystal, que se retira (DH-10). Segunda enmienda 2026-09-15: la primera versión decía "Rosa de marca `#FF1F6B` / `#141024` (5.01:1) solo para CTA y estados de interacción; los links de navegación no se vuelven rosas" y no incluía navy ni cielo. Queda sin efecto por decisión de Matías: el rosa sale del sistema de la herramienta (DH-5) y navy entra como token.)* |
| DH-5 | **RETIRADA 2026-09-15.** La reemplaza lo siguiente. **CTA (enmendado por Matías el 2026-09-15, F2b):** relleno violeta `#8A3FFC` con texto blanco (5.00:1). El violeta es además el único acento que llega a AA como texto chico sobre claro: 4.88:1 sobre el fondo y 5.00:1 sobre blanco. El azul no sirve para CTA: como relleno con blanco da 4.56:1, pero como texto chico sobre el fondo da 4.45:1 y no alcanza AA. *(La primera versión de este reemplazo, del mismo día, ponía el CTA en azul; Matías lo corrigió a violeta por ese contraste.)* **Estados**, que el sistema nuevo no define: error bermellón `#F5451F`, advertencia amarillo `#FFC300` y éxito verde `#00C878`, los tres con texto tinta `#141024` (5.09 / 11.56 / 8.44:1, verificados en `tokens.css`). Esos contrastes valen para el color como relleno con su par de texto; como texto sobre fondo no alcanzan AA (3.56 / 1.57 / 2.15:1). Por eso el estado se pinta como relleno, chip o indicador con su par, nunca como texto de color chico sobre fondo, y nunca solo con color: siempre lo acompaña un texto o un ícono. En la herramienta (F2b), el mensaje de estado va en tinta con un indicador del color del estado de contorno tinta (`MensajeEstado`), y el punto del semáforo lleva el mismo contorno (`EstadoPunto`). **El rosa `#FF1F6B` no se usa:** `tokens.css` lo declara color de marca y de CTA, pero queda fuera del sistema de la herramienta. Motivo: **para no confundir CTA con error**. Con el CTA en violeta, el bermellón queda libre para error; un CTA rosa, vecino del bermellón, reintroduciría la confusión. Donde el docx pide CTA bermellón (cierre) o rosa (énfasis puntual, CTA, la mancha de portada), rige esta resolución. *(Retiro 2026-09-15: la resolución original era "`#D92F6E` para texto acentuado sobre claro. `#FF4B8D` para CTA/display/actividad/gráfica, nunca texto chico sobre blanco. Success/warning/error conservan color propio". Queda sin efecto porque esos pinks eran de crystal, que se retira (DH-10), y porque los colores de estado nunca habían tenido valor fijado.)* |
| DH-6 | **ENMENDADA 2026-09-15.** El isotipo es **`velocentum-v-bicolor.svg`**: una V de dos patas rectas separadas, la izquierda con degradado naranja (`#FF512C` → `#FC4D27` → `#F5451F`) y la derecha con degradado violeta (`#8A3FFC` → `#8139F8` → `#7432E8`). Reemplaza a `isotipo-approved.svg` (hoy en `src/documents/theme/marca/`) en todo uso nuevo. Para espacios chicos se usa `velocentum-v-bicolor-ui.svg`, con los mismos paths y degradados y el viewBox recortado (DH-8). **Es una decisión humana de Matías del 2026-09-15, con el mismo peso que el veredicto original de DH-6**; Claude Code no la reabre ni la somete a un gate propio. `isotipo-approved.svg` sigue en el repo mientras exista el tema crystal; se decide su retiro en F2b. *(F2b, 2026-09-15: la V nueva y sus variantes están versionadas en `src/assets/marca/web-v1/logo/`; la interfaz usa la de interfaz en la navegación contraída y la cuadrada como favicon. `isotipo-approved.svg` sale del repo con el resto de crystal, DH-10.)* *(Enmienda 2026-09-15: la resolución original era "El isotipo es `isotipo-approved.svg`, aportado por Matías; reemplaza a `crystal-v-short-b.svg` en todo uso", con el gate de 16/24/32 px, monocromo claro, monocromo oscuro y avatar, y veredicto humano de Matías. Queda sin efecto porque Matías aprobó el sistema de branding nuevo, que trae su propio isotipo.)* |
| DH-7 | **ENMENDADA 2026-09-15.** La excepción de encapsulamiento pasa a la **V nueva**. Sus cuatro tonos de degradado que no son de la paleta —`#FF512C` y `#FC4D27` en la pata izquierda, `#8139F8` y `#7432E8` en la derecha— son material interno del asset: se quedan dentro de `velocentum-v-bicolor.svg`, `velocentum-v-bicolor-ui.svg` y `velocentum-v-fondo-negro.svg`, **no generan tokens** y no reaparecen en otros componentes. Los extremos `#F5451F` y `#8A3FFC` coinciden con bermellón y violeta, que ya son tokens por DH-4, no por la V. *(Enmienda 2026-09-15: la resolución original era "El espectro multicolor del Prisma se conserva como excepción semántica deliberada, encapsulada en el asset", extendida el 2026-08-31 a los 35 tonos de facetado de `isotipo-approved.svg`. Queda sin efecto porque los dos assets son de crystal —hoy en `src/documents/theme/marca/`, el Prisma como `objects/prism.svg`— y crystal se retira (DH-10); su salida del repo se decide en F2b junto con la del tema.)* |
| DH-8 | **ENMENDADA 2026-09-15.** Las variantes de la herramienta son cuatro, las del sistema nuevo: **logotipo negro** (`velocentum-logotipo-negro.svg`, sobre fondos claros), **logotipo blanco** (`velocentum-logotipo-blanco.svg`, sobre navy, tinta o colores oscuros), **V bicolor** (`velocentum-v-bicolor.svg`, encuadre cuadrado para portada, redes y exportaciones) y **V bicolor para interfaz** (`velocentum-v-bicolor-ui.svg`, encuadre recortado para espacios chicos). Reglas de uso (docx): no deformar, rotar ni aplicar sombras al logo; zona libre alrededor equivalente al **25 % de su altura**; **wordmark completo en portadas y cierres**; **V sola para numeración, sello, favicon o firma chica**; los PNG para redes se exportan desde el SVG cuadrado con fondo transparente. `velocentum-v-fondo-negro.*` y `Foto IG.png` vienen en la carpeta pero no son variantes de la herramienta. *(Enmienda 2026-09-15: la resolución original era "Para la herramienta alcanzan `isotipo-approved.svg` + lockup tipográfico en Satoshi", con `crystal-v-short-b.svg` como posible variante simplificada ≤24 px y las variantes Simple/Brand/Object y el lockup horizontal como entregables futuros. Queda sin efecto porque el sistema nuevo trae su propio wordmark y sus variantes: el lockup tipográfico en Satoshi, `crystal-v-short-b.svg` y las variantes Simple/Brand/Object dejan de aplicar a la herramienta. Segunda enmienda 2026-09-15: el wordmark estaba solo en PNG —`velocentum-logotipo-negro.png` y `velocentum-logotipo-blanco-tight.png`— y esa era la variante que nombraba esta decisión. Matías proveyó los SVG el mismo día; la interfaz pasó a usarlos, y los PNG quedan en el repo para redes. Ver `src/assets/marca/web-v1/PROCEDENCIA.md`.)* |
| DH-9 | **ENMENDADA 2026-09-15.** Las tipografías del sistema son tres: **Anton** (400) para display: títulos grandes, portadas, números de sección y frases de impacto, preferentemente en mayúsculas. **Manrope** (400–800) para texto: cuerpo, tablas, conclusiones, botones y explicaciones. **Geist Mono** (400–500) **se conserva** para labels, estados, identificadores, fechas, categorías, métricas y datos técnicos; es la que ya está en el repo (`src/assets/fuentes/geist-mono/`). Anton y Manrope entran con el mismo criterio que tuvo Geist Mono: archivos estáticos locales, licencia incluida, sin CDN; si falta la licencia, se frena y se reporta. *(F2b, 2026-09-15: entraron en `src/assets/fuentes/anton/` y `src/assets/fuentes/manrope/`, con el `OFL.txt` oficial de `google/fonts` (commit `1ac2012c`) como `LICENSE.txt`; Geist Mono suma sus woff2 en `src/assets/fuentes/geist-mono/woff2/`. Los woff2 de Manrope y Geist Mono son variables (eje `wght`), locales igual. La interfaz dejó de cargar Inter Tight desde Google Fonts.)* **Satoshi e Inter dejan de ser las tipografías del sistema, pero NO se sacan del repo:** el pipeline de PDF en v1 las consume (`registrar-fuentes.ts`; `velocentum-light-v1` las usa como `heading` y `body`) y sacarlas lo rompería. Siguen en el repo, con sus licencias, mientras exista la cadena v1. *(Enmienda 2026-09-15: la resolución original era "Geist Mono entra para labels, estados, identificadores y microcopy técnico […]. Satoshi e Inter quedan como están", con Satoshi e Inter como tipografías del sistema. Queda sin efecto porque el sistema de branding nuevo define Anton y Manrope; Geist Mono y la regla de fuente oficial con licencia se mantienen.)* |
| DH-10 | **ENMENDADA 2026-09-15.** `velocentum-crystal/v1` queda **retirado**: no es destino de ninguna migración. Nunca se activó (`tema-activo.ts` sigue en `velocentum-light-v1`); se decide en F2b si su código y sus tests salen del repo. *(F2b, 2026-09-15: salen, por decisión de Matías: el tema, su test y su test de contraste —reemplazados por los de `velocentum-web/v1`—, `src/documents/theme/marca/` y los scripts de F1 que lo generaban. Ningún documento los consumía. `velocentum-web/v1` queda registrado en el interruptor, que sigue en `velocentum-light-v1`.)* El tema nuevo se llama **`velocentum-web/v1`** (en código, `velocentum-web-v1`). Es un nombre propuesto: ni el docx ni `tokens.css` nombran el sistema, y `tokens.css` solo se identifica como "VELOCENTUM.COM — TOKENS V3", que es la versión de los tokens del sitio, no el nombre de un tema. Rige salvo que Matías lo cambie antes del prompt de F2b. "v2" sigue reservado al motor documental. El tema vive junto al existente, reversible, sin modificar `velocentum-light-v1` ni su test. *(Enmienda 2026-09-15: la resolución original era "El tema nuevo se llama `velocentum-crystal/v1`" y queda sin efecto porque el sistema de branding crystal de F1 fue reemplazado por completo por el sistema nuevo.)* |
| DH-11 | **ENMENDADA 2026-09-15.** Ya no hay lockup en Satoshi. El wordmark (DH-8) va siempre como imagen, entero, y ningún texto se compone dentro de él ni dentro de su zona libre, que es el 25 % de su altura medida sobre la tinta del logo, no sobre el lienzo del archivo. El descriptor y el claim son texto vivo, aparte. **"Velocentum · Equipo de crecimiento"** va en acceso, navegación principal y portadas. Junto al wordmark, "Velocentum" ya lo dice el logo, así que el texto queda en "Equipo de crecimiento": en Geist Mono (etiqueta, DH-9), del color de la variante del logo (tinta con el negro, blanco con el blanco), debajo del wordmark, fuera de su zona libre y alineado al borde izquierdo de su tinta. Donde la V va sola, sin wordmark, el texto va completo. **"Estamos en el negocio de hacer crecer negocios"** va en acceso, portada institucional y cierre. Es una frase de impacto, en Anton (DH-9), en un bloque propio y nunca pegada al wordmark como si fuera parte del logo. No se repite en headers/footers/páginas interiores. No se reescriben hallazgos, cifras, conclusiones ni recomendaciones para insertar el posicionamiento. *(Enmienda 2026-09-15: la resolución original ubicaba el descriptor en "acceso, navegación principal, lockup y portadas"; el lockup era el tipográfico en Satoshi de la DH-8 original y ya no existe. Las ubicaciones y las prohibiciones se mantienen; lo nuevo es cómo conviven descriptor y claim con el wordmark.)* |
| DH-12 | **NUEVA 2026-09-15.** Las **formas onduladas** son cuatro SVG de `src/assets/marca/web-v1/formas-onduladas/` (la herramienta no tiene portada ni cierre propios, así que no los usa en pantalla): `borde-onda.svg` (onda de entrada, separa una sección de otra), `borde-onda-contorno.svg` (con línea negra, separa una sección blanca de una de color), `borde-onda-abajo.svg` (cierre invertido de una sección) y `tarjeta-onda.svg` (tarjeta orgánica, solo para tarjetas destacadas). Se usan en **portadas, divisores de capítulo y cierre**, y no se aplican a todas las tablas o tarjetas. En A4, la franja ondulada mide **18–28 mm** de alto. La línea del contorno mide **2–2,5 px** en exportación digital; el archivo trae un trazo de 2.5 con `vector-effect: non-scaling-stroke`, así que no se engrosa al estirarse. Las tarjetas normales no llevan onda: esquinas de 16–24 px (`--r-media` / `--r-card`, DH-13) y borde oscuro de 2 px. Las ondas se estiran en horizontal (`preserveAspectRatio="none"`); `borde-onda` y `borde-onda-abajo` toman color por `currentColor`. Si se usan como máscara, rige `tokens.css`: propiedades de máscara separadas (el shorthand `mask-image: url(...) 50%/cover no-repeat alpha` no es válido), sobre una capa decorativa con `pointer-events: none`, **nunca sobre texto, controles ni anillos de foco** |
| DH-13 | **NUEVA 2026-09-15.** Las escalas de `tokens.css` entran tal cual, con sus nombres. **Separación:** `--space-1`…`--space-7` = 4, 8, 16, 24, 32, 48, 64 px; `--space-section` 100 px (64 px hasta 809 px de ancho); `--page-gutter` 16 px. **Radios:** `--r-card` 24, `--r-media` 16, `--r-campo` 16, `--r-pill` 999 px. **Movimiento:** `--motion-hover` 180 ms, `--motion-reveal` 240 ms, `--motion-stagger` 50 ms, `--motion-curtain-phase` 300 ms, curva `--motion-ease: cubic-bezier(.22,1,.36,1)`. Con `prefers-reduced-motion` los tiempos van a cero, y eso no alcanza: la lógica apaga sticky y scroll-linked, detiene tickers y muestra el contenido completo, y ningún bloque arranca permanentemente oculto. **Capas:** `--layer-content` 0, `--layer-nav` 20, `--layer-menu` 30, `--layer-curtain` 50, `--layer-cursor` 60. Los contenedores y las dimensiones funcionales de `tokens.css` también entran. Las mecánicas medidas en el sitio (`--sticky-servicios`, `--sticky-clientes`, `--alto-caso`, `--degradado-borde`, `--grid-gap-trabajos`) son de sus secciones y no entran a la herramienta sin decisión humana |
| CE-1 | El `"v2"` local de `motor-activo.ts` fue una prueba deliberada. Preflight restaura **exclusivamente** ese archivo a `"v1"`. Durante BV4, v2 puede activarse temporalmente para pruebas, pero **ningún commit candidato lo deja activo**. La promoción permanente de v2 requiere aprobación humana posterior |
| S-1 | Paginación = F3a, dentro de Documentos, antes de F3b |
| S-2 | Panel comercial = F2a: después de Foundation, antes del resto de la interfaz, con tokens nuevos, disponible antes de F3 |

Decisiones de consolidación aprobadas: el preflight viaja dentro del prompt de
F1; la rama es `feat/bv4-rebranding` desde `831ef34`; las decisiones de marca
son humanas; los valores de color son los de `tokens.css` más navy (DH-4) y
no se modifican sin decisión humana. *(Enmienda 2026-09-15: decía "el
veredicto del isotipo es humano; los neutros se ajustan dentro de la familia
aprobada, los pinks vinculantes no se modifican sin decisión humana". La
familia de neutros y los pinks eran de crystal (DH-4 y DH-5 originales), y el
isotipo nuevo ya es decisión de Matías (DH-6).)*

**Enmienda de branding (2026-09-15).** Matías aprobó un sistema de branding
nuevo que reemplaza por completo al de F1; DH-4, DH-6, DH-8, DH-9 y DH-10
quedan enmendadas en consecuencia. El material está versionado en el repo
(rutas abajo, en "Versionado"): `tokens.css` es la fuente de verdad de los
valores, `Sistema de diseño.docx` dice cómo se usan (declara que el sistema traslada la estética de Velocentum
a la herramienta de diagnóstico y a los PDF), y están además las fuentes
(Anton, Manrope, Geist Mono), los logos y las formas onduladas. Si el docx y
`tokens.css` no coinciden en un valor, gana `tokens.css`. Los enlaces del
docx apuntan al repo del sitio (`web-oficial-velocentum`); para esta
herramienta valen las rutas del repo. La migración del tema es
**F2b**; los PDF quedan para **F3b**, porque `motor-activo.ts` está en
`"v1"` y la cadena v2 no se sirve hoy.

**Versionado (F2b, 2026-09-15).** Rutas definitivas del sistema:

- `tokens.css` → `src/documents/theme/fuente-web-v1/tokens.css`
- `Sistema de diseño.docx` → `docs/branding-web-v1/Sistema de diseño.docx`
- Fuentes → `src/assets/fuentes/anton/woff2/`, `src/assets/fuentes/manrope/woff2/`
  y `src/assets/fuentes/geist-mono/woff2/`, con su `LICENSE.txt`
- Logos → `src/assets/marca/web-v1/logo/`
- Formas onduladas → `src/assets/marca/web-v1/formas-onduladas/`

Cada carpeta tiene su `PROCEDENCIA.md` con los SHA-256. Matías entregó el
material en una carpeta sin versionar, `.branding-nuevo/`; sus 20 archivos
se copiaron byte a byte (verificado por SHA-256) y la carpeta se retiró del
disco el mismo día, para que no quedara una segunda copia que pudiera
desviarse. La fuente es el repo.

**Cierre de la salida de crystal (2026-09-15).** Matías decidió que sale todo
lo de crystal. Quedan enmendadas además DH-3, DH-4 (por segunda vez: sale el
rosa, entra navy), DH-7 y DH-11. DH-5 queda retirada; la reemplazan el CTA
(violeta desde la corrección de Matías en F2b) y los colores de estado. Se suman DH-12 (formas onduladas) y DH-13
(escalas). Donde el docx asigna usos que estas decisiones cambian (CTA
bermellón, rosa para énfasis y CTA), gana este contrato. Los documentos de
F1 —`BV4_BRANDING_CONFIRMADO/`, el Plan Maestro 03–05,
`rebranding-primera-entrega-v2.md`, `docs/bv4-f1-muestra-visual.html` y la
lámina del isotipo— quedan como **referencia histórica, no como fuente**.

**Dependencias verificadas el 2026-09-15.**

- **El wordmark solo existe en PNG:** el negro mide 2117×743 y trae margen
  transparente (la tinta ocupa unos 1925×291); el blanco tight mide
  1933×299. La V sí es vectorial, incluidas la variante de interfaz (viewBox
  recortado `128.25 218 996.52 841`) y la de fondo negro. Los PDF necesitan
  el wordmark en SVG: **dependencia de F3b**, que provee Matías; no se
  vectoriza por cuenta propia (sección 3). *(Cubierta el 2026-09-15: Matías
  proveyó `velocentum-logotipo-negro.svg` y `velocentum-logotipo-blanco.svg`,
  viewBox `0 0 2117 743`, el mismo lienzo del PNG negro. Están en
  `src/assets/marca/web-v1/logo/` y la interfaz ya los usa; los PNG quedan
  para redes. F3b ya no depende de esto.)*
- **Las fuentes del paquete no traen archivos de licencia**, y DH-9 los
  exige. Son los woff2 latin y latin-ext de Anton, Manrope y Geist Mono
  (hoy en `src/assets/fuentes/*/woff2/`). **Pendiente antes de que Anton y Manrope entren
  al repo.** *(Resuelto en F2b, 2026-09-15: ver DH-9.)* Geist Mono no queda afectada: la del repo
  (`src/assets/fuentes/geist-mono/`) ya tiene su `LICENSE.txt`.
- **La mancha de color de portada no existe como asset.** El docx descarta
  `hero-mancha-referencia.png` por provisional y propone recrear una propia;
  no se inventa (sección 3). Si F3b la necesita, es dependencia, y va sin
  rosa (DH-5).

## 3 · Invariantes del bloque (todas las fases)

- `main` intacto. Sin publicación, sin producción, sin base de datos, sin
  migraciones de esquema, sin secretos.
- Cadena v1 completa (tema, renderers, tests) intacta como ancla de rollback.
- **Commit candidato local, sin push**: Claude Code no ejecuta `git push` al
  cierre de una fase. El push es posterior al gate visual humano y a la
  auditoría externa, y requiere autorización expresa de Matías en cada fase.
- Nada se inventa: ni cifras, ni servicios, ni precios, ni claims, ni métricas,
  ni assets sustitutos. Faltante = parada y reporte.
- Prompt de cada fase guardado verbatim en `docs/prompts/` antes de empezar.
- Artefactos de auditoría generados desde worktree limpio del commit candidato.
- Máximo dos rondas de corrección por fase; handoff final ≤10 líneas (commit,
  pruebas, qué cambió, qué se encontró, qué queda). **Excepción registrada
  (F2a, 2026-09-01):** Matías autorizó una tercera ronda con motivo explícito
  —el reparto 30/60/90 es lógica de negocio, no presentación, y diferirlo a
  F3b habría dejado que una fase de arte rediseñara el render sobre un
  reparto incorrecto—. La excepción es de esa ronda y ese motivo; el límite
  sigue siendo dos. Prompt verbatim en
  `docs/prompts/bv4-f2a-ronda3-roadmap-prompt.md`.
- El auditor (este chat) no ejecuta `git push` ni escribe en el repo; Claude
  Code ejecuta, este chat audita contra artefactos crudos.
- Toda contradicción real entre branding, contrato funcional, accesibilidad,
  legibilidad o render PDF: se documenta y se frena. No se improvisa.

## 4 · Rama de trabajo (confirmada)

**`feat/bv4-rebranding`**, creada desde `831ef34`.
`feat/noche-continuacion` queda congelada como ancla de Fase 14.1. La rama
nueva permanece **solo local** hasta la primera autorización de push (paso 9
de la secuencia de cierre de F1).

## 5 · Archivos que Matías deja accesibles a Claude Code

**Enmienda 2026-09-15.** La fuente de branding vigente está en el repo, en las
rutas de "Versionado" (sección 2): `tokens.css` para los valores,
`Sistema de diseño.docx` para el uso, más las fuentes, los logos y las formas
onduladas. Los ítems 3, 5 y 6 de abajo
—`BV4_BRANDING_CONFIRMADO/`, el Plan Maestro 03–05 y
`rebranding-primera-entrega-v2.md`— eran las fuentes de crystal. Quedan como
**referencia histórica de F1, no como fuente**. La directiva del ítem 4 sigue
vigente para proceso y QA (§10, F4); donde fije valores de marca, gana
`src/documents/theme/fuente-web-v1/tokens.css`. La lista se conserva como registro de lo que se entregó
para F1.

**Necesarios para F1:**

1. `bv4-f1-foundation-prompt.md` — el prompt ejecutable (se guarda en
   `docs/prompts/`).
2. `bv4-contrato-maestro.md` — este documento (guardarlo en `docs/`).
3. *[Referencia histórica desde 2026-09-15.]* **ACTUALIZADO 2026-08-31.** Todo el material vive en una única carpeta:
   `~/Desktop/BV4_BRANDING_CONFIRMADO/` — `assets/` (biblioteca oficial
   aprobada, lo que se copia al repo), `docs/` (contrato, prompts,
   auditorías) y `referencia/` (boards, solo QA). El paquete
   "Velocentum_Brand_Assets_V2_Board_Exact" **queda retirado**: traía
   versiones más pobres de `bars` y `target`.
4. `actualizacion-vinculante-rebranding.txt` — directiva original.
5. *[Referencia histórica desde 2026-09-15.]*
   `Plan_Maestro_Velocentum_2026.pdf` — secciones 03–05 (dirección visual,
   sistema de marca, biblioteca de objetos).
6. *[Referencia histórica desde 2026-09-15.]*
   `rebranding-primera-entrega-v2.md` — auditoría aprobada, evidencia y mapeo
   de tokens.

**No adjuntar:** Geist Mono (Claude Code la obtiene de la fuente oficial con
su licencia según DH-9; si su entorno no puede descargarla, frena y la reporta
como dependencia para que la provea Matías). Satoshi e Inter ya están en el
repo.

**Para F2a (todavía no):** `f2a-panel-comercial-reconciliado.md` (entrada
vigente, con Q1–Q10 cerradas) y, como referencia histórica de lo confirmado,
`paso-1-panel-seleccion-comercial.md`. Se adjuntan cuando se redacte el prompt
de F2a, después de la auditoría aprobada de F1.

## 6 · Mensaje de inicio para Claude Code (copiar y pegar)

*(Enmienda 2026-09-15: es el mensaje con que arrancó F1 y se conserva como
registro. La ruta de assets del punto 5 era la de crystal y no rige: el
material vigente está en las rutas de "Versionado", sección 2.)*

```text
Iniciamos Bloque Visual 4 · Rebranding — SOLO fase F1 Foundation.

1. Guardá el adjunto bv4-f1-foundation-prompt.md verbatim en docs/prompts/
   y ejecutalo etapa por etapa, en orden, sin saltear gates.
2. Contrato normativo: bv4-contrato-maestro.md (guardalo en docs/). Ante
   cualquier contradicción real, frenás y reportás; no improvisás.
3. Base: HEAD 831ef34. Antes de todo, restaurá exclusivamente
   src/documents/motor-activo.ts a "v1" y verificá árbol limpio.
4. Rama de trabajo: feat/bv4-rebranding creada desde 831ef34, solo local.
5. Los assets de marca están en:
   ~/Desktop/BV4_BRANDING_CONFIRMADO/assets/  (biblioteca oficial aprobada;
   el paquete V2 Board Exact queda retirado y no se usa)
6. Al terminar: commit candidato LOCAL, handoff de máximo 10 líneas + ZIP de
   artefactos desde worktree limpio de ese commit, y te detenés por completo.
7. NO pushees hasta autorización posterior: el push llega recién después de
   la auditoría externa y de mi veredicto sobre el isotipo y la muestra.

No toques main. No publiques. No promuevas el motor v2. No avances a F2.
```
