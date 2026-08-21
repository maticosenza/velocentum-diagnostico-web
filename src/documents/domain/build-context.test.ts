import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoTitanWebB1,
  configuracionRegresionFase2,
} from "../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { buildDocumentContext } from "./build-context";
import { validarContextoDocumento } from "./validation";

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
    expect(c.actual.roasProductAds).toMatchObject({ estado: "retenido", valor: null });
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
    expect(c.servicios).toContainEqual({
      id: "product_ads_en_mercado_libre",
      nombre: "Product Ads en Mercado Libre",
      alcance: [],
    });
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
    const c = contexto({
      ...casoTitanWebB1,
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
