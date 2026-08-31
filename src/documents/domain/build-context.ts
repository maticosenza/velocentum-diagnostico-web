import type { EstadoBloque, Fuga, ResultadoCalculo } from "../../lib/calculo-diagnostico";
import { inversionCanal, productosCargados } from "../../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { calcularEscenarios90d, umbralDispersionDe } from "../../lib/escenarios-90d";
import { impactosDeFuga, type TipoImpactoClasificado } from "../../lib/impacto-economico";
import { mapearHallazgos } from "../../lib/propuesta";
import type { EscaleraPaquetesConfirmada } from "../../lib/paquetes";
import { NOMBRES_NIVELES_DEFECTO, serviciosCanonicosDe } from "../../lib/paquetes";
import {
  calcularTotalesV2,
  agregadosEfectivosV2,
  seleccionV2Exportable,
  totalDeLinea,
  type SobreComercialV2,
} from "../../lib/seleccion-comercial-v2";
import { lineaV2, type LineaId } from "../../lib/catalogo-v2";
import { ETIQUETA_UNIDAD_V2 } from "../../lib/precargas-v2";
import {
  LINEAS_CON_NOTA_DE_CONTENIDO,
  NOTA_AL_PIE_CONTENIDO,
  textoDeLinea,
} from "../../lib/textos-servicios-v2";
import { escenariosDocumento } from "./escenarios-90d";
import { construirResumenComercial } from "./resumen-comercial";
import {
  envioBloqueaRentabilidad,
  resolverPoliticaEnvio,
  valorCalculado,
  valorEvidenciaFaltante,
  valorNoAplica,
  valorRetenido,
} from "./publishing-policy";
import type {
  ConfianzaDocumento,
  DocumentContextV1,
  EtapaFunnelWebDocumento,
  EtapaRoadmap,
  Evidencia,
  FortalezaDocumento,
  FunnelWebDocumento,
  HallazgoDocumento,
  PoliticaEnvio,
  RestriccionDocumento,
  SeleccionComercial,
  GrupoInversionDocumento,
  LineaComercialDocumento,
  OfertaComercialV2Documento,
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
  /**
   * Escalera de paquetes ya confirmada manualmente (decisión comercial 7).
   * `null`/ausente cuando no hay ninguna confirmación todavía: `comercial`
   * queda en `null` en ese caso, nunca se completa con un paquete inventado.
   */
  paquetesConfirmados?: EscaleraPaquetesConfirmada | null;
  /**
   * BV4 F2a: el sobre comercial v2 leído de `diagnostico.propuesta`.
   * `null`/ausente mientras no haya una selección v2 confirmada; en ese caso
   * `comercialV2` queda en `null` y el documento no cambia en nada.
   */
  sobreComercialV2?: SobreComercialV2 | null;
  configHallazgos?: ConfigHallazgos;
};

export type ConfigHallazgos = {
  umbral_prioridad_fuga_pct_facturacion?: number;
};

/**
 * Peso mínimo (como fracción de la facturación mensual) para que una fuga
 * en un negocio con la economía ya sana ("verde") siga en prioridad "alta".
 * Por defecto, 15%: una fuga individual por debajo de eso, cuando el MER ya
 * supera el objetivo (`breakeven_roas` con la reserva aplicada), es una
 * oportunidad de mejora, no una urgencia — mismo orden de magnitud que
 * `tope_fuga_individual` (25% por defecto, el tope de la red de seguridad),
 * pero más conservador porque acá el criterio no es "¿es creíble el
 * número?" sino "¿amerita la máxima urgencia en un negocio que ya funciona
 * bien?" (corrección 2026-08-23, incoherencia #2 del loop nocturno del
 * 2026-08-22: ver docs/loop-nocturno-2026-08-22-escenarios.md, escenario 5
 * — 39% de la facturación en fugas "alta" sobre un negocio sano).
 */
export const UMBRAL_PRIORIDAD_FUGA_PCT_FACTURACION_DEFECTO = 0.15;

