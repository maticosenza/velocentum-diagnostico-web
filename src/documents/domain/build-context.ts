import type { Fuga, ResultadoCalculo } from "../../lib/calculo-diagnostico";
import { productosCargados } from "../../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { calcularEscenarios90d, umbralDispersionDe } from "../../lib/escenarios-90d";
import { impactosDeFuga, type TipoImpactoClasificado } from "../../lib/impacto-economico";
import { mapearHallazgos } from "../../lib/propuesta";
import { escenariosDocumento } from "./escenarios-90d";
import { construirResumenComercial } from "./resumen-comercial";
import {
  envioBloqueaRentabilidad,
  resolverPoliticaEnvio,
  valorCalculado,
  valorNoAplica,
  valorRetenido,
} from "./publishing-policy";
import type {
  ConfianzaDocumento,
  DocumentContextV1,
  Evidencia,
  HallazgoDocumento,
  PoliticaEnvio,
  RestriccionDocumento,
  ServicioDocumento,
  TipoDocumento,
  ValorPublicable,
} from "./types";

export type BuildDocumentContextArgs = {
  datos: DatosDiagnostico;
  resultado: ResultadoCalculo;
  diagnostico: {
    id: string;
    version: number;
    fecha: string;
  };
  tipoDocumento?: TipoDocumento;
  templateVersion?: string;
  rulesetVersion?: string;
};

const FUENTE_DIAGNOSTICO = "diagnostico_cliente";
const PERIODO_MENSUAL = "mensual";

