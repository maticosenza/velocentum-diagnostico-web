/**
 * Corrección 2026-08-22: la contradicción del margen declarado no puede dejar
 * de evaluarse sólo porque el margen total (100% de cobertura) está
 * retenido. Si hay margen de la muestra, se compara contra él, y se
 * registra el origen (`origen_margen`) y la cobertura usada, sin que eso
 * cambie los umbrales, el cambio de signo, ni la regla de bloqueo (que
 * sigue dependiendo únicamente de `margen_declarado_confirmado`).
 */
import { describe, expect, it } from "vitest";
import { evaluarContradiccion, rangoDeclarado } from "./contradiccion";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import { casoTitanWebB1, configuracionRegresionFase2 } from "./fixtures-casos";

describe("evaluarContradiccion: contra qué margen se compara", () => {
  const rango10a12 = rangoDeclarado(10, 12)!;

  it("cobertura completa: compara contra el margen total (aunque haya muestra distinta), origen_margen 'total'", () => {
    // total: -0,03 (cambia de signo contra el rango declarado) vs.
    // muestra: 0,11 (adentro). Si comparara contra la muestra no habría
    // contradicción; el total manda cuando está disponible.
    const c = evaluarContradiccion(
      { total: -0.03, muestra: 0.11 },
      rango10a12,
      { cobertura_productos: 100, cobertura_canales: 100 },
    )!;
    expect(c.origen_margen).toBe("total");
    expect(c.confianza_base).toBe("alta");
    expect(c.cobertura_productos).toBe(100);
    expect(c.cobertura_canales).toBe(100);
    expect(c.calculado).toBe(-0.03);
    expect(c.cambio_de_signo).toBe(true);
    expect(c.nivel).toBe("critica");
  });

  it("cobertura parcial con muestra disponible: compara contra la muestra, origen_margen 'muestra', confianza un nivel más baja, cobertura registrada", () => {
    const c = evaluarContradiccion(
      { total: null, muestra: -0.03 },
      rango10a12,
      { cobertura_productos: 60, cobertura_canales: 100 },
    )!;
    expect(c.origen_margen).toBe("muestra");
    expect(c.confianza_base).toBe("media"); // un nivel menos que "alta"
    expect(c.cobertura_productos).toBe(60);
    expect(c.cobertura_canales).toBe(100);
    expect(c.calculado).toBe(-0.03);
    expect(c.nivel).toBe("critica");
  });

  it("contradicción confirmada apoyada en muestra parcial: bloquea igual, pero declara su origen y cobertura", () => {
    const c = evaluarContradiccion(
      { total: null, muestra: -0.03 },
      rango10a12,
      { confirmado: true, cobertura_productos: 60, cobertura_canales: 100 },
    )!;
    expect(c.confirmado).toBe(true);
    expect(c.nivel).toBe("critica");
    expect(c.bloquea).toBe(true); // confirmado + crítica bloquea, sin importar el origen
    expect(c.origen_margen).toBe("muestra");
    expect(c.cobertura_productos).toBe(60);
  });

  it("sin margen total ni de muestra: no se evalúa, sin error", () => {
    expect(evaluarContradiccion({ total: null, muestra: null }, rango10a12)).toBeNull();
    expect(evaluarContradiccion({ total: undefined, muestra: undefined }, rango10a12)).toBeNull();
  });

  it("sin rango declarado: no se evalúa, con o sin margen", () => {
    expect(evaluarContradiccion({ total: 0.1, muestra: 0.1 }, null)).toBeNull();
  });

  it("umbrales y cambio de signo dan idéntico resultado con ambos orígenes (sólo cambia origen_margen/confianza_base)", () => {
    const conTotal = evaluarContradiccion({ total: 0.03, muestra: null }, rango10a12)!;
    const conMuestra = evaluarContradiccion({ total: null, muestra: 0.03 }, rango10a12)!;

    expect(conTotal.nivel).toBe(conMuestra.nivel);
    expect(conTotal.diferencia).toBe(conMuestra.diferencia);
    expect(conTotal.limite_cercano).toBe(conMuestra.limite_cercano);
    expect(conTotal.dentro_del_rango).toBe(conMuestra.dentro_del_rango);
    expect(conTotal.cambio_de_signo).toBe(conMuestra.cambio_de_signo);

    expect(conTotal.origen_margen).toBe("total");
    expect(conMuestra.origen_margen).toBe("muestra");
    expect(conTotal.confianza_base).toBe("alta");
    expect(conMuestra.confianza_base).toBe("media");
  });

  it("no confunde confirmado con origen_margen: un origen 'muestra' sin confirmar informa pero no bloquea", () => {
    const c = evaluarContradiccion(
      { total: null, muestra: -0.03 },
      rango10a12,
      { confirmado: false, cobertura_productos: 60, cobertura_canales: 100 },
    )!;
    expect(c.nivel).toBe("critica");
    expect(c.confirmado).toBe(false);
    expect(c.bloquea).toBe(false);
    expect(c.origen_margen).toBe("muestra");
  });
});

describe("caso Titan Web (60% de cobertura de productos): la contradicción crítica sigue disparando", () => {
  const cfg: ConfiguracionCalculo = configuracionRegresionFase2;

  it("declara 10%-12% de rentabilidad; el margen de la muestra es negativo: contradicción crítica sobre la muestra", () => {
    const datos = {
      ...casoTitanWebB1,
      margen_declarado_min: 10,
      margen_declarado_max: 12,
    };
    const r = calcularDiagnostico(datos, cfg);

    // Éste es el caso que originó la regla: sin la corrección, al estar el
    // margen total retenido (60% de cobertura de productos), la
    // contradicción no se evaluaba y nadie advertía la diferencia.
    expect(r.derivados.cobertura_productos).toBe(60);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margen_muestra).not.toBeNull();

    const c = r.derivados.contradiccion_margen!;
    expect(c).not.toBeNull();
    expect(c.origen_margen).toBe("muestra");
    expect(c.confianza_base).toBe("media");
    expect(c.cobertura_productos).toBe(60);
    expect(c.nivel).toBe("critica");
    expect(c.cambio_de_signo).toBe(true); // margen de la muestra negativo vs. declarado positivo
  });

  it("confirmada, bloquea las cifras que dependen del margen, y el resto sigue en pie", () => {
    const datos = {
      ...casoTitanWebB1,
      margen_declarado_min: 10,
      margen_declarado_max: 12,
      margen_declarado_confirmado: true,
    };
    const r = calcularDiagnostico(datos, cfg);

    expect(r.derivados.contradiccion_margen?.nivel).toBe("critica");
    expect(r.derivados.contradiccion_margen?.origen_margen).toBe("muestra");
    expect(r.margen_bloqueado).toBe(true);
    expect(r.oportunidad_total).toBe(0);

    // Módulos independientes del margen siguen visibles.
    expect(r.derivados.canales.find((c) => c.id === "mercado_libre")!.comision_efectiva).toBe(
      0.1694,
    );
  });
});
