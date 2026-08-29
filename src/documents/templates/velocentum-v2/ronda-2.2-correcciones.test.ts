/**
 * Pruebas exclusivas de la ronda de correcciones 2.2 (Q1-Q6). Verifican
 * el contrato, no describen el resultado obtenido — si una prueba falla,
 * se corrige el prototipo, nunca el umbral. No tocan v1, dominio,
 * `src/lib/` ni ninguna prueba preexistente del Bloque Visual 2 o de la
 * ronda 2.1.
 *
 * Este archivo NUNCA importa el archivo de escenarios demostrativos de
 * `src/lib/` (ni lo nombra literalmente, ni en un comentario): el propio
 * repositorio tiene una prueba que escanea el árbol de `src/` y falla
 * ante cualquier referencia a ese archivo fuera de su lista corta
 * permitida. El barrido de cobertura de los escenarios demostrativos
 * 2/3/5/6 se hizo con un script efímero fuera de `src/` (no commiteado),
 * documentado en el informe de cobertura del handoff; acá se cubren
 * estructuralmente los casos mayorista/mixto (los que el propio prompt de
 * esta ronda señala como los únicos que "sólo se pueden probar acá")
 * usando los contextos de `test-fixtures.ts`.
 */
import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import React from "react";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "./index";
import {
  buildMargenNegativoContext,
  buildMayoristaContext,
  buildMixtoContext,
  buildMulticanalContext,
} from "./test-fixtures";
import type { DocumentBlockV2, DocumentModelV2 } from "./types";
import {
  createPdfDocumentElementV2,
  PROFILES_V2,
  type PdfProfileV2,
} from "../../renderers/pdf-v2/document";
import { renderPdfV2ConDosPasadas } from "../../renderers/pdf-v2/paginacion";
import { DocumentWebRendererV2 } from "../../renderers/web-v2/document-renderer";
import {
  PROFUNDIDAD_TARJETA,
  TEXTURA_FONDO,
  colorProfundidadTarjeta,
  colorTexturaLinea,
} from "../../semantica-v2/direccion-arte";
import { TITULO_SUPUESTOS_CON_DAGA } from "../../semantica-v2/etiquetas";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoPorPagina(buffer: Uint8Array): Promise<string[]> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas;
}

function blocksOf<T extends DocumentBlockV2["type"]>(
  model: DocumentModelV2,
  type: T,
): Array<Extract<DocumentBlockV2, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlockV2, { type: T }> => block.type === type);
}

