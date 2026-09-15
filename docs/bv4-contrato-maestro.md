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
| **F1 · Foundation** | Inventario de los [NV]; tema `velocentum-crystal/v1` + switch; neutros DH-4 con verificación automática de contraste; Geist Mono (DH-9); assets SVG al repo; test del isotipo (DH-6); lockup tipográfico Satoshi; muestra visual | commit candidato **local, sin push** → auditoría externa contra artefactos crudos → **aprobación visual de Matías** (muestra + isotipo) → push solo con autorización expresa |
| **F2a · Panel de selección comercial** | Implementar el panel según `f2a-panel-comercial-reconciliado.md`, una vez resueltas sus preguntas (ver sección 1.1); nace con tokens crystal | flujo diagnóstico → proyección → selección confirmada → propuesta → PDF descargado en **pantalla y A4**, dos perfiles de cliente, y **el contenido extraído del PDF de la interfaz dice lo mismo que el del pipeline**, con la fecha del diagnóstico como única exclusión declarada. *(Enmienda 2026-09-05: el criterio original era "SHA-256 interfaz = pipeline" y queda sin efecto por **H-14** — la app genera la fecha del diagnóstico al vuelo y la imprime, así que la igualdad byte a byte es imposible de cumplir. Pasos en `docs/bv4-f2a-gate-navegador.md`.)* |
| **F2b · Resto de la interfaz** | Migración UI al esquema híbrido DH-3. *(Enmienda 2026-09-15: la migración del tema a `velocentum-web/v1` —paleta DH-4, isotipo DH-6, variantes DH-8, tipografías DH-9— se hace en F2b; crystal queda retirado, DH-10.)* | antes/después desktop+mobile, contraste AA, focus visible, estados funcionales intactos |
| **F3a · Paginación y densidad documental** | E-21, E-28: fusión de secciones, continuaciones, grilla, ambos perfiles | matriz de 54 PDFs sin páginas <50% de ocupación salvo excepción registrada; cero cortes/solapes |
| **F3b · Rebranding de documentos** | Jerarquía tipográfica, objetos semánticos, portadas, cierres, claim (DH-11), A4/16:9 y web v2. *(Enmienda 2026-09-15: los PDF adoptan el sistema nuevo recién en F3b. Hoy `src/documents/motor-activo.ts` está en `"v1"` y la cadena v2 no se sirve; hasta F3b los PDF salen de la cadena v1 tal como está, con Satoshi e Inter, DH-9.)* | matriz de 54 rasterizada e inspeccionada, ambos perfiles, paridad PDF/web |
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
| DH-3 | UI **híbrida**: superficies de trabajo/formularios/tablas/diagnóstico/lectura prolongada claras; navegación/acceso/portadas/cierres/transiciones/momentos de marca en ink/surface; pink como energía controlada, nunca baño general |
| DH-4 | **ENMENDADA 2026-09-15.** La paleta es la del sistema nuevo (`.branding-nuevo/tokens.css`, fuente de verdad de los valores): fondo `#FDFCFA`, tinta `#141024` (18.1:1 sobre fondo), texto de apoyo `#6B6880` (5.2:1 sobre fondo). Cinco acentos, cada uno con su par de texto **obligatorio** —también en hover, footer, chips y estados activos—: azul `#1F6BFF` / `#FFFFFF` (4.56:1), bermellón `#F5451F` / `#141024` (5.09:1), verde `#00C878` / `#141024` (8.44:1), violeta `#8A3FFC` / `#FFFFFF` (5.00:1), amarillo `#FFC300` / `#141024` (11.56:1). Rosa de marca `#FF1F6B` / `#141024` (5.01:1) **solo para CTA y estados de interacción**; los links de navegación no se vuelven rosas. El contraste viene verificado en `tokens.css`; al implementarse se vuelve a verificar con el test automático de contraste, como en F1. Un color que el docx nombre y `tokens.css` no traiga no entra como token sin decisión humana. *(Enmienda 2026-09-15: la resolución original era "Neutros aprobados: surfaceSoft `#F5F5F7`, borderLight `#E9E9EE`, borderDark `#2A2A35`, muted `#6E6E7A`; si un par no alcanza AA, se ajusta el neutro dentro de la misma familia" y queda sin efecto porque Matías aprobó un sistema de branding nuevo que reemplaza por completo al de F1 — esos neutros pertenecían a la familia crystal, que se retira (DH-10).)* |
| DH-5 | `#D92F6E` para texto acentuado sobre claro. `#FF4B8D` para CTA/display/actividad/gráfica, **nunca** texto chico sobre blanco. Success/warning/error conservan color propio |
| DH-6 | **ENMENDADA 2026-09-15.** El isotipo es **`velocentum-v-bicolor.svg`**: una V de dos patas rectas separadas, la izquierda con degradado naranja (`#FF512C` → `#FC4D27` → `#F5451F`) y la derecha con degradado violeta (`#8A3FFC` → `#8139F8` → `#7432E8`). Reemplaza a `isotipo-approved.svg` (hoy en `src/documents/theme/marca/`) en todo uso nuevo. Para espacios chicos se usa `velocentum-v-bicolor-ui.svg`, con los mismos paths y degradados y el viewBox recortado (DH-8). **Es una decisión humana de Matías del 2026-09-15, con el mismo peso que el veredicto original de DH-6**; Claude Code no la reabre ni la somete a un gate propio. `isotipo-approved.svg` sigue en el repo mientras exista el tema crystal; se decide su retiro en F2b. *(Enmienda 2026-09-15: la resolución original era "El isotipo es `isotipo-approved.svg`, aportado por Matías; reemplaza a `crystal-v-short-b.svg` en todo uso", con el gate de 16/24/32 px, monocromo claro, monocromo oscuro y avatar, y veredicto humano de Matías. Queda sin efecto porque Matías aprobó el sistema de branding nuevo, que trae su propio isotipo.)* |
| DH-7 | El espectro multicolor del Prisma se conserva como excepción semántica deliberada, **encapsulada en el asset**: sus violetas/verdes/cyan/amarillo no se convierten en tokens ni reaparecen en otros componentes. **Extensión 2026-08-31:** `isotipo-approved.svg` usa 35 tonos propios de facetado, ninguno de la paleta vinculante; se aplica el mismo criterio de encapsulamiento — el material interno del asset no genera tokens |
| DH-8 | **ENMENDADA 2026-09-15.** Las variantes de la herramienta son cuatro, las del sistema nuevo: **logotipo negro** (`velocentum-logotipo-negro.png`, sobre fondos claros), **logotipo blanco** (`velocentum-logotipo-blanco-tight.png`, sobre navy, tinta o colores oscuros), **V bicolor** (`velocentum-v-bicolor.svg`, encuadre cuadrado para portada, redes y exportaciones) y **V bicolor para interfaz** (`velocentum-v-bicolor-ui.svg`, encuadre recortado para espacios chicos). Reglas de uso (docx): no deformar, rotar ni aplicar sombras al logo; zona libre alrededor equivalente al **25 % de su altura**; **wordmark completo en portadas y cierres**; **V sola para numeración, sello, favicon o firma chica**; los PNG para redes se exportan desde el SVG cuadrado con fondo transparente. `velocentum-v-fondo-negro.*` y `Foto IG.png` vienen en la carpeta pero no son variantes de la herramienta. *(Enmienda 2026-09-15: la resolución original era "Para la herramienta alcanzan `isotipo-approved.svg` + lockup tipográfico en Satoshi", con `crystal-v-short-b.svg` como posible variante simplificada ≤24 px y las variantes Simple/Brand/Object y el lockup horizontal como entregables futuros. Queda sin efecto porque el sistema nuevo trae su propio wordmark y sus variantes: el lockup tipográfico en Satoshi, `crystal-v-short-b.svg` y las variantes Simple/Brand/Object dejan de aplicar a la herramienta.)* |
| DH-9 | **ENMENDADA 2026-09-15.** Las tipografías del sistema son tres: **Anton** (400) para display: títulos grandes, portadas, números de sección y frases de impacto, preferentemente en mayúsculas. **Manrope** (400–800) para texto: cuerpo, tablas, conclusiones, botones y explicaciones. **Geist Mono** (400–500) **se conserva** para labels, estados, identificadores, fechas, categorías, métricas y datos técnicos; es la que ya está en el repo (`src/assets/fuentes/geist-mono/`). Anton y Manrope entran con el mismo criterio que tuvo Geist Mono: archivos estáticos locales, licencia incluida, sin CDN; si falta la licencia, se frena y se reporta. **Satoshi e Inter dejan de ser las tipografías del sistema, pero NO se sacan del repo:** el pipeline de PDF en v1 las consume (`registrar-fuentes.ts`; `velocentum-light-v1` las usa como `heading` y `body`) y sacarlas lo rompería. Siguen en el repo, con sus licencias, mientras exista la cadena v1. *(Enmienda 2026-09-15: la resolución original era "Geist Mono entra para labels, estados, identificadores y microcopy técnico […]. Satoshi e Inter quedan como están", con Satoshi e Inter como tipografías del sistema. Queda sin efecto porque el sistema de branding nuevo define Anton y Manrope; Geist Mono y la regla de fuente oficial con licencia se mantienen.)* |
| DH-10 | **ENMENDADA 2026-09-15.** `velocentum-crystal/v1` queda **retirado**: no es destino de ninguna migración. Nunca se activó (`tema-activo.ts` sigue en `velocentum-light-v1`); se decide en F2b si su código y sus tests salen del repo. El tema nuevo se llama **`velocentum-web/v1`** (en código, `velocentum-web-v1`). Es un nombre propuesto: ni el docx ni `tokens.css` nombran el sistema, y `tokens.css` solo se identifica como "VELOCENTUM.COM — TOKENS V3", que es la versión de los tokens del sitio, no el nombre de un tema. Rige salvo que Matías lo cambie antes del prompt de F2b. "v2" sigue reservado al motor documental. El tema vive junto al existente, reversible, sin modificar `velocentum-light-v1` ni su test. *(Enmienda 2026-09-15: la resolución original era "El tema nuevo se llama `velocentum-crystal/v1`" y queda sin efecto porque el sistema de branding crystal de F1 fue reemplazado por completo por el sistema nuevo.)* |
| DH-11 | "Velocentum · Equipo de crecimiento": acceso, navegación principal, lockup y portadas. "Estamos en el negocio de hacer crecer negocios": acceso, portada institucional y cierre. No se repite en headers/footers/páginas interiores. No se reescriben hallazgos, cifras, conclusiones ni recomendaciones para insertar el posicionamiento |
| CE-1 | El `"v2"` local de `motor-activo.ts` fue una prueba deliberada. Preflight restaura **exclusivamente** ese archivo a `"v1"`. Durante BV4, v2 puede activarse temporalmente para pruebas, pero **ningún commit candidato lo deja activo**. La promoción permanente de v2 requiere aprobación humana posterior |
| S-1 | Paginación = F3a, dentro de Documentos, antes de F3b |
| S-2 | Panel comercial = F2a: después de Foundation, antes del resto de la interfaz, con tokens nuevos, disponible antes de F3 |

