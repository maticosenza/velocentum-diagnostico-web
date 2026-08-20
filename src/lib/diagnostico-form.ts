/** Definiciones compartidas del formulario de carga de diagnóstico. */

export type Modo = "A" | "B";

export const MODOS = [
  {
    value: "A" as const,
    titulo: "Con pantalla compartida",
    detalle: "Tengo acceso a su panel de Meta Ads y a su tienda. Puedo verificar los números.",
  },
  {
    value: "B" as const,
    titulo: "Solo conversado",
    detalle: "Sin acceso al panel. Los datos salen de lo que cuenta el prospecto.",
  },
];

export const VERTICALES = [
  { value: "indumentaria", label: "Indumentaria" },
  { value: "cosmetica", label: "Cosmética" },
  { value: "deco_hogar", label: "Deco y hogar" },
  { value: "electronica", label: "Electrónica" },
  { value: "deportes", label: "Deportes" },
  { value: "alimentos", label: "Alimentos" },
  { value: "otro", label: "Otro" },
] as const;

export const PLATAFORMAS = [
  { value: "tiendanube", label: "Tiendanube" },
  { value: "shopify", label: "Shopify" },
  { value: "empretienda", label: "Empretienda" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "vtex", label: "VTEX" },
  { value: "desarrollo_propio", label: "Desarrollo propio" },
  { value: "otro", label: "Otro" },
] as const;

export const PLANES_POR_PLATAFORMA: Record<string, { value: string; label: string }[]> = {
  tiendanube: [
    { value: "inicial", label: "Inicial" },
    { value: "esencial", label: "Esencial" },
    { value: "impulso", label: "Impulso" },
  ],
  shopify: [
    { value: "basic", label: "Basic" },
    { value: "grow", label: "Grow" },
    { value: "advanced", label: "Advanced" },
    { value: "plus", label: "Plus" },
  ],
};

export const PASARELAS = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "pago_nube", label: "Pago Nube" },
  { value: "mobbex", label: "Mobbex" },
  { value: "talo", label: "Talo" },
  { value: "otra", label: "Otra" },
] as const;

/** Tipos de publicación de Mercado Libre: definen la comisión aplicable. */
export const TIPOS_PUBLICACION_ML = [
  { value: "clasica", label: "Clásica" },
  { value: "premium", label: "Premium" },
] as const;

export const CANTIDAD_CAMPANAS = [
  { value: "pocas", label: "Pocas" },
  { value: "varias", label: "Varias" },
  { value: "muchas", label: "Muchas" },
] as const;

/**
 * Base sobre la que están expresados facturación y ticket. Legado: se conserva
 * para poder leer diagnósticos guardados antes de los indicadores independientes.
 */
export type BaseMontos = "bruto" | "neto";

export const BASES_MONTOS = [
  { value: "bruto", label: "Bruto (antes de descuentos)" },
  { value: "neto", label: "Neto (ya con descuentos aplicados)" },
] as const;

/**
 * Vocabulario de montos, para que no queden dudas de qué se resta y qué no:
 *  - bruto: precio de lista, antes de cualquier deducción;
 *  - neto de descuento: el ingreso después de aplicar los descuentos comerciales
 *    (transferencia, cupones);
 *  - neto de financiación: el ingreso después de que el procesador ya retuvo el
 *    costo de las cuotas.
 * Cada indicador es independiente: un mismo diagnóstico puede venir neto de
 * descuento y bruto de financiación, o al revés.
 */
export type RelacionFinDesc = "excluyentes" | "superpuestos";

export const RELACIONES_FIN_DESC = [
  { value: "excluyentes", label: "No, son excluyentes" },
  { value: "superpuestos", label: "Sí, se pueden combinar" },
] as const;


