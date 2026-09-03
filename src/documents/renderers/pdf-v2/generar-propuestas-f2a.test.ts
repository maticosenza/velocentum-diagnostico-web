/**
 * BV4 · F2a etapa 6 — artefactos del gate y prueba de determinismo.
 *
 * Genera las propuestas de **Snake Store** y **Titan Web B1** en los dos
 * perfiles —pantalla (16:9) e impresión (A4)— con una selección comercial v2
 * confirmada, y verifica dos cosas en cada una:
 *
 *  1. que sale un PDF válido pasando por el candado real
 *     (`exportarDocumentModelV2` corre el gate antes de renderizar);
 *  2. **determinismo por doble corrida**: el mismo modelo renderizado dos
 *     veces produce el mismo SHA-256, byte por byte. Es la condición de la
 *     que depende el gate "SHA-256 del descargado = SHA-256 del pipeline":
 *     el navegador y el pipeline llaman a la MISMA
 *     `renderPdfV2ConDosPasadas`, así que si el render es determinístico, los
 *     dos hashes coinciden.
 *
 * Mismo criterio que `generar-pdfs-bloque-3.test.ts`: sólo escribe a disco si
 * se define `VELOCENTUM_F2A_QA_DIR`, pero siempre verifica. Cuando escribe,
 * deja además `sha256.txt` con los hashes, que es lo que la auditoría compara
 * contra lo que descargue Matías desde el navegador.
 *
 * Los precios de estas dos selecciones son **fixture de QA**, igual que la
 * `paquetesConfirmados` construida a mano en el generador de los 54: no son
 * precios de negocio ni salen de ninguna decisión comercial. Existen para que
 * el artefacto ejercite el desglose completo (unitario × cantidad, línea sin
 * cantidad, ambos grupos de recurrencia, impuesto y ruta B2C/B2B).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { buildPropuestaDocumentV2 } from "../../templates/velocentum-v2";
import { buildDocumentContext } from "../../domain";
import { exportarDocumentModelV2 } from "./exportacion";
import type { PdfProfileV2 } from "./document";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoTitanWebB1,
  configuracionRegresionFase2,
} from "../../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../../lib/diagnostico-form";
import { LINEAS_V2_IDS, lineaV2, type LineaId } from "../../../lib/catalogo-v2";
import {
  lineaVaciaV2,
  type LineaSeleccionadaV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "../../../lib/seleccion-comercial-v2";
import { ETAPAS_ROADMAP_V2, renglonDePlan } from "../../../lib/reparto-roadmap-v2";
import { formatMoneda } from "../../../lib/format";
import { textoMonedaV2 } from "../../semantica-v2/estado";
import type { ValorV2 } from "../../templates/velocentum-v2/types";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

/**
 * El texto real de un PDF, página por página. El contenido viaja comprimido,
 * así que buscar sobre el buffer crudo no encuentra nada: hace falta
 * `getTextContent()`. Mismo extractor que usa la QA de la Fase 14.
 */
async function textoDelPdf(buffer: Uint8Array): Promise<string> {
  const pdf = await getDocument({ data: buffer }).promise;
  let texto = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const contenido = await pdf.getPage(p).then((pagina) => pagina.getTextContent());
    texto += contenido.items.map((i) => ("str" in i ? (i as { str: string }).str : "")).join(" ");
    texto += " ";
  }
  return texto.replace(/\s+/g, " ").trim();
}

const PERFILES: PdfProfileV2[] = ["pantalla", "impresion"];

function seleccion(
  nivel: SeleccionComercialV2["nivel"],
  cargas: { id: LineaId; cambios: Partial<LineaSeleccionadaV2> }[],
  agregados: SeleccionComercialV2["agregados"],
): SeleccionComercialV2 {
  const lineas = LINEAS_V2_IDS.map((id) => lineaVaciaV2(id as LineaId));
  for (const { id, cambios } of cargas) {
    const i = lineas.findIndex((l) => l.lineaId === id);
    lineas[i] = { ...lineas[i]!, seleccionada: true, ...cambios } as LineaSeleccionadaV2;
  }
  return { nivel, lineas, agregados };
}

