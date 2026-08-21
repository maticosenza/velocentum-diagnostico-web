import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../lib/calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
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
    const datos: DatosDiagnostico = {
      ...casoSnakeStore,
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

  it("no fabrica escenarios ni propuesta comercial al leer un diagnóstico vivo", () => {
    const contexto = buildDocumentContextDesdeDiagnostico({
      fila: filaGuardada(casoSnakeStore),
      tipoDocumento: "proyeccion_90d",
    });

    expect(contexto.tipoDocumento).toBe("proyeccion_90d");
    expect(contexto.escenarios90d).toEqual([]);
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