export type DatosDiagnostico = {

  // Identificación (compartido)
  nombre_tienda: string;
  vertical: string;
  plataforma: string;
  plan_plataforma: string;
  vende_mercado_libre: boolean;
  // Medición (compartido)
  tiene_pixel: boolean | null;
  // Medición · modo A (observado en pantalla)
  facturacion_pixel: number | null;
  capi_estado: string;
  // Medición · modo B (declarado)
  tiene_analytics: boolean | null;
  numeros_meta_coinciden: boolean | null;

  // Economía (compartido)
  facturacion_mensual: number | null;
  ticket_promedio: number | null;
  /** Legado. Se lee sólo si no están los dos indicadores nuevos. */
  base_montos?: BaseMontos;
  /** true si facturación y ticket ya vienen netos de descuentos comerciales. */
  montos_netos_de_descuento?: boolean;
  /** true si facturación y ticket ya vienen netos del costo financiero. */
  montos_netos_de_financiacion?: boolean;
  /** Legado: se interpreta como envío neto del vendedor. */
  costo_envio_promedio: number | null;
  /** Costo total del envío por pedido. */
  envio_bruto: number | null;
  /** Cuánto del envío paga el comprador. */
  envio_cobrado_comprador: number | null;
  pasarela: string;
  /** % de las ventas que se paga en cuotas. */
  financiacion_pct_ventas: number | null;
  /** Costo de esa financiación, como % del monto financiado. */
  financiacion_costo_pct: number | null;
  /** % de las ventas que usa descuento. */
  descuento_pct_ventas: number | null;
  /** Magnitud del descuento, como % del precio. */
  descuento_pct: number | null;
  /** Si cuotas y descuento pueden caer sobre la misma venta. */
  relacion_financiacion_descuento?: RelacionFinDesc;

  /** Margen de contribución que declara el cliente, en porcentaje. Mínimo del rango. */
  margen_declarado_min?: number | null;
  /** Máximo del rango declarado. Sin máximo, el rango es el valor exacto del mínimo. */
  margen_declarado_max?: number | null;
  /** Sólo un margen declarado y confirmado puede bloquear el cálculo. */
  margen_declarado_confirmado?: boolean;

  inversion_meta: number | null;
  inversion_google: number | null;

  // Productos (compartido; en modo B sólo el principal lleva costo y precio)
  producto_1_nombre: string;
  producto_1_costo: number | null;
  producto_1_precio: number | null;
  producto_1_pct_facturacion: number | null;
  producto_2_nombre: string;
  producto_2_costo: number | null;
  producto_2_precio: number | null;
  producto_2_pct_facturacion: number | null;
  producto_3_nombre: string;
  producto_3_costo: number | null;
  producto_3_precio: number | null;
  producto_3_pct_facturacion: number | null;
  reparto_pauta: string;
  // Cuenta · modo A
  conjuntos_activos: number | null;
  presupuesto_diario: number | null;
  // Cuenta · modo B
  gasto_diario: number | null;
  cantidad_campanas: string;
  // Cuenta · datos leídos del CSV de Meta (modo A)
  csv_gasto_total: number | null;
  csv_frecuencia_promedio: number | null;
  csv_ctr_global: number | null;
  csv_conjuntos_bajo_gasto: number | null;
  csv_dias_periodo: number | null;

  // Web
  visitas_mensuales: number | null;
  /** Sesiones que agregaron al carrito en el mes. Etapa intermedia del funnel. */
  agregados_carrito: number | null;
  /** Sesiones que iniciaron el checkout en el mes. Etapa intermedia del funnel. */
  checkouts_iniciados: number | null;
  carritos_abandonados: number | null;
  recuperacion_carrito: boolean | null;
  retargeting_abandono: boolean | null;
  // Contenido (compartido, cualitativo)
  frecuencia_creativos: string;
  formato_creativos: string;
  angulo_que_funciona: string;
  dolor_cliente: string;
  consultas_por_organico: boolean | null;
  // Mercado Libre (compartido, condicional)
  ml_pct_facturacion: number | null;
  ml_productos_publicados: number | null;
  ml_product_ads: boolean | null;
  ml_inversion_product_ads: number | null;
  /** Ventas atribuidas a Product Ads, en pesos. Opcional: habilita el ROAS del canal. */
  ml_ventas_product_ads?: number | null;

  /**
   * Mix de canales. Todos opcionales: los diagnósticos guardados no los tienen y
   * NO se migran asumiendo que la tienda propia factura el 100%.
   * Los porcentajes de comisión de canal se cargan en porcentaje (16,94), no en tasa.
   */
  canal_tienda_pct?: number | null;
  canal_tienda_no_aplica?: boolean;
  canal_tienda_facturacion?: number | null;
  canal_tienda_ticket?: number | null;
  canal_tienda_comision_pct?: number | null;
  canal_tienda_cargo_fijo?: number | null;
  canal_tienda_envio_neto?: number | null;
  canal_tienda_financiacion_pct_ventas?: number | null;
  canal_tienda_financiacion_costo_pct?: number | null;
  canal_tienda_descuento_pct_ventas?: number | null;
  canal_tienda_descuento_pct?: number | null;
  canal_tienda_inversion?: number | null;
  canal_tienda_periodo?: string;
  canal_tienda_moneda?: string;

  canal_ml_pct?: number | null;
  canal_ml_no_aplica?: boolean;
  canal_ml_facturacion?: number | null;
  canal_ml_ticket?: number | null;
  canal_ml_comision_pct?: number | null;
  canal_ml_cargo_fijo?: number | null;
  canal_ml_envio_neto?: number | null;
  canal_ml_financiacion_pct_ventas?: number | null;
  canal_ml_financiacion_costo_pct?: number | null;
  canal_ml_descuento_pct_ventas?: number | null;
  canal_ml_descuento_pct?: number | null;
  canal_ml_inversion?: number | null;
  canal_ml_tipo_publicacion?: string;
  canal_ml_periodo?: string;
  canal_ml_moneda?: string;
};

