/**
 * Decisión 9 (persistencia de paquetes, cerrada 2026-08-22): la selección
 * confirmada vive en la misma columna JSON que ya guardaba la propuesta
 * redactada por el modelo, sin migración. Estas pruebas cubren la
 * compatibilidad con diagnósticos guardados antes de este cambio (forma
 * vieja: el objeto ES la propuesta directamente) y que ninguna de las dos
 * partes se pisa a la otra al combinar.
 */
import { describe, expect, it } from "vitest";
import { combinarContenidoGuardado, separarContenidoGuardado } from "./contenido-propuesta";

const propuestaDeEjemplo = {
  resumen: "Resumen de prueba",
  hallazgos: [],
  plan_90_dias: [],
  servicios_recomendados: [],
  proximos_pasos: "",
};

const paquetesDeEjemplo = {
  confirmado: true,
  niveles: [{ id: "impulso", nombre: "IMPULSO", servicios: [], precio: null }],
};

describe("separarContenidoGuardado", () => {
  it("valor null o vacío: las dos partes quedan null", () => {
    expect(separarContenidoGuardado(null)).toEqual({ propuestaCruda: null, paquetesCrudo: null });
    expect(separarContenidoGuardado(undefined)).toEqual({ propuestaCruda: null, paquetesCrudo: null });
  });

  it("forma vieja (anterior a la decisión 9): el objeto guardado ES la propuesta, sin sobre", () => {
    const r = separarContenidoGuardado(propuestaDeEjemplo);
    expect(r.propuestaCruda).toEqual(propuestaDeEjemplo);
    expect(r.paquetesCrudo).toBeNull();
  });

  it("forma nueva: separa las dos claves del sobre", () => {
    const r = separarContenidoGuardado({ propuesta: propuestaDeEjemplo, paquetes: paquetesDeEjemplo });
    expect(r.propuestaCruda).toEqual(propuestaDeEjemplo);
    expect(r.paquetesCrudo).toEqual(paquetesDeEjemplo);
  });

  it("forma nueva con sólo paquetes confirmados (nunca se generó una propuesta todavía)", () => {
    const r = separarContenidoGuardado({ propuesta: null, paquetes: paquetesDeEjemplo });
    expect(r.propuestaCruda).toBeNull();
    expect(r.paquetesCrudo).toEqual(paquetesDeEjemplo);
  });

  it("forma nueva con sólo propuesta (nunca se confirmó ningún paquete)", () => {
    const r = separarContenidoGuardado({ propuesta: propuestaDeEjemplo, paquetes: null });
    expect(r.propuestaCruda).toEqual(propuestaDeEjemplo);
    expect(r.paquetesCrudo).toBeNull();
  });

  it("un array (forma inesperada) no se confunde con ninguna de las dos formas", () => {
    expect(separarContenidoGuardado([1, 2, 3])).toEqual({ propuestaCruda: null, paquetesCrudo: null });
  });
});

describe("combinarContenidoGuardado", () => {
  it("arma el sobre con las dos partes", () => {
    const r = combinarContenidoGuardado({
      propuestaCruda: propuestaDeEjemplo,
      paquetesCrudo: paquetesDeEjemplo,
    });
    expect(r).toEqual({ propuesta: propuestaDeEjemplo, paquetes: paquetesDeEjemplo });
  });

  it("conserva paquetes al reescribir sólo la propuesta (nunca pisa la otra clave)", () => {
    const r = combinarContenidoGuardado({
      propuestaCruda: { ...propuestaDeEjemplo, resumen: "Resumen nuevo" },
      paquetesCrudo: paquetesDeEjemplo,
    });
    expect(r.paquetes).toEqual(paquetesDeEjemplo);
    expect((r.propuesta as typeof propuestaDeEjemplo).resumen).toBe("Resumen nuevo");
  });

  it("conserva la propuesta al reescribir sólo los paquetes (nunca pisa la otra clave)", () => {
    const r = combinarContenidoGuardado({
      propuestaCruda: propuestaDeEjemplo,
      paquetesCrudo: { ...paquetesDeEjemplo, confirmado: true },
    });
    expect(r.propuesta).toEqual(propuestaDeEjemplo);
  });

  it("ida y vuelta: separar lo que combinó reproduce las mismas dos partes", () => {
    const combinado = combinarContenidoGuardado({
      propuestaCruda: propuestaDeEjemplo,
      paquetesCrudo: paquetesDeEjemplo,
    });
    const { propuestaCruda, paquetesCrudo } = separarContenidoGuardado(combinado);
    expect(propuestaCruda).toEqual(propuestaDeEjemplo);
    expect(paquetesCrudo).toEqual(paquetesDeEjemplo);
  });
});