/** Snake Store: mensual puro + branding de pago único, en ARS con 21 %. */
const SOBRE_SNAKE: SobreComercialV2 = {
  version: 2,
  moneda: "ARS",
  fiscal: { aplicaImpuesto: true, porcentaje: 21, confirmado: true },
  seleccion: seleccion(
    "traccion",
    [
      {
        id: "meta_ads",
        cambios: { precio: { modo: "unitario", cantidad: 5, precioUnitario: 90_000 } },
      },
      {
        id: "google_ads",
        cambios: { precio: { modo: "unitario", cantidad: 5, precioUnitario: 80_000 } },
      },
      {
        id: "contenido_audiovisual",
        cambios: { precio: { modo: "unitario", cantidad: 15, precioUnitario: 18_000 } },
      },
      {
        id: "contenido_estatico",
        cambios: { precio: { modo: "unitario", cantidad: 18, precioUnitario: 9_000 } },
      },
      {
        id: "planificacion_contenido",
        cambios: { precio: { modo: "total", precioLinea: 120_000 } },
      },
      {
        id: "branding",
        cambios: { recurrencia: "unica", precio: { modo: "total", precioLinea: 950_000 } },
      },
    ],
    [
      { agregadoId: "tracking_web", incluido: true },
      { agregadoId: "email_marketing", incluido: true },
      { agregadoId: "reportes", incluido: true },
    ],
  ),
  legado: null,
};

/** Titan Web B1: ESCALA, con Diseño web en ambas rutas y desarrollo custom. */
const SOBRE_TITAN: SobreComercialV2 = {
  version: 2,
  moneda: "USD",
  fiscal: { aplicaImpuesto: true, porcentaje: 21, confirmado: true },
  seleccion: seleccion(
    "escala",
    [
      {
        id: "meta_ads",
        cambios: { precio: { modo: "unitario", cantidad: 7, precioUnitario: 1_200 } },
      },
      {
        id: "product_ads",
        cambios: { precio: { modo: "unitario", cantidad: 7, precioUnitario: 800 } },
      },
      {
        id: "diseno_web",
        cambios: {
          recurrencia: "unica",
          ruta: "ambas",
          precio: { modo: "total", precioLinea: 6_500 },
        },
      },
      {
        id: "desarrollo_web_custom",
        cambios: {
          recurrencia: "unica",
          precio: { modo: "unitario", cantidad: 4, precioUnitario: 1_500 },
        },
      },
    ],
    [
      { agregadoId: "tracking_web", incluido: true },
      { agregadoId: "email_marketing", incluido: true },
      { agregadoId: "reportes", incluido: true },
      { agregadoId: "cro", incluido: true },
    ],
  ),
  legado: null,
};

const CASOS: { id: string; datos: DatosDiagnostico; sobre: SobreComercialV2 }[] = [
  { id: "snake-store", datos: casoSnakeStore, sobre: SOBRE_SNAKE },
  { id: "titan-web-b1", datos: casoTitanWebB1, sobre: SOBRE_TITAN },
];

