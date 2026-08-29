/**
 * PASO 6 (Bloque 3 Funcional): genera los 54 PDFs de revisión visual —
 * nueve casos (los seis escenarios demostrativos, mayorista, mixto y
 * "confirmada"), tres documentos, dos perfiles, con v2 (dos pasadas).
 * Mismo criterio que el generador hermano de v1
 * (`renderers/pdf/generar-pdfs-escenarios-demo.test.ts`): sólo escribe a
 * disco si se define `VELOCENTUM_BLOQUE3_QA_DIR`, pero siempre verifica
 * que los 54 documentos son PDFs válidos.
 *
 * R-03 (2026-08-27): esta ronda de corrección agregó verificación
 * automática permanente sobre estos documentos — H1 (contraste de
 * título en secciones oscuras), H2 (páginas sin contenido real /
 * anomalías de paginación), H3 (mojibake / cobertura de fuente en los
 * glifos no-ASCII usados). Generar una sola vez (`beforeAll`) y
 * compartir el resultado entre los `it()` de verificación evita pagar el
 * costo de generación más de una vez por corrida de suite.
 *
 * AJUSTES a R-03 (2026-08-27), punto 2: noveno caso "confirmada" — el
 * muestreo visual (punto 3) encontró que ninguno de los ocho casos
 * originales tiene `comercial` confirmado, así que `restrictions-grouped`
 * y el roadmap 30/60/90 (DHB-3) nunca se renderizaban en ningún
 * documento real, sólo en pruebas unitarias con fixtures sintéticas
 * (`roadmap-dhb-3.test.ts`). Este caso pasa por el pipeline real
 * (`calcularDiagnostico` → `buildDocumentContext`, sin datos inyectados
 * a mano) sobre `casoSnakeStore` (`src/lib/fixtures-casos.ts` — fixture
 * de regresión, NO el archivo de escenarios demostrativos, ver el
 * aislamiento de `fixtures-escenarios-demo.test.ts`), con una
 * `paquetesConfirmados` construida a mano (mismo criterio que
 * `buildMayoristaContext`/`buildMixtoContext`: contexto de prueba del
 * prototipo). Ejercita L7 (selección comercial completa) y L14 (roadmap
 * con selección confirmada) por artefacto real, no sólo por prueba.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { getDocument, GlobalWorkerOptions, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "../../templates/velocentum-v2";
import { buildMayoristaContext, buildMixtoContext } from "../../templates/velocentum-v2/test-fixtures";
import { renderPdfV2ConDosPasadas } from "./paginacion";
import type { PdfProfileV2 } from "./document";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  ESCENARIOS_DEMOSTRATIVOS,
  configuracionEscenariosDemo,
} from "../../../lib/fixtures-escenarios-demo";
import { casoSnakeStore, configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import type { EscaleraPaquetesConfirmada } from "../../../lib/paquetes";
import { buildDocumentContext, type DocumentContextV1 } from "../../domain";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;
type Tipo = (typeof TIPOS)[number];
const PERFILES: PdfProfileV2[] = ["pantalla", "impresion"];

function modelFor(tipo: Tipo, context: DocumentContextV1) {
  return tipo === "diagnostico"
    ? buildDiagnosticoDocumentV2(context)
    : tipo === "proyeccion_90d"
      ? buildProyeccion90dDocumentV2(context)
      : buildPropuestaDocumentV2(context);
}

type PaginaGenerada = { caso: string; tipo: Tipo; perfil: PdfProfileV2; pagina: number; texto: string };
type DocumentoGenerado = {
  caso: string;
  tipo: Tipo;
  perfil: PdfProfileV2;
  buffer: Uint8Array;
  numPaginas: number;
};

const documentos: DocumentoGenerado[] = [];
const paginas: PaginaGenerada[] = [];

/**
 * `pdfjs` extrae texto con letter-spacing separado en runs irregulares
 * ("P O R Q U É"), así que toda comparación contra un literal se hace
 * sin espacios de por medio — nunca contra el string con espacios tal
 * cual aparece en el código fuente del renderer.
 */
