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

/** Sobre qué unidad se cobra el cargo fijo del marketplace. */
export type BaseAplicacionCargo = "pedido" | "unidad" | "publicacion";
/** Qué precio se compara contra el umbral del cargo fijo. */
export type PrecioUmbral = "precio_producto" | "ticket_promedio";

/** Comisión de marketplace con sus metadatos de origen y vigencia. */
export type ComisionMarketplace = {
  comision: number;
  cargo_fijo?: number;
  /** El cargo fijo sólo aplica en ventas por debajo de este importe. */
  cargo_fijo_hasta?: number;
  /** Sobre qué se cobra el cargo fijo. Por defecto, por pedido. */
  base_aplicacion?: BaseAplicacionCargo;
  /** Qué precio se compara contra el umbral. Por defecto, el ticket promedio. */
  precio_umbral?: PrecioUmbral;
  /** De dónde salió la regla. */
  fuente?: string;
  /** Mientras sea false, el cargo fijo NO entra en la comisión efectiva. */
  verificado?: boolean;
  marketplace?: string;
  tipo_publicacion?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;
  pais?: string;
  origen?: string;
  /** true cuando el número es un benchmark pendiente de verificar con la liquidación real. */
  provisional?: boolean;
};

/**
 * Valores por defecto de comisión de marketplace, definidos en el código.
 * La tabla `configuracion` los sobreescribe únicamente si la fila existe:
 * así el sistema funciona sin tocar la base de datos.
 */
export const COMISIONES_MARKETPLACE_DEFECTO: Record<string, ComisionMarketplace> = {
  mercado_libre: {
    comision: 0.1694,
    marketplace: "mercado_libre",
    pais: "AR",
    origen: "benchmark_provisional",
    provisional: true,
    cargo_fijo: 1095,
    cargo_fijo_hasta: 33000,
    base_aplicacion: "pedido",
    precio_umbral: "precio_producto",
    fuente: "benchmark_provisional_pendiente_liquidacion",
    verificado: false,
  },
};

export type ConfigComisiones = {
  comision_plataforma?: Record<string, number>;
  comision_pasarela?: Record<string, number>;
  comision_marketplace?: Record<string, ComisionMarketplace>;
};

/**
 * Una comisión verificada menor al 1% casi siempre es un error de escala:
 * alguien cargó la tasa (0,1694) en un campo que espera porcentaje (16,94).
 */
export function comisionEnEscalaSospechosa(valorEnPorcentaje: number | null | undefined): boolean {
  return typeof valorEnPorcentaje === "number" && valorEnPorcentaje > 0 && valorEnPorcentaje < 1;
}


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

/** Cargo fijo conocido pero no aplicado, con sus metadatos, para mostrarlo en el detalle. */
export type CargoFijoDisponible = {
  valor: number;
  hasta: number | null;
  base_aplicacion: BaseAplicacionCargo;
  precio_umbral: PrecioUmbral;
  fuente: string | null;
  verificado: boolean;
};

