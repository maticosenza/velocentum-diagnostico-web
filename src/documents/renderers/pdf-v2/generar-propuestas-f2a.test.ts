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
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
import { LINEAS_V2_IDS, type LineaId } from "../../../lib/catalogo-v2";
import {
  lineaVaciaV2,
  type LineaSeleccionadaV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "../../../lib/seleccion-comercial-v2";

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

function modeloDe(datos: DatosDiagnostico, sobre: SobreComercialV2) {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return buildPropuestaDocumentV2(
    buildDocumentContext({
      datos,
      resultado,
      diagnostico: { id: `f2a-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-31" },
      tipoDocumento: "propuesta",
      sobreComercialV2: sobre,
    }),
  );
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