function sinEspacios(s: string): string {
  return s.replace(/\s+/g, "");
}

/**
 * Color de relleno REAL con el que el visor pinta el primer carácter de
 * `textoObjetivo` en `pagina` — no el par de tokens del tema, el color
 * que efectivamente quedó en el stream del PDF. Camina la lista de
 * operadores (`getOperatorList`), reconstruye el texto mostrado
 * carácter por carácter (cada `showText` en este renderer trae 1-2
 * glifos) y recuerda el último `setFillRGBColor` visto antes de que el
 * texto reconstruido empiece a coincidir con `textoObjetivo` (sin
 * espacios, mismo criterio que el resto del archivo). Ver H1.4 (R-03):
 * "el check debe contemplar contraste, no sólo texto".
 */
async function colorAlMostrar(
  pagina: { getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[] }> },
  textoObjetivo: string,
): Promise<string | null> {
  const objetivo = sinEspacios(textoObjetivo);
  const opList = await pagina.getOperatorList();
  const OPS_POR_CODIGO: Record<number, string> = {};
  for (const [nombre, codigo] of Object.entries(OPS)) OPS_POR_CODIGO[codigo as number] = nombre;

  let colorActual: string | null = null;
  let acumulado = "";
  for (let i = 0; i < opList.fnArray.length; i++) {
    const nombre = OPS_POR_CODIGO[opList.fnArray[i]!];
    const args = opList.argsArray[i];
    if (nombre === "setFillRGBColor" && Array.isArray(args) && typeof args[0] === "string") {
      colorActual = args[0];
    }
    if (nombre === "showText" && Array.isArray(args) && Array.isArray(args[0])) {
      const antes = acumulado.length;
      for (const glifo of args[0]) {
        if (glifo && typeof glifo === "object" && typeof glifo.unicode === "string") {
          acumulado += glifo.unicode;
        }
      }
      const acumuladoSinEspacios = sinEspacios(acumulado);
      const antesSinEspacios = sinEspacios(acumulado.slice(0, antes));
      if (acumuladoSinEspacios.includes(objetivo) && !antesSinEspacios.includes(objetivo)) {
        return colorActual;
      }
    }
  }
  return null;
}

