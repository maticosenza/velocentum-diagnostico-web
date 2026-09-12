/**
 * Identificación pregunta "¿Tiene tienda propia?", "¿Pauta en Meta?" y
 * "¿Pauta en Google?". La primera es `canal_tienda_no_aplica`; las dos de pauta
 * separan "no pauta" de "no relevado" en la inversión publicitaria (cierra la
 * decisión abierta del arreglo 2 de `docs/bv4-motor-arreglos-propuestos.md`).
 * Los diagnósticos guardados antes de las preguntas no las traen y tienen que
 * dar el mismo cálculo que antes: lo verifica el caso 1ac7186c, copiado de la base.
 */

import { describe, expect, it } from "vitest";
import { buildDocumentContext } from "../documents/domain/build-context";
import {
  calcularDiagnostico,
  hayInversionPublicitaria,
  inversionCanal,
  inversionPublicitariaTotal,
  lecturaPresupuesto,
  type Derivados,
} from "./calculo-diagnostico";
import { estadoCanal } from "./canales";
import {
  DATOS_INICIALES,
  camposPorBloque,
  contarCompletos,
  type DatosDiagnostico,
} from "./diagnostico-form";
import { CASO_1AC7186C as caso } from "./fixtures-caso-1ac7186c";
import { casoTitanWebB1, configuracionRegresionFase2 as cfg } from "./fixtures-casos";
import { mapearHallazgos } from "./propuesta";

describe("Identificación: las tres preguntas cuentan para la completitud", () => {
  it("entran en camposPorBloque en los dos modos", () => {
    for (const modo of ["A", "B"] as const) {
      expect(camposPorBloque(modo, "identificacion")).toEqual(
        expect.arrayContaining(["canal_tienda_no_aplica", "pauta_meta", "pauta_google"]),
      );
    }
  });

  it("sin responder no cuentan; respondidas, con Sí o con No, sí", () => {
    expect(contarCompletos(DATOS_INICIALES, "A", "identificacion")).toEqual({
      completos: 0,
      total: 7,
    });
    const respondido: DatosDiagnostico = {
      ...DATOS_INICIALES,
      canal_tienda_no_aplica: true,
      pauta_meta: false,
      pauta_google: true,
    };
    expect(contarCompletos(respondido, "B", "identificacion").completos).toBe(3);
  });
});

describe("¿Tiene tienda propia? es canal_tienda_no_aplica", () => {
  const base: DatosDiagnostico = { ...DATOS_INICIALES, canal_tienda_pct: 40 };

  it("No deja la tienda en no_aplica", () => {
    expect(estadoCanal({ ...base, canal_tienda_no_aplica: true }, "tienda_propia")).toBe(
      "no_aplica",
    );
  });

  it("Sí y sin responder la dejan como estaba", () => {
    expect(estadoCanal({ ...base, canal_tienda_no_aplica: false }, "tienda_propia")).toBe(
      "declarado",
    );
    expect(estadoCanal({ ...base, canal_tienda_no_aplica: null }, "tienda_propia")).toBe(
      "declarado",
    );
  });
});

describe("¿Pauta en Meta? / ¿Pauta en Google?: no pauta no es no relevado", () => {
  /** Canal único: sin canales declarados, como la mayoría de los guardados. */
  const base: DatosDiagnostico = {
    ...DATOS_INICIALES,
    facturacion_mensual: 10_000_000,
    ticket_promedio: 20_000,
  };

  it("sin responder, Google vacío con Meta cargado se suma como cero, igual que antes", () => {
    const d = { ...base, inversion_meta: 500_000, inversion_google: null };
    expect(inversionPublicitariaTotal(d)).toBe(500_000);
    expect(hayInversionPublicitaria(d)).toBe(true);
  });

  it("No pauta en Google con el monto vacío cuenta cero", () => {
    const d = { ...base, inversion_meta: 500_000, inversion_google: null, pauta_google: false };
    expect(inversionPublicitariaTotal(d)).toBe(500_000);
    expect(hayInversionPublicitaria(d)).toBe(true);
  });

  it("Sí pauta en Google sin el monto retiene el total y el perímetro de la tienda", () => {
    const d = { ...base, inversion_meta: 500_000, inversion_google: null, pauta_google: true };
    expect(inversionPublicitariaTotal(d)).toBeNull();
    expect(hayInversionPublicitaria(d)).toBeNull();
    expect(inversionCanal(d, "tienda_propia")).toBeNull();
  });

  it("Sí pauta en Meta sin el monto retiene aunque Google esté cargado", () => {
    const d = { ...base, inversion_meta: null, inversion_google: 300_000, pauta_meta: true };
    expect(inversionPublicitariaTotal(d)).toBeNull();
    expect(hayInversionPublicitaria(d)).toBeNull();
  });

  it("Meta en cero y Google sin cargar: null sin responder, false si no pauta en Google", () => {
    const d = { ...base, inversion_meta: 0, inversion_google: null };
    expect(hayInversionPublicitaria(d)).toBeNull();
    expect(inversionPublicitariaTotal({ ...d, pauta_google: false })).toBe(0);
    expect(hayInversionPublicitaria({ ...d, pauta_google: false })).toBe(false);
  });

  it("no pauta en ninguno de los dos, sin montos, es declarar que no invierte", () => {
    const d = { ...base, pauta_meta: false, pauta_google: false };
    expect(inversionPublicitariaTotal(d)).toBe(0);
    expect(hayInversionPublicitaria(d)).toBe(false);
    expect(inversionPublicitariaTotal({ ...d, pauta_meta: null, pauta_google: null })).toBeNull();
  });

  it("la inversión cargada en el canal tienda propia manda sobre Meta y Google", () => {
    const d = {
      ...base,
      pauta_google: true,
      inversion_google: null,
      canal_tienda_inversion: 800_000,
    };
    expect(inversionPublicitariaTotal(d)).toBe(800_000);
    expect(hayInversionPublicitaria(d)).toBe(true);
  });

  describe("con canales declarados", () => {
    const titan: DatosDiagnostico = {
      ...casoTitanWebB1,
      canal_tienda_no_aplica: false,
      canal_tienda_pct: 40,
      canal_ml_pct: 60,
    };

    it("Meta cargado y no pauta en Google completa la tienda y se suma a Product Ads", () => {
      const d = { ...titan, inversion_meta: 200_000, inversion_google: null, pauta_google: false };
      expect(inversionPublicitariaTotal(d)).toBe(2_000_000);
      expect(hayInversionPublicitaria(d)).toBe(true);
    });

    it("Sí pauta en Meta sin monto retiene el total aunque Product Ads esté cargado", () => {
      const d = { ...titan, inversion_meta: null, inversion_google: 0, pauta_meta: true };
      expect(inversionPublicitariaTotal(d)).toBeNull();
      expect(hayInversionPublicitaria(d)).toBeNull();
    });
  });
});

