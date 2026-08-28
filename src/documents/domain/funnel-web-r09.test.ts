/**
 * R-09 (Bloque Visual 3, HEAD 82bb66e): `funnelWebDocumento`
 * (`build-context.ts`), vía `DocumentContextV1.funnelWeb`. Verifica que
 * el dominio traduce `resultado.derivados.funnel` (`FunnelDerivado`,
 * `src/lib/funnel.ts`) sin derivar ni estimar ninguna tasa nueva —
 * mismo criterio de DHB-1 para conversiones no formables (denominador
 * cero) y el mismo "nunca un bloque vacío con encabezado" que el resto
 * del contrato v2.
 *
 * Usa `DATOS_INICIALES`/`configuracionRegresionFase2` de
 * `fixtures-casos.ts` — nunca el fixture ficticio de los seis escenarios
 * demostrativos de `src/lib/`, reservado a un allowlist explícito que
 * este archivo no integra.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../lib/calculo-diagnostico";
import { configuracionRegresionFase2 } from "../../lib/fixtures-casos";
import { DATOS_INICIALES, type DatosDiagnostico } from "../../lib/diagnostico-form";
import { buildDocumentContext } from "./build-context";

function contexto(overrides: Partial<DatosDiagnostico>) {
  const datos: DatosDiagnostico = { ...DATOS_INICIALES, nombre_tienda: "Fixture Funnel R-09", ...overrides };
  return buildDocumentContext({
    datos,
    resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
    diagnostico: { id: "fixture-funnel-r09", version: 1, fecha: "2026-08-28" },
  });
}

describe("R-09: funnel web de tienda propia (DocumentContextV1.funnelWeb)", () => {
  it("desglosado (cuatro etapas): valores y conversiones vienen tal cual del motor, sin recalcular nada", () => {
    const c = contexto({
      facturacion_mensual: 1_000_000,
      ticket_promedio: 2_000,
      visitas_mensuales: 10_000,
      agregados_carrito: 1_000,
      checkouts_iniciados: 600,
    });

    expect(c.funnelWeb).not.toBeNull();
    const f = c.funnelWeb!;
    expect(f.desglosado).toBe(true);
    expect(f.etapas.map((e) => e.id)).toEqual(["visitas", "agregados_carrito", "checkouts_iniciados", "compras"]);

    expect(f.etapas[0]).toMatchObject({ id: "visitas", valor: { estado: "disponible", valor: 10_000 }, conversion: null });
    expect(f.etapas[1]).toMatchObject({ id: "agregados_carrito", valor: { estado: "disponible", valor: 1_000 } });
    expect(f.etapas[1]!.conversion).toMatchObject({ estado: "disponible", valor: 0.1 });
    expect(f.etapas[2]).toMatchObject({ id: "checkouts_iniciados", valor: { estado: "disponible", valor: 600 } });
    expect(f.etapas[2]!.conversion).toMatchObject({ estado: "disponible", valor: 0.6 });
    expect(f.etapas[3]).toMatchObject({ id: "compras", valor: { estado: "disponible", valor: 500 } });
    expect(f.etapas[3]!.conversion).toMatchObject({ estado: "disponible", valor: 0.8333 });
    expect(f.conversionGlobal).toMatchObject({ estado: "disponible", valor: 0.05 });
  });

  it("combinado (faltan etapas intermedias): sólo visitas y compras, sin desglose ni conversiones por tramo", () => {
    const c = contexto({
      facturacion_mensual: 1_000_000,
      ticket_promedio: 2_000,
      visitas_mensuales: 10_000,
      // sin agregados_carrito ni checkouts_iniciados
    });

    expect(c.funnelWeb).not.toBeNull();
    const f = c.funnelWeb!;
    expect(f.desglosado).toBe(false);
    expect(f.etapas.map((e) => e.id)).toEqual(["visitas", "compras"]);
    expect(f.etapas[0]!.conversion).toBeNull();
    expect(f.etapas[1]!.conversion).toBeNull();
    // La conversión global sí está disponible: compras/visitas no depende del desglose intermedio.
    expect(f.conversionGlobal).toMatchObject({ estado: "disponible", valor: 0.05 });
  });

  it("no_aplica (tienda propia no aplica al negocio): el bloque no existe, nunca vacío con encabezado", () => {
    const c = contexto({
      canal_tienda_no_aplica: true,
      visitas_mensuales: 10_000,
      agregados_carrito: 1_000,
      checkouts_iniciados: 600,
    });

    expect(c.funnelWeb).toBeNull();
  });

  it("sin_datos (sin visitas ni facturación cargadas): el bloque no existe", () => {
    const c = contexto({});
    expect(c.funnelWeb).toBeNull();
  });

  it("DHB-1: conversión con denominador cero queda no_aplica, nunca evidencia_faltante ni retenido", () => {
    const c = contexto({
      facturacion_mensual: 0,
      ticket_promedio: 1_000,
      visitas_mensuales: 0,
      agregados_carrito: 0,
      checkouts_iniciados: 0,
    });

    expect(c.funnelWeb).not.toBeNull();
    const f = c.funnelWeb!;
    expect(f.desglosado).toBe(true);
    for (const etapa of f.etapas) {
      expect(etapa.valor).toMatchObject({ estado: "disponible", valor: 0 });
      if (etapa.conversion !== null) {
        expect(etapa.conversion).toMatchObject({ estado: "no_aplica" });
      }
    }
    expect(f.conversionGlobal).toMatchObject({ estado: "no_aplica" });
  });
});