function finito(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function limitarCobertura(valor: number): number {
  return Math.max(0, Math.min(100, valor));
}

function evidenciaDeclarada<T>(valor: T | null | undefined, motivo: string): Evidencia<T> {
  if (valor === null || valor === undefined || (typeof valor === "string" && valor.trim() === "")) {
    return { estado: "no_disponible", valor: null, motivo };
  }
  return {
    estado: "declarado",
    valor,
    fuente: FUENTE_DIAGNOSTICO,
    periodo: PERIODO_MENSUAL,
  };
}

function publicarNumero(args: {
  valor: number | null | undefined;
  evidenciaIds: string[];
  motivo: string;
  confianza?: Exclude<ConfianzaDocumento, "bloqueada">;
}): ValorPublicable<number> {
  if (!finito(args.valor)) return valorRetenido(args.motivo);
  return valorCalculado({
    valor: args.valor,
    confianza: args.confianza ?? "media",
    evidenciaIds: args.evidenciaIds,
  });
}

function coberturaProductos(datos: DatosDiagnostico): number {
  return limitarCobertura(
    productosCargados(datos).reduce(
      (total, producto) => total + (finito(producto.pct) && producto.pct > 0 ? producto.pct : 0),
      0,
    ),
  );
}

/**
 * El adaptador documental nunca infiere la política nueva desde el monto legado.
 * El motor conserva ese monto para compatibilidad, pero el PDF debe esperar una
 * decisión explícita del cliente.
 */
export function politicaEnvioDocumento(
  datos: DatosDiagnostico,
  resultado: ResultadoCalculo,
): PoliticaEnvio {
  if (datos.absorbe_costo_envio !== true) {
    return resolverPoliticaEnvio({ estado: datos.absorbe_costo_envio ?? null });
  }

  const neto = resultado.derivados.envio_neto_vendedor;
  return resolverPoliticaEnvio({
    estado: true,
    costoNeto: finito(neto)
      ? {
          estado: "declarado",
          valor: neto,
          fuente: FUENTE_DIAGNOSTICO,
          periodo: PERIODO_MENSUAL,
        }
      : null,
  });
}

function restriccionesDocumento(args: {
  resultado: ResultadoCalculo;
  envio: PoliticaEnvio;
  coberturaCanales: number;
  coberturaProductos: number;
}): RestriccionDocumento[] {
  const restricciones: RestriccionDocumento[] = [];

  if (args.resultado.derivados.cobertura_canales > 100) {
    restricciones.push({
      id: "mix_canales_invalido",
      etiqueta: "Mix de canales inconsistente",
      detalle: "Los porcentajes declarados por canal superan el 100%.",
      bloquea: ["rentabilidad", "escenario", "escalamiento"],
    });
  } else if (args.coberturaCanales < 100) {
    restricciones.push({
      id: "cobertura_canales_parcial",
      etiqueta: "Cobertura de canales parcial",
      detalle: `El mix conocido cubre ${args.coberturaCanales}% de la facturación.`,
      bloquea: ["rentabilidad", "escenario"],
    });
  }

  if (args.coberturaProductos < 100) {
    restricciones.push({
      id: "cobertura_productos_parcial",
      etiqueta: "Muestra de productos parcial",
      detalle: `Los productos relevados representan ${args.coberturaProductos}% de la facturación.`,
      bloquea: ["rentabilidad", "escenario"],
    });
  }

  if (envioBloqueaRentabilidad(args.envio)) {
    restricciones.push({
      id: "politica_envio_no_confirmada",
      etiqueta: "Política de envío sin confirmar",
      detalle:
        "El cálculo legado puede existir, pero la rentabilidad no se publica hasta confirmar si el vendedor absorbe el costo y cuál es el neto.",
      bloquea: ["rentabilidad", "escenario"],
    });
  }

  const contradiccion = args.resultado.contradiccion_margen;
  if (contradiccion && contradiccion.nivel !== "sin_alerta") {
    restricciones.push({
      id: "contradiccion_margen",
      etiqueta: "Margen declarado y calculado no coinciden",
      detalle: contradiccion.confirmado
        ? "La contradicción fue confirmada y bloquea las cifras dependientes del margen."
        : "La diferencia requiere validación antes de presentar conclusiones de rentabilidad.",
      bloquea: contradiccion.bloquea
        ? ["rentabilidad", "escenario", "escalamiento"]
        : ["rentabilidad"],
    });
  }

  return restricciones;
}

/**
 * De qué magnitud económica es el monto de una fuga (corrección aprobada
 * 2026-08-21, punto 3). `fuga.monto` (legado) nunca representó facturación
 * incremental: por diseño, siempre fue contribución (tramos de funnel) o
 * ahorro publicitario (gasto no rentable/sobrefragmentación) — facturación
 * incremental es una magnitud nueva sin análogo legado. Por eso esta
 * función busca sólo entre esos dos tipos, nunca entre los tres: si
 * buscara también facturación, un margen de exactamente 100% (facturación
 * == contribución) haría que el monto coincidiera con dos impactos
 * distintos, y cuál gane sería arbitrario. Restringir a contribución/ahorro
 * hace que, para cualquier fuga real, coincida con uno solo. `null` para
 * riesgos o montos legados sin clasificar (nunca adivina la magnitud de un
 * dato viejo).
 */
export function magnitudDeFuga(fuga: Fuga): TipoImpactoClasificado | null {
  if (!finito(fuga.monto)) return null;
  const impacto = impactosDeFuga(fuga).find(
    (i) =>
      (i.tipo === "contribucion_incremental" || i.tipo === "ahorro_publicitario") &&
      i.confianza !== "retenida" &&
      i.montoMensual === fuga.monto,
  );
  return impacto ? (impacto.tipo as TipoImpactoClasificado) : null;
}

function hallazgosDocumento(
  datos: DatosDiagnostico,
  resultado: ResultadoCalculo,
): { hallazgos: HallazgoDocumento[]; servicios: ServicioDocumento[] } {
  const mapeados = mapearHallazgos(
    datos,
    resultado.derivados,
    resultado.estados_bloque,
    resultado.fugas,
  );
  const idServicio = (nombre: string) =>
    nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  const servicios = Array.from(
    new Set(
      mapeados
        .map((hallazgo) => hallazgo.servicio)
        .filter((nombre): nombre is string => nombre !== null),
    ),
  ).map((nombre) => ({ id: idServicio(nombre), nombre, alcance: [] }));
  const hallazgos: HallazgoDocumento[] = mapeados.map((hallazgo) => {
    const fuga = resultado.fugas.find(
      (candidata) =>
        candidata.id === hallazgo.id && candidata.calculable && finito(candidata.monto),
    );
    return {
      id: hallazgo.id,
      titulo: hallazgo.titulo,
      capa: hallazgo.capa,
      prioridad: fuga && (fuga.monto as number) > 0 ? "alta" : "media",
      confianza: resultado.margen_bloqueado ? "baja" : "media",
      evidenciaIds: fuga ? [`fuga_${fuga.id}`] : [],
      monto: fuga
        ? valorCalculado({
            valor: fuga.monto as number,
            confianza: fuga.confianza === "parcial" ? "baja" : "media",
            evidenciaIds: [`fuga_${fuga.id}`],
          })
        : null,
      magnitud: fuga ? magnitudDeFuga(fuga) : null,
      servicioId: hallazgo.servicio ? idServicio(hallazgo.servicio) : null,
    };
  });
  return { hallazgos, servicios };
}

/**
 * `null` para un diagnóstico: esa pieza no proyecta (corrección aprobada
 * 2026-08-21, punto 3) — el contrato ni siquiera lo carga, para que no
 * pueda filtrarse a esa plantilla por accidente en el futuro.
 */
function resumenComercialDocumento(args: {
  datos: DatosDiagnostico;
  resultado: ResultadoCalculo;
  confianza: ConfianzaDocumento;
  envio: PoliticaEnvio;
  tipoDocumento: TipoDocumento;
}): DocumentContextV1["resumenComercial"] {
  if (args.tipoDocumento === "diagnostico") return null;
  return construirResumenComercial({
    escenariosCalculados: calcularEscenarios90d(args.datos, args.resultado),
    escenariosDocumento: escenariosDocumento(args.datos, args.resultado, args.confianza, args.envio),
    umbralDispersion: umbralDispersionDe({}),
  });
}

/**
 * Traduce el diagnóstico ya calculado al contrato común de documentos.
 * No recalcula el negocio, no genera escenarios y no completa ausencias con cero.
 */
export function buildDocumentContext(args: BuildDocumentContextArgs): DocumentContextV1 {
  const { datos, resultado } = args;
  const coberturaCanales = limitarCobertura(resultado.derivados.cobertura_canales);
  const productos = coberturaProductos(datos);
  const general = Math.min(coberturaCanales, productos);
  const envio = politicaEnvioDocumento(datos, resultado);
  const restricciones = restriccionesDocumento({
    resultado,
    envio,
    coberturaCanales,
    coberturaProductos: productos,
  });
  const contradiccion = resultado.contradiccion_margen;
  const salidaHallazgos = hallazgosDocumento(datos, resultado);
  const confianza: ConfianzaDocumento = resultado.margen_bloqueado
    ? "bloqueada"
    : general === 100 && restricciones.length === 0
      ? "alta"
      : general >= 60
        ? "media"
        : "baja";
  const confianzaPublicable = confianza === "bloqueada" ? "baja" : confianza;

  const evidencia: Record<string, Evidencia<unknown>> = {
    facturacion_mensual: evidenciaDeclarada(
      datos.facturacion_mensual,
      "No se declaró la facturación mensual.",
    ),
    ticket_promedio: evidenciaDeclarada(datos.ticket_promedio, "No se declaró el ticket promedio."),
    inversion_meta: evidenciaDeclarada(datos.inversion_meta, "No se declaró inversión en Meta."),
    inversion_google: evidenciaDeclarada(
      datos.inversion_google,
      "No se declaró inversión en Google.",
    ),
    product_ads_activo: evidenciaDeclarada(
      datos.ml_product_ads,
      "No se confirmó si usa Product Ads.",
    ),
    inversion_product_ads: evidenciaDeclarada(
      datos.ml_inversion_product_ads,
      "No se declaró inversión en Product Ads.",
    ),
    ventas_product_ads: evidenciaDeclarada(
      datos.ml_ventas_product_ads,
      "No se declararon ventas atribuidas a Product Ads.",
    ),
    mix_canales: evidenciaDeclarada(
      (datos.canal_tienda_pct !== null && datos.canal_tienda_pct !== undefined) ||
        (datos.canal_ml_pct !== null && datos.canal_ml_pct !== undefined) ||
        datos.canal_tienda_no_aplica === true ||
        datos.canal_ml_no_aplica === true
        ? {
            tienda: datos.canal_tienda_pct,
            mercadoLibre: datos.canal_ml_pct,
            tiendaNoAplica: datos.canal_tienda_no_aplica === true,
            mercadoLibreNoAplica: datos.canal_ml_no_aplica === true,
          }
        : null,
      "No se declaró el mix de canales.",
    ),
    productos_muestra: evidenciaDeclarada(
      productosCargados(datos).length > 0
        ? productosCargados(datos).map((producto) => ({
            nombre: producto.nombre,
            costo: producto.costo,
            precio: producto.precio,
            participacion: producto.pct,
          }))
        : null,
      "No se relevaron productos.",
    ),
    politica_envio: evidenciaDeclarada(
      datos.absorbe_costo_envio,
      "No se confirmó si el vendedor absorbe el envío.",
    ),
    margen_declarado: evidenciaDeclarada(
      datos.margen_declarado_min === null || datos.margen_declarado_min === undefined
        ? null
        : {
            minimo: datos.margen_declarado_min,
            maximo: datos.margen_declarado_max,
            confirmado: datos.margen_declarado_confirmado === true,
          },
      "No se declaró un margen para contrastar.",
    ),
    contradiccion_margen: contradiccion
      ? {
          estado: "verificado",
          valor: contradiccion,
          fuente: "calcularDiagnostico",
          periodo: PERIODO_MENSUAL,
        }
      : {
          estado: "no_disponible",
          valor: null,
          motivo: "No existe un margen declarado comparable.",
        },
  };

  for (const fuga of resultado.fugas) {
    if (!fuga.calculable || !finito(fuga.monto)) continue;
    evidencia[`fuga_${fuga.id}`] = {
      estado: "verificado",
      valor: fuga.monto,
      fuente: "calcularDiagnostico",
      periodo: PERIODO_MENSUAL,
    };
  }

  const margenPublicable = !resultado.margen_bloqueado && !envioBloqueaRentabilidad(envio);
  const coberturaCompleta = coberturaCanales === 100 && productos === 100;
  const margenTotal =
    margenPublicable && coberturaCompleta
      ? publicarNumero({
          valor: resultado.derivados.margen_contribucion,
          evidenciaIds: ["productos_muestra", "mix_canales", "politica_envio"],
          motivo: "No se pudo calcular el margen total.",
          confianza: confianzaPublicable,
        })
      : valorRetenido<number>(
          resultado.margen_bloqueado
            ? "Una contradicción crítica confirmada bloquea el margen."
            : !margenPublicable
              ? "La política de envío no está confirmada."
              : "La cobertura de canales o productos es parcial.",
        );
  const margenMuestra = margenPublicable
    ? publicarNumero({
        valor: resultado.derivados.margen_muestra,
        evidenciaIds: ["productos_muestra", "mix_canales", "politica_envio"],
        motivo: "No se pudo calcular el margen de la muestra.",
        confianza: coberturaCompleta ? "alta" : "media",
      })
    : valorRetenido<number>(
        resultado.margen_bloqueado
          ? "Una contradicción crítica confirmada bloquea el margen."
          : "La política de envío no está confirmada.",
      );

  const tipoDocumento = args.tipoDocumento ?? "diagnostico";

  return {
    schemaVersion: "document-context/1",
    templateVersion: args.templateVersion ?? "velocentum-diagnostico/v1",
    rulesetVersion: args.rulesetVersion ?? "calculo/2.5",
    tipoDocumento,
    diagnostico: args.diagnostico,
    cliente: {
      nombre: datos.nombre_tienda,
      vertical: datos.vertical.trim() || null,
      moneda: "ARS",
      periodo: "mensual",
    },
    modalidad: { minorista: true, mayorista: false },
    cobertura: {
      general,
      canales: coberturaCanales,
      productos,
      confianza,
    },
    evidencia,
    actual: {
      facturacion: publicarNumero({
        valor: datos.facturacion_mensual,
        evidenciaIds: ["facturacion_mensual"],
        motivo: "No se declaró la facturación mensual.",
      }),
      ticket: publicarNumero({
        valor: datos.ticket_promedio,
        evidenciaIds: ["ticket_promedio"],
        motivo: "No se declaró el ticket promedio.",
      }),
      pedidos: publicarNumero({
        valor: resultado.derivados.pedidos_mensuales,
        evidenciaIds: ["facturacion_mensual", "ticket_promedio"],
        motivo: "Faltan facturación o ticket para calcular pedidos.",
      }),
      margenTotal,
      margenMuestra,
      inversionTotal: publicarNumero({
        valor: resultado.derivados.inversion_publicitaria_total,
        evidenciaIds: ["inversion_meta", "inversion_google", "inversion_product_ads"],
        motivo: "No se declaró inversión publicitaria.",
      }),
      merTienda:
        datos.canal_tienda_no_aplica === true
          ? valorNoAplica("El cliente declaró que no vende por tienda propia.")
          : publicarNumero({
              valor: resultado.derivados.mer_tienda_propia,
              evidenciaIds: ["mix_canales", "inversion_meta", "inversion_google"],
              motivo: "Faltan facturación o inversión del perímetro de tienda propia.",
            }),
      merMarketplace:
        datos.canal_ml_no_aplica === true || datos.vende_mercado_libre === false
          ? valorNoAplica("El cliente declaró que no vende por Mercado Libre.")
          : publicarNumero({
              valor: resultado.derivados.mer_marketplace,
              evidenciaIds: ["mix_canales", "inversion_product_ads"],
              motivo: "Faltan facturación o inversión del perímetro de marketplace.",
            }),
      roasProductAds:
        datos.ml_product_ads === false
          ? valorNoAplica("El cliente declaró que no usa Product Ads.")
          : publicarNumero({
              valor: resultado.derivados.roas_product_ads,
              evidenciaIds: ["ventas_product_ads", "inversion_product_ads"],
              motivo: "Faltan ventas atribuidas o inversión de Product Ads.",
            }),
    },
    envio,
    hallazgos: salidaHallazgos.hallazgos,
    escenarios90d: escenariosDocumento(datos, resultado, confianza, envio),
    resumenComercial: resumenComercialDocumento({ datos, resultado, confianza, envio, tipoDocumento }),
    roadmap: [],
    servicios: salidaHallazgos.servicios,
    comercial: null,
    restricciones,
    metodologia: [],
  };
}
