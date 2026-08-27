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
import { buildDocumentContext, magnitudDeFuga } from "./build-context";
import { impactoCalculado } from "../../lib/impacto-economico";
import type { Fuga } from "../../lib/calculo-diagnostico";
import { validarContextoDocumento } from "./validation";
import type { EscaleraPaquetesConfirmada } from "../../lib/paquetes";

function contexto(datos: DatosDiagnostico) {
  return buildDocumentContext({
    datos,
    resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
    diagnostico: { id: `fixture-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-20" },
  });
}

describe("adaptador conservador a DocumentContextV1", () => {
  it("adapta Titan sin confundir MER, ROAS ni Product Ads", () => {
    const c = contexto(casoTitanWebB1);

    expect(validarContextoDocumento(c)).toEqual([]);
    expect(c.actual.facturacion).toMatchObject({ estado: "calculado", valor: 50_000_000 });
    expect(c.actual.inversionTotal).toMatchObject({ estado: "calculado", valor: 1_800_000 });
    expect(c.actual.merMarketplace).toMatchObject({ estado: "calculado", valor: 27.78 });
    // D4/Bloque 3 Funcional: faltan las ventas atribuidas de Product Ads (dato
    // de entrada ausente), no una regla de negocio — reclasificado de
    // "retenido" a "evidencia_faltante" (contrato-bloque-3.md sección 1,
    // caso "Faltan ventas atribuidas o inversión de Product Ads").
    expect(c.actual.roasProductAds).toMatchObject({ estado: "evidencia_faltante", valor: null });
    expect(c.evidencia["inversion_product_ads"]).toMatchObject({
      estado: "declarado",
      valor: 1_800_000,
    });
    // Envío sin confirmar: retiene contribución y ahorro, igual que el margen total.
    expect(c.escenarios90d).toHaveLength(3);
    for (const escenario of c.escenarios90d) {
      expect(escenario.contribucionIncremental.acumulado90d).toMatchObject({ estado: "retenido" });
      expect(escenario.contribucionIncremental.ritmoMensualDia90).toMatchObject({ estado: "retenido" });
      expect(escenario.ahorroPublicitario.acumulado90d).toMatchObject({ estado: "retenido" });
    }
    expect(c.comercial).toBeNull();
  });

  it("mantiene envío legado como no confirmado y retiene márgenes publicables", () => {
    const c = contexto(casoSnakeStore);

    expect(c.envio).toEqual({
      estado: "no_confirmado",
      costoNeto: null,
      mostrarEnDocumentos: false,
    });
    expect(c.actual.margenTotal).toMatchObject({ estado: "retenido", valor: null });
    expect(c.actual.margenMuestra).toMatchObject({ estado: "retenido", valor: null });
    expect(c.restricciones.map((r) => r.id)).toContain("politica_envio_no_confirmada");
  });

  it("publica el margen de la muestra, pero no el total, con productos parciales", () => {
    const c = contexto({ ...casoSnakeStore, absorbe_costo_envio: true });

    expect(c.envio).toMatchObject({
      estado: "si",
      costoNeto: { estado: "declarado", valor: 11_000 },
      mostrarEnDocumentos: true,
    });
    expect(c.cobertura).toMatchObject({ general: 60, canales: 100, productos: 60 });
    expect(c.actual.margenTotal).toMatchObject({ estado: "retenido", valor: null });
    expect(c.actual.margenMuestra).toMatchObject({ estado: "calculado", valor: 0.6375 });
  });

  it("respeta no absorbe y conserva false y cero como evidencia real", () => {
    const datos: DatosDiagnostico = {
      ...casoSnakeStore,
      absorbe_costo_envio: false,
      facturacion_mensual: 0,
      inversion_meta: 0,
      inversion_google: 0,
      ml_product_ads: false,
      ml_inversion_product_ads: 0,
    };
    const c = contexto(datos);

    expect(c.envio).toEqual({ estado: "no", costoNeto: 0, mostrarEnDocumentos: false });
    expect(c.evidencia["politica_envio"]).toMatchObject({ estado: "declarado", valor: false });
    expect(c.evidencia["product_ads_activo"]).toMatchObject({
      estado: "declarado",
      valor: false,
    });
    expect(c.evidencia["inversion_meta"]).toMatchObject({ estado: "declarado", valor: 0 });
    expect(c.actual.facturacion).toMatchObject({ estado: "calculado", valor: 0 });
    expect(c.actual.inversionTotal).toMatchObject({ estado: "calculado", valor: 0 });
    expect(c.actual.pedidos).toMatchObject({ estado: "calculado", valor: 0 });
    expect(c.actual.roasProductAds).toMatchObject({ estado: "no_aplica", valor: null });
  });

  it("mantiene MER y ROAS de Product Ads como métricas independientes", () => {
    const c = contexto({
      ...casoTitanWebB1,
      absorbe_costo_envio: false,
      ml_product_ads: true,
      ml_ventas_product_ads: 9_000_000,
    });

    expect(c.actual.merMarketplace).toMatchObject({ estado: "calculado", valor: 27.78 });
    expect(c.actual.roasProductAds).toMatchObject({ estado: "calculado", valor: 5 });
    expect(c.actual.merMarketplace).not.toEqual(c.actual.roasProductAds);
    // casoTitanWebB1 tiene 60% de cobertura de productos: el margen total
    // (y por lo tanto breakeven_roas) queda retenido, así que el hallazgo
    // "product_ads" (que desde el 2026-08-23 exige ROAS real por debajo del
    // breakeven, no sólo que el canal exista) no puede evaluarse todavía —
    // no es un bug, es la ausencia de la evidencia que probaría el
    // problema. Ver el caso positivo (con evidencia real, dispara) en
    // src/documents/correccion-incoherencias-escenarios.test.ts, describe "3b".
    expect(c.servicios).not.toContainEqual(
      expect.objectContaining({ id: "product_ads" }),
    );
  });

  it("preserva cobertura parcial sin normalizarla a margen total", () => {
    const c = contexto({
      ...casoTitanWebB1,
      absorbe_costo_envio: false,
      canal_ml_pct: 60,
    });

    expect(c.cobertura).toMatchObject({ general: 60, canales: 60, productos: 60 });
    expect(c.actual.margenTotal).toMatchObject({ estado: "retenido", valor: null });
    expect(c.actual.margenMuestra).toMatchObject({ estado: "calculado", valor: 0.3148 });
    expect(c.restricciones.map((r) => r.id)).toContain("cobertura_canales_parcial");
  });

  it("transporta la contradicción confirmada y bloquea los márgenes", () => {
    // Requiere margen total calculado (100% de cobertura de productos) para
    // que haya algo contra qué contrastar el margen declarado.
    const c = contexto({
      ...casoTitanWebB1CoberturaCompleta,
      absorbe_costo_envio: false,
      margen_declarado_min: 10,
      margen_declarado_max: 12,
      margen_declarado_confirmado: true,
    });

    expect(c.evidencia["contradiccion_margen"]).toMatchObject({
      estado: "verificado",
      valor: { nivel: "critica", confirmado: true, bloquea: true },
    });
    expect(c.cobertura.confianza).toBe("bloqueada");
    expect(c.actual.margenTotal).toMatchObject({ estado: "retenido", valor: null });
    expect(c.actual.margenMuestra).toMatchObject({ estado: "retenido", valor: null });
    expect(c.restricciones).toContainEqual(
      expect.objectContaining({
        id: "contradiccion_margen",
        bloquea: ["rentabilidad", "escenario", "escalamiento"],
      }),
    );
  });
});

describe("hallazgos: magnitud (corrección aprobada 2026-08-21, punto 3)", () => {
  it("etiqueta un hallazgo de funnel como contribución incremental y uno de publicidad como ahorro publicitario", () => {
    const datos: DatosDiagnostico = {
      ...casoSnakeStoreCoberturaCompleta,
      facturacion_mensual: 22_522_600,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
      inversion_meta: 5_000_000,
      conjuntos_activos: 50,
      presupuesto_diario: 500,
    };
    const c = contexto(datos);

    const funnel = c.hallazgos.find((h) => h.id.startsWith("funnel_"));
    expect(funnel).toBeDefined();
    expect(funnel!.magnitud).toBe("contribucion_incremental");

    const publicidad = c.hallazgos.find(
      (h) => h.id === "gasto_no_rentable" || h.id === "sobrefragmentacion",
    );
    if (publicidad) {
      expect(publicidad.magnitud).toBe("ahorro_publicitario");
    }
  });

  it("un hallazgo de riesgo (sin monto) no tiene magnitud", () => {
    const c = contexto(casoSnakeStore);
    const conMonto = c.hallazgos.filter((h) => h.monto === null);
    for (const h of conMonto) {
      expect(h.magnitud).toBeNull();
    }
  });

  it("nunca elige facturación incremental aunque su monto coincida por casualidad con el de contribución (margen 100% teórico)", () => {
    // Caso construido a mano: un margen de exactamente 100% haría que
    // facturación incremental y contribución incremental tuvieran el mismo
    // montoMensual. magnitudDeFuga no debe confundir una con la otra: sólo
    // busca entre contribución y ahorro (facturación no tiene análogo
    // legado), así que la ambigüedad nunca puede ocurrir.
    const fugaConMargen100: Fuga = {
      id: "funnel_carrito",
      etiqueta: "Fuga por carrito",
      tipo: "monto",
      monto: 50_000,
      calculable: true,
      faltantes: [],
      impactos: [
        impactoCalculado({ tipo: "facturacion_incremental", montoMensual: 50_000, confianza: "alta" }),
        impactoCalculado({ tipo: "contribucion_incremental", montoMensual: 50_000, confianza: "alta" }),
      ],
    };
    expect(magnitudDeFuga(fugaConMargen100)).toBe("contribucion_incremental");
  });

  it("magnitudDeFuga: un monto legado sin impactos tipados no se reclasifica", () => {
    const fugaLegada: Fuga = {
      id: "funnel_carrito",
      etiqueta: "Fuga por carrito",
      tipo: "monto",
      monto: 50_000,
      calculable: true,
      faltantes: [],
    };
    expect(magnitudDeFuga(fugaLegada)).toBeNull();
  });
});

describe("comercial: la escalera de paquetes confirmada, nunca un paquete inventado", () => {
  const escaleraConfirmada: EscaleraPaquetesConfirmada = {
    confirmado: true,
    niveles: [
      {
        id: "impulso",
        nombre: "IMPULSO",
        servicios: [
          {
            servicio: "Meta Ads",
            unidad: "campañas_activas",
            cantidad: 1,
            descripcion: null,
            hallazgoIds: ["fuga_funnel_carrito"],
            propuestoPorSistema: true,
          },
        ],
        precio: 900_000,
      },
    ],
  };

  it("con una escalera confirmada, `comercial` expone los niveles, servicios y precios tal cual llegaron", () => {
    const datos = casoSnakeStoreCoberturaCompleta;
    const c = buildDocumentContext({
      datos,
      resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
      diagnostico: { id: "con-escalera", version: 1, fecha: "2026-08-20" },
      paquetesConfirmados: escaleraConfirmada,
    });

    expect(validarContextoDocumento(c)).toEqual([]);
    expect(c.comercial?.niveles).toHaveLength(1);
    expect(c.comercial?.niveles[0]).toMatchObject({
      id: "impulso",
      nombre: "IMPULSO",
      servicios: [
        {
          servicio: "Meta Ads",
          unidad: "campañas_activas",
          cantidad: 1,
          descripcion: null,
          hallazgoIds: ["fuga_funnel_carrito"],
        },
      ],
    });
    expect(c.comercial?.niveles[0]?.precio).toMatchObject({ estado: "calculado", valor: 900_000 });
  });

  it("sin escalera confirmada (argumento ausente), `comercial` sigue en null", () => {
    const datos = casoSnakeStoreCoberturaCompleta;
    const c = buildDocumentContext({
      datos,
      resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
      diagnostico: { id: "sin-escalera", version: 1, fecha: "2026-08-20" },
    });

    expect(c.comercial).toBeNull();
  });

  it("una escalera no confirmada (`confirmado: false`) nunca se filtra al documento", () => {
    const datos = casoSnakeStoreCoberturaCompleta;
    // `confirmado: false` nunca ocurre en la práctica en este tipo (el
    // productor real, `confirmarPaquetes.functions.ts`, lo rechaza antes de
    // persistir) — el cast simula un dato corrupto/legado para probar que
    // `comercialDesdeEscalera` revalida en vez de confiar ciegamente en el tipo.
    const escaleraNoConfirmada = {
      ...escaleraConfirmada,
      confirmado: false,
    } as unknown as EscaleraPaquetesConfirmada;
    const c = buildDocumentContext({
      datos,
      resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
      diagnostico: { id: "escalera-no-confirmada", version: 1, fecha: "2026-08-20" },
      paquetesConfirmados: escaleraNoConfirmada,
    });

    expect(c.comercial).toBeNull();
  });

  it("un precio sin cargar en un nivel queda retenido, nunca en cero", () => {
    const datos = casoSnakeStoreCoberturaCompleta;
    const c = buildDocumentContext({
      datos,
      resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
      diagnostico: { id: "nivel-sin-precio", version: 1, fecha: "2026-08-20" },
      paquetesConfirmados: {
        confirmado: true,
        niveles: [{ ...escaleraConfirmada.niveles[0]!, precio: null }],
      },
    });

    // D4/Bloque 3 Funcional: el precio es un dato de entrada ausente (el
    // vendedor no lo cargó), no una regla de negocio — reclasificado de
    // "retenido" a "evidencia_faltante" (contrato-bloque-3.md sección 1,
    // fila general "falta un campo de entrada").
    expect(c.comercial?.niveles[0]?.precio).toMatchObject({
      estado: "evidencia_faltante",
      valor: null,
    });
  });
});