export type NotasDiagnostico = Record<string, string>;

export const DATOS_INICIALES: DatosDiagnostico = {
  nombre_tienda: "",
  vertical: "",
  plataforma: "",
  plan_plataforma: "",
  vende_mercado_libre: false,
  tiene_pixel: null,
  facturacion_pixel: null,
  capi_estado: "",
  tiene_analytics: null,
  numeros_meta_coinciden: null,

  facturacion_mensual: null,
  ticket_promedio: null,
  montos_netos_de_descuento: false,
  montos_netos_de_financiacion: false,
  costo_envio_promedio: null,
  envio_bruto: null,
  envio_cobrado_comprador: null,
  pasarela: "",
  financiacion_pct_ventas: null,
  financiacion_costo_pct: null,
  descuento_pct_ventas: null,
  descuento_pct: null,
  relacion_financiacion_descuento: "excluyentes",
  margen_declarado_min: null,
  margen_declarado_max: null,
  margen_declarado_confirmado: false,


  inversion_meta: null,
  inversion_google: null,
  producto_1_nombre: "",
  producto_1_costo: null,
  producto_1_precio: null,
  producto_1_pct_facturacion: null,
  producto_2_nombre: "",
  producto_2_costo: null,
  producto_2_precio: null,
  producto_2_pct_facturacion: null,
  producto_3_nombre: "",
  producto_3_costo: null,
  producto_3_precio: null,
  producto_3_pct_facturacion: null,
  reparto_pauta: "",
  conjuntos_activos: null,
  presupuesto_diario: null,
  gasto_diario: null,
  cantidad_campanas: "",
  csv_gasto_total: null,
  csv_frecuencia_promedio: null,
  csv_ctr_global: null,
  csv_conjuntos_bajo_gasto: null,
  csv_dias_periodo: null,

  visitas_mensuales: null,
  agregados_carrito: null,
  checkouts_iniciados: null,
  carritos_abandonados: null,
  recuperacion_carrito: null,
  retargeting_abandono: null,
  frecuencia_creativos: "",
  formato_creativos: "",
  angulo_que_funciona: "",
  dolor_cliente: "",
  consultas_por_organico: null,
  ml_pct_facturacion: null,
  ml_productos_publicados: null,
  ml_product_ads: null,
  ml_inversion_product_ads: null,
  ml_ventas_product_ads: null,

  canal_tienda_pct: null,
  canal_tienda_no_aplica: false,
  canal_tienda_facturacion: null,
  canal_tienda_ticket: null,
  canal_tienda_comision_pct: null,
  canal_tienda_cargo_fijo: null,
  canal_tienda_envio_neto: null,
  canal_tienda_financiacion_pct_ventas: null,
  canal_tienda_financiacion_costo_pct: null,
  canal_tienda_descuento_pct_ventas: null,
  canal_tienda_descuento_pct: null,
  canal_tienda_inversion: null,
  canal_tienda_periodo: "mensual",
  canal_tienda_moneda: "ARS",

  canal_ml_pct: null,
  canal_ml_no_aplica: false,
  canal_ml_facturacion: null,
  canal_ml_ticket: null,
  canal_ml_comision_pct: null,
  canal_ml_cargo_fijo: null,
  canal_ml_envio_neto: null,
  canal_ml_financiacion_pct_ventas: null,
  canal_ml_financiacion_costo_pct: null,
  canal_ml_descuento_pct_ventas: null,
  canal_ml_descuento_pct: null,
  canal_ml_inversion: null,
  canal_ml_tipo_publicacion: "",
  canal_ml_periodo: "mensual",
  canal_ml_moneda: "ARS",
};

