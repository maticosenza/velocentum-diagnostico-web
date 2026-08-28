import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  configuracionRegresionFase2,
} from "../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { calcularEscenarios90d } from "../../lib/escenarios-90d";
import { buildDocumentContext } from "./build-context";
import {
  buildDocumentContextDesdeDiagnostico,
  estadosBloqueCompletos,
  resultadoDesdeDiagnostico,
  type DiagnosticoAlmacenado,
} from "./from-diagnostico";
import { validarContextoDocumento } from "./validation";

/** Emula lo que la base guarda: sólo los campos persistidos del resultado. */
function filaGuardada(datos: DatosDiagnostico): DiagnosticoAlmacenado {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return {
    id: "diagnostico-guardado",
    fecha: "2026-08-20",
    version: 2,
    datos,
    derivados: resultado.derivados,
    estados_bloque: resultado.estados_bloque,
    fugas: resultado.fugas,
    oportunidad_total: resultado.oportunidad_total,
  };
}

describe("reconstrucción del resultado persistido", () => {
  it("reproduce el resultado del motor sin volver a calcular", () => {
    const esperado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);

    expect(resultadoDesdeDiagnostico(filaGuardada(casoSnakeStore))).toEqual(esperado);
  });

  it("deriva el bloqueo de margen desde la contradicción guardada", () => {
    // Requiere margen total calculado (100% de cobertura de productos) para
    // que haya algo contra qué contrastar el margen declarado.
    const datos: DatosDiagnostico = {
      ...casoSnakeStoreCoberturaCompleta,
      margen_declarado_min: 0.45,
      margen_declarado_max: 0.45,
      margen_declarado_confirmado: true,
    };
    const fila = filaGuardada(datos);

    expect(fila.derivados?.contradiccion_margen?.bloquea).toBe(true);
    const resultado = resultadoDesdeDiagnostico(fila);
    expect(resultado.margen_bloqueado).toBe(true);
    expect(resultado.oportunidad_total).toBe(0);
    expect(resultado.oportunidad_conservadora).toBe(0);
  });

  it("no publica una oportunidad guardada que llegó corrupta", () => {
    const fila = { ...filaGuardada(casoSnakeStore), oportunidad_total: null };

    expect(resultadoDesdeDiagnostico(fila).oportunidad_total).toBe(0);
  });

  it("un diagnóstico legado (fugas sin `impactos`) no se reinterpreta: el motor de escenarios lo trata como no clasificado", () => {
    const datosConOportunidad: DatosDiagnostico = {
      ...casoSnakeStoreCoberturaCompleta,
      facturacion_mensual: 22_522_600,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
    };
    const fila = filaGuardada(datosConOportunidad);
    // Emula una fila persistida ANTES de este modelo: sin el campo `impactos`.
    const filaLegada: DiagnosticoAlmacenado = {
      ...fila,
      fugas: fila.fugas!.map(({ impactos: _impactos, ...resto }) => resto),
    };

    const resultado = resultadoDesdeDiagnostico(filaLegada);
    expect(resultado.fugas.some((f) => f.calculable && (f.monto ?? 0) > 0)).toBe(true);
    expect(resultado.fugas.every((f) => !("impactos" in f))).toBe(true);

    // El monto legado sigue existiendo (compatibilidad de lectura), pero el
    // motor de escenarios no lo reclasifica: sin impactos tipados, no hay
    // magnitud calculable.
    const escenarios = calcularEscenarios90d(datosConOportunidad, resultado);
    for (const escenario of escenarios) {
      expect(escenario.facturacionIncremental.calculable).toBe(false);
      expect(escenario.contribucionIncremental.calculable).toBe(false);
    }
  });

  it("trata los bloques ausentes como falta de dato, no como verde", () => {
    expect(estadosBloqueCompletos(null)).toEqual({
      medicion: "sin_datos",
      economia: "sin_datos",
      cuenta: "sin_datos",
      funnel_web: "sin_datos",
      creativos: "sin_datos",
    });
    expect(estadosBloqueCompletos({ medicion: "rojo" }).medicion).toBe("rojo");
    expect(estadosBloqueCompletos({ economia: "inventado" as never }).economia).toBe("sin_datos");
  });

  it("falla explícitamente cuando el diagnóstico guardado no trae derivados", () => {
    expect(() => resultadoDesdeDiagnostico({ id: "x" })).toThrow(/derivados/);
    expect(() =>
      buildDocumentContextDesdeDiagnostico({ fila: { id: "x", derivados: {} as never } }),
    ).toThrow(/datos/);
  });
});

