/**
 * BV4 · F2a etapa 3 — persistencia del sobre comercial v2 en
 * `diagnostico.propuesta`, cero migraciones.
 *
 * El bloque final es la prueba de regresión que pidió Matías al aprobar F-2:
 * envolver un diagnóstico que ya tenía escalera legada NO cambia una coma del
 * documento v1 que ese diagnóstico produce. Se verifica a tres alturas: el
 * valor guardado, el contrato documental y el modelo v1 armado.
 */
import { describe, expect, it } from "vitest";
import { combinarContenidoGuardado, separarContenidoGuardado } from "./contenido-propuesta";
import {
  escaleraConfirmadaDesdeColumna,
  lineaVaciaV2,
  normalizarSobreComercialV2,
  paquetesConEscaleraV1,
  paquetesConSobreV2,
  seleccionV2Exportable,
  type ConfiguracionFiscalV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "./seleccion-comercial-v2";
import { LINEAS_V2_IDS } from "./catalogo-v2";
import type { EscaleraPaquetesConfirmada } from "./paquetes";
import { calcularDiagnostico } from "./calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "./fixtures-casos";
import type { DiagnosticoAlmacenado } from "../documents/domain/from-diagnostico";
import { buildDocumentContextDesdeDiagnostico } from "../documents/domain/from-diagnostico";
import { buildDocumentModelDesdeDiagnostico } from "../documents/build-document";

const FISCAL: ConfiguracionFiscalV2 = { aplicaImpuesto: true, porcentaje: 21, confirmado: true };

const ESCALERA_LEGADA: EscaleraPaquetesConfirmada = {
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
          hallazgoIds: ["H1"],
          propuestoPorSistema: true,
        },
      ],
      precio: 250000,
    },
    {
      id: "traccion",
      nombre: "TRACCIÓN",
      servicios: [
        {
          servicio: "Meta Ads",
          unidad: "campañas_activas",
          cantidad: 2,
          descripcion: null,
          hallazgoIds: ["H1"],
          propuestoPorSistema: true,
        },
        {
          servicio: "Desarrollo y optimización web",
          unidad: "alcance_descrito",
          cantidad: null,
          descripcion: "Alcance a definir con el equipo.",
          hallazgoIds: ["H2"],
          propuestoPorSistema: true,
        },
      ],
      precio: 480000,
    },
  ],
};

function seleccionV2(): SeleccionComercialV2 {
  const lineas = LINEAS_V2_IDS.map((id) => lineaVaciaV2(id));
  const i = lineas.findIndex((l) => l.lineaId === "meta_ads");
  lineas[i] = {
    ...lineas[i]!,
    seleccionada: true,
    precio: { modo: "unitario", cantidad: 3, precioUnitario: 120000 },
  };
  return { nivel: "traccion", lineas, agregados: [{ agregadoId: "tracking_web", incluido: true }] };
}

/** La columna tal como la deja el escritor de la Fase 13. */
function columnaConEscaleraLegada(propuestaRedactada: unknown = { texto: "propuesta del modelo" }) {
  return combinarContenidoGuardado({
    propuestaCruda: propuestaRedactada,
    paquetesCrudo: ESCALERA_LEGADA,
  });
}