export const BLOQUES = [
  { id: "identificacion", label: "Identificación" },
  { id: "medicion", label: "Medición" },
  { id: "canales", label: "Canales" },
  { id: "economia", label: "Economía" },
  { id: "productos", label: "Productos" },
  { id: "cuenta", label: "Cuenta" },
  { id: "web", label: "Web" },
  { id: "contenido", label: "Contenido" },
  { id: "mercado_libre", label: "Mercado Libre" },
] as const;

export type BloqueId = (typeof BLOQUES)[number]["id"];

/** Notas con contenido, ordenadas y etiquetadas igual que el formulario. */
export function notasVisibles(notas: NotasDiagnostico | null | undefined) {
  const etiquetas = new Map<string, string>(BLOQUES.map((bloque) => [bloque.id, bloque.label]));
  return Object.entries(notas ?? {})
    .map(([bloque, valor]) => ({
      bloque,
      etiqueta: etiquetas.get(bloque) ?? bloque.replace(/[_-]+/g, " "),
      texto: typeof valor === "string" ? valor.trim() : "",
    }))
    .filter((nota) => nota.texto !== "")
    .sort((a, b) => {
      const ordenA = BLOQUES.findIndex((bloque) => bloque.id === a.bloque);
      const ordenB = BLOQUES.findIndex((bloque) => bloque.id === b.bloque);
      return (ordenA < 0 ? BLOQUES.length : ordenA) - (ordenB < 0 ? BLOQUES.length : ordenB);
    });
}

const CAMPOS_COMUNES: Record<BloqueId, (keyof DatosDiagnostico)[]> = {
  identificacion: ["nombre_tienda", "vertical", "plataforma", "plan_plataforma"],
  medicion: [],
  canales: ["canal_tienda_pct", "canal_ml_pct"],
  economia: [
    "facturacion_mensual",
    "ticket_promedio",
    "costo_envio_promedio",
    "pasarela",
    "inversion_meta",
    "inversion_google",
  ],
  productos: [],
  cuenta: [],
  web: [],
  contenido: [
    "frecuencia_creativos",
    "formato_creativos",
    "angulo_que_funciona",
    "dolor_cliente",
    "consultas_por_organico",
  ],
  mercado_libre: [
    "ml_pct_facturacion",
    "ml_productos_publicados",
    "ml_product_ads",
    "ml_inversion_product_ads",
    "ml_ventas_product_ads",
  ],
};

