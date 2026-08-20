/**
 * Mix de canales de venta. Cada canal es independiente: tiene su propia
 * facturación, ticket, comisiones, envío, financiación, descuento e inversión.
 *
 * Reglas duras de esta capa:
 *  - nunca se reescalan los porcentajes declarados para que sumen 100;
 *  - cero, ausente y "no aplica" son tres estados distintos;
 *  - el canal principal se deriva del porcentaje mayor, jamás se declara.
 */

import type { DatosDiagnostico } from "./diagnostico-form";
import { redondear } from "./dinero";

export type CanalId = "tienda_propia" | "mercado_libre";

export const CANALES: { id: CanalId; label: string }[] = [
  { id: "tienda_propia", label: "Tienda propia" },
  { id: "mercado_libre", label: "Mercado Libre" },
];

/** Prefijo de los campos planos de cada canal dentro de `DatosDiagnostico`. */
export const PREFIJO_CANAL: Record<CanalId, string> = {
  tienda_propia: "canal_tienda",
  mercado_libre: "canal_ml",
};

/**
 * - declarado: hay un porcentaje cargado (puede ser 0: el canal existe y no factura);
 * - ausente: no sabemos si vende ahí. Baja la cobertura;
 * - no_aplica: el cliente declaró que no vende ahí. No baja la cobertura.
 */
export type EstadoCanal = "declarado" | "ausente" | "no_aplica";

/** Comisión de marketplace con sus metadatos de origen y vigencia. */
export type ComisionMarketplace = {
  comision: number;
  cargo_fijo?: number;
  /** El cargo fijo sólo aplica en ventas por debajo de este importe. */
  cargo_fijo_hasta?: number;
  marketplace?: string;
  tipo_publicacion?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;
  pais?: string;
  origen?: string;
  /** true cuando el número es un benchmark pendiente de verificar con la liquidación real. */
  provisional?: boolean;
};

export type ConfigComisiones = {
  comision_plataforma?: Record<string, number>;
  comision_pasarela?: Record<string, number>;
  comision_marketplace?: Record<string, ComisionMarketplace>;
};

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Lee un campo del canal por sufijo, sin castear a un tipo concreto. */
export function campoCanal(d: DatosDiagnostico, canal: CanalId, sufijo: string): unknown {
  return (d as unknown as Record<string, unknown>)[`${PREFIJO_CANAL[canal]}_${sufijo}`];
}

export function numeroCanal(d: DatosDiagnostico, canal: CanalId, sufijo: string): number | null {
  const v = campoCanal(d, canal, sufijo);
  return finito(v) ? v : null;
}

/**
 * Porcentaje declarado del canal.
 * Migración conservadora: un diagnóstico viejo con `ml_pct_facturacion` cargado
 * usa ese valor para Mercado Libre. La tienda propia NO se asume por diferencia.
 */
export function pctCanal(d: DatosDiagnostico, canal: CanalId): number | null {
  const propio = numeroCanal(d, canal, "pct");
  if (propio !== null) return propio;
  if (canal === "mercado_libre" && finito(d.ml_pct_facturacion)) return d.ml_pct_facturacion;
  return null;
}

export function estadoCanal(d: DatosDiagnostico, canal: CanalId): EstadoCanal {
  if (campoCanal(d, canal, "no_aplica") === true) return "no_aplica";
  return pctCanal(d, canal) !== null ? "declarado" : "ausente";
}

export function canalesDeclarados(d: DatosDiagnostico): { id: CanalId; pct: number }[] {
  return CANALES.filter((c) => estadoCanal(d, c.id) === "declarado").map((c) => ({
    id: c.id,
    pct: pctCanal(d, c.id) as number,
  }));
}

/** Suma de los porcentajes declarados. Sin canales declarados devuelve 0. */
export function coberturaCanales(d: DatosDiagnostico): number {
  const suma = canalesDeclarados(d).reduce((a, c) => a + c.pct, 0);
  return redondear(suma, 4) ?? 0;
}

export function hayCanalesDeclarados(d: DatosDiagnostico): boolean {
  return canalesDeclarados(d).length > 0;
}

/** Los porcentajes de canal no pueden superar el total de la facturación. */
export function canalesSuperan100(d: DatosDiagnostico): boolean {
  return hayCanalesDeclarados(d) && coberturaCanales(d) > 100;
}

/** Campos de canal que quedan en falta cuando el mix es imposible. */
export const CAMPOS_PCT_CANAL: Record<CanalId, string> = {
  tienda_propia: "canal_tienda_pct",
  mercado_libre: "canal_ml_pct",
};

/**
 * Canal con mayor participación. Un empate exacto no se desempata: devuelve null.
 * Los canales en 0% no compiten por el primer puesto.
 */
export function canalPrincipal(d: DatosDiagnostico): CanalId | null {
  const conVenta = canalesDeclarados(d).filter((c) => c.pct > 0);
  if (conVenta.length === 0) return null;
  const max = Math.max(...conVenta.map((c) => c.pct));
  const empatados = conVenta.filter((c) => c.pct === max);
  return empatados.length === 1 ? (empatados[0] as { id: CanalId }).id : null;
}