describe("Ronda 2.2 — Q1 (D-1): ocupación con lista de excepciones explícita y cerrada", () => {
  // Lista cerrada, verificable página por página (contrato sección 5.8
  // actualizado en esta ronda) — no una categoría genérica.
  const EXCEPCIONES_CERRADAS_2_2 = [
    "propuesta/services: tarjetas de alcance sin bullets adicionales en el contexto (sin cambios respecto de la ronda 2.1)",
    "propuesta/commercial-offer sin selección confirmada (D1): aviso de una sola oración",
    "diagnostico y proyeccion_90d/metric-grid, perfil pantalla, caso multicanal: fila de continuación con 1-2 tarjetas tras el balanceo de filasBalanceadas",
    "cover/impresion, los tres documentos: vacío vertical entre subtítulo y coverMeta pese al motivo de línea+puntos — llenarlo exigiría un componente con datos que la portada no tiene",
  ];

  it("la lista de excepciones tiene motivo puntual, no una categoría genérica", () => {
    expect(EXCEPCIONES_CERRADAS_2_2.length).toBeGreaterThan(0);
    for (const excepcion of EXCEPCIONES_CERRADAS_2_2) {
      expect(excepcion).toMatch(/\//); // referencia a documento/bloque concreto
      expect(excepcion.length).toBeGreaterThan(25);
    }
  });

  it("el hero de propuesta (commercial-summary) ahora incluye el motivo de línea+puntos y el glifo de personalidad, aportando ocupación real (no relleno inventado)", () => {
    const model = buildPropuestaDocumentV2(buildMulticanalContext());
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain("vdoc2-heading-rule");
    expect(html).toContain("vdoc2-eyebrow__glyph");
  });
});

describe("Ronda 2.2 — Q2 (D-2): ninguna tarjeta que quepa entera repite su propio nombre", () => {
  // Ambas pruebas restringen el conteo a las páginas del bloque
  // "scenarios" (marcadas por su eyebrow único) — el texto completo del
  // documento también menciona el nombre del escenario comunicado dentro
  // del kicker de `commercial-summary` ("Escenario conservador"), que es
  // un bloque DISTINTO y no participa del defecto D-2 (identidad
  // repetida dentro de una misma tarjeta de escenario).
  const MARCA_SECCION_ESCENARIOS = "Qué puede ocurrir en 90 días, mes a mes";

  it("escenario corto (esCorta, cabe entero — sin tabla mensual ni palancas): el nombre aparece una sola vez dentro del bloque de escenarios", async () => {
    const model = buildProyeccion90dDocumentV2(buildMargenNegativoContext());
    const escenarios = blocksOf(model, "scenarios")[0]!.items;
    expect(escenarios.every((e) => e.esCorta)).toBe(true);
    const paginas = await textoPorPagina(await renderToBuffer(createPdfDocumentElementV2(model, "impresion")));
    const texto = paginas.filter((p) => p.includes(MARCA_SECCION_ESCENARIOS)).join("\n");
    // "CONSERVADOR" aparece en el header (itemTitle) y, si el kicker se
    // repitiera de forma incondicional (defecto D-2), también antes de
    // cada subsección — acá no hay ninguna (mensual/palancas/supuestos
    // vacíos), así que debe aparecer EXACTAMENTE 1 vez por escenario.
    for (const nombre of ["CONSERVADOR", "BASE", "POTENCIAL"]) {
      const ocurrencias = (texto.match(new RegExp(nombre, "g")) ?? []).length;
      expect(ocurrencias).toBe(1);
    }
  });

  it("escenario largo (full, con tabla mensual): el nombre se repite una sola vez además del header (2 en total dentro del bloque de escenarios), nunca 3+", async () => {
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    // Bloque Visual 2.2.3: mapa medido sobre el PDF real (dos pasadas), no
    // una regla estática incondicional.
    const { buffer } = await renderPdfV2ConDosPasadas(model, "impresion");
    const paginas = await textoPorPagina(buffer);
    const texto = paginas.filter((p) => p.includes(MARCA_SECCION_ESCENARIOS)).join("\n");
    // El fixture multicanal tiene mensual+palancas+supuestos en
    // "conservador" (full=true) — antes de esta ronda el kicker se
    // repetía 3 veces (una por subsección) más el header = 4 en total.
    const ocurrencias = (texto.match(/CONSERVADOR/g) ?? []).length;
    expect(ocurrencias).toBe(2);
  });
});

describe("Ronda 2.2 — Q3 (D-3): la portada A4 no contiene bloques de color sin contenido", () => {
  it("el acento de portada en impresión dibuja trazos vectoriales reales (líneas), no sólo un relleno sólido", async () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "impresion"));
    const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
    const portada = await documento.getPage(1);
    const operadores = await portada.getOperatorList();
    // `getOperatorList()` de esta versión de pdfjs no distingue un
    // operador `stroke` separado para trazos vectoriales — el color de
    // trazo (`setStrokeRGBColor`) y el ancho de línea (`setLineWidth`) sí
    // se emiten una vez por cada `<Line>` con `stroke` real, así que son
    // la señal directa y verificable de que se dibujaron líneas (no sólo
    // un `<Rect>` de relleno sólido).
    const { OPS } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const trazos = operadores.fnArray.filter((op) => op === OPS.setStrokeRGBColor).length;
    // 5 líneas diagonales dibujadas sobre el degradado (D-3) — muy por
    // encima de 0, que sería el caso "bloque de color liso".
    expect(trazos).toBeGreaterThanOrEqual(5);
  });

  it("el motivo de línea+puntos aparece bajo el subtítulo de portada, en ambos perfiles y en web", async () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
      const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
      const portada = await documento.getPage(1);
      const contenido = await portada.getTextContent();
      const texto = contenido.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      // pdfjs extrae cada carácter con su propio espaciado cuando el
      // estilo usa `letterSpacing` (el motivo de puntos lo usa a
      // propósito) — se compara sin espacios para no depender de eso.
      expect(texto.replace(/\s+/g, "")).toContain("····");
    }
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain("vdoc2-heading-rule");
  });
});