/** WCAG 2.x: luminancia relativa + ratio de contraste, self-contained. */
function luminanciaRelativa(hex: string): number {
  const limpio = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(limpio.substring(i, i + 2), 16) / 255);
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
}
function ratioContraste(a: string, b: string): number {
  const [l1, l2] = [luminanciaRelativa(a), luminanciaRelativa(b)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * AJUSTES a R-03, punto 2 — datos del noveno caso ("confirmada"):
 * `casoSnakeStore` produce, vía el pipeline real, exactamente estos
 * hallazgos reales (verificado por inspección directa, no supuesto):
 * `retencion_recuperacion_carrito` (media, capa "servicio", servicioIds
 * ["planificacion_y_creacion_de_contenido"]), `retencion_subir_plan`
 * (media, sin servicio) y `comisiones` (media, sin servicio) — y dos
 * restricciones reales: `cobertura_productos_parcial` y
 * `politica_envio_no_confirmada`. Ninguno de los ocho casos originales
 * (ni sus variantes "CoberturaCompleta") tiene un hallazgo "alta" en
 * capa "servicio", así que no hay ningún dato real que llene la etapa
 * 30 del roadmap sin inventar uno — se deja vacía a propósito (mismo
 * principio de "cero ítems inventados" que exige `roadmap-dhb-3.test.ts`).
 * La escalera confirmada selecciona:
 *  - "Planificación y creación de contenido" (servicio real sugerido
 *    por el motor para este caso, ver `context.servicios`), con
 *    `hallazgoIds: ["retencion_recuperacion_carrito"]` — llena la etapa
 *    60 (media → 60) con la acción literal del hallazgo real.
 *  - "Meta Ads" (servicio del catálogo cerrado, sin ningún hallazgo real
 *    asociado en este caso), `hallazgoIds: []` — llena la etapa 90 con
 *    el servicio + las restricciones vigentes, mismo mecanismo que
 *    "un servicio sin hallazgo alta" en `roadmap-dhb-3.test.ts`.
 */
const ESCALERA_CONFIRMADA_SNAKE_STORE: EscaleraPaquetesConfirmada = {
  confirmado: true,
  niveles: [
    {
      id: "impulso",
      nombre: "IMPULSO",
      servicios: [
        {
          servicio: "Planificación y creación de contenido",
          unidad: "piezas_por_mes",
          cantidad: 4,
          descripcion: null,
          hallazgoIds: ["retencion_recuperacion_carrito"],
          propuestoPorSistema: true,
        },
        {
          servicio: "Meta Ads",
          unidad: "campañas_activas",
          cantidad: 2,
          descripcion: null,
          hallazgoIds: [],
          propuestoPorSistema: true,
        },
      ],
      precio: 850_000,
    },
  ],
};

describe("PDFs de revisión de los nueve casos (Bloque 3 Funcional, v2)", () => {
  beforeAll(async () => {
    const qaDir = process.env["VELOCENTUM_BLOQUE3_QA_DIR"];

    const casos: { id: string; contexto: (tipo: Tipo) => DocumentContextV1 }[] = [
      ...ESCENARIOS_DEMOSTRATIVOS.map((escenario) => ({
        id: escenario.id,
        contexto: (tipo: Tipo) => {
          const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
          return buildDocumentContext({
            datos: escenario.datos,
            resultado,
            diagnostico: { id: `demo-${escenario.id}-${tipo}`, version: 1, fecha: "2026-08-27" },
            tipoDocumento: tipo,
          });
        },
      })),
      { id: "mayorista", contexto: () => buildMayoristaContext() },
      { id: "mixto", contexto: () => buildMixtoContext() },
      {
        id: "confirmada",
        contexto: (tipo: Tipo) => {
          const resultado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
          return buildDocumentContext({
            datos: casoSnakeStore,
            resultado,
            diagnostico: { id: `confirmada-${tipo}`, version: 1, fecha: "2026-08-27" },
            tipoDocumento: tipo,
            paquetesConfirmados: ESCALERA_CONFIRMADA_SNAKE_STORE,
          });
        },
      },
    ];

    for (const caso of casos) {
      for (const tipo of TIPOS) {
        const context = caso.contexto(tipo);
        const model = modelFor(tipo, context);

        for (const perfil of PERFILES) {
          const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
          documentos.push({ caso: caso.id, tipo, perfil, buffer, numPaginas: 0 });

          if (qaDir) {
            const archivo = join(qaDir, caso.id, `${tipo}-${perfil}.pdf`);
            await mkdir(dirname(archivo), { recursive: true });
            await writeFile(archivo, buffer);
          }
        }
      }
    }

    // Segunda pasada: extraer texto de cada página (pdfjs), una sola vez,
    // reutilizado por todas las verificaciones de abajo.
    for (const doc of documentos) {
      const pdf = await getDocument({ data: new Uint8Array(doc.buffer) }).promise;
      doc.numPaginas = pdf.numPages;
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const texto = content.items.map((i) => ("str" in i ? i.str : "")).join(" ");
        paginas.push({ caso: doc.caso, tipo: doc.tipo, perfil: doc.perfil, pagina: p, texto });
      }
    }
  }, 180_000);

  it("genera diagnóstico, proyección y propuesta en pantalla e impresión para los nueve casos (54 PDFs válidos)", () => {
    expect(documentos.length).toBe(9 * TIPOS.length * 2);
    for (const doc of documentos) {
      expect(Buffer.from(doc.buffer.subarray(0, 5)).toString("ascii")).toBe("%PDF-");
      expect(doc.buffer.byteLength).toBeGreaterThan(3_000);
    }
  });

  // ── H3 (R-03): mojibake / cobertura de fuente ──────────────────────
  describe("H3 — cero mojibake en los 329 páginas reales", () => {
    // Símbolos no-ASCII que el propio código de pdf-v2 usa a propósito
    // (`grep` real sobre el árbol, no una lista inventada) — cualquier
    // OTRO carácter no-ASCII fuera de la prosa española normal es
    // sospechoso.
    const SIMBOLOS_ESPERADOS = ["■", "→", "●", "†", "×", "▲", "▽", "✓", "·"];
    const PROSA_PERMITIDA = /[\x00-\x7F áéíóúñÁÉÍÓÚÑüÜ¿¡—–''""€]/;

    it("ningún carácter fuera de la prosa española y los símbolos esperados aparece en ninguna página", () => {
      const sospechosos: { caso: string; tipo: string; perfil: string; pagina: number; char: string }[] = [];
      for (const p of paginas) {
        for (const ch of p.texto) {
          if (
            ch.charCodeAt(0) > 127 &&
            !PROSA_PERMITIDA.test(ch) &&
            !SIMBOLOS_ESPERADOS.includes(ch)
          ) {
            sospechosos.push({ caso: p.caso, tipo: p.tipo, perfil: p.perfil, pagina: p.pagina, char: ch });
          }
        }
      }
      expect(sospechosos, JSON.stringify(sospechosos.slice(0, 10))).toEqual([]);
    });

    it("el glifo roto conocido (Æ, U+00C6) nunca aparece — regresión directa del hallazgo H3", () => {
      const conAe = paginas.filter((p) => p.texto.includes("Æ"));
      expect(conAe, JSON.stringify(conAe.map((p) => `${p.caso}/${p.tipo}/${p.perfil} p${p.pagina}`))).toEqual([]);
    });

    it("cada símbolo esperado aparece al menos una vez en el set real (evita un falso verde por lista vacía)", () => {
      const texto = paginas.map((p) => p.texto).join("");
      for (const simbolo of SIMBOLOS_ESPERADOS) {
        expect(texto.includes(simbolo), `símbolo esperado ausente: ${simbolo}`).toBe(true);
      }
    });
  });

  // ── H2 (R-03): páginas sin contenido real / anomalías de paginación ─
  describe("H2 — ninguna página queda sin contenido real más allá del header", () => {
    // Un header ("eyebrow" + título de sección) más pie de página ronda
    // sólo header+pie ronda 80-100 caracteres (verificado reproduciendo
    // el hallazgo H2 real: la página vacía encontrada en el caso 1 medía
    // ~90-100). El contenido real MÁS corto observado en los 329 páginas
    // reales (un solo servicio o un solo nivel comercial) ronda 130-145.
    // 115 separa ambos con margen sin acoplarse a un caso puntual.
    const UMBRAL_MINIMO = 115;

    it("ninguna página de contenido (no portada/transición) cae bajo el umbral mínimo de texto", () => {
      const sospechosas = paginas.filter((p) => {
        if (p.pagina === 1) return false; // portada, corta por diseño
        // Transición/próximo paso son intencionalmente breves. `pdfjs`
        // extrae el texto con letter-spacing separado en runs
        // irregulares ("V E LO C E N T U M / S I G U I E N T E"), así
        // que se compara sin espacios en vez de buscar el substring literal.
        if (sinEspacios(p.texto).includes("VELOCENTUM/")) return false;
        // AJUSTES a R-03, punto 2 (caso "confirmada"): hallazgo real, no
        // un H2 — `build-context.ts` construye `context.servicios[].alcance`
        // SIEMPRE vacío (`alcance: []`, no derivado de ningún dato real)
        // para cualquier caso que pase por el pipeline real; los ocho
        // casos originales nunca lo mostraron porque sus servicios vienen
        // de fixtures armadas a mano con `alcance` hardcodeado
        // (`test-fixtures.ts`). Con un solo servicio real sugerido y sin
        // alcance, la página "Qué vamos a trabajar" mide ~98 caracteres —
        // legítimamente corta, no un defecto de render. No se inventa
        // contenido de alcance para taparlo (decisión de producto fuera
        // de este ajuste, reportada, no tomada acá); se excluye del
        // umbral sólo el caso de UN único servicio sin "02" (no
        // enmascara una página "Qué vamos a trabajar" con más de un
        // servicio, que sigue evaluada normalmente).
        if (sinEspacios(p.texto).includes("ALCANCE") && !p.texto.includes("02")) return false;
        return p.texto.trim().length < UMBRAL_MINIMO;
      });
      expect(
        sospechosas,
        JSON.stringify(sospechosas.map((p) => `${p.caso}/${p.tipo}/${p.perfil} p${p.pagina}: "${p.texto.trim()}"`)),
      ).toEqual([]);
    });

    it("diagnóstico: impresión nunca tiene MÁS páginas que pantalla (impresión apila, nunca expande)", () => {
      const porCaso = new Map<string, { pantalla?: number; impresion?: number }>();
      for (const doc of documentos) {
        if (doc.tipo !== "diagnostico") continue;
        const entry = porCaso.get(doc.caso) ?? {};
        entry[doc.perfil] = doc.numPaginas;
        porCaso.set(doc.caso, entry);
      }
      const anomalias: string[] = [];
      for (const [caso, { pantalla, impresion }] of porCaso) {
        if (pantalla === undefined || impresion === undefined) continue;
        if (impresion > pantalla) {
          anomalias.push(`${caso}: pantalla=${pantalla}, impresion=${impresion}`);
        }
      }
      expect(anomalias).toEqual([]);
    });
  });

  // ── H2b (AJUSTES a R-03, 2026-08-27): superposición de footer en
  // PANTALLA — el check de arriba (umbral de texto mínimo) detecta la
  // firma de IMPRESIÓN (página con sólo el header, contenido desplazado a
  // una página que no se vuelve a renderizar). En pantalla la misma causa
  // raíz (`cardRow` sin `wrap={false}`) produce una firma distinta: Yoga
  // NO corta página, así que el contenido desborda hacia abajo, dentro de
  // la franja del pie. `Footer` se pinta DESPUÉS del contenido en el JSX
  // de `ContentPage` (`styles.footer` es `position: "absolute"`, pintado
  // al final del árbol) — cualquier texto que desborde hasta esa franja
  // queda TAPADO visualmente por el pie, aunque sigue presente en el
  // stream de texto (por eso el umbral de longitud no lo atrapa: el texto
  // está, sólo invisible). Un check escrito contra el caso 1 en impresión
  // no dispara nunca en pantalla porque la condición disparadora depende
  // de la cantidad de tarjetas por fila del perfil (2 en impresión, 4 en
  // pantalla) — cada perfil necesita su propio check con su propia firma.
  describe("H2b — pantalla: ningún contenido queda oculto detrás del pie de página", () => {
    // `styles.footer`: bottom: 18, fontSize (perfil pantalla) 8 — la
    // franja del pie ocupa aprox. y ∈ [18, 30] en coordenadas PDF (origen
    // abajo-izquierda). El contenido normal de página respeta
    // `pagePaddingBottom` (48 en pantalla) y no debería tener baseline
    // por debajo de eso; 34 separa la franja del pie del contenido
        // legítimo con margen, sin acoplarse a un caso puntual.
    const FOOTER_ZONA_MAX_Y = 34;

    // El pie sólo dibuja dos textos: el wordmark "Velocentum" (caja mixta,
    // R-06) y el contador de página `${pageNumber} / ${totalPages}`
    // (pdfjs puede partirlo en runs como "3", "/", "6"). Cualquier OTRO
    // texto con baseline dentro de la franja es contenido que no debería
    // estar ahí.
    function esTextoDelPie(s: string): boolean {
      const t = s.trim();
      return t === "" || t === "Velocentum" || /^[\d\s/]+$/.test(t);
    }

    it("ninguna página en pantalla tiene contenido (no del pie) con baseline dentro de la franja del pie", async () => {
      const pantallaDocs = documentos.filter((d) => d.perfil === "pantalla");
      const sospechosas: string[] = [];
      for (const doc of pantallaDocs) {
        const pdf = await getDocument({ data: new Uint8Array(doc.buffer) }).promise;
        for (let p = 2; p <= pdf.numPages; p++) {
          // p=1 (portada) no lleva el `Footer` estándar — tiene su propio
          // pie de marca ("v2" y otros elementos de diseño de portada) que
          // no es el defecto que este check busca; se excluye igual que
          // en el check de umbral mínimo de arriba.
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          for (const item of content.items) {
            if (!("str" in item) || !("transform" in item)) continue;
            const y = (item as { transform: number[] }).transform[5]!;
            if (y < FOOTER_ZONA_MAX_Y && !esTextoDelPie(item.str)) {
              sospechosas.push(`${doc.caso}/${doc.tipo} p${p}: y=${y.toFixed(1)} "${item.str}"`);
            }
          }
        }
      }
      expect(sospechosas, JSON.stringify(sospechosas.slice(0, 15))).toEqual([]);
    }, 60_000);
  });

  // ── H1 (R-03): presencia Y contraste REAL (color efectivamente
  // renderizado, no sólo el par de tokens del tema) del título en
  // secciones oscuras.
  describe("H1 — título de sección oscura: presente y con contraste real", () => {
    async function colorDelTitulo(caso: string, textoTitulo: string, textoEyebrow: string) {
      const doc = documentos.find(
        (d) => d.caso === caso && d.tipo === "propuesta" && d.perfil === "pantalla",
      )!;
      const pagina = paginas.find(
        (p) =>
          p.caso === caso &&
          p.tipo === "propuesta" &&
          p.perfil === "pantalla" &&
          sinEspacios(p.texto).includes(sinEspacios(textoEyebrow)),
      );
      expect(pagina, `no se encontró la página con eyebrow "${textoEyebrow}"`).toBeDefined();
      const pdf = await getDocument({ data: new Uint8Array(doc.buffer) }).promise;
      const page = await pdf.getPage(pagina!.pagina);
      return colorAlMostrar(page, textoTitulo);
    }

    it("caso normal: el título 'Contribución incremental proyectada' se pinta con el color claro (titleDark), no con ink", async () => {
      const color = await colorDelTitulo(
        "1-marketplace-fuerte-tienda-floja",
        "Contribución incremental proyectada",
        "LO QUE IMPORTA",
      );
      expect(color, "no se encontró el color de relleno para el título").not.toBeNull();
      // `#0d0b2d` es `theme.colors.ink` — el bug exacto de H1 (título
      // invisible) era usar este color sobre fondo también `ink`.
      expect(color?.toLowerCase()).not.toBe("#0d0b2d");
      const ratio = ratioContraste(color!, "#0d0b2d");
      expect(ratio, `contraste insuficiente: ${color} sobre #0d0b2d (fondo oscuro real de la sección)`).toBeGreaterThanOrEqual(3);
    });

    it("caso DHB-2 (margen negativo): el título 'Margen negativo: foco en la causa raíz' se pinta con el color claro, no con ink", async () => {
      const color = await colorDelTitulo(
        "4-roas-bueno-margen-negativo",
        "Margen negativo: foco en la causa raíz",
        "POR QUÉ NO PROYECTAMOS",
      );
      expect(color, "no se encontró el color de relleno para el título").not.toBeNull();
      expect(color?.toLowerCase()).not.toBe("#0d0b2d");
      const ratio = ratioContraste(color!, "#0d0b2d");
      expect(ratio, `contraste insuficiente: ${color} sobre #0d0b2d (fondo oscuro real de la sección)`).toBeGreaterThanOrEqual(3);
    });

    it("el cuerpo de la alerta DHB-2 también está presente y no repite el titular ausente (H1.6)", () => {
      const paginaAlerta = paginas.find(
        (p) =>
          p.caso === "4-roas-bueno-margen-negativo" &&
          p.tipo === "propuesta" &&
          p.perfil === "pantalla" &&
          sinEspacios(p.texto).includes("PORQUÉNOPROYECTAMOS"),
      );
      expect(paginaAlerta).toBeDefined();
      expect(sinEspacios(paginaAlerta!.texto)).toContain(sinEspacios("Margen negativo: foco en la causa raíz"));
      expect(sinEspacios(paginaAlerta!.texto)).toContain(sinEspacios("Alerta: Margen de contribución negativo"));
    });
  });
});