export type ComisionResuelta = {
  valor: number | null;
  origen: string | null;
  provisional: boolean;
  cargo_fijo_aplicado: boolean;
  faltantes: string[];
};

/** Clave compuesta plataforma_plan usada en la configuración de comisiones. */
export function claveComisionPlataforma(plataforma: string, plan: string): string {
  const p = (plataforma || "").trim();
  const pl = (plan || "").trim();
  if (!p) return "";
  return pl ? `${p}_${pl}` : p;
}

export function comisionPlataformaDe(cfg: ConfigComisiones, d: DatosDiagnostico): number | null {
  const tabla = cfg.comision_plataforma ?? {};
  const compuesta = claveComisionPlataforma(d.plataforma, d.plan_plataforma);
  if (finito(tabla[compuesta])) return tabla[compuesta] as number;
  const simple = (d.plataforma || "").trim();
  if (finito(tabla[simple])) return tabla[simple] as number;
  return null;
}

/** Entrada de comisión de marketplace, por tipo de publicación si está declarado. */
export function entradaMarketplace(
  cfg: ConfigComisiones,
  canal: CanalId,
  tipoPublicacion: string,
): ComisionMarketplace | null {
  const tabla = cfg.comision_marketplace ?? {};
  const base = canal === "mercado_libre" ? "mercado_libre" : canal;
  const tipo = (tipoPublicacion || "").trim();
  const candidatas = tipo ? [`${base}_${tipo}`, base] : [base];
  for (const clave of candidatas) {
    const e = tabla[clave];
    if (e && finito(e.comision)) return e;
  }
  return null;
}

/**
 * Comisión efectiva del canal sobre el precio.
 * Precedencia: el valor verificado con el cliente le gana al benchmark de
 * configuración. Cuando hay cargo fijo, la comisión efectiva es la porcentual
 * más el cargo dividido el ticket del canal.
 */
export function comisionEfectivaCanal(
  d: DatosDiagnostico,
  cfg: ConfigComisiones,
  canal: CanalId,
  ticket: number | null,
): ComisionResuelta {
  const verificada = numeroCanal(d, canal, "comision_pct");
  const cargoDeclarado = numeroCanal(d, canal, "cargo_fijo");

  const conCargo = (base: number, cargo: number | null, hasta: number | null) => {
    const aplica =
      cargo !== null && cargo > 0 && finito(ticket) && (ticket as number) > 0 &&
      (hasta === null || (ticket as number) < hasta);
    const valor = aplica ? base + (cargo as number) / (ticket as number) : base;
    return { valor: redondear(valor, 4), aplicado: aplica };
  };

  if (verificada !== null) {
    // El formulario carga la comisión verificada en porcentaje (16,94), no en tasa.
    const r = conCargo(verificada / 100, cargoDeclarado, null);
    return {
      valor: r.valor,
      origen: "verificado_cliente",
      provisional: false,
      cargo_fijo_aplicado: r.aplicado,
      faltantes: [],
    };
  }

  if (canal === "tienda_propia") {
    const plataforma = comisionPlataformaDe(cfg, d);
    const pasarela = finito(cfg.comision_pasarela?.[d.pasarela])
      ? (cfg.comision_pasarela![d.pasarela] as number)
      : null;
    const faltan: string[] = [];
    if (plataforma === null) faltan.push("comision_plataforma");
    if (pasarela === null) faltan.push("comision_pasarela");
    if (faltan.length > 0) {
      return {
        valor: null,
        origen: "benchmark_configuracion",
        provisional: false,
        cargo_fijo_aplicado: false,
        faltantes: faltan,
      };
    }
    const r = conCargo((plataforma as number) + (pasarela as number), cargoDeclarado, null);
    return {
      valor: r.valor,
      origen: "benchmark_configuracion",
      provisional: false,
      cargo_fijo_aplicado: r.aplicado,
      faltantes: [],
    };
  }

  const entrada = entradaMarketplace(cfg, canal, String(campoCanal(d, canal, "tipo_publicacion") ?? ""));
  if (!entrada) {
    return {
      valor: null,
      origen: null,
      provisional: false,
      cargo_fijo_aplicado: false,
      faltantes: ["comision_marketplace"],
    };
  }
  const cargo = cargoDeclarado ?? (finito(entrada.cargo_fijo) ? (entrada.cargo_fijo as number) : null);
  const hasta = finito(entrada.cargo_fijo_hasta) ? (entrada.cargo_fijo_hasta as number) : null;
  const r = conCargo(entrada.comision, cargo, hasta);
  return {
    valor: r.valor,
    origen: entrada.origen ?? "benchmark_configuracion",
    provisional: entrada.provisional === true,
    cargo_fijo_aplicado: r.aplicado,
    faltantes: [],
  };
}