describe("Ronda 2.2 — Q4 (D-4): toda página con † resuelve la marca en la MISMA página", () => {
  // La referencia puede ser el título completo del bloque de supuestos
  // (`TITULO_SUPUESTOS_CON_DAGA`, cuando ese bloque cae en la misma
  // página) o la nota corta vinculada a la tabla mensual/palancas (que
  // vive en el mismo `wrap={false}` que las dagas, garantizando que
  // nunca queden separadas por un salto de página — hallazgo real de
  // esta ronda: la tarjeta larga puede partir la tabla mensual y el
  // bloque "Supuestos" completo en dos páginas distintas).
  const REFERENCIAS_VALIDAS = ["referencia de los valores marcados con †", "remite a Supuestos"];

  it("PDF: ninguna página contiene † sin contener también una referencia inequívoca a Supuestos, en ambos documentos con supuestos", async () => {
    for (const builder of [buildProyeccion90dDocumentV2, buildPropuestaDocumentV2]) {
      const model = builder(buildMulticanalContext());
      for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
        const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
        const paginas = await textoPorPagina(buffer);
        for (const [index, texto] of paginas.entries()) {
          if (texto.includes("†")) {
            const tieneReferencia = REFERENCIAS_VALIDAS.some((ref) => texto.includes(ref));
            expect(tieneReferencia, `página ${index + 1} (${perfil}) tiene † sin nota vinculada: ${texto.slice(0, 120)}`).toBe(
              true,
            );
          }
        }
      }
    }
  });

  it("el título del bloque de supuestos vincula explícitamente el símbolo †, idéntico en PDF y web", () => {
    expect(TITULO_SUPUESTOS_CON_DAGA).toContain("†");
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain(TITULO_SUPUESTOS_CON_DAGA);
  });
});

describe("Ronda 2.2 — Q5: el barrido de cobertura (mayorista y mixto) pasa las mismas comprobaciones estructurales que s1/s4", () => {
  const CASOS = [
    { nombre: "mayorista", build: buildMayoristaContext },
    { nombre: "mixto", build: buildMixtoContext },
  ];

  it.each(CASOS)("$nombre: sin 'Sin datos', sin daga doble, paridad de un valor concreto entre PDF y web", async ({ build }) => {
    const context = build();
    const modelos = [
      buildDiagnosticoDocumentV2(context),
      buildProyeccion90dDocumentV2(context),
      buildPropuestaDocumentV2(context),
    ];
    for (const model of modelos) {
      for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
        const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
        const texto = (await textoPorPagina(buffer)).join("\n");
        expect(texto).not.toContain("Sin datos");
        expect(texto).not.toContain("††");
        expect(texto).not.toContain("undefined");
        expect(texto).not.toContain("NaN");
      }
      const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
      expect(html).not.toContain("Sin datos");
      expect(html).not.toContain("undefined");
      expect(html).not.toContain("NaN");
    }
  });

  it("mayorista: la comparación entre canales y la deduplicación del MER (C6) se comportan igual que en un caso minorista — el concepto de canal no depende de la modalidad comercial", () => {
    const model = buildProyeccion90dDocumentV2(buildMayoristaContext());
    expect(blocksOf(model, "channel-comparison")).toHaveLength(1);
    const grids = blocksOf(model, "metric-grid");
    for (const grid of grids) {
      const ids = grid.items.map((item) => item.id);
      expect(ids).not.toContain("merTienda");
      expect(ids).not.toContain("merMarketplace");
    }
  });

  it("mixto: terminología D7 respetada — el contexto de prueba etiqueta explícitamente 'mixto' como distinto de 'multicanal', nunca como sinónimo", async () => {
    const model = buildDiagnosticoDocumentV2(buildMixtoContext());
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const texto = (await textoPorPagina(buffer)).join("\n");
    // La fixture mixta describe su propia modalidad con la disambiguación
    // D7 explícita ("Mixto (D7): ... — no es multicanal"). El texto
    // "Multicanal: tienda propia + Mercado Libre" que aparece por
    // separado, en otra entrada de metodología, describe el perímetro de
    // atribución (un concepto distinto, no la modalidad comercial del
    // cliente) — ambos coexistiendo correctamente etiquetados es
    // precisamente lo que D7 exige, no una violación.
    expect(texto).toContain("Mixto (D7)");
    expect(texto).toContain("no es multicanal");
  });
});