/** Campos que cuentan para el indicador de completitud de cada pestaña, según el modo. */
export function camposPorBloque(modo: Modo, bloque: BloqueId): (keyof DatosDiagnostico)[] {
  const base = CAMPOS_COMUNES[bloque];
  if (bloque === "medicion") return modo === "A" ? ["facturacion_pixel", "capi_estado"] : [];
  if (bloque === "productos") {
    const nombres: (keyof DatosDiagnostico)[] = [
      "producto_1_nombre",
      "producto_2_nombre",
      "producto_3_nombre",
      "producto_1_pct_facturacion",
      "producto_2_pct_facturacion",
      "producto_3_pct_facturacion",
    ];
    return modo === "A"
      ? [
          ...nombres,
          "producto_1_costo",
          "producto_1_precio",
          "producto_2_costo",
          "producto_2_precio",
          "producto_3_costo",
          "producto_3_precio",
        ]
      : [...nombres, "producto_1_costo", "producto_1_precio"];
  }
  if (bloque === "cuenta") {
    return modo === "A" ? ["conjuntos_activos", "presupuesto_diario"] : ["gasto_diario", "cantidad_campanas"];
  }
  if (bloque === "web")
    return modo === "A"
      ? ["visitas_mensuales", "agregados_carrito", "checkouts_iniciados", "carritos_abandonados"]
      : ["agregados_carrito", "checkouts_iniciados", "carritos_abandonados"];
  return base;
}

export function estaCompleto(valor: unknown) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  return true;
}

export function contarCompletos(datos: DatosDiagnostico, modo: Modo, bloque: BloqueId) {
  const campos = camposPorBloque(modo, bloque);
  return {
    completos: campos.filter((c) => estaCompleto(datos[c])).length,
    total: campos.length,
  };
}

/** Campos que NO se conservan al cambiar de modo (son exclusivos del otro modo). */
export const CAMPOS_EXCLUSIVOS: Record<Modo, (keyof DatosDiagnostico)[]> = {
  A: [
    "facturacion_pixel",
    "capi_estado",
    "conjuntos_activos",
    "presupuesto_diario",
    "visitas_mensuales",
    "csv_gasto_total",
    "csv_frecuencia_promedio",
    "csv_ctr_global",
    "csv_conjuntos_bajo_gasto",
    "csv_dias_periodo",
  ],
  B: ["tiene_analytics", "numeros_meta_coinciden", "gasto_diario", "cantidad_campanas"],

};

export const CLAVE_BORRADOR = "velocentum:borrador-diagnostico";

export const ESTADOS_CAPI = [
  { value: "activa", label: "Activa" },
  { value: "ausente", label: "Ausente" },
  { value: "no_se_sabe", label: "No se sabe" },
] as const;

/** Dónde sale cada dato: ayuda para el vendedor arriba de los campos. */
export const ORIGEN_DATOS: Record<BloqueId, string> = {
  identificacion: "Conversado. El plan se ve en el panel del cliente.",
  medicion:
    "Events Manager, pestaña Resumen. Ojo que Meta solo guarda unos dos meses de historial.",
  canales:
    "Conversado, más el panel de cada canal. El porcentaje de cada canal sale de la facturación total del negocio.",
  economia: "Tiendanube: Estadísticas, Visión general.",
  productos: "Tiendanube: Estadísticas, Productos. Ahí están las unidades vendidas de cada uno.",
  cuenta:
    "Meta Ads Manager: filtrá el mes, activá 'Con entrega', desglosá por conjunto de anuncios y exportá.",
  web: "Las visitas salen de Tiendanube, Estadísticas, Visión general. Los carritos abandonados, de Tiendanube, sección Carritos abandonados.",
  contenido: "Todo conversado.",
  mercado_libre: "Conversado, más el panel de Product Ads si lo tiene.",
};