export type ComisionResuelta = {
  valor: number | null;
  origen: string | null;
  provisional: boolean;
  cargo_fijo_aplicado: boolean;
  /** Cargo fijo declarado en la regla, esté o no aplicado al cálculo. */
  cargo_fijo_disponible: CargoFijoDisponible | null;
  /** true si la comisión verificada parece cargada en tasa y no en porcentaje. */
  escala_sospechosa: boolean;
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

/**
 * Entrada de comisión de marketplace, por tipo de publicación si está declarado.
 * La configuración pisa al valor por defecto del código; si la fila no existe,
 * se usa el valor por defecto.
 */
export function entradaMarketplace(
  cfg: ConfigComisiones,
  canal: CanalId,
  tipoPublicacion: string,
): ComisionMarketplace | null {
  const tabla = { ...COMISIONES_MARKETPLACE_DEFECTO, ...(cfg.comision_marketplace ?? {}) };
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
 *
 * Precedencia: el valor verificado con el cliente le gana al benchmark de
 * configuración, y la configuración le gana al valor por defecto del código.
 *
 * Cargo fijo: sólo entra en la comisión efectiva cuando la regla está
 * verificada. Mientras `verificado` sea false el cargo se informa como
 * `cargo_fijo_disponible` y no toca el cálculo.
 *
 * @param precioProducto precio del producto en cuestión, cuando el cargo se
 * cobra por unidad o el umbral se compara contra el precio del producto.
 */
export function comisionEfectivaCanal(
  d: DatosDiagnostico,
  cfg: ConfigComisiones,
  canal: CanalId,
  ticket: number | null,
  precioProducto: number | null = null,
): ComisionResuelta {
  const verificada = numeroCanal(d, canal, "comision_pct");
  const cargoDeclarado = numeroCanal(d, canal, "cargo_fijo");
  const precio = finito(precioProducto) && precioProducto > 0 ? precioProducto : null;
  const tkt = finito(ticket) && ticket > 0 ? ticket : null;

  type OpcionesCargo = {
    cargo: number | null;
    hasta?: number | null | undefined;
    base?: BaseAplicacionCargo | undefined;
    umbral?: PrecioUmbral | undefined;
    fuente?: string | null | undefined;
    verificado?: boolean | undefined;
  };

  const conCargo = (base: number, o: OpcionesCargo) => {
    const cargo = o.cargo;
    const hasta = o.hasta ?? null;
    const baseAplicacion: BaseAplicacionCargo = o.base ?? "pedido";
    const precioUmbral: PrecioUmbral = o.umbral ?? "ticket_promedio";
    const verificado = o.verificado !== false;

    const disponible: CargoFijoDisponible | null =
      cargo !== null && cargo > 0
        ? {
            valor: cargo,
            hasta,
            base_aplicacion: baseAplicacion,
            precio_umbral: precioUmbral,
            fuente: o.fuente ?? null,
            verificado,
          }
        : null;

    // El cargo por publicación no se paga por venta: nunca entra en la comisión.
    const divisor =
      baseAplicacion === "unidad" ? (precio ?? tkt) : baseAplicacion === "pedido" ? tkt : null;
    const comparado = precioUmbral === "precio_producto" ? (precio ?? tkt) : tkt;

    const aplica =
      verificado &&
      cargo !== null &&
      cargo > 0 &&
      divisor !== null &&
      divisor > 0 &&
      (hasta === null || (comparado !== null && comparado < hasta));

    const valor = aplica ? base + cargo / (divisor as number) : base;
    return { valor: redondear(valor, 4), aplicado: aplica, disponible };
  };

  if (verificada !== null) {
    // El formulario carga la comisión verificada en porcentaje (16,94), no en tasa.
    // Este es el único lugar del código donde se divide por 100.
    const r = conCargo(verificada / 100, { cargo: cargoDeclarado });
    return {
      valor: r.valor,
      origen: "verificado_cliente",
      provisional: false,
      cargo_fijo_aplicado: r.aplicado,
      cargo_fijo_disponible: r.disponible,
      escala_sospechosa: comisionEnEscalaSospechosa(verificada),
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
        cargo_fijo_disponible: null,
        escala_sospechosa: false,
        faltantes: faltan,
      };
    }
    const r = conCargo((plataforma as number) + (pasarela as number), { cargo: cargoDeclarado });
    return {
      valor: r.valor,
      origen: "benchmark_configuracion",
      provisional: false,
      cargo_fijo_aplicado: r.aplicado,
      cargo_fijo_disponible: r.disponible,
      escala_sospechosa: false,
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
      cargo_fijo_disponible: null,
      escala_sospechosa: false,
      faltantes: ["comision_marketplace"],
    };
  }
  // El cargo declarado por el cliente sí está verificado: lo dijo él.
  const usaDeclarado = cargoDeclarado !== null;
  const cargo = usaDeclarado
    ? cargoDeclarado
    : finito(entrada.cargo_fijo)
      ? (entrada.cargo_fijo as number)
      : null;
  const r = conCargo(entrada.comision, {
    cargo,
    hasta: usaDeclarado ? null : finito(entrada.cargo_fijo_hasta) ? entrada.cargo_fijo_hasta : null,
    base: usaDeclarado ? "pedido" : entrada.base_aplicacion,
    umbral: usaDeclarado ? "ticket_promedio" : entrada.precio_umbral,
    fuente: usaDeclarado ? "declarado_cliente" : (entrada.fuente ?? null),
    verificado: usaDeclarado ? true : entrada.verificado === true,
  });
  return {
    valor: r.valor,
    origen: entrada.origen ?? "benchmark_configuracion",
    provisional: entrada.provisional === true,
    cargo_fijo_aplicado: r.aplicado,
    cargo_fijo_disponible: r.disponible,
    escala_sospechosa: false,
    faltantes: [],
  };

}