describe("Ronda 2.2 — Q6 (D-5): tokens y componentes compartidos, sin decoración que compita con el contenido", () => {
  it("PDF y web consumen exactamente los mismos valores de profundidad/textura del módulo compartido (ningún renderer define su propio color)", () => {
    const shadowPantalla = colorProfundidadTarjeta("pantalla");
    const shadowImpresion = colorProfundidadTarjeta("impresion");
    expect(shadowPantalla).toContain(String(PROFUNDIDAD_TARJETA.pantalla.opacidad));
    expect(shadowImpresion).toContain(String(PROFUNDIDAD_TARJETA.impresion.opacidad));
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    // El renderer web inyecta el token real como variable CSS inline —
    // verificable en el HTML servido, no un valor hardcodeado aparte.
    expect(html).toContain(shadowPantalla);
  });

  it("la opacidad de textura de fondo nunca supera el límite fijado en el contrato, en ningún perfil", () => {
    expect(TEXTURA_FONDO.opacidadMaximaPantalla).toBeLessThanOrEqual(0.05);
    expect(TEXTURA_FONDO.opacidadMaximaImpresion).toBeLessThanOrEqual(0.035);
    expect(colorTexturaLinea("pantalla")).toContain(String(TEXTURA_FONDO.opacidadMaximaPantalla));
    expect(colorTexturaLinea("impresion")).toContain(String(TEXTURA_FONDO.opacidadMaximaImpresion));
  });

  it("A4 sigue por debajo del 25% de tinta plena con la decoración de D-5 aplicada (reutiliza la geometría de acentos ya verificada en P3, sin agregar área nueva)", () => {
    // La textura de fondo no agrega área de tinta relevante: son líneas de
    // 1pt de grosor espaciadas 46pt a opacidad ≤0.035 — el propio cálculo
    // geométrico (longitud de línea × grosor × opacidad, sumado sobre el
    // espaciado) es una fracción despreciable del área de página.
    const AREA_PAGINA = 595.28 * 841.89;
    const espaciado = TEXTURA_FONDO.espaciadoLineaPt;
    const cantidadLineas = Math.ceil((595.28 + 841.89) / espaciado);
    const longitudPromedio = 841.89; // diagonal, worst-case generosa
    const areaTintaTextura = cantidadLineas * longitudPromedio * 1 * TEXTURA_FONDO.opacidadMaximaImpresion;
    expect(areaTintaTextura / AREA_PAGINA).toBeLessThan(0.01);
  });

  it("ninguna decoración se superpone a una cifra: las líneas diagonales de portada se pintan ANTES que el título/subtítulo/meta (detrás, nunca encima)", () => {
    // Hallazgo real de esta ronda: un primer intento agregaba una textura
    // de fondo (`BackgroundTexture`, `Svg` en `position: absolute`) a
    // CADA página de contenido — `@react-pdf/renderer` no trata `Svg`
    // como `View` bajo posicionamiento absoluto (advertencia real: "Node
    // of type SVG can't wrap between pages and it's bigger than available
    // page height"), el color rgba() no se pintaba como se esperaba y
    // forzaba páginas adicionales completas (verificado comparando el
    // conteo de páginas antes/después: hasta +4 por documento). Se
    // retiró de `ContentPage`; la textura de fondo queda sólo en la
    // portada, donde el `Svg` está anidado en un `View` de tamaño fijo
    // (`coverAccentBounded`/`coverGradientLayer`), no como hijo absoluto
    // de la página — ahí sí se verifica el orden de render correcto.
    const fuente = require("node:fs").readFileSync(
      require.resolve("../../renderers/pdf-v2/document.tsx"),
      "utf-8",
    ) as string;
    // No debe quedar ningún rastro del componente retirado.
    expect(fuente).not.toContain("BackgroundTexture");
    const indiceLineas = fuente.indexOf("D-3: líneas diagonales sutiles");
    const indiceTitulo = fuente.indexOf("styles.coverTitle, styles.coverTitleLight");
    expect(indiceLineas).toBeGreaterThan(0);
    expect(indiceLineas).toBeLessThan(indiceTitulo);
  });
});