Decisiones de consolidación aprobadas: el preflight viaja dentro del prompt de
F1; la rama es `feat/bv4-rebranding` desde `831ef34`; el veredicto del isotipo
es humano; los neutros se ajustan dentro de la familia aprobada, los pinks
vinculantes no se modifican sin decisión humana.

**Enmienda de branding (2026-09-15).** Matías aprobó un sistema de branding
nuevo que reemplaza por completo al de F1; DH-4, DH-6, DH-8, DH-9 y DH-10
quedan enmendadas en consecuencia. El material vive en `.branding-nuevo/`:
`tokens.css` es la fuente de verdad de los valores, `Sistema de diseño.docx`
dice cómo se usan (declara que el sistema traslada la estética de Velocentum
a la herramienta de diagnóstico y a los PDF), y están además las fuentes
(Anton, Manrope, Geist Mono), los logos y las formas onduladas. Si el docx y
`tokens.css` no coinciden en un valor, gana `tokens.css`. Los enlaces del
docx apuntan al repo del sitio (`web-oficial-velocentum`); para esta
herramienta vale la copia de `.branding-nuevo/`. La migración del tema es
**F2b**; los PDF quedan para **F3b**, porque `motor-activo.ts` está en
`"v1"` y la cadena v2 no se sirve hoy.

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

**Necesarios para F1:**

1. `bv4-f1-foundation-prompt.md` — el prompt ejecutable (se guarda en
   `docs/prompts/`).
2. `bv4-contrato-maestro.md` — este documento (guardarlo en `docs/`).
3. **ACTUALIZADO 2026-08-31.** Todo el material vive en una única carpeta:
   `~/Desktop/BV4_BRANDING_CONFIRMADO/` — `assets/` (biblioteca oficial
   aprobada, lo que se copia al repo), `docs/` (contrato, prompts,
   auditorías) y `referencia/` (boards, solo QA). El paquete
   "Velocentum_Brand_Assets_V2_Board_Exact" **queda retirado**: traía
   versiones más pobres de `bars` y `target`.
4. `actualizacion-vinculante-rebranding.txt` — directiva original.
5. `Plan_Maestro_Velocentum_2026.pdf` — secciones 03–05 (dirección visual,
   sistema de marca, biblioteca de objetos).
6. `rebranding-primera-entrega-v2.md` — auditoría aprobada, evidencia y mapeo
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