function umbralPrioridadFugaDe(cfg: ConfigHallazgos): number {
  return typeof cfg.umbral_prioridad_fuga_pct_facturacion === "number"
    ? cfg.umbral_prioridad_fuga_pct_facturacion
    : UMBRAL_PRIORIDAD_FUGA_PCT_FACTURACION_DEFECTO;
}

/**
 * La prioridad de un hallazgo no depende sólo de si tiene un monto positivo:
 * también pondera cuánto pesa esa fuga sobre la facturación y qué tan sano
 * está el bloque económico. `margen_negativo` es la única excepción
 * explícita: siempre "alta", por encima de cualquier otro hallazgo (ver
 * `mapearHallazgos` en `src/lib/propuesta.ts`, que lo empuja primero).
 */
function prioridadDeHallazgo(args: {
  hallazgoId: string;
  fuga: Fuga | undefined;
  facturacionMensual: number | null;
  estadoEconomia: EstadoBloque;
  umbral: number;
}): "alta" | "media" {
  if (args.hallazgoId === "margen_negativo") return "alta";

  const base: "alta" | "media" =
    args.fuga && finito(args.fuga.monto) && (args.fuga.monto as number) > 0 ? "alta" : "media";
  if (base !== "alta") return base;

  if (
    args.estadoEconomia === "verde" &&
    args.facturacionMensual !== null &&
    args.facturacionMensual > 0 &&
    args.fuga
  ) {
    const peso = (args.fuga.monto as number) / args.facturacionMensual;
    if (peso < args.umbral) return "media";
  }

  return "alta";
}

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

/**
 * Bloque 3 Funcional, D4 Eje 2: variante de `publicarNumero` para campos
 * cuya ausencia es SIEMPRE "el dato de entrada no está" — nunca una regla
 * de negocio. `datoFaltante` es el NOMBRE del dato (no una oración), para
 * que el copy D4 "Falta [dato] para realizar este cálculo" lea natural.
 * Ver `docs/funcional/contrato-bloque-3.md` sección 1.
 */
function publicarNumeroOFaltante(args: {
  valor: number | null | undefined;
  evidenciaIds: string[];
  datoFaltante: string;
  confianza?: Exclude<ConfianzaDocumento, "bloqueada">;
}): ValorPublicable<number> {
  if (!finito(args.valor)) return valorEvidenciaFaltante(args.datoFaltante);
  return valorCalculado({
    valor: args.valor,
    confianza: args.confianza ?? "media",
    evidenciaIds: args.evidenciaIds,
  });
}

/**
 * DHB-1: un ratio con denominador de inversión declarada en cero es
 * `no_aplica` (matemáticamente no formable), nunca `retenido` ni
 * `evidencia_faltante`. El discriminador se calcula desde el dato CRUDO
 * (`inversionCanal`, ya distingue `0` declarado de `null` ausente en
 * `calculo-diagnostico.ts`) — nunca desde el ratio ya nulo, que colapsa
 * ambos casos. Ver `docs/funcional/contrato-bloque-3.md` sección 1.
 */
