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
| **F2a · Panel de selección comercial** | Implementar el panel según `f2a-panel-comercial-reconciliado.md`, una vez resueltas sus preguntas (ver sección 1.1); nace con tokens crystal | flujo diagnóstico → proyección → selección confirmada → propuesta → PDF descargado en **pantalla y A4**, dos perfiles de cliente, SHA-256 interfaz = pipeline |
| **F2b · Resto de la interfaz** | Migración UI al esquema híbrido DH-3 | antes/después desktop+mobile, contraste AA, focus visible, estados funcionales intactos |
| **F3a · Paginación y densidad documental** | E-21, E-28: fusión de secciones, continuaciones, grilla, ambos perfiles | matriz de 54 PDFs sin páginas <50% de ocupación salvo excepción registrada; cero cortes/solapes |
| **F3b · Rebranding de documentos** | Jerarquía tipográfica, objetos semánticos, portadas, cierres, claim (DH-11), A4/16:9 y web v2 | matriz de 54 rasterizada e inspeccionada, ambos perfiles, paridad PDF/web |
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
| DH-4 | Neutros aprobados: surfaceSoft `#F5F5F7`, borderLight `#E9E9EE`, borderDark `#2A2A35`, muted `#6E6E7A`. Foundation verifica contraste automáticamente; si un par no alcanza AA, se ajusta el neutro dentro de la misma familia sin cambiar dirección visual |
| DH-5 | `#D92F6E` para texto acentuado sobre claro. `#FF4B8D` para CTA/display/actividad/gráfica, **nunca** texto chico sobre blanco. Success/warning/error conservan color propio |
| DH-6 | **ACTUALIZADA 2026-08-31.** El isotipo es **`isotipo-approved.svg`**, aportado por Matías; reemplaza a `crystal-v-short-b.svg` en todo uso. Gate de F1: se prueba a 16/24/32 px, monocromo claro, monocromo oscuro y avatar. **El veredicto es humano, de Matías; Claude Code no puede autoadjudicárselo.** Si pasa, queda aprobado como isotipo de la herramienta. Si falla a tamaños chicos, se detiene **solo** el lockup definitivo y el favicon, y se resuelve con variante simplificada (ver DH-8); el resto de F1 continúa |
| DH-7 | El espectro multicolor del Prisma se conserva como excepción semántica deliberada, **encapsulada en el asset**: sus violetas/verdes/cyan/amarillo no se convierten en tokens ni reaparecen en otros componentes. **Extensión 2026-08-31:** `isotipo-approved.svg` usa 35 tonos propios de facetado, ninguno de la paleta vinculante; se aplica el mismo criterio de encapsulamiento — el material interno del asset no genera tokens |
| DH-8 | **ACTUALIZADA 2026-08-31.** Para la herramienta alcanzan `isotipo-approved.svg` + lockup tipográfico en Satoshi. `crystal-v-short-b.svg` queda **retirado del uso principal** y se conserva únicamente como posible variante simplificada para tamaños ≤24 px si el test DH-6 muestra que el nuevo no lee — decisión de Matías tras ver la lámina. Las variantes Simple/Brand/Object y el lockup horizontal siguen siendo entregables futuros del rebranding institucional; no bloquean BV4 |
| DH-9 | Geist Mono entra para labels, estados, identificadores y microcopy técnico. Se obtiene **exclusivamente de fuente oficial**, con licencia incluida, archivos estáticos locales, sin CDN. Satoshi e Inter quedan como están (repo, `registrar-fuentes.ts`, data URI, licencias documentadas, consumidas por pdf-v2) |
| DH-10 | El tema nuevo se llama **`velocentum-crystal/v1`**. "v2" queda reservado al motor documental. El tema vive junto al existente, reversible, sin modificar `velocentum-light-v1` ni su test |
| DH-11 | "Velocentum · Equipo de crecimiento": acceso, navegación principal, lockup y portadas. "Estamos en el negocio de hacer crecer negocios": acceso, portada institucional y cierre. No se repite en headers/footers/páginas interiores. No se reescriben hallazgos, cifras, conclusiones ni recomendaciones para insertar el posicionamiento |
| CE-1 | El `"v2"` local de `motor-activo.ts` fue una prueba deliberada. Preflight restaura **exclusivamente** ese archivo a `"v1"`. Durante BV4, v2 puede activarse temporalmente para pruebas, pero **ningún commit candidato lo deja activo**. La promoción permanente de v2 requiere aprobación humana posterior |
| S-1 | Paginación = F3a, dentro de Documentos, antes de F3b |
| S-2 | Panel comercial = F2a: después de Foundation, antes del resto de la interfaz, con tokens nuevos, disponible antes de F3 |

Decisiones de consolidación aprobadas: el preflight viaja dentro del prompt de
F1; la rama es `feat/bv4-rebranding` desde `831ef34`; el veredicto del isotipo
es humano; los neutros se ajustan dentro de la familia aprobada, los pinks
vinculantes no se modifican sin decisión humana.

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
  pruebas, qué cambió, qué se encontró, qué queda).
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