describe("paquetesConSobreV2: escribir la selección v2 sin perder nada", () => {
  it("preserva la escalera legada que había en la columna", () => {
    const { paquetesCrudo } = separarContenidoGuardado(columnaConEscaleraLegada());
    const sobre = paquetesConSobreV2(paquetesCrudo, {
      moneda: "USD",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    expect(sobre.version).toBe(2);
    expect(sobre.moneda).toBe("USD");
    expect(sobre.legado).toEqual(ESCALERA_LEGADA);
  });

  it("preserva la escalera que ya venía dentro de un sobre v2 anterior", () => {
    const primero = paquetesConSobreV2(ESCALERA_LEGADA, {
      moneda: "ARS",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    const segundo = paquetesConSobreV2(primero, {
      moneda: "USD",
      fiscal: { ...FISCAL, aplicaImpuesto: false },
      seleccion: seleccionV2(),
    });
    expect(segundo.legado).toEqual(ESCALERA_LEGADA);
    expect(segundo.moneda).toBe("USD");
    expect(segundo.fiscal.aplicaImpuesto).toBe(false);
  });

  it("sin escalera previa, el legado queda en null y nada se inventa", () => {
    const sobre = paquetesConSobreV2(null, {
      moneda: "ARS",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    expect(sobre.legado).toBeNull();
  });

  it("el legado NO puede venir del cliente: sale siempre de lo guardado", () => {
    const falsificado = {
      version: 2,
      moneda: "ARS" as const,
      fiscal: FISCAL,
      seleccion: seleccionV2(),
      legado: {
        confirmado: true,
        niveles: [{ id: "impulso", nombre: "FALSO", servicios: [], precio: 1 }],
      },
    };
    // La firma sólo acepta moneda, fiscal y selección: el `legado` del
    // cliente no tiene por dónde entrar, y el que se escribe es el de la base.
    const sobre = paquetesConSobreV2(ESCALERA_LEGADA, {
      moneda: falsificado.moneda,
      fiscal: falsificado.fiscal,
      seleccion: falsificado.seleccion,
    });
    expect(sobre.legado).toEqual(ESCALERA_LEGADA);
    expect(sobre.legado!.niveles[0]!.nombre).toBe("IMPULSO");
  });
});

describe("paquetesConEscaleraV1: el escritor viejo no destruye el sobre nuevo", () => {
  it("sin sobre v2 escribe la escalera tal cual, como antes de F2a", () => {
    expect(paquetesConEscaleraV1(null, ESCALERA_LEGADA)).toEqual(ESCALERA_LEGADA);
    expect(paquetesConEscaleraV1({ viejo: true }, ESCALERA_LEGADA)).toEqual(ESCALERA_LEGADA);
  });

  it("con sobre v2 la escalera entra como legado y la selección v2 sobrevive", () => {
    const sobre = paquetesConSobreV2(null, {
      moneda: "USD",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    const resultado = paquetesConEscaleraV1(sobre, ESCALERA_LEGADA) as SobreComercialV2;
    expect(resultado.version).toBe(2);
    expect(resultado.legado).toEqual(ESCALERA_LEGADA);
    expect(resultado.moneda).toBe("USD");
    expect(resultado.seleccion.lineas.find((l) => l.lineaId === "meta_ads")!.seleccionada).toBe(
      true,
    );
  });

  it("los dos escritores alternados no se pisan nunca", () => {
    let columna: unknown = null;
    columna = paquetesConEscaleraV1(columna, ESCALERA_LEGADA);
    columna = paquetesConSobreV2(columna, {
      moneda: "ARS",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    columna = paquetesConEscaleraV1(columna, ESCALERA_LEGADA);
    columna = paquetesConSobreV2(columna, {
      moneda: "USD",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });

    const sobre = normalizarSobreComercialV2(columna)!;
    expect(sobre.moneda).toBe("USD");
    expect(sobre.legado).toEqual(ESCALERA_LEGADA);
    expect(escaleraConfirmadaDesdeColumna(columna)).toEqual(ESCALERA_LEGADA);
  });
});

describe("la columna: raíz intacta, cero migraciones", () => {
  it("la raíz sigue siendo { propuesta, paquetes }: el sobre v2 va ADENTRO de `paquetes`", () => {
    const { propuestaCruda, paquetesCrudo } = separarContenidoGuardado(columnaConEscaleraLegada());
    const sobre = paquetesConSobreV2(paquetesCrudo, {
      moneda: "ARS",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    const aGuardar = combinarContenidoGuardado({ propuestaCruda, paquetesCrudo: sobre });

    expect(Object.keys(aGuardar).sort()).toEqual(["paquetes", "propuesta"]);
    expect(aGuardar.paquetes).toHaveProperty("version", 2);
    expect(aGuardar).not.toHaveProperty("version");
    expect(aGuardar).not.toHaveProperty("seleccion");
  });

  it("escribir la selección v2 no toca la propuesta redactada por el modelo", () => {
    const redactada = { texto: "una propuesta larga y cara de regenerar" };
    const { propuestaCruda, paquetesCrudo } = separarContenidoGuardado(
      columnaConEscaleraLegada(redactada),
    );
    const aGuardar = combinarContenidoGuardado({
      propuestaCruda,
      paquetesCrudo: paquetesConSobreV2(paquetesCrudo, {
        moneda: "ARS",
        fiscal: FISCAL,
        seleccion: seleccionV2(),
      }),
    });
    expect(aGuardar.propuesta).toEqual(redactada);
  });

  it("todo el sobre sobrevive el viaje por JSONB", () => {
    const sobre = paquetesConSobreV2(ESCALERA_LEGADA, {
      moneda: "USD",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    const columna = combinarContenidoGuardado({ propuestaCruda: null, paquetesCrudo: sobre });
    const desdeLaBase = JSON.parse(JSON.stringify(columna));
    const { paquetesCrudo } = separarContenidoGuardado(desdeLaBase);
    expect(normalizarSobreComercialV2(paquetesCrudo)).toEqual(sobre);
    expect(escaleraConfirmadaDesdeColumna(paquetesCrudo)).toEqual(ESCALERA_LEGADA);
  });
});

describe("Q9: la exportación se bloquea sin configuración fiscal confirmada", () => {
  it("con selección y fiscal confirmada, exportable", () => {
    const sobre = paquetesConSobreV2(null, {
      moneda: "ARS",
      fiscal: FISCAL,
      seleccion: seleccionV2(),
    });
    expect(seleccionV2Exportable(sobre)).toBe(true);
  });

  it("sin fiscal confirmada, bloqueada aunque haya líneas seleccionadas", () => {
    const sobre = paquetesConSobreV2(null, {
      moneda: "ARS",
      fiscal: { ...FISCAL, confirmado: false },
      seleccion: seleccionV2(),
    });
    expect(seleccionV2Exportable(sobre)).toBe(false);
  });

  it("sin ninguna línea seleccionada, bloqueada aunque la fiscal esté confirmada", () => {
    const vacia: SeleccionComercialV2 = {
      nivel: "impulso",
      lineas: LINEAS_V2_IDS.map((id) => lineaVaciaV2(id)),
      agregados: [],
    };
    const sobre = paquetesConSobreV2(null, { moneda: "ARS", fiscal: FISCAL, seleccion: vacia });
    expect(seleccionV2Exportable(sobre)).toBe(false);
  });

  it("sin sobre, bloqueada", () => {
    expect(seleccionV2Exportable(null)).toBe(false);
  });
});

describe("REGRESIÓN F-2: la salida v1 no cambia al envolver en el sobre v2", () => {
  const resultado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);

  function fila(propuesta: unknown): DiagnosticoAlmacenado {
    return {
      id: "diagnostico-regresion-f2",
      fecha: "2026-08-20",
      version: 2,
      datos: casoSnakeStore,
      derivados: resultado.derivados,
      estados_bloque: resultado.estados_bloque,
      fugas: resultado.fugas,
      oportunidad_total: resultado.oportunidad_total,
      propuesta,
    };
  }

  const antes = fila(columnaConEscaleraLegada());
  const despues = fila(
    combinarContenidoGuardado({
      propuestaCruda: { texto: "propuesta del modelo" },
      paquetesCrudo: paquetesConSobreV2(ESCALERA_LEGADA, {
        moneda: "USD",
        fiscal: FISCAL,
        seleccion: seleccionV2(),
      }),
    }),
  );

  it("1 · la escalera que lee la cadena documental es la misma", () => {
    const { paquetesCrudo: crudoAntes } = separarContenidoGuardado(antes.propuesta);
    const { paquetesCrudo: crudoDespues } = separarContenidoGuardado(despues.propuesta);
    expect(escaleraConfirmadaDesdeColumna(crudoDespues)).toEqual(
      escaleraConfirmadaDesdeColumna(crudoAntes),
    );
  });

  it("2 · el contrato documental es idéntico salvo el campo NUEVO `comercialV2`", () => {
    // La selección v2 agrega un campo que antes no existía; eso no es un
    // cambio de la salida v1, es información nueva que ninguna plantilla v1
    // lee. Lo que hay que probar es que NINGÚN otro campo se movió — y que
    // el campo nuevo aparece sólo del lado que tiene selección v2.
    for (const tipoDocumento of ["diagnostico", "proyeccion_90d", "propuesta"] as const) {
      const contextoAntes = buildDocumentContextDesdeDiagnostico({ fila: antes, tipoDocumento });
      const contextoDespues = buildDocumentContextDesdeDiagnostico({
        fila: despues,
        tipoDocumento,
      });

      const { comercialV2: v2Antes, ...restoAntes } = contextoAntes;
      const { comercialV2: v2Despues, ...restoDespues } = contextoDespues;

      expect(restoDespues).toEqual(restoAntes);
      expect(v2Antes).toBeNull();
      expect(v2Despues).not.toBeNull();
      // La escalera legada sigue siendo la misma en los dos.
      expect(contextoDespues.comercial).toEqual(contextoAntes.comercial);
      // Y la moneda del CLIENTE no se contagia de la propuesta en USD.
      expect(contextoDespues.cliente.moneda).toBe("ARS");
    }
  });

  it("3 · el modelo v1 armado es idéntico, serialización incluida", () => {
    for (const templateId of [
      "velocentum-diagnostico/v1",
      "velocentum-proyeccion-90d/v1",
      "velocentum-propuesta/v1",
      "velocentum-proyeccion-propuesta/v1",
    ] as const) {
      const modeloAntes = buildDocumentModelDesdeDiagnostico(antes, templateId);
      const modeloDespues = buildDocumentModelDesdeDiagnostico(despues, templateId);
      expect(modeloDespues).toEqual(modeloAntes);
      expect(JSON.stringify(modeloDespues)).toBe(JSON.stringify(modeloAntes));
    }
  });

  it("4 · el precio del nivel legado sigue publicándose en la propuesta v1", () => {
    const contexto = buildDocumentContextDesdeDiagnostico({
      fila: despues,
      tipoDocumento: "propuesta",
    });
    expect(contexto.comercial).not.toBeNull();
    expect(contexto.comercial!.niveles).toHaveLength(2);
    expect(contexto.comercial!.niveles[0]!.precio).toMatchObject({
      estado: "disponible",
      valor: 250000,
    });
  });

  it("5 · si el legado se perdiera, el documento v1 CAMBIARÍA — por eso la prueba 3 vale", () => {
    const sinLegado = fila(
      combinarContenidoGuardado({
        propuestaCruda: { texto: "propuesta del modelo" },
        paquetesCrudo: {
          version: 2,
          moneda: "ARS",
          fiscal: FISCAL,
          seleccion: seleccionV2(),
          legado: null,
        },
      }),
    );
    const modeloPerdido = buildDocumentModelDesdeDiagnostico(sinLegado, "velocentum-propuesta/v1");
    const modeloIntacto = buildDocumentModelDesdeDiagnostico(antes, "velocentum-propuesta/v1");
    expect(modeloPerdido).not.toEqual(modeloIntacto);
  });
});