function publicarRatioDeInversion(args: {
  valorRatio: number | null | undefined;
  denominadorInversion: number | null;
  evidenciaIds: string[];
  datoFaltante: string;
  motivoNoAplica: string;
}): ValorPublicable<number> {
  if (args.denominadorInversion === 0) return valorNoAplica(args.motivoNoAplica);
  return publicarNumeroOFaltante({
    valor: args.valorRatio,
    evidenciaIds: args.evidenciaIds,
    datoFaltante: args.datoFaltante,
  });
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
 * DA-4/R-07 (Bloque 3 Funcional): fortalezas determinísticas, sólo para
 * `economia` y `funnel_web` — las dos dimensiones de `EstadosBloque` que
 * exponen tanto su métrica real como su umbral como campos de
 * `resultado.derivados`. `medicion`/`cuenta`/`creativos` quedan
 * explícitamente sin resolver (ver `docs/funcional/contrato-bloque-3.md`
 * sección 6) — nunca se fabrica una fortaleza para ellas.
 */
function fortalezasDocumento(resultado: ResultadoCalculo): FortalezaDocumento[] {
  const fortalezas: FortalezaDocumento[] = [];
  const d = resultado.derivados;

  if (
    resultado.estados_bloque.economia === "verde" &&
    finito(d.mer_actual) &&
    finito(d.breakeven_roas)
  ) {
    fortalezas.push({
      id: "economia",
      etiqueta: "Economía",
      metrica: valorCalculado({ valor: d.mer_actual, confianza: "alta", evidenciaIds: [] }),
      umbral: valorCalculado({ valor: d.breakeven_roas, confianza: "alta", evidenciaIds: [] }),
      unidad: "ratio",
    });
  }

  if (
    resultado.estados_bloque.funnel_web === "verde" &&
    finito(d.cr_tienda) &&
    finito(d.cr_umbral_verde)
  ) {
    fortalezas.push({
      id: "funnel_web",
      etiqueta: "Rendimiento web",
      metrica: valorCalculado({ valor: d.cr_tienda, confianza: "alta", evidenciaIds: [] }),
      umbral: valorCalculado({ valor: d.cr_umbral_verde, confianza: "alta", evidenciaIds: [] }),
      unidad: "porcentaje",
    });
  }

  return fortalezas;
}

const ETIQUETA_ETAPA_FUNNEL: Record<EtapaFunnelWebDocumento["id"], string> = {
  visitas: "Visitas",
  agregados_carrito: "Agregados al carrito",
  checkouts_iniciados: "Checkouts iniciados",
  compras: "Compras",
};

/**
 * R-09 (Bloque Visual 3, HEAD 82bb66e): funnel web de tienda propia,
 * forma tabular. Lee sin modificar `resultado.derivados.funnel`
 * (`FunnelDerivado`) — nunca deriva ni estima una tasa que el motor no
 * exponga. `null` cuando el motor marca `no_aplica`, `sin_datos` o
 * `error` (mismo criterio que cualquier otro bloque opcional: nunca un
 * bloque vacío con encabezado).
 */
function funnelWebDocumento(resultado: ResultadoCalculo): FunnelWebDocumento | null {
  const f = resultado.derivados.funnel;
  if (f.estado === "no_aplica" || f.estado === "sin_datos" || f.estado === "error") return null;

  const tasa = (v: number | null): ValorPublicable<number> =>
    finito(v)
      ? valorCalculado({ valor: v, confianza: "alta", evidenciaIds: [] })
      : valorNoAplica("Este cálculo no corresponde a este caso");
  const conteo = (v: number | null): ValorPublicable<number> =>
    finito(v)
      ? valorCalculado({ valor: v, confianza: "alta", evidenciaIds: [] })
      : valorEvidenciaFaltante("Falta este dato para completar la etapa.");

  const etapa = (
    id: EtapaFunnelWebDocumento["id"],
    valor: number | null,
    conversion: ValorPublicable<number> | null,
  ): EtapaFunnelWebDocumento => ({
    id,
    etiqueta: ETIQUETA_ETAPA_FUNNEL[id],
    valor: conteo(valor),
    conversion,
  });

  const etapas: EtapaFunnelWebDocumento[] = f.desglosado
    ? [
        etapa("visitas", f.visitas, null),
        etapa("agregados_carrito", f.agregados_carrito, tasa(f.p_carrito_dado_visita)),
        etapa("checkouts_iniciados", f.checkouts_iniciados, tasa(f.p_checkout_dado_carrito)),
        etapa("compras", f.compras, tasa(f.p_compra_dado_checkout)),
      ]
    : [etapa("visitas", f.visitas, null), etapa("compras", f.compras, null)];

  return {
    desglosado: f.desglosado,
    etapas,
    conversionGlobal: tasa(f.cr_global),
  };
}

/**
 * DHB-3/E-18 (Bloque 3 Funcional): roadmap 30/60/90 determinístico. Vacío
 * sin selección comercial confirmada — nunca se completa con contenido
 * inventado. Fuentes únicas: `hallazgos` (ya priorizados), los servicios
 * de `comercial.niveles[]` (con sus `hallazgoIds` de justificación, ya
 * existentes) y `restricciones` (para el plan de validación de la etapa
 * 90). Reparto: hallazgo "alta" ligado a un servicio seleccionado → etapa
 * 30; "media" ligado a un servicio seleccionado → etapa 60; servicio
 * seleccionado sin ningún hallazgo "alta" asociado + las restricciones
 * vigentes → etapa 90. Cada acción es literal (título de hallazgo, nombre
 * de servicio o etiqueta de restricción), nunca texto redactado. Ver
 * `docs/funcional/contrato-bloque-3.md` sección 4.
 */
export function roadmapDocumento(
  hallazgos: HallazgoDocumento[],
  comercial: SeleccionComercial | null,
  restricciones: RestriccionDocumento[],
): EtapaRoadmap[] {
  if (comercial === null) return [];

  const hallazgosPorId = new Map(hallazgos.map((h) => [h.id, h]));
  const serviciosSeleccionados = new Map<string, { servicio: string; hallazgoIds: string[] }>();
  for (const nivel of comercial.niveles) {
    for (const servicio of nivel.servicios) {
      const existente = serviciosSeleccionados.get(servicio.servicio);
      if (existente) {
        existente.hallazgoIds.push(...servicio.hallazgoIds);
      } else {
        serviciosSeleccionados.set(servicio.servicio, {
          servicio: servicio.servicio,
          hallazgoIds: [...servicio.hallazgoIds],
        });
      }
    }
  }

  const acciones30: { accion: string; origen: string }[] = [];
  const acciones60: { accion: string; origen: string }[] = [];
  const serviciosConHallazgoAlta = new Set<string>();

  for (const servicio of serviciosSeleccionados.values()) {
    for (const hallazgoId of servicio.hallazgoIds) {
      const hallazgo = hallazgosPorId.get(hallazgoId);
      if (!hallazgo) continue;
      if (hallazgo.prioridad === "alta") {
        acciones30.push({ accion: hallazgo.titulo, origen: `el hallazgo "${hallazgo.titulo}"` });
        serviciosConHallazgoAlta.add(servicio.servicio);
      } else if (hallazgo.prioridad === "media") {
        acciones60.push({ accion: hallazgo.titulo, origen: `el hallazgo "${hallazgo.titulo}"` });
      }
    }
  }

  const acciones90: { accion: string; origen: string }[] = [];
  for (const servicio of serviciosSeleccionados.values()) {
    if (!serviciosConHallazgoAlta.has(servicio.servicio)) {
      acciones90.push({ accion: servicio.servicio, origen: `el servicio "${servicio.servicio}"` });
    }
  }
  for (const restriccion of restricciones) {
    acciones90.push({
      accion: restriccion.etiqueta,
      origen: `la restricción "${restriccion.etiqueta}"`,
    });
  }

  const etapas: EtapaRoadmap[] = [];
  const agregarEtapa = (
    id: string,
    etiqueta: string,
    desdeDia: number,
    hastaDia: number,
    items: { accion: string; origen: string }[],
  ) => {
    if (items.length === 0) return;
    etapas.push({
      id,
      etiqueta,
      desdeDia,
      hastaDia,
      acciones: items.map((i) => i.accion),
      resultadoEsperado: `Avance sobre ${items.map((i) => i.origen).join(", ")}.`,
    });
  };
  agregarEtapa("etapa_30", "Días 1 a 30", 0, 30, acciones30);
  agregarEtapa("etapa_60", "Días 31 a 60", 31, 60, acciones60);
  agregarEtapa("etapa_90", "Días 61 a 90", 61, 90, acciones90);
  return etapas;
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
  cfg: ConfigHallazgos = {},
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
  const umbralPrioridad = umbralPrioridadFugaDe(cfg);
  const facturacionMensual = finito(datos.facturacion_mensual) ? datos.facturacion_mensual : null;
  const hallazgos: HallazgoDocumento[] = mapeados.map((hallazgo) => {
    const fuga = resultado.fugas.find(
      (candidata) =>
        candidata.id === hallazgo.id && candidata.calculable && finito(candidata.monto),
    );
    return {
      id: hallazgo.id,
      titulo: hallazgo.titulo,
      capa: hallazgo.capa,
      prioridad: prioridadDeHallazgo({
        hallazgoId: hallazgo.id,
        fuga,
        facturacionMensual,
        estadoEconomia: resultado.estados_bloque.economia,
        umbral: umbralPrioridad,
      }),
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
      servicioIds: serviciosCanonicosDe(hallazgo.servicio).map((nombreCanonico) =>
        idServicio(nombreCanonico),
      ),
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
    escenariosDocumento: escenariosDocumento(
      args.datos,
      args.resultado,
      args.confianza,
      args.envio,
    ),
    umbralDispersion: umbralDispersionDe({}),
  });
}

/**
 * Traduce la escalera de paquetes ya confirmada (decisión comercial 7) al
 * contrato documental. `null` sin una confirmación explícita — el tipo de
 * origen (`EscaleraPaquetesConfirmada`) ya garantiza `confirmado: true`,
 * pero se revalida acá porque llega como dato persistido (JSON de la
 * columna `diagnostico.propuesta`), no como un valor construido en memoria.
 */
export function comercialDesdeEscalera(
  escalera: EscaleraPaquetesConfirmada | null | undefined,
): SeleccionComercial | null {
  if (!escalera || escalera.confirmado !== true || escalera.niveles.length === 0) return null;
  return {
    niveles: escalera.niveles.map((nivel) => ({
      id: nivel.id,
      nombre: nivel.nombre,
      servicios: nivel.servicios.map((servicio) => ({
        servicio: servicio.servicio,
        unidad: servicio.unidad,
        cantidad: servicio.cantidad,
        descripcion: servicio.descripcion,
        hallazgoIds: [...servicio.hallazgoIds],
      })),
      precio: publicarNumeroOFaltante({
        valor: nivel.precio,
        evidenciaIds: [],
        datoFaltante: "el precio de este nivel",
        confianza: "alta",
      }),
    })),
  };
}

const NOMBRE_NIVEL_V2: Record<string, string> = {
  impulso: NOMBRES_NIVELES_DEFECTO[0],
  traccion: NOMBRES_NIVELES_DEFECTO[1],
  escala: NOMBRES_NIVELES_DEFECTO[2],
};

const ETIQUETA_RUTA_V2: Record<string, string> = {
  b2c: "B2C",
  b2b: "B2B",
  ambas: "B2C y B2B",
};

const TITULO_GRUPO_V2 = {
  mensual: "Inversión mensual",
  unica: "Inversión inicial / pago único",
} as const;

/**
 * BV4 F2a etapa 5 — traduce el sobre comercial v2 al contrato documental.
 *
 * Los textos de servicio salen VERBATIM de `textos-servicios-v2.ts`; una
 * línea sin texto confirmado viaja con `textoPendiente: true` y sin
 * descripción, para que el renderer diga que falta en vez de rellenarla.
 *
 * Los precios sin cargar viajan como `evidencia_faltante`, igual que
 * cualquier otro dato ausente del contrato: nunca como cero.
 *
 * Q10: se emiten SIEMPRE los dos grupos y nunca uno que los combine. Q9: la
 * estructura fiscal es idéntica en ARS y en USD, y `pendiente` incorpora la
 * confirmación fiscal al mismo candado de exportación que ya existía.
 */
export function ofertaComercialDesdeSobreV2(
  sobre: SobreComercialV2 | null | undefined,
): OfertaComercialV2Documento | null {
  if (!sobre) return null;

  const totales = calcularTotalesV2(sobre.seleccion, sobre.fiscal);
  const seleccionadas = sobre.seleccion.lineas.filter((linea) => linea.seleccionada);

  const lineas: LineaComercialDocumento[] = seleccionadas.map((linea) => {
    const delCatalogo = lineaV2(linea.lineaId);
    const texto = textoDeLinea(linea.lineaId);
    const total = totalDeLinea(linea);
    const cantidad = linea.precio.modo === "unitario" ? linea.precio.cantidad : null;
    const unitario = linea.precio.modo === "unitario" ? linea.precio.precioUnitario : null;

    return {
      lineaId: linea.lineaId,
      nombre: delCatalogo.nombre,
      unidad: ETIQUETA_UNIDAD_V2[delCatalogo.unidad],
      cantidad,
      precioUnitario:
        linea.precio.modo === "unitario"
          ? publicarNumeroOFaltante({
              valor: unitario,
              evidenciaIds: [],
              datoFaltante: `el precio unitario de ${delCatalogo.nombre}`,
              confianza: "alta",
            })
          : null,
      totalLinea: publicarNumeroOFaltante({
        valor: total,
        evidenciaIds: [],
        datoFaltante: `el precio de ${delCatalogo.nombre}`,
        confianza: "alta",
      }),
      recurrencia: linea.recurrencia,
      ruta: linea.ruta ? (ETIQUETA_RUTA_V2[linea.ruta] ?? null) : null,
      descripcion: texto?.descripcion ?? null,
      entregables: texto ? [...texto.entregables] : [],
      exclusion: texto?.exclusion ?? null,
      notaContenido: LINEAS_CON_NOTA_DE_CONTENIDO.includes(linea.lineaId as LineaId)
        ? NOTA_AL_PIE_CONTENIDO
        : null,
      textoPendiente: texto === null,
    };
  });

  const grupos: GrupoInversionDocumento[] = (["mensual", "unica"] as const).map((id) => {
    const grupo = id === "mensual" ? totales.mensual : totales.unica;
    return {
      id,
      titulo: TITULO_GRUPO_V2[id],
      subtotalNeto: valorCalculado({
        valor: grupo.subtotalNeto,
        confianza: "alta",
        evidenciaIds: [],
      }),
      impuesto:
        grupo.impuesto === null
          ? null
          : valorCalculado({ valor: grupo.impuesto, confianza: "alta", evidenciaIds: [] }),
      porcentajeImpuesto: grupo.impuesto === null ? null : sobre.fiscal.porcentaje,
      total: valorCalculado({ valor: grupo.total, confianza: "alta", evidenciaIds: [] }),
    };
  });

  return {
    pendiente: !seleccionV2Exportable(sobre),
    moneda: sobre.moneda,
    nivel: NOMBRE_NIVEL_V2[sobre.seleccion.nivel] ?? sobre.seleccion.nivel,
    lineas,
    grupos,
    agregados: agregadosEfectivosV2(sobre.seleccion).map((a) => ({
      nombre: a.nombre,
      alcance: a.alcance,
    })),
    lineasSinPrecio: totales.lineasSinPrecio.map((id) => lineaV2(id).nombre),
  };
}

/**
 * Traduce el diagnóstico ya calculado al contrato común de documentos.
 * No recalcula el negocio, no genera escenarios y no completa ausencias con cero.
 */
export function buildDocumentContext(args: BuildDocumentContextArgs): DocumentContextV1 {
  const { datos, resultado } = args;
  const coberturaCanales = limitarCobertura(resultado.derivados.cobertura_canales);
  const productos = limitarCobertura(resultado.derivados.cobertura_productos);
  const general = Math.min(coberturaCanales, productos);
  const envio = politicaEnvioDocumento(datos, resultado);
  const comercial = comercialDesdeEscalera(args.paquetesConfirmados);
  const comercialV2 = ofertaComercialDesdeSobreV2(args.sobreComercialV2);
  const restricciones = restriccionesDocumento({
    resultado,
    envio,
    coberturaCanales,
    coberturaProductos: productos,
  });
  const contradiccion = resultado.contradiccion_margen;
  const salidaHallazgos = hallazgosDocumento(datos, resultado, args.configHallazgos ?? {});
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
      ? publicarNumeroOFaltante({
          valor: resultado.derivados.margen_contribucion,
          evidenciaIds: ["productos_muestra", "mix_canales", "politica_envio"],
          datoFaltante: "el detalle de productos o canales",
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
    ? publicarNumeroOFaltante({
        valor: resultado.derivados.margen_muestra,
        evidenciaIds: ["productos_muestra", "mix_canales", "politica_envio"],
        datoFaltante: "el detalle de productos o canales",
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
      // Q4: esta es la moneda de OPERACIÓN del cliente, la del diagnóstico,
      // y sigue siendo ARS. La moneda de la PROPUESTA es otra cosa y vive en
      // `comercialV2.moneda`: mezclarlas rotularía en dólares las cifras de
      // facturación, ticket y margen, que el motor calcula en pesos.
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
      facturacion: publicarNumeroOFaltante({
        valor: datos.facturacion_mensual,
        evidenciaIds: ["facturacion_mensual"],
        datoFaltante: "la facturación mensual",
      }),
      ticket: publicarNumeroOFaltante({
        valor: datos.ticket_promedio,
        evidenciaIds: ["ticket_promedio"],
        datoFaltante: "el ticket promedio",
      }),
      pedidos: publicarNumeroOFaltante({
        valor: resultado.derivados.pedidos_mensuales,
        evidenciaIds: ["facturacion_mensual", "ticket_promedio"],
        datoFaltante: "la facturación o el ticket para calcular pedidos",
      }),
      margenTotal,
      margenMuestra,
      inversionTotal: publicarNumeroOFaltante({
        valor: resultado.derivados.inversion_publicitaria_total,
        evidenciaIds: ["inversion_meta", "inversion_google", "inversion_product_ads"],
        datoFaltante: "la inversión publicitaria declarada",
      }),
      merTienda:
        datos.canal_tienda_no_aplica === true
          ? valorNoAplica("El cliente declaró que no vende por tienda propia.")
          : publicarRatioDeInversion({
              valorRatio: resultado.derivados.mer_tienda_propia,
              denominadorInversion: inversionCanal(datos, "tienda_propia"),
              evidenciaIds: ["mix_canales", "inversion_meta", "inversion_google"],
              datoFaltante: "la facturación o la inversión del perímetro de tienda propia",
              motivoNoAplica:
                "La inversión declarada de tienda propia es $0: el ratio no es formable.",
            }),
      merMarketplace:
        datos.canal_ml_no_aplica === true || datos.vende_mercado_libre === false
          ? valorNoAplica("El cliente declaró que no vende por Mercado Libre.")
          : publicarRatioDeInversion({
              valorRatio: resultado.derivados.mer_marketplace,
              denominadorInversion: inversionCanal(datos, "mercado_libre"),
              evidenciaIds: ["mix_canales", "inversion_product_ads"],
              datoFaltante: "la facturación o la inversión del perímetro de marketplace",
              motivoNoAplica:
                "La inversión declarada de Mercado Libre es $0: el ratio no es formable.",
            }),
      roasProductAds:
        datos.ml_product_ads === false
          ? valorNoAplica("El cliente declaró que no usa Product Ads.")
          : publicarRatioDeInversion({
              valorRatio: resultado.derivados.roas_product_ads,
              denominadorInversion: inversionCanal(datos, "mercado_libre"),
              evidenciaIds: ["ventas_product_ads", "inversion_product_ads"],
              datoFaltante: "las ventas atribuidas o la inversión de Product Ads",
              motivoNoAplica:
                "La inversión declarada de Product Ads es $0: el ratio no es formable.",
            }),
    },
    envio,
    hallazgos: salidaHallazgos.hallazgos,
    margenBloqueado: resultado.margen_bloqueado,
    fortalezas: fortalezasDocumento(resultado),
    funnelWeb: funnelWebDocumento(resultado),
    escenarios90d: escenariosDocumento(datos, resultado, confianza, envio),
    resumenComercial: resumenComercialDocumento({
      datos,
      resultado,
      confianza,
      envio,
      tipoDocumento,
    }),
    roadmap: roadmapDocumento(salidaHallazgos.hallazgos, comercial, restricciones),
    servicios: salidaHallazgos.servicios,
    comercial,
    comercialV2,
    restricciones,
    metodologia: [],
  };
}