describe("contexto documental desde el diagnóstico persistido", () => {
  it("coincide con el contexto armado directamente desde el motor", () => {
    const resultado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
    const directo = buildDocumentContext({
      datos: casoSnakeStore,
      resultado,
      diagnostico: { id: "diagnostico-guardado", version: 2, fecha: "2026-08-20" },
    });

    const desdeFila = buildDocumentContextDesdeDiagnostico({ fila: filaGuardada(casoSnakeStore) });

    expect(validarContextoDocumento(desdeFila)).toEqual([]);
    expect(desdeFila).toEqual(directo);
  });

  it("retiene los escenarios (no inventa) y no fabrica roadmap ni propuesta comercial al leer un diagnóstico vivo", () => {
    const contexto = buildDocumentContextDesdeDiagnostico({
      fila: filaGuardada(casoSnakeStore),
      tipoDocumento: "proyeccion_90d",
    });

    expect(contexto.tipoDocumento).toBe("proyeccion_90d");
    // Snake Store no confirmó la política de envío: los tres escenarios quedan
    // retenidos, nunca con un acumulado fabricado.
    expect(contexto.escenarios90d).toHaveLength(3);
    for (const escenario of contexto.escenarios90d) {
      expect(escenario.contribucionIncremental.acumulado90d).toMatchObject({ estado: "retenido" });
      expect(escenario.contribucionIncremental.ritmoMensualDia90).toMatchObject({ estado: "retenido" });
    }
    expect(contexto.roadmap).toEqual([]);
    expect(contexto.comercial).toBeNull();
  });

  it("normaliza versión y fecha ausentes sin inventar contenido", () => {
    const fila = { ...filaGuardada(casoSnakeStore), version: null, fecha: null };
    const contexto = buildDocumentContextDesdeDiagnostico({ fila });

    expect(contexto.diagnostico.version).toBe(1);
    expect(contexto.diagnostico.fecha).toBe("");
  });
});

describe("comercial desde la columna `propuesta` persistida (build-context.ts:479)", () => {
  const escaleraConfirmadaCruda = {
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

  it("con selección confirmada persistida, la propuesta usa el paquete elegido con sus servicios, alcances y precios", () => {
    const fila: DiagnosticoAlmacenado = {
      ...filaGuardada(casoSnakeStore),
      propuesta: { propuesta: null, paquetes: escaleraConfirmadaCruda },
    };

    const contexto = buildDocumentContextDesdeDiagnostico({ fila, tipoDocumento: "propuesta" });

    expect(contexto.comercial?.niveles).toHaveLength(1);
    expect(contexto.comercial?.niveles[0]).toMatchObject({
      id: "impulso",
      nombre: "IMPULSO",
      servicios: [{ servicio: "Meta Ads", unidad: "campañas_activas", cantidad: 1 }],
    });
    expect(contexto.comercial?.niveles[0]?.precio).toMatchObject({ estado: "disponible", valor: 900_000 });
  });

  it("sin ninguna selección persistida, `comercial` queda en null y la propuesta se genera sin bloque comercial", () => {
    const fila: DiagnosticoAlmacenado = filaGuardada(casoSnakeStore);
    const contexto = buildDocumentContextDesdeDiagnostico({ fila, tipoDocumento: "propuesta" });

    expect(contexto.comercial).toBeNull();
  });

  it("una selección persistida pero sin confirmar (`confirmado: false`) no se filtra al documento: `comercial` sigue en null", () => {
    const fila: DiagnosticoAlmacenado = {
      ...filaGuardada(casoSnakeStore),
      propuesta: {
        propuesta: null,
        paquetes: { ...escaleraConfirmadaCruda, confirmado: false },
      },
    };

    const contexto = buildDocumentContextDesdeDiagnostico({ fila, tipoDocumento: "propuesta" });

    expect(contexto.comercial).toBeNull();
  });

  it("la forma vieja de la columna (sin sobre, es directamente la propuesta redactada) tampoco fabrica una selección comercial", () => {
    const fila: DiagnosticoAlmacenado = {
      ...filaGuardada(casoSnakeStore),
      propuesta: { textoIntroductorio: "Propuesta redactada antes de este bloque." },
    };

    const contexto = buildDocumentContextDesdeDiagnostico({ fila, tipoDocumento: "propuesta" });

    expect(contexto.comercial).toBeNull();
  });
});