describe("Caso guardado 1ac7186c, anterior a las preguntas", () => {
  /** Como lo abre "Editar y recalcular": iniciales debajo, lo guardado encima. */
  const cargado: DatosDiagnostico = { ...DATOS_INICIALES, ...caso.datos };
  const calcular = (d: DatosDiagnostico) => calcularDiagnostico(d, cfg, caso.modo);

  it("es la fila tal cual está en la base: no trae las preguntas de pauta", () => {
    expect("pauta_meta" in caso.datos).toBe(false);
    expect("pauta_google" in caso.datos).toBe(false);
    expect(caso.datos.canal_tienda_no_aplica).toBe(false);
  });

  it("recalcularlo da los mismos derivados que quedaron guardados", () => {
    // El umbral verde de conversión y el cargo fijo de Mercado Libre salen de la
    // configuración, y la de los tests no es la de producción: quedan afuera.
    const sinConfiguracion = (d: Derivados) => ({
      ...d,
      cr_umbral_verde: null,
      canales: d.canales.map((c) => ({ ...c, cargo_fijo_disponible: null })),
    });
    expect(sinConfiguracion(calcular(caso.datos).derivados)).toEqual(
      sinConfiguracion(caso.derivados),
    );
  });

  it("la inversión sigue en cero declarado, como en lo guardado", () => {
    expect(inversionPublicitariaTotal(caso.datos)).toBe(0);
    expect(hayInversionPublicitaria(caso.datos)).toBe(false);
  });

  it("abrirlo en el formulario no cambia el cálculo: ausente, null y guardado dan lo mismo", () => {
    const referencia = calcular(caso.datos);
    expect(calcular(cargado)).toEqual(referencia);
    expect(
      calcular({
        ...caso.datos,
        pauta_meta: null,
        pauta_google: null,
        canal_tienda_no_aplica: null,
      }),
    ).toEqual(referencia);
  });

  it("en el formulario, tienda propia aparece en Sí y las dos de pauta sin responder", () => {
    expect(cargado.canal_tienda_no_aplica).toBe(false);
    expect(cargado.pauta_meta).toBeNull();
    expect(cargado.pauta_google).toBeNull();
    expect(contarCompletos(cargado, caso.modo, "identificacion")).toEqual({
      completos: 5,
      total: 7,
    });
  });

  it("el detalle se arma con lo guardado: hallazgos, presupuesto y documento", () => {
    const hallazgos = mapearHallazgos(caso.datos, caso.derivados, caso.estados_bloque, caso.fugas);
    expect(hallazgos.length).toBeGreaterThan(0);
    expect(mapearHallazgos(cargado, caso.derivados, caso.estados_bloque, caso.fugas)).toEqual(
      hallazgos,
    );
    expect(() => lecturaPresupuesto(caso.derivados)).not.toThrow();
    const contexto = buildDocumentContext({
      datos: caso.datos,
      resultado: calcular(caso.datos),
      diagnostico: { id: caso.id, version: caso.version, fecha: caso.fecha },
    });
    expect(
      buildDocumentContext({
        datos: cargado,
        resultado: calcular(cargado),
        diagnostico: { id: caso.id, version: caso.version, fecha: caso.fecha },
      }),
    ).toEqual(contexto);
  });
});
