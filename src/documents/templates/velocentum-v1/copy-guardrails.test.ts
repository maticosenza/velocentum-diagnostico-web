/**
 * Guardarraíles de redacción (corrección aprobada 2026-08-21, punto 6):
 * ninguna de las frases prohibidas puede aparecer en NINGÚN texto generado,
 * en ningún documento, para ningún dato de entrada. Este archivo escanea el
 * `DocumentModel` completo (recorriendo cada string de cada bloque, no sólo
 * la redacción del resumen comercial) porque ambos renderers (web y PDF)
 * consumen exactamente esos mismos strings sin transformarlos: probarlo acá
 * cubre a los dos por igual.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  casoTitanWebB1,
  configuracionRegresionFase2,
} from "../../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../../lib/diagnostico-form";
import { buildDocumentContext } from "../../domain";
import { FRASES_PROHIBIDAS, fraseProhibidaEncontrada } from "../../domain/resumen-comercial";
import { buildDiagnosticoDocument } from "./diagnostico";
import { buildProyeccionPropuestaDocument } from "./composicion";
import { buildPropuestaDocument } from "./propuesta";
import { buildProyeccion90dDocument } from "./proyeccion-90d";
import type { DocumentModel } from "./types";

/** Recorre cualquier valor y junta cada string que encuentra. */
function stringsDe(valor: unknown, acc: string[] = []): string[] {
  if (typeof valor === "string") {
    acc.push(valor);
  } else if (Array.isArray(valor)) {
    for (const item of valor) stringsDe(item, acc);
  } else if (valor && typeof valor === "object") {
    for (const clave of Object.keys(valor)) stringsDe((valor as Record<string, unknown>)[clave], acc);
  }
  return acc;
}

function fraseProhibidaEnModelo(model: DocumentModel): string | null {
  for (const texto of stringsDe(model)) {
    const frase = fraseProhibidaEncontrada(texto);
    if (frase !== null) return `${frase} (en: "${texto}")`;
  }
  return null;
}

const casoConOportunidad: DatosDiagnostico = {
  ...casoSnakeStoreCoberturaCompleta,
  facturacion_mensual: 22_522_600,
  visitas_mensuales: 5000,
  agregados_carrito: 1000,
  checkouts_iniciados: 300,
  absorbe_costo_envio: true,
};

function contexto(datos: DatosDiagnostico, tipoDocumento: "diagnostico" | "proyeccion_90d" | "propuesta") {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return buildDocumentContext({
    datos,
    resultado,
    diagnostico: { id: `guardrail-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-20" },
    tipoDocumento,
  });
}

describe("guardarraíles de redacción: ninguna frase prohibida en ningún documento", () => {
  it("declara exactamente las 4 frases prohibidas aprobadas", () => {
    expect(FRASES_PROHIBIDAS).toEqual([
      "vas a facturar",
      "vas a ganar",
      "el retorno esperado es",
      "vas a recuperar",
    ]);
  });

  it("diagnóstico: sin frases prohibidas", () => {
    const model = buildDiagnosticoDocument(contexto(casoConOportunidad, "diagnostico"));
    expect(fraseProhibidaEnModelo(model)).toBeNull();
  });

  it("proyección a 90 días (con oportunidad calculable): sin frases prohibidas", () => {
    const model = buildProyeccion90dDocument(contexto(casoConOportunidad, "proyeccion_90d"));
    expect(fraseProhibidaEnModelo(model)).toBeNull();
    // Confirmamos que el modelo sí tiene contenido real para escanear (no
    // pasa vacío): debe incluir la redacción obligatoria en algún bloque.
    const textos = stringsDe(model);
    expect(textos.some((t) => t.includes("Con los datos disponibles y bajo estos supuestos"))).toBe(
      true,
    );
  });

  it("proyección a 90 días (sin oportunidad, retenida): sin frases prohibidas", () => {
    const model = buildProyeccion90dDocument(contexto(casoSnakeStore, "proyeccion_90d"));
    expect(fraseProhibidaEnModelo(model)).toBeNull();
  });

  it("proyección a 90 días (100% Mercado Libre, Titan B1): sin frases prohibidas", () => {
    const model = buildProyeccion90dDocument(contexto(casoTitanWebB1, "proyeccion_90d"));
    expect(fraseProhibidaEnModelo(model)).toBeNull();
  });

  it("propuesta: sin frases prohibidas", () => {
    const model = buildPropuestaDocument(contexto(casoConOportunidad, "propuesta"));
    expect(fraseProhibidaEnModelo(model)).toBeNull();
  });

  it("proyección + propuesta combinada: sin frases prohibidas", () => {
    const model = buildProyeccionPropuestaDocument(contexto(casoConOportunidad, "propuesta"));
    expect(fraseProhibidaEnModelo(model)).toBeNull();
  });

  it("detecta a propósito una frase prohibida insertada en un string cualquiera (control negativo)", () => {
    const modeloFalso = {
      texto: "Con estos datos, vas a facturar mucho más el próximo trimestre.",
    } as unknown as DocumentModel;
    expect(fraseProhibidaEnModelo(modeloFalso)).not.toBeNull();
  });
});
