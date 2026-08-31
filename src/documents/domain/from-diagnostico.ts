/**
 * Puente entre el diagnóstico persistido y el contrato documental.
 *
 * Esta capa **no recalcula**. Reconstruye `ResultadoCalculo` a partir de lo que
 * el motor ya guardó, para que la vista previa y el PDF muestren exactamente las
 * mismas cifras que la pantalla de detalle. Cuando un campo persistido falta o
 * llega corrupto no se inventa un número: se degrada a la ausencia, que las
 * políticas de publicación traducen luego en restricción.
 */

import { redondear } from "../../lib/dinero";
import type {
  Derivados,
  EstadoBloque,
  EstadosBloque,
  Fuga,
  ResultadoCalculo,
} from "../../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { separarContenidoGuardado } from "../../lib/contenido-propuesta";
import { escaleraConfirmadaDesdeColumna } from "../../lib/seleccion-comercial-v2";
import { buildDocumentContext } from "./build-context";
import type { DocumentContextV1, TipoDocumento } from "./types";

/** Fila del diagnóstico tal como la devuelve la consulta de detalle. */
export type DiagnosticoAlmacenado = {
  id: string;
  fecha?: string | null;
  version?: number | null;
  datos?: DatosDiagnostico | null;
  derivados?: Derivados | null;
  estados_bloque?: Partial<EstadosBloque> | null;
  fugas?: Fuga[] | null;
  oportunidad_total?: number | null;
  /** Columna JSONB cruda: `{ propuesta, paquetes }` (ver `contenido-propuesta.ts`). */
  propuesta?: unknown;
};

export type BuildDocumentContextDesdeDiagnosticoArgs = {
  fila: DiagnosticoAlmacenado;
  tipoDocumento?: TipoDocumento;
  templateVersion?: string;
  rulesetVersion?: string;
};

const BLOQUES: readonly (keyof EstadosBloque)[] = [
  "medicion",
  "economia",
  "cuenta",
  "funnel_web",
  "creativos",
];

const ESTADOS_VALIDOS: readonly EstadoBloque[] = ["verde", "amarillo", "rojo", "sin_datos"];

function finito(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

/**
 * Completa los bloques ausentes con `sin_datos`.
 *
 * Un bloque que nunca se guardó es falta de dato, no un semáforo en verde.
 */
export function estadosBloqueCompletos(
  parcial: Partial<EstadosBloque> | null | undefined,
): EstadosBloque {
  const salida = {} as EstadosBloque;
  for (const bloque of BLOQUES) {
    const valor = parcial?.[bloque];
    salida[bloque] =
      typeof valor === "string" && (ESTADOS_VALIDOS as readonly string[]).includes(valor)
        ? (valor as EstadoBloque)
        : "sin_datos";
  }
  return salida;
}

/**
 * Reconstruye el resultado del motor sin volver a ejecutarlo.
 *
 * `margen_bloqueado` y `contradiccion_margen` no se persisten por separado: el
 * motor los deriva de `derivados.contradiccion_margen`, y acá se reproduce esa
 * misma derivación en lugar de asumir un valor.
 */
export function resultadoDesdeDiagnostico(fila: DiagnosticoAlmacenado): ResultadoCalculo {
  const derivados = fila.derivados;
  if (!derivados) {
    throw new Error("El diagnóstico guardado no tiene derivados: no se puede armar el documento.");
  }

  const contradiccion = derivados.contradiccion_margen ?? null;
  const margenBloqueado = contradiccion?.bloquea === true;
  const fugas = Array.isArray(fila.fugas) ? fila.fugas : [];
  const total = margenBloqueado || !finito(fila.oportunidad_total) ? 0 : fila.oportunidad_total;

  return {
    derivados: {
      ...derivados,
      cobertura_canales: finito(derivados.cobertura_canales) ? derivados.cobertura_canales : 0,
    },
    estados_bloque: estadosBloqueCompletos(fila.estados_bloque),
    fugas,
    oportunidad_total: total,
    oportunidad_conservadora: redondear(total * 0.6, 0) ?? 0,
    margen_bloqueado: margenBloqueado,
    contradiccion_margen: contradiccion,
  };
}

/** Traduce el diagnóstico persistido al contexto que consumen las plantillas. */
export function buildDocumentContextDesdeDiagnostico(
  args: BuildDocumentContextDesdeDiagnosticoArgs,
): DocumentContextV1 {
  const { fila } = args;
  if (!fila.datos) {
    throw new Error("El diagnóstico guardado no tiene datos: no se puede armar el documento.");
  }

  const { paquetesCrudo } = separarContenidoGuardado(fila.propuesta);

  return buildDocumentContext({
    datos: fila.datos,
    resultado: resultadoDesdeDiagnostico(fila),
    diagnostico: {
      id: fila.id,
      version: finito(fila.version) && fila.version >= 1 ? fila.version : 1,
      fecha: typeof fila.fecha === "string" ? fila.fecha : "",
    },
    paquetesConfirmados: escaleraConfirmadaDesdeColumna(paquetesCrudo),
    ...(args.tipoDocumento ? { tipoDocumento: args.tipoDocumento } : {}),
    ...(args.templateVersion ? { templateVersion: args.templateVersion } : {}),
    ...(args.rulesetVersion ? { rulesetVersion: args.rulesetVersion } : {}),
  });
}