function contextoDe(datos: DatosDiagnostico, sobre: SobreComercialV2) {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return buildDocumentContext({
    datos,
    resultado,
    diagnostico: { id: `f2a-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-31" },
    tipoDocumento: "propuesta",
    sobreComercialV2: sobre,
  });
}

function modeloDe(datos: DatosDiagnostico, sobre: SobreComercialV2) {
  return buildPropuestaDocumentV2(contextoDe(datos, sobre));
}

const sha256 = (buffer: Uint8Array) => createHash("sha256").update(buffer).digest("hex");

describe("BV4 F2a — propuestas del gate, dos casos × dos perfiles", () => {
  it("genera cuatro PDFs válidos y son deterministas por doble corrida", async () => {
    const qaDir = process.env["VELOCENTUM_F2A_QA_DIR"];
    if (qaDir) await mkdir(qaDir, { recursive: true });

    const hashes: string[] = [];

    for (const caso of CASOS) {
      for (const perfil of PERFILES) {
        const modelo = modeloDe(caso.datos, caso.sobre);

        const primera = await exportarDocumentModelV2(modelo, perfil);
        const segunda = await exportarDocumentModelV2(modeloDe(caso.datos, caso.sobre), perfil);

        expect(new TextDecoder("latin1").decode(primera.buffer.subarray(0, 5))).toBe("%PDF-");
        expect(primera.buffer.length).toBeGreaterThan(10_000);

        // Determinismo: mismo modelo, mismo perfil, mismo byte.
        const hash = sha256(primera.buffer);
        expect(sha256(segunda.buffer)).toBe(hash);
        expect(segunda.buffer.length).toBe(primera.buffer.length);

        const nombre = `${caso.id}-propuesta-${perfil}.pdf`;
        hashes.push(`${hash}  ${nombre}`);

        if (qaDir) await writeFile(join(qaDir, nombre), primera.buffer);
      }
    }

    expect(hashes).toHaveLength(4);
    if (qaDir) await writeFile(join(qaDir, "sha256.txt"), `${hashes.join("\n")}\n`, "utf8");
  }, 600_000);

  it("el candado deja pasar estas dos: selección y configuración fiscal confirmadas", () => {
    for (const caso of CASOS) {
      const modelo = modeloDe(caso.datos, caso.sobre);
      const bloque = modelo.sections
        .flatMap((s) => s.blocks)
        .find((b) => b.type === "commercial-selection");
      expect(bloque).toBeDefined();
      expect(bloque && "pendiente" in bloque ? bloque.pendiente : true).toBe(false);
    }
  });

  it("las dos propuestas ejercitan los dos grupos de recurrencia", () => {
    for (const caso of CASOS) {
      const modelo = modeloDe(caso.datos, caso.sobre);
      const bloque = modelo.sections
        .flatMap((s) => s.blocks)
        .find((b) => b.type === "commercial-selection");
      if (!bloque || bloque.type !== "commercial-selection") throw new Error("falta el bloque");
      const recurrencias = new Set(bloque.lineas.map((l) => l.recurrencia));
      expect([...recurrencias].sort()).toEqual(["mensual", "unica"]);
      expect(bloque.grupos).toHaveLength(2);
    }
  });

  it("las dos monedas quedan cubiertas por los artefactos", () => {
    expect(SOBRE_SNAKE.moneda).toBe("ARS");
    expect(SOBRE_TITAN.moneda).toBe("USD");
  });
});

/**
 * BV4 · F2a ronda 3 — el gate del reparto 30/60/90, verificado sobre el
 * TEXTO EXTRAÍDO de los cuatro PDFs, no sobre el modelo. Los cuatro puntos
 * son los del prompt de la ronda: existe la etapa 1-30 en los dos clientes;
 * ninguna etapa con servicios seleccionados queda vacía; el plan nombra QUÉ
 * SE HACE y no sólo el servicio; y ninguna frase del plan está fuera de
 * `docs/funcional/f2a-textos-servicios.md`.
 *
 * El defecto que corrigió la ronda: en los PDFs del commit anterior, Titan
 * Web tenía una sola etapa —"DÍAS 61-90"— y Snake Store no tenía la 1-30.
 */
describe("RONDA 3 · el plan 30/60/90 impreso en los cuatro PDFs", () => {
  const ETIQUETAS = ["Días 1 a 30", "Días 31 a 60", "Días 61 a 90"] as const;

  it("los dos clientes tienen las tres etapas, y ninguna vacía", async () => {
    for (const caso of CASOS) {
      const ctx = contextoDe(caso.datos, caso.sobre);
      const plan = ctx.roadmapV2!;
      expect(plan.map((e) => e.etiqueta)).toEqual([...ETIQUETAS]);
      for (const etapa of plan) expect(etapa.acciones.length).toBeGreaterThan(0);

      for (const perfil of PERFILES) {
        const { buffer } = await exportarDocumentModelV2(modeloDe(caso.datos, caso.sobre), perfil);
        const texto = await textoDelPdf(buffer);
        for (const etiqueta of ETIQUETAS) expect(texto).toContain(etiqueta);
        // Y cada acción del plan, impresa tal cual.
        for (const etapa of plan) {
          for (const accion of etapa.acciones) expect(texto).toContain(accion);
        }
      }
    }
  }, 600_000);

  it("el plan nombra QUÉ SE HACE, y nada de lo que dice está fuera del texto fuente", () => {
    for (const caso of CASOS) {
      const ctx = contextoDe(caso.datos, caso.sobre);
      const seleccionadas = caso.sobre.seleccion.lineas.filter((l) => l.seleccionada);

      const permitidas = new Set<string>([
        ...ctx.hallazgos.map((h) => h.titulo),
        ...ctx.restricciones.map((r) => r.etiqueta),
      ]);
      for (const linea of seleccionadas) {
        for (const etapa of ETAPAS_ROADMAP_V2) {
          const renglon = renglonDePlan(linea.lineaId, etapa);
          if (renglon !== null) permitidas.add(renglon);
        }
      }

      for (const etapa of ctx.roadmapV2!) {
        for (const accion of etapa.acciones) {
          expect(permitidas.has(accion)).toBe(true);
          // Ninguna acción es el nombre pelado de una línea cotizada.
          expect(seleccionadas.some((l) => lineaV2(l.lineaId).nombre === accion)).toBe(false);
        }
      }
    }
  });

  it("cada línea cotizada aparece en las etapas que le tocan, con sus entregables", () => {
    for (const caso of CASOS) {
      const plan = contextoDe(caso.datos, caso.sobre).roadmapV2!;
      for (const linea of caso.sobre.seleccion.lineas.filter((l) => l.seleccionada)) {
        for (const etapa of ETAPAS_ROADMAP_V2) {
          const renglon = renglonDePlan(linea.lineaId, etapa);
          if (renglon === null) continue;
          expect(plan.find((e) => e.id === etapa)!.acciones).toContain(renglon);
        }
      }
    }
  });
});

/**
 * BV4 · gate de F2a — COMPARACIÓN POR CONTENIDO, no por bytes.
 *
 * El criterio viejo ("SHA-256 del descargado = SHA-256 del pipeline") era
 * inejecutable: la fecha del diagnóstico la genera la app al vuelo
 * (`diagnosticos.nuevo.tsx:279`, `new Date()`), no hay campo editable, y viaja
 * al PDF impreso (`velocentum-v2/shared.ts:55` → `document.tsx:1908` y `1942`).
 * Distinta fecha, distintos bytes, siempre. Está registrado como **H-14**.
 *
 * Lo que sí se puede comparar es el CONTENIDO. Estos puntos de control salen
 * del modelo —la fuente de verdad— y se buscan en el texto extraído de los dos
 * PDFs, el del pipeline y el descargado del navegador. Cubren los ocho puntos
 * del prompt del 2026-09-03: las líneas del catálogo con sus cantidades, los
 * precios unitarios y totales por línea, los dos grupos de totales con
 * subtotal/impuesto/total, la ausencia de un total que los sume, la moneda y
 * el porcentaje fiscal, los agregados incluidos, el plan 30/60/90 con sus tres
 * etiquetas y cada acción, y el nivel elegido.
 *
 * Queda FUERA de la comparación, a propósito y declarado en
 * `docs/bv4-f2a-gate-navegador.md`:
 *
 *  - **la fecha del diagnóstico**, por lo de arriba. Es variable por diseño y
 *    correcta de los dos lados: el pipeline usa una fija para ser
 *    reproducible, la app la del día porque es la de un diagnóstico real.
 *
 * El determinismo del render se sigue probando aparte, por doble corrida, en
 * el primer `describe` de este archivo. No lo reemplaza esto.
 */

/** Directorio con los PDFs bajados del navegador. Sin él no hay gate que correr. */
const DIR_NAVEGADOR = process.env["VELOCENTUM_F2A_NAVEGADOR_DIR"];

/** Un dato que el PDF tiene que imprimir, con el nombre que se lee si falta. */
type PuntoDeControl = { etiqueta: string; texto: string };

/**
 * `formatMoneda` usa `Intl`, que separa el símbolo con un espacio duro; el
 * extractor colapsa todo espacio en uno normal. Sin normalizar la aguja igual
 * que el pajar, `includes` no encuentra un solo importe.
 */
const normalizar = (texto: string) => texto.replace(/\s+/g, " ").trim();

function bloqueComercialDe(caso: (typeof CASOS)[number]) {
  const bloque = modeloDe(caso.datos, caso.sobre)
    .sections.flatMap((s) => s.blocks)
    .find((b) => b.type === "commercial-selection");
  if (!bloque || bloque.type !== "commercial-selection")
    throw new Error("falta el bloque comercial");
  return bloque;
}

function puntosDeControl(caso: (typeof CASOS)[number]): PuntoDeControl[] {
  const bloque = bloqueComercialDe(caso);
  const money = (valor: ValorV2) => textoMonedaV2(valor, bloque.moneda);
  const puntos: PuntoDeControl[] = [];

  // 8 · el nivel elegido.
  puntos.push({ etiqueta: "nivel", texto: `Nivel: ${bloque.nivel}` });

  // 1 y 2 · las líneas seleccionadas, con cantidad, unitario, recurrencia y
  // total. El renglón se arma igual que en `document.tsx:1731-1738`; el total
  // va pegado atrás porque el extractor une los dos `Text` con un espacio.
  for (const linea of bloque.lineas) {
    puntos.push({
      etiqueta: `línea ${linea.lineaId} · nombre`,
      texto: `${linea.nombre}${linea.ruta ? ` — ${linea.ruta}` : ""}`,
    });
    puntos.push({
      etiqueta: `línea ${linea.lineaId} · cantidad, unitario, recurrencia y total`,
      texto:
        (linea.cantidad === null ? "" : `${linea.cantidad} ${linea.unidad} · `) +
        (linea.precioUnitario ? `unitario ${money(linea.precioUnitario)} · ` : "") +
        `${linea.recurrencia === "mensual" ? "mensual" : "pago único"} ${money(linea.totalLinea)}`,
    });
  }

  // 6 · los agregados incluidos, con su alcance.
  for (const agregado of bloque.agregados) {
    puntos.push({
      etiqueta: `agregado ${agregado.nombre}`,
      texto: agregado.alcance ? `${agregado.nombre} — ${agregado.alcance}` : agregado.nombre,
    });
  }

  // 3 y 5 · los dos grupos, cada uno con subtotal neto, impuesto y total. El
  // importe lleva la moneda adentro y el impuesto el porcentaje fiscal.
  for (const grupo of bloque.grupos) {
    puntos.push({
      etiqueta: `grupo ${grupo.id} · título y subtotal neto`,
      texto: `${grupo.titulo} Subtotal neto: ${money(grupo.subtotalNeto)}`,
    });
    if (grupo.impuesto) {
      puntos.push({
        etiqueta: `grupo ${grupo.id} · impuesto (porcentaje fiscal) y total`,
        texto: `Impuesto (${grupo.porcentajeImpuesto} %): ${money(grupo.impuesto)} ${money(grupo.total)}`,
      });
    }
  }

  // 7 · el plan 30/60/90: las tres etiquetas y cada acción impresa tal cual.
  for (const etapa of contextoDe(caso.datos, caso.sobre).roadmapV2!) {
    puntos.push({ etiqueta: `plan ${etapa.id} · etiqueta`, texto: etapa.etiqueta });
    for (const accion of etapa.acciones) {
      puntos.push({ etiqueta: `plan ${etapa.id} · acción`, texto: accion });
    }
  }

  return puntos.map((p) => ({ ...p, texto: normalizar(p.texto) }));
}

/** Los puntos que el texto NO trae, nombrados para que el fallo se lea. */
function faltantes(texto: string, puntos: PuntoDeControl[]): string[] {
  return puntos.filter((p) => !texto.includes(p.texto)).map((p) => `${p.etiqueta} → «${p.texto}»`);
}

/**
 * 4 · los totales que no pueden existir: los que sumen los dos grupos, tanto
 * el neto como el que lleva impuesto (Q10, `document.tsx:1754-1755`).
 */
function totalesCombinadosProhibidos(caso: (typeof CASOS)[number]): string[] {
  const bloque = bloqueComercialDe(caso);
  const sumar = (valores: ValorV2[]) =>
    valores.reduce((acc, v) => acc + (v.estado === "disponible" ? v.valor : NaN), 0);
  const neto = sumar(bloque.grupos.map((g) => g.subtotalNeto));
  const conImpuesto = sumar(bloque.grupos.map((g) => g.total));
  if (!Number.isFinite(neto) || !Number.isFinite(conImpuesto)) {
    throw new Error("algún grupo no tiene total disponible: el caso no sirve de gate");
  }
  return [neto, conImpuesto].map((v) => normalizar(formatMoneda(v, bloque.moneda)));
}

/** 1 · las líneas del catálogo que esta propuesta NO cotiza, y no deben salir. */
function nombresNoSeleccionados(caso: (typeof CASOS)[number]): string[] {
  const cotizadas = new Set(bloqueComercialDe(caso).lineas.map((l) => l.lineaId));
  return LINEAS_V2_IDS.filter((id) => !cotizadas.has(id)).map(
    (id) => lineaV2(id as LineaId).nombre,
  );
}

const MATRIZ = CASOS.flatMap((caso) => PERFILES.map((perfil) => ({ id: caso.id, perfil, caso })));

async function textoDelPipeline(caso: (typeof CASOS)[number], perfil: PdfProfileV2) {
  const { buffer } = await exportarDocumentModelV2(modeloDe(caso.datos, caso.sobre), perfil);
  return textoDelPdf(buffer);
}

/**
 * El PDF que bajó Matías. Se espera con el mismo nombre que escribe el
 * pipeline —`<caso>-propuesta-<perfil>.pdf`— porque la descarga del navegador
 * no distingue perfil en el nombre (`export-client.ts:35-39`) y hay que
 * renombrar las dos igual.
 */
async function textoDelNavegador(caso: (typeof CASOS)[number], perfil: PdfProfileV2) {
  const archivo = join(DIR_NAVEGADOR!, `${caso.id}-propuesta-${perfil}.pdf`);
  return textoDelPdf(new Uint8Array(await readFile(archivo)));
}

describe("GATE F2a · los puntos de control del contenido, sobre el PDF del pipeline", () => {
  it.each(MATRIZ)(
    "$id · $perfil — imprime todo lo que el modelo prescribe",
    async ({ caso, perfil }) => {
      const texto = await textoDelPipeline(caso, perfil);
      expect(faltantes(texto, puntosDeControl(caso))).toEqual([]);
    },
    600_000,
  );

  it.each(MATRIZ)(
    "$id · $perfil — no imprime un total que sume los dos grupos",
    async ({ caso, perfil }) => {
      const texto = await textoDelPipeline(caso, perfil);
      for (const prohibido of totalesCombinadosProhibidos(caso))
        expect(texto).not.toContain(prohibido);
    },
    600_000,
  );

  it.each(MATRIZ)(
    "$id · $perfil — no imprime ninguna línea que no esté cotizada",
    async ({ caso, perfil }) => {
      const texto = await textoDelPipeline(caso, perfil);
      for (const nombre of nombresNoSeleccionados(caso)) expect(texto).not.toContain(nombre);
    },
    600_000,
  );

  it("la fecha es el único campo variable que llega al PDF, y por eso es la única exclusión", () => {
    for (const caso of CASOS) {
      const modelo = modeloDe(caso.datos, caso.sobre);
      // `diagnosticId` y `diagnosticVersion` viajan en `source` pero no se
      // imprimen: `document.tsx` sólo lee `clientName`, `documentKind`,
      // `diagnosticDate` y `version`, y esa última es el sufijo del
      // `templateId` (`shared.ts:43`), no la versión del diagnóstico.
      expect(modelo.metadata.date).toBe("2026-08-31");
      expect(modelo.source.diagnosticVersion).toBe(1);
      expect(modelo.templateId.endsWith("v2")).toBe(true);
    }
  });
});

/**
 * El gate propiamente dicho. Sin `VELOCENTUM_F2A_NAVEGADOR_DIR` no hay nada
 * que comparar y vitest lo saltea a la vista, en vez de pasar en falso.
 */
describe.skipIf(!DIR_NAVEGADOR)("GATE F2a · el PDF del navegador contra el del pipeline", () => {
  it.each(MATRIZ)(
    "$id · $perfil — dice exactamente lo mismo",
    async ({ caso, perfil }) => {
      const [navegador, pipeline] = await Promise.all([
        textoDelNavegador(caso, perfil),
        textoDelPipeline(caso, perfil),
      ]);
      const puntos = puntosDeControl(caso);

      // El pipeline primero: si falla acá, el problema no es lo descargado.
      expect(faltantes(pipeline, puntos)).toEqual([]);
      expect(faltantes(navegador, puntos)).toEqual([]);

      for (const prohibido of totalesCombinadosProhibidos(caso)) {
        expect(navegador).not.toContain(prohibido);
      }
      for (const nombre of nombresNoSeleccionados(caso)) {
        expect(navegador).not.toContain(nombre);
      }
    },
    600_000,
  );
});
