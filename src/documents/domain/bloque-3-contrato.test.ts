/**
 * PASO 5 (Bloque 3 Funcional) — pruebas S1, S4, S5, S6, S7, S14 sobre el
 * contrato de `docs/funcional/contrato-bloque-3.md`. S2/S3 se verifican
 * por diseño (ver comentarios en las secciones correspondientes); S8, S9,
 * S10, S11, S12, S13, S15 viven en sus propios archivos
 * (`dhb-2-margen-negativo.test.ts`, `pdf-v2/exportacion.test.ts`,
 * `web-v2/c-08-perfil-a4.test.ts`, `roadmap-dhb-3.test.ts`, este mismo
 * directorio); S16/S17 se verifican en PASO 6 (regeneración de
 * artefactos, no pruebas unitarias).
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  casoTitanWebB1,
  casoTitanWebB1CoberturaCompleta,
  configuracionRegresionFase2,
} from "../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { buildDocumentContext } from "./build-context";
import { textoEstadoV2, textoOrigenV2 } from "../semantica-v2/estado";
import {
  publicarV2,
  buildCoverageBlockV2,
  buildMetricGridV2,
  buildRestrictionsGroupedV2,
} from "../templates/velocentum-v2/blocks";
import type { EstadoEvidencia } from "./types";
import { confianzaEscenario } from "./escenarios-90d";
import { valorCalculado, valorRetenido, valorNoAplica } from "./publishing-policy";
import type { LineaImpacto90d } from "./types";

function contexto(datos: DatosDiagnostico) {
  return buildDocumentContext({
    datos,
    resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
    diagnostico: { id: `fixture-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-27" },
  });
}

describe("S1 — los 9 estados de D4 existen y producen el copy literal, sin reformular", () => {
  it("Eje 2 (ValorV2): los 4 estados producen el copy exacto de la sección 3.1 del prompt", () => {
    expect(textoEstadoV2(publicarV2({ estado: "disponible", valor: 5, confianza: "alta", evidenciaIds: [], supuestos: [] }, "number")).texto).toBe(
      "5",
    );
    expect(textoEstadoV2({ estado: "retenido", formato: "number", motivos: ["x"] }).texto).toBe(
      "No se muestra hasta validar: x",
    );
    expect(textoEstadoV2({ estado: "evidencia_faltante", formato: "number", motivos: ["la facturación"] }).texto).toBe(
      "Falta la facturación para realizar este cálculo",
    );
    expect(textoEstadoV2({ estado: "no_aplica", formato: "number", motivo: "x" }).texto).toBe(
      "Este cálculo no corresponde a este caso",
    );
  });

  it("Eje 1 (Evidencia): los 5 estados producen el copy exacto de la sección 3.1 del prompt", () => {
    const COPY: Record<EstadoEvidencia, string> = {
      verificado: "Validado con evidencia del período",
      declarado: "Informado por el cliente; pendiente de validación documental",
      estimado_configuracion: "Referencia configurada; no validada con datos del cliente",
      no_disponible: "No contamos con este dato",
      no_aplica: "No corresponde a este negocio o canal",
    };
    for (const [estado, texto] of Object.entries(COPY)) {
      expect(textoOrigenV2(estado as EstadoEvidencia)).toBe(texto);
    }
  });
});

describe("S4 — ningún no_aplica aparece en la sección de datos faltantes ('Qué falta validar')", () => {
  it("un caso con varios no_aplica (canal no aplicable) no filtra el copy D4 de no_aplica a 'Qué falta validar'", () => {
    // casoTitanWebB1: canal_tienda_no_aplica → merTienda es no_aplica.
    // `context.restricciones` (fuente única de este bloque) se construye con
    // etiqueta/detalle propios, nunca leyendo un ValorPublicable — la
    // separación es estructural (RestriccionDocumento no tiene ningún campo
    // ValorPublicable), esta prueba confirma que también lo es en el texto
    // ya renderizado.
    const c = contexto(casoTitanWebB1);
    expect(c.actual.merTienda.estado).toBe("no_aplica");
    const block = buildRestrictionsGroupedV2(c.restricciones);
    const items = block?.type === "restrictions-grouped" ? block.items : [];
    const textoCompleto = items.map((i) => `${i.motivo} ${i.etiquetas.join(" ")}`).join(" | ");
    expect(textoCompleto).not.toContain("Este cálculo no corresponde a este caso");
  });
});

describe("S5 — DHB-1: inversión declarada en cero", () => {
  it("MER tienda propia: inversión $0 declarada → no_aplica, nunca evidencia_faltante ni retenido; el cero queda 'declarado'", () => {
    const datos: DatosDiagnostico = {
      ...casoSnakeStore,
      facturacion_mensual: 40_000_000,
      inversion_meta: 0,
      inversion_google: 0,
    };
    const c = contexto(datos);
    expect(c.actual.merTienda).toMatchObject({ estado: "no_aplica" });
    expect(c.evidencia["inversion_meta"]).toMatchObject({ estado: "declarado", valor: 0 });
  });

  it("MER marketplace: inversión Product Ads $0 declarada → no_aplica; el cero queda 'declarado' (R-03/DHB-1, presencia no sólo ausencia)", () => {
    const datos: DatosDiagnostico = {
      ...casoTitanWebB1,
      ml_product_ads: true,
      ml_inversion_product_ads: 0,
    };
    const c = contexto(datos);
    expect(c.actual.merMarketplace).toMatchObject({ estado: "no_aplica" });
    expect(c.evidencia["inversion_product_ads"]).toMatchObject({ estado: "declarado", valor: 0 });
  });

  it("ROAS Product Ads: inversión Product Ads $0 declarada → no_aplica; el cero queda 'declarado' (R-03/DHB-1, presencia no sólo ausencia)", () => {
    const datos: DatosDiagnostico = {
      ...casoTitanWebB1,
      ml_product_ads: true,
      ml_inversion_product_ads: 0,
    };
    const c = contexto(datos);
    expect(c.actual.roasProductAds).toMatchObject({ estado: "no_aplica" });
    expect(c.evidencia["inversion_product_ads"]).toMatchObject({ estado: "declarado", valor: 0 });
  });
});

const CATALOGO_IDS = new Set([
  "meta_ads",
  "google_ads",
  "product_ads",
  "desarrollo_y_optimizacion_web",
  "planificacion_y_creacion_de_contenido",
  "diseno_de_marca",
]);

// S6 usa exclusivamente fixtures de la suite de regresión
// (`src/lib/fixtures-casos.ts`) — los seis escenarios demostrativos usados
// en material de venta/demo tienen un aislamiento deliberado y probado por
// separado que esta prueba no está autorizada a extender (ningún archivo
// fuera de una lista corta puede referenciar ese módulo).
const CASOS_S6 = [
  casoSnakeStore,
  casoTitanWebB1,
  casoSnakeStoreCoberturaCompleta,
  casoTitanWebB1CoberturaCompleta,
];

describe("S6 — servicio: sólo catálogo cerrado, cero concatenados, cero repetidos", () => {
  it("todos los servicioIds de los casos de regresión son del catálogo cerrado, sin repetidos por hallazgo", () => {
    let totalServicioIds = 0;
    for (const datos of CASOS_S6) {
      const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
      const c = buildDocumentContext({
        datos,
        resultado,
        diagnostico: { id: "fixture-s6", version: 1, fecha: "2026-08-27" },
      });
      for (const hallazgo of c.hallazgos) {
        totalServicioIds += hallazgo.servicioIds.length;
        for (const id of hallazgo.servicioIds) {
          expect(CATALOGO_IDS.has(id), `id fuera de catálogo: ${id}`).toBe(true);
        }
        expect(new Set(hallazgo.servicioIds).size, "servicioIds con ids repetidos").toBe(
          hallazgo.servicioIds.length,
        );
      }
    }
    // Guarda contra un falso positivo: si ningún caso produjera servicioIds, las
    // aserciones de arriba pasarían vacías sin probar nada.
    expect(totalServicioIds).toBeGreaterThan(0);
  });

  // Nota S6: el caso real de string concatenado
  // ("Desarrollo y optimización web y Meta Ads", `src/lib/propuesta.ts:216`,
  // tramo `funnel_carrito`) ya está cubierto donde corresponde —
  // `serviciosCanonicosDe` tiene esa cadena exacta como caso de prueba en
  // `src/lib/paquetes.test.ts` ("extrae servicios del catálogo, incluso de
  // strings compuestos"). Reproducir el hallazgo `funnel_carrito` completo
  // acá exigiría reconstruir umbrales internos del motor de funnel sin
  // ganancia real de cobertura sobre esa prueba ya existente.
});

describe("S7 — confianza de escenario derivada de sus propias magnitudes", () => {
  const lineaRetenida: LineaImpacto90d = {
    acumulado90d: valorRetenido<number>("sin dato"),
    ritmoMensualDia90: valorRetenido<number>("sin dato"),
    palancas: [],
  };
  const lineaNoAplica: LineaImpacto90d = {
    acumulado90d: valorNoAplica<number>("no corresponde"),
    ritmoMensualDia90: valorNoAplica<number>("no corresponde"),
    palancas: [],
  };
  const lineaCalculadaMedia: LineaImpacto90d = {
    acumulado90d: valorCalculado({ valor: 100, confianza: "media", evidenciaIds: [] }),
    ritmoMensualDia90: valorCalculado({ valor: 1, confianza: "media", evidenciaIds: [] }),
    palancas: [],
  };
  const lineaCalculadaBaja: LineaImpacto90d = {
    acumulado90d: valorCalculado({ valor: 5, confianza: "baja", evidenciaIds: [] }),
    ritmoMensualDia90: valorCalculado({ valor: 0.1, confianza: "baja", evidenciaIds: [] }),
    palancas: [],
  };

  it("un escenario íntegramente retenido/no_aplica nunca puede llevar ALTA, sin importar confianzaDocumento", () => {
    expect(confianzaEscenario("alta", [lineaRetenida, lineaNoAplica, lineaRetenida])).toBe("baja");
  });

  it("con al menos una magnitud calculada, la confianza es confianzaDocumento acotada por la peor calculada", () => {
    expect(confianzaEscenario("alta", [lineaCalculadaMedia, lineaRetenida, lineaNoAplica])).toBe("media");
    expect(confianzaEscenario("alta", [lineaCalculadaBaja, lineaCalculadaMedia, lineaRetenida])).toBe("baja");
    expect(confianzaEscenario("media", [lineaCalculadaMedia, lineaRetenida, lineaNoAplica])).toBe("media");
  });
});

describe("S14 — Eje 1 visible sólo donde DA-1 lo define (metric-grid/coverage), nunca en findings/scenarios", () => {
  it("metric-grid: facturación y ticket llevan origen; el resto (2+ evidenciaIds) no lo lleva", () => {
    const datos: DatosDiagnostico = { ...casoSnakeStore, facturacion_mensual: 40_000_000 };
    const c = contexto(datos);
    const block = buildMetricGridV2(c);
    expect(block?.type).toBe("metric-grid");
    if (block?.type !== "metric-grid") throw new Error("fixture inesperado");
    const porId = new Map(block.items.map((i) => [i.id, i.origen]));
    expect(porId.get("facturacion")).not.toBeNull();
    expect(porId.get("ticket")).not.toBeNull();
    for (const id of ["pedidos", "margenTotal", "margenMuestra", "inversionTotal"]) {
      expect(porId.get(id), `${id} no debería tener origen (2+ evidenciaIds)`).toBeNull();
    }
  });

  it("coverage: canales y productos llevan origen; general (mínimo de ambos) no lo lleva", () => {
    const datos: DatosDiagnostico = { ...casoSnakeStore, facturacion_mensual: 40_000_000 };
    const c = contexto(datos);
    const block = buildCoverageBlockV2(c);
    if (block.type !== "coverage") throw new Error("fixture inesperado");
    const porId = new Map(block.items.map((i) => [i.id, i.origen]));
    expect(porId.get("canales")).not.toBeNull();
    expect(porId.get("productos")).not.toBeNull();
    expect(porId.get("general")).toBeNull();
  });

  // Nota S14: "nunca en findings/scenarios" no necesita una prueba en runtime
  // — `HallazgoV2` y `EscenarioV2` (templates/velocentum-v2/types.ts) no
  // declaran ningún campo `origen`/Evidencia, así que TypeScript ya lo
  // impide en tiempo de compilación (ver `npm run typecheck`, verde).
});
